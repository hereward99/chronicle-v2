import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },

        // VtM Custom Colors
        'blood-red': 'hsl(var(--blood-red))',
        'blood-red-dark': 'hsl(var(--blood-red-dark))',
        'gothic-gray': 'hsl(var(--gothic-gray))',
        'shadow-black': 'hsl(var(--shadow-black))',
        'parchment': 'hsl(var(--parchment))',
        'gold': 'hsl(var(--gold))',
        relationship: {
          ally: 'hsl(var(--relationship-ally))',
          enemy: 'hsl(var(--relationship-enemy))',
          rival: 'hsl(var(--relationship-rival))',
          friend: 'hsl(var(--relationship-friend))',
          contact: 'hsl(var(--relationship-contact))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        crit: {
          DEFAULT: 'hsl(var(--crit))',
          foreground: 'hsl(var(--crit-foreground))',
        },
        messy: {
          DEFAULT: 'hsl(var(--messy))',
          foreground: 'hsl(var(--messy-foreground))',
        },
        mention: {
          character: 'hsl(var(--mention-character))',
          plot: 'hsl(var(--mention-plot))',
          session: 'hsl(var(--mention-session))',
          note: 'hsl(var(--mention-note))',
          faction: 'hsl(var(--mention-faction))',
          coterie: 'hsl(var(--mention-coterie))',
          location: 'hsl(var(--mention-location))',
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-blood': 'var(--gradient-blood)',
        'gradient-shadow': 'var(--gradient-shadow)',
        'gradient-subtle': 'var(--gradient-subtle)',
      },
      boxShadow: {
        'crimson': 'var(--shadow-crimson)',
        'deep': 'var(--shadow-deep)',
        'gothic': 'var(--shadow-gothic)',
      },
      fontFamily: {
        'gothic': 'var(--font-gothic)',
        'label': 'var(--font-label)',
        'body': 'var(--font-body)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
