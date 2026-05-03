import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DEFAULT_SETTINGS, PomodoroMode, PomodoroSettings,
  loadSettings, saveSettings, loadStats, saveStats, modeLabel, playBeep,
} from "@/lib/pomodoro";
import { checkAchievementsAfterDone, unlockAchievement } from "@/lib/achievements";
import { categoryMeta } from "@/lib/categories";
import {
  Loader2, Pause, Play, RotateCcw, Settings as SettingsIcon, SkipForward, Check, Target,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

const MODE_TINT: Record<PomodoroMode, string> = {
  focus: "from-primary/30 to-pink/20",
  short: "from-cat-other/40 to-primary/10",
  long: "from-cat-study/40 to-pink/10",
};

export default function FocusPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.focus * 60);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0); // current cycle
  const [settingsOpen, setSettingsOpen] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("tasks").select("*").eq("is_done", false).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setTasks(t ?? []);
      setProfile(p);
      setFetching(false);
    })();
  }, [user]);

  // Reset timer when mode or settings change (only if not running)
  useEffect(() => {
    if (running) return;
    setSecondsLeft(settings[mode] * 60);
  }, [mode, settings, running]);

  // Tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Document title
  useEffect(() => {
    document.title = `${formatTime(secondsLeft)} · ${modeLabel(mode)} — Goals Roll`;
    return () => { document.title = "Goals Roll"; };
  }, [secondsLeft, mode]);

  async function handleComplete() {
    setRunning(false);
    if (settings.sound) playBeep(mode === "focus" ? 3 : 2);

    if (mode === "focus") {
      const stats = loadStats();
      const newTotal = stats.totalFocus + 1;
      saveStats({ ...stats, totalFocus: newTotal });
      setCompletedFocus((c) => c + 1);

      toast.success("Sessão de foco concluída! ☁️", {
        description: "Hora de uma pausinha merecida.",
      });

      if (user && newTotal === 10) await unlockAchievement(user.id, "marathoner");

      // Move to break
      const nextMode: PomodoroMode = (completedFocus + 1) % settings.longEvery === 0 ? "long" : "short";
      setMode(nextMode);
      setSecondsLeft(settings[nextMode] * 60);
      if (settings.autoStart) setRunning(true);
    } else {
      // Break finished without skip
      const stats = loadStats();
      const consec = stats.consecutiveNoSkip + 1;
      saveStats({ ...stats, consecutiveNoSkip: consec });
      if (user && consec >= 4) await unlockAchievement(user.id, "iron_focus");

      toast("Pausinha terminada 🤍", { description: "Bora pra mais um foco?" });
      setMode("focus");
      setSecondsLeft(settings.focus * 60);
      if (settings.autoStart) setRunning(true);
    }
  }

  function skipBreak() {
    if (mode === "focus") return;
    saveStats({ ...loadStats(), consecutiveNoSkip: 0 });
    setRunning(false);
    setMode("focus");
    setSecondsLeft(settings.focus * 60);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(settings[mode] * 60);
  }

  async function completeTask(taskId: string) {
    const updated = tasks.map((t) => t.id === taskId ? { ...t, is_done: true } : t);
    const just = updated.find((t) => t.id === taskId)!;
    const { error } = await supabase.from("tasks").update({ is_done: true }).eq("id", taskId);
    if (error) { toast.error("Erro ao concluir"); return; }
    setTasks((curr) => curr.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) setActiveTaskId(null);
    toast.success("Tarefa concluída! 🍬");
    if (user) {
      // Need full task list (incl already done) for accurate counts
      const { data: all } = await supabase.from("tasks").select("*");
      if (all) await checkAchievementsAfterDone(user.id, all, just);
    }
  }

  if (loading || !user || fetching) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>;
  }

  const total = settings[mode] * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} minimal />
      <div className="container max-w-5xl px-4 py-8 grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Timer principal */}
        <section className={cn(
          "rounded-[2rem] p-8 md:p-12 border-2 border-white/60 shadow-cloud bg-gradient-to-br relative overflow-hidden",
          MODE_TINT[mode]
        )}>
          {/* Mode tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(["focus", "short", "long"] as PomodoroMode[]).map((m) => (
              <button key={m}
                onClick={() => { setRunning(false); setMode(m); }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-smooth",
                  mode === m ? "bg-white text-foreground shadow-soft" : "bg-white/40 text-muted-foreground hover:bg-white/70"
                )}>
                {modeLabel(m)}
              </button>
            ))}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button className="px-3 py-2 rounded-full bg-white/40 hover:bg-white/70 transition-smooth" aria-label="Configurações">
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <SettingsDialog
                settings={settings}
                onSave={(s) => { setSettings(s); saveSettings(s); setSettingsOpen(false); toast.success("Configurações salvas ✨"); }}
              />
            </Dialog>
          </div>

          {/* Big timer */}
          <div className="text-center">
            <div className="text-7xl md:text-9xl font-bold tracking-tight font-[Fredoka] text-foreground tabular-nums">
              {formatTime(secondsLeft)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeTask ? <>Focando em: <span className="font-semibold text-foreground">{activeTask.title}</span></> : "Escolha uma tarefa ao lado pra focar"}
            </p>

            {/* Progress bar */}
            <div className="mt-6 h-2 bg-white/50 rounded-full overflow-hidden max-w-md mx-auto">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg" onClick={() => setRunning((r) => !r)}
                className="rounded-full px-10 py-6 text-lg font-bold shadow-pop">
                {running ? <><Pause className="w-5 h-5 mr-2" /> Pausar</> : <><Play className="w-5 h-5 mr-2" /> Começar</>}
              </Button>
              <Button variant="outline" size="icon" onClick={reset} className="rounded-full w-12 h-12" aria-label="Reiniciar">
                <RotateCcw className="w-4 h-4" />
              </Button>
              {mode !== "focus" && (
                <Button variant="outline" size="icon" onClick={skipBreak} className="rounded-full w-12 h-12" aria-label="Pular pausa">
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Sessões neste ciclo: {completedFocus} · Pausa longa a cada {settings.longEvery}
            </p>
          </div>
        </section>

        {/* Lista lateral de tarefas */}
        <aside className="rounded-3xl bg-white/80 backdrop-blur border border-border shadow-soft p-4 h-fit">
          <h2 className="font-bold text-base flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" /> Tarefas ativas
          </h2>
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Nada por aqui ☁️<br/>Adicione tarefas no início.</p>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {tasks.map((t) => {
                const cat = categoryMeta(t.category);
                const Icon = cat.icon;
                const active = activeTaskId === t.id;
                return (
                  <li key={t.id}
                    className={cn(
                      "rounded-2xl border p-3 transition-bounce cursor-pointer",
                      active ? "bg-primary-soft border-primary shadow-soft" : "bg-white border-border hover:border-primary/40"
                    )}
                    onClick={() => setActiveTaskId(active ? null : t.id)}>
                    <div className="flex items-start gap-2">
                      <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", cat.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{cat.label}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); completeTask(t.id); }}
                        className="w-7 h-7 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-smooth flex items-center justify-center"
                        aria-label="Concluir tarefa">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function SettingsDialog({ settings, onSave }: { settings: PomodoroSettings; onSave: (s: PomodoroSettings) => void }) {
  const [draft, setDraft] = useState<PomodoroSettings>(settings);
  useEffect(() => setDraft(settings), [settings]);
  const upd = <K extends keyof PomodoroSettings>(k: K, v: PomodoroSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <DialogContent className="rounded-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> Configurações do Pomodoro</DialogTitle>
      </DialogHeader>
      <div className="space-y-5 pt-2">
        <NumberRow label="Foco (min)" value={draft.focus} onChange={(v) => upd("focus", v)} min={5} max={90} />
        <NumberRow label="Pausinha (min)" value={draft.short} onChange={(v) => upd("short", v)} min={1} max={30} />
        <NumberRow label="Pausa longa (min)" value={draft.long} onChange={(v) => upd("long", v)} min={5} max={60} />
        <div className="space-y-2">
          <Label className="text-sm">Pausa longa a cada {draft.longEvery} sessões</Label>
          <Slider value={[draft.longEvery]} min={2} max={8} step={1} onValueChange={(v) => upd("longEvery", v[0])} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Iniciar próxima automaticamente</Label>
          <Switch checked={draft.autoStart} onCheckedChange={(v) => upd("autoStart", v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Som ao terminar</Label>
          <Switch checked={draft.sound} onCheckedChange={(v) => upd("sound", v)} />
        </div>
        <Button className="w-full rounded-full" onClick={() => onSave(draft)}>Salvar</Button>
      </div>
    </DialogContent>
  );
}

function NumberRow({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm">{label}</Label>
      <Input type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-24 rounded-xl" />
    </div>
  );
}
