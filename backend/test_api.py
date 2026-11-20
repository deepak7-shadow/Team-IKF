"""
FINTRUST AI — Claim Analyzer End-to-End Test Suite
Tests FastAPI endpoints:
  - GET  /api/v1/health
  - POST /api/v1/claims (text only, invalid input, high-risk detection)
  - GET  /api/v1/claims
  - GET  /api/v1/claims/{id}
  - POST /api/v1/claims/{id}/analyze
  - GET  /api/v1/claims/{id}/report
  - Safety constraints: no fraudulent labels, no buy/sell advice, preserved original text
"""

import sys
import unittest
from fastapi.testclient import TestClient
from main import app, get_current_user

# Mock authentication for test suite
app.dependency_overrides[get_current_user] = lambda: {"id": "00000000-0000-0000-0000-000000000001", "email": "test@fintrust.ai"}

client = TestClient(app)

class TestClaimAnalyzer(unittest.TestCase):
    def test_01_health_check(self):
        resp = client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("gemini_configured", data)
        self.assertIn("supabase_configured", data)
        print("✓ Health check passed")

    def test_02_validation_empty_submission(self):
        resp = client.post("/api/v1/claims", data={"claim_text": "", "platform": "Telegram"})
        self.assertEqual(resp.status_code, 422)
        print("✓ Empty claim validation passed")

    def test_03_submit_guaranteed_return_claim(self):
        sample_text = "Invest in this emerging midcap stock XYZ for 100% guaranteed 30% monthly gains with zero downside risk. Target price ₹4,500 by December 2025."
        resp = client.post(
            "/api/v1/claims",
            data={
                "claim_text": sample_text,
                "source_url": "https://t.me/sample_channel/123",
                "platform": "Telegram",
                "target_date": "2025-12-31"
            }
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn("id", data)
        self.assertEqual(data["claim_text"], sample_text)
        self.assertIn(data["risk_level"], ["high", "critical"])
        self.assertIsNotNone(data["extracted_entities"])
        
        # Verify safety constraints
        summary = (data.get("ai_summary") or "").lower()
        self.assertNotIn("fraudulent", summary)
        self.assertNotIn("fraud", summary)
        self.assertNotIn("criminal", summary)
        
        # Verify risk indicators
        types = [ri["type"] for ri in data.get("risk_indicators", [])]
        self.assertTrue(any("guaranteed" in t or "unrealistic" in t or "missing" in t for t in types))
        print(f"✓ Claim submitted and analyzed: ID={data['id']}, Risk={data['risk_level']}, Score={data.get('risk_score')}")
        
        # Save ID for subsequent tests
        TestClaimAnalyzer.claim_id = data["id"]

    def test_04_list_claims(self):
        resp = client.get("/api/v1/claims")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertIsInstance(items, list)
        self.assertGreaterEqual(len(items), 1)
        print(f"✓ List claims passed: {len(items)} claims found")

    def test_05_get_claim_by_id(self):
        cid = getattr(TestClaimAnalyzer, "claim_id", None)
        self.assertIsNotNone(cid)
        resp = client.get(f"/api/v1/claims/{cid}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], cid)
        self.assertEqual(data["platform"], "Telegram")
        print("✓ Get claim by ID passed")

    def test_06_reanalyze_claim(self):
        cid = getattr(TestClaimAnalyzer, "claim_id", None)
        self.assertIsNotNone(cid)
        resp = client.post(f"/api/v1/claims/{cid}/analyze")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], cid)
        print("✓ Re-analyze claim passed")

    def test_07_get_claim_report(self):
        cid = getattr(TestClaimAnalyzer, "claim_id", None)
        self.assertIsNotNone(cid)
        resp = client.get(f"/api/v1/claims/{cid}/report")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], cid)
        self.assertIn("extracted_entities", data)
        self.assertIn("risk_indicators", data)
        print("✓ Get claim report passed")

    def test_08_list_and_search_influencers(self):
        # Test basic list
        resp = client.get("/api/v1/influencers")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("items", data)
        self.assertGreaterEqual(data["total"], 1)
        
        # Test search by profile URL
        resp_url = client.get("/api/v1/influencers?q=youtube.com")
        self.assertEqual(resp_url.status_code, 200)
        url_data = resp_url.json()
        self.assertGreaterEqual(url_data["total"], 1)
        for it in url_data["items"]:
            self.assertTrue(
                "youtube" in (it.get("profile_url") or "").lower() or
                "youtube" in it["platform"].lower()
            )
        
        # Test filter by platform
        resp_tg = client.get("/api/v1/influencers?platform=Telegram")
        self.assertEqual(resp_tg.status_code, 200)
        tg_data = resp_tg.json()
        for it in tg_data["items"]:
            self.assertEqual(it["platform"].lower(), "telegram")
            
        print(f"✓ Influencer search & platform filtering passed ({data['total']} creators)")

    def test_09_create_influencer_audit_request(self):
        payload = {
            "name": "Nifty Advisory Desk",
            "handle": "@nifty_advisory",
            "platform": "YouTube",
            "profile_url": "https://youtube.com/@nifty_advisory",
            "followers": 75000,
            "bio": "Daily market updates",
            "tags": ["NIFTY", "Equities"],
            "sebi_reg_number": "INH000001234"  # matches real registered sample
        }
        resp = client.post("/api/v1/influencers", json=payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["sebi_status"], "verified_registered")
        self.assertEqual(data["identity_status"], "verified")
        self.assertIsNotNone(data["last_verified_at"])
        TestClaimAnalyzer.created_inf_id = data["id"]
        print(f"✓ Influencer created & verified: ID={data['id']} SEBI={data['sebi_status']}")

    def test_10_get_influencer_profile(self):
        inf_id = getattr(TestClaimAnalyzer, "created_inf_id", "inf-sebi-01")
        resp = client.get(f"/api/v1/influencers/{inf_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], inf_id)
        self.assertIn("verification_source", data)
        self.assertIn("last_verified_at", data)
        print("✓ Get influencer profile passed")

    def test_11_re_verify_sebi_registration(self):
        inf_id = getattr(TestClaimAnalyzer, "created_inf_id", "inf-sebi-01")
        resp = client.post(
            f"/api/v1/influencers/{inf_id}/verify-sebi",
            json={"claimed_sebi_reg_number": "INH000006248"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["sebi_status"], "verified_registered")
        self.assertIn("Statutory Notice", data["name_match_disclaimer"])
        print(f"✓ SEBI re-verification passed: {data['sebi_status']} ({data['sebi_reg_type']})")

    def test_12_influencer_claims_and_predictions(self):
        inf_id = "inf-sebi-01"
        # Claims
        resp_c = client.get(f"/api/v1/influencers/{inf_id}/claims")
        self.assertEqual(resp_c.status_code, 200)
        self.assertIn("claims", resp_c.json())
        
        # Predictions & performance
        resp_p = client.get(f"/api/v1/influencers/{inf_id}/predictions")
        self.assertEqual(resp_p.status_code, 200)
        data_p = resp_p.json()
        self.assertIn("performance", data_p)
        self.assertIn("has_sufficient_data", data_p["performance"])
        print("✓ Influencer claims and predictions performance passed")

    def test_13_create_prediction_engine(self):
        payload = {
            "asset": "RELIANCE",
            "ticker_symbol": "RELIANCE.NS",
            "direction": "bullish",
            "target_price": 3500.0,
            "reference_price": 2800.0,
            "evaluation_date": "2026-12-31",
            "influencer_name": "Capitalmind Financial Research",
            "notes": "Target backed by corporate earnings growth thesis"
        }
        resp = client.post("/api/v1/predictions", json=payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["asset"], "RELIANCE")
        self.assertEqual(data["target_price"], 3500.0)
        self.assertIn("status", data)
        self.assertIn("price_snapshots", data)
        TestClaimAnalyzer.pred_id = data["id"]
        print(f"✓ Prediction created in engine: ID={data['id']} Status={data['status']}")

    def test_14_list_predictions_engine(self):
        resp = client.get("/api/v1/predictions")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("items", data)
        self.assertGreaterEqual(data["total"], 1)
        
        # Filter test
        resp_f = client.get("/api/v1/predictions?q=RELIANCE")
        self.assertEqual(resp_f.status_code, 200)
        self.assertGreaterEqual(resp_f.json()["total"], 1)
        print(f"✓ List and filter predictions passed: {data['total']} total records")

    def test_15_get_prediction_details(self):
        pid = getattr(TestClaimAnalyzer, "pred_id", None)
        self.assertIsNotNone(pid)
        resp = client.get(f"/api/v1/predictions/{pid}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], pid)
        self.assertEqual(data["evaluation_methodology_version"], "v1.0.0-deterministic")
        self.assertIn("price_snapshots", data)
        print("✓ Get prediction details with snapshots passed")

    def test_16_deterministic_evaluation(self):
        pid = getattr(TestClaimAnalyzer, "pred_id", None)
        self.assertIsNotNone(pid)
        resp = client.post(f"/api/v1/predictions/{pid}/evaluate")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data["status"], ["met", "not_met", "partially_met", "inconclusive", "pending"])
        self.assertIsNotNone(data["evaluated_at"])
        self.assertIn("Direction", data["evaluation_criteria"])
        self.assertIn("deterministic", data["evaluation_methodology_version"])
        print(f"✓ Deterministic evaluation executed: Status={data['status']}")

    def test_17_prediction_analytics(self):
        resp = client.get("/api/v1/predictions/analytics")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total_predictions", data)
        self.assertIn("methodology_version", data)
        self.assertIn("has_sufficient_sample_size", data)
        self.assertIn("methodology_explanation", data)
        print(f"✓ Prediction analytics passed: Total={data['total_predictions']}, Sample Size={data['sample_size']}")

if __name__ == "__main__":
    unittest.main()
