export type PomodoroMode = "focus" | "short" | "long";

export interface PomodoroSettings {
  focus: number; // minutes
  short: number;
  long: number;
  longEvery: number; // long break every N focus sessions
  autoStart: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
  sound: true,
};

const SETTINGS_KEY = "goalsroll.pomodoro.settings";
const STATS_KEY = "goalsroll.pomodoro.stats";

export interface PomodoroStats {
  totalFocus: number; // total finished focus sessions (lifetime)
  consecutiveNoSkip: number; // consecutive focus->break completed without skipping break
}

export function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: PomodoroSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadStats(): PomodoroStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalFocus: 0, consecutiveNoSkip: 0 };
    return JSON.parse(raw);
  } catch {
    return { totalFocus: 0, consecutiveNoSkip: 0 };
  }
}

export function saveStats(s: PomodoroStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

export function modeLabel(m: PomodoroMode) {
  return m === "focus" ? "Foco" : m === "short" ? "Pausinha" : "Pausa longa";
}

// Beep using WebAudio so we don't ship an asset
export function playBeep(times = 2) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
      t += 0.55;
    }
    setTimeout(() => ctx.close(), (times * 600) + 200);
  } catch {
    // ignore
  }
}
