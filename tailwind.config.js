/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Warm Ivory & Gold Palette
        ivory: "#F8F5EC",
        "ivory-dark": "#F1EBDD",
        "ivory-muted": "#E8DFC9",
        "card-bg": "#FFFEFA",
        "surface-warm": "#FAF7F0",
        
        // Text
        "text-primary": "#25251F",
        "text-secondary": "#777365",
        "text-muted": "#9E9988",
        
        // Gold & Amber Accents
        gold: "#C49A45",
        "gold-light": "#E4C477",
        "gold-dark": "#A88032",
        amber: "#D6A94F",
        "amber-soft": "#F4E3B8",
        "amber-dark": "#B58428",
        
        // Borders
        "border-gold": "#E9E1D1",
        "border-subtle": "#EFE8DC",
        
        // Semantic
        success: "#258B65",
        "success-light": "#D8F3E5",
        warning: "#D49A32",
        "warning-light": "#FDF0D5",
        danger: "#D95353",
        "danger-light": "#FDE8E8",
        
        // Backward compatibility mappings for existing component tokens
        midnight: "#F8F5EC",
        navy: "#F1EBDD",
        "navy-light": "#E8DFC9",
        "navy-muted": "#F5EEDB",
        electric: "#C49A45",
        "electric-dark": "#A88032",
        "electric-light": "#E4C477",
        cyan: "#D6A94F",
        "cyan-dark": "#B58428",
        violet: "#A38655",
        "light-bg": "#F8F5EC",
        glass: "rgba(255, 254, 250, 0.75)",
        "glass-border": "#E9E1D1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-champagne": "linear-gradient(135deg, #E4C477 0%, #C49A45 100%)",
        "gradient-champagne-soft": "linear-gradient(135deg, #FFFDF8 0%, #F5EEDB 100%)",
        "gradient-gold-amber": "linear-gradient(135deg, #D6A94F 0%, #C49A45 100%)",
        "gradient-hero": "linear-gradient(135deg, #FAF7F0 0%, #EFE8DA 100%)",
        "gradient-brand": "linear-gradient(135deg, #E4C477 0%, #C49A45 100%)",
        "gradient-brand-cyan": "linear-gradient(135deg, #FFF6E0 0%, #E4C477 100%)",
      },
      boxShadow: {
        warm: "0 4px 20px rgba(70, 60, 45, 0.05), 0 1px 3px rgba(70, 60, 45, 0.03)",
        "warm-hover": "0 10px 30px rgba(70, 60, 45, 0.08), 0 2px 6px rgba(70, 60, 45, 0.04)",
        glass: "0 8px 30px rgba(70, 60, 45, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        "glass-hover": "0 14px 40px rgba(70, 60, 45, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        "gold-glow": "0 4px 24px rgba(196, 154, 69, 0.25)",
        "electric-glow": "0 4px 20px rgba(196, 154, 69, 0.25)",
        "cyan-glow": "0 4px 20px rgba(214, 169, 79, 0.25)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
