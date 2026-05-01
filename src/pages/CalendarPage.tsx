import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { TaskItem } from "@/components/flow/TaskItem";
import { AddTaskForm } from "@/components/flow/AddTaskForm";
import { checkAchievementsAfterDone } from "@/lib/achievements";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { Category } from "@/lib/categories";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("tasks").select("*").order("due_date", { ascending: true }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setTasks(t ?? []); setProfile(p); setFetching(false);
    })();
  }, [user]);

  const dayMap = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) if (t.due_date) {
      const k = t.due_date;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    return m;
  }, [tasks]);

  const selectedKey = toIso(date);
  const selectedTasks = dayMap.get(selectedKey) ?? [];

  const { pendingDates, doneDates, overdueDates } = useMemo(() => {
    const pending: Date[] = [];
    const done: Date[] = [];
    const overdue: Date[] = [];
    const todayKey = toIso(new Date());
    for (const [k, list] of dayMap.entries()) {
      const allDone = list.every((t) => t.is_done);
      const d = new Date(k + "T00:00:00");
      if (allDone) done.push(d);
      else if (k < todayKey) overdue.push(d);
      else pending.push(d);
    }
    return { pendingDates: pending, doneDates: done, overdueDates: overdue };
  }, [dayMap]);

  const monthSummary = useMemo(() => {
    const y = date.getFullYear(), m = date.getMonth();
    const inMonth = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date + "T00:00:00");
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const done = inMonth.filter((t) => t.is_done).length;
    return { total: inMonth.length, done, pct: inMonth.length ? Math.round((done / inMonth.length) * 100) : 0 };
  }, [tasks, date]);

  const addTask = async ({ title, priority, due_date, category }: { title: string; priority: Task["priority"]; due_date: string | null; category: Category }) => {
    if (!user) return;
    const { data, error } = await supabase.from("tasks")
      .insert({ user_id: user.id, title, priority, due_date: due_date ?? selectedKey, category }).select().single();
    if (error) { toast.error("Erro ao criar"); return; }
    setTasks((p) => [...p, data]);
    toast.success("Tarefa marcada no calendário ☁️");
  };

  const toggleTask = async (id: string, done: boolean) => {
    const updated = tasks.map((t) => t.id === id ? { ...t, is_done: done } : t);
    setTasks(updated);
    await supabase.from("tasks").update({ is_done: done }).eq("id", id);
    if (done && user) {
      const just = updated.find((t) => t.id === id)!;
      await checkAchievementsAfterDone(user.id, updated, just);
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  if (loading || !user || fetching) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>;

  const isToday = toIso(new Date()) === selectedKey;

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} />
      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-end gap-3">
          <Mascot mood="think" size={100} />
          <SpeechBubble className="flex-1 mb-2">
            Vamos ver seus prazos? Toque num diazinho pra ver as tarefas dele 📅
            <br/><span className="text-xs text-muted-foreground">Este mês: {monthSummary.done}/{monthSummary.total} concluídas ({monthSummary.pct}%)</span>
          </SpeechBubble>
        </div>

        <div className="bg-gradient-cloud border-2 border-primary-soft rounded-3xl shadow-cloud p-3 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-6xl opacity-20 pointer-events-none select-none">☁️</div>
          <div className="absolute -bottom-6 -left-2 text-5xl opacity-20 pointer-events-none select-none">☁️</div>
          <div className="relative flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              locale={ptBR}
              modifiers={{ pending: pendingDates, doneDay: doneDates, overdue: overdueDates }}
              modifiersClassNames={{
                pending: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
                doneDay: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-[hsl(var(--cat-other))]",
                overdue: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-destructive",
              }}
              className="p-3 pointer-events-auto [&_.rdp-day_selected]:shadow-pop"
            />
          </div>
          <div className="relative flex flex-wrap justify-center gap-3 mt-3 pt-3 border-t border-primary-soft text-xs">
            <Legend color="bg-primary" label="Pendente" />
            <Legend color="bg-[hsl(var(--cat-other))]" label="Concluída" />
            <Legend color="bg-destructive" label="Atrasada" />
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-lg flex items-center gap-2">
              {isToday && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-soft text-pink-foreground font-bold">Hoje</span>}
              <span className="capitalize">{date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
            </h2>
            {selectedTasks.length > 0 && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {selectedTasks.filter((t) => t.is_done).length}/{selectedTasks.length}
              </span>
            )}
          </div>
          <AddTaskForm onAdd={addTask} defaultDate={selectedKey} />
          {selectedTasks.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary/60" />
              <p className="text-sm">Sem tarefas neste dia ☁️</p>
              <p className="text-xs">Adicione uma metinha pra esse dia acima!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
