export type ThemeKey = "cinnamoroll" | "mymelody" | "kuromi" | "pompompurin" | "keroppi";

export interface ThemeDef {
  key: ThemeKey;
  name: string;
  emoji: string;
  description: string;
  unlockHint?: string;
  // HSL triplets
  vars: {
    background: string;
    primary: string;
    primarySoft: string;
    accent: string;
    pink: string;
    ring: string;
    radial1: string;
    radial2: string;
  };
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  cinnamoroll: {
    key: "cinnamoroll",
    name: "Cinnamoroll",
    emoji: "☁️",
    description: "Céu azulzinho e fofo, o tema clássico.",
    vars: {
      background: "205 80% 97%",
      primary: "205 85% 70%",
      primarySoft: "205 90% 92%",
      accent: "45 95% 88%",
      pink: "340 90% 85%",
      ring: "205 85% 70%",
      radial1: "205 100% 95%",
      radial2: "340 100% 96%",
    },
  },
  mymelody: {
    key: "mymelody",
    name: "My Melody",
    emoji: "🎀",
    description: "Rosa docinho com laços fofos.",
    vars: {
      background: "340 100% 97%",
      primary: "340 80% 75%",
      primarySoft: "340 100% 94%",
      accent: "350 90% 90%",
      pink: "340 90% 80%",
      ring: "340 80% 75%",
      radial1: "340 100% 94%",
      radial2: "0 100% 96%",
    },
  },
  kuromi: {
    key: "kuromi",
    name: "Kuromi",
    emoji: "🖤",
    description: "Roxo travesso, mas sempre fofo.",
    vars: {
      background: "270 60% 96%",
      primary: "275 55% 65%",
      primarySoft: "275 80% 92%",
      accent: "300 70% 88%",
      pink: "320 80% 82%",
      ring: "275 55% 65%",
      radial1: "275 80% 93%",
      radial2: "320 90% 95%",
    },
  },
  pompompurin: {
    key: "pompompurin",
    name: "Pompompurin",
    emoji: "🍮",
    description: "Amarelinho de pudim quentinho.",
    vars: {
      background: "45 100% 96%",
      primary: "40 90% 65%",
      primarySoft: "45 100% 90%",
      accent: "30 90% 85%",
      pink: "20 90% 85%",
      ring: "40 90% 65%",
      radial1: "45 100% 92%",
      radial2: "30 100% 94%",
    },
  },
  keroppi: {
    key: "keroppi",
    name: "Keroppi",
    emoji: "🐸",
    description: "Verdinho lago, fresquinho como folha de vitória-régia.",
    vars: {
      background: "140 60% 96%",
      primary: "145 55% 60%",
      primarySoft: "140 70% 90%",
      accent: "90 70% 85%",
      pink: "350 80% 85%",
      ring: "145 55% 60%",
      radial1: "140 70% 92%",
      radial2: "90 80% 94%",
    },
  },
};

export function applyTheme(key: ThemeKey) {
  const t = THEMES[key] ?? THEMES.cinnamoroll;
  const r = document.documentElement.style;
  r.setProperty("--background", t.vars.background);
  r.setProperty("--primary", t.vars.primary);
  r.setProperty("--primary-soft", t.vars.primarySoft);
  r.setProperty("--accent", t.vars.accent);
  r.setProperty("--pink", t.vars.pink);
  r.setProperty("--ring", t.vars.ring);
  r.setProperty("--radial-1", t.vars.radial1);
  r.setProperty("--radial-2", t.vars.radial2);
  document.documentElement.dataset.theme = key;
}

const STORAGE_KEY = "goalsroll.theme";
export function loadCachedTheme(): ThemeKey {
  if (typeof window === "undefined") return "cinnamoroll";
  const v = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
  return v && v in THEMES ? v : "cinnamoroll";
}
export function cacheTheme(key: ThemeKey) {
  localStorage.setItem(STORAGE_KEY, key);
}