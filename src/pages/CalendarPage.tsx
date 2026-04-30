import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  const datesWithTasks = useMemo(() => Array.from(dayMap.keys()).map((k) => new Date(k + "T00:00:00")), [dayMap]);

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

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} />
      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-end gap-3">
          <Mascot mood="think" size={100} />
          <SpeechBubble className="flex-1 mb-2">
            Vamos ver seus prazos? Toque num diazinho pra ver as tarefas dele 📅
          </SpeechBubble>
        </div>

        <Card className="bg-white border border-border rounded-3xl shadow-cloud p-2 sm:p-4 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            locale={ptBR}
            modifiers={{ hasTask: datesWithTasks }}
            modifiersClassNames={{ hasTask: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary" }}
            className="p-3 pointer-events-auto"
          />
        </Card>

        <section className="space-y-3">
          <h2 className="font-bold text-lg">
            {date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <AddTaskForm onAdd={addTask} defaultDate={selectedKey} />
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem tarefas neste dia ☁️</p>
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
