import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AddTaskForm } from "@/components/flow/AddTaskForm";
import { TaskItem } from "@/components/flow/TaskItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ListTodo, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { cinnamonGreeting, cinnamonQuote } from "@/lib/cinnamon-quotes";
import { checkAchievementsAfterDone } from "@/lib/achievements";
import { CATEGORIES, Category } from "@/lib/categories";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      if (p && !p.has_onboarded) { navigate("/onboarding", { replace: true }); return; }
      setTasks(t ?? []);
      setProfile(p);
      setFetching(false);
    })();
  }, [user, navigate]);

  const addTask = async ({ title, priority, due_date, category }: { title: string; priority: Task["priority"]; due_date: string | null; category: Category }) => {
    if (!user) return;
    const { data, error } = await supabase.from("tasks")
      .insert({ user_id: user.id, title, priority, due_date, category }).select().single();
    if (error) { toast.error("Não foi possível criar a tarefa"); return; }
    setTasks((prev) => [data, ...prev]);
    toast.success("Tarefa adicionada ☁️");
  };

  const toggleTask = async (id: string, done: boolean) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, is_done: done } : t));
    setTasks(updated);
    const { error } = await supabase.from("tasks").update({ is_done: done }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    if (done && user) {
      const just = updated.find((t) => t.id === id);
      if (just) await checkAchievementsAfterDone(user.id, updated, just);
    }
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks((curr) => curr.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { setTasks(prev); toast.error("Erro ao remover"); }
  };

  const visible = useMemo(() => {
    let v = tasks;
    if (catFilter !== "all") v = v.filter((t) => t.category === catFilter);
    if (filter === "active") v = v.filter((t) => !t.is_done);
    if (filter === "done") v = v.filter((t) => t.is_done);
    return v;
  }, [tasks, filter, catFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_done).length;
    return { total, done, active: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  if (loading || !user || fetching) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>;
  }

  const name = profile?.display_name ?? "amigo(a)";
  const mood = stats.total === 0 ? "think" : stats.active === 0 ? "happy" : "hello";

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} />
      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <section className="flex items-end gap-3">
          <Mascot mood={mood} size={110} />
          <SpeechBubble className="flex-1 mb-2 animate-pop-in">
            <p className="font-semibold mb-0.5">{cinnamonGreeting(name)}</p>
            <p className="text-muted-foreground text-xs">{cinnamonQuote(name, stats.active, stats.total)}</p>
          </SpeechBubble>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <StatCard icon={<ListTodo className="w-4 h-4" />} label="Total" value={stats.total} />
          <StatCard icon={<Sparkles className="w-4 h-4" />} label="Ativas" value={stats.active} />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Feitas" value={`${stats.pct}%`} />
        </section>

        <AddTaskForm onAdd={addTask} />

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCatFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth ${catFilter === "all" ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground"}`}>Todas categorias</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth ${catFilter === c.value ? "bg-primary text-primary-foreground" : `${c.color} opacity-80 hover:opacity-100`}`}>
              <c.icon className="w-3 h-3" /> {c.label}
            </button>
          ))}
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-white border border-border rounded-full p-1 h-11">
            <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ativas</TabsTrigger>
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todas</TabsTrigger>
            <TabsTrigger value="done" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Feitas</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="space-y-2 pb-12">
          {visible.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
              <Mascot mood="sleep" size={120} />
              <p className="text-sm">Nada por aqui... Cinnamoroll tirou um cochilo 💤</p>
            </div>
          ) : visible.map((t) => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-3xl p-4 bg-white shadow-soft border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
