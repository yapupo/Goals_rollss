import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AddTaskForm } from "@/components/flow/AddTaskForm";
import { TaskItem } from "@/components/flow/TaskItem";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, LogOut, ListTodo, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setTasks(t ?? []);
      setProfile(p);
      setFetching(false);
    })();
  }, [user]);

  const addTask = async ({ title, priority, due_date }: { title: string; priority: Task["priority"]; due_date: string | null }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: user.id, title, priority, due_date })
      .select()
      .single();
    if (error) { toast.error("Não foi possível criar a tarefa"); return; }
    setTasks((prev) => [data, ...prev]);
    toast.success("Tarefa adicionada ✨");
  };

  const toggleTask = async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done: done } : t)));
    const { error } = await supabase.from("tasks").update({ is_done: done }).eq("id", id);
    if (error) toast.error("Erro ao atualizar tarefa");
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks((curr) => curr.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { setTasks(prev); toast.error("Erro ao remover"); }
    else toast.success("Tarefa removida");
  };

  const visible = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.is_done);
    if (filter === "done") return tasks.filter((t) => t.is_done);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_done).length;
    return { total, done, active: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </main>
    );
  }

  const initials = (profile?.display_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen">
      <header className="glass border-b border-border/40 sticky top-0 z-10">
        <div className="container max-w-3xl flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Flow List</span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 ring-2 ring-primary/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <section>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Olá, <span className="bg-gradient-primary bg-clip-text text-transparent">{profile?.display_name ?? "você"}</span> ✨
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.active === 0 ? "Tudo em ordem por aqui." : `Você tem ${stats.active} ${stats.active === 1 ? "tarefa" : "tarefas"} pendentes.`}
          </p>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <StatCard icon={<ListTodo className="w-4 h-4" />} label="Total" value={stats.total} />
          <StatCard icon={<Sparkles className="w-4 h-4" />} label="Ativas" value={stats.active} />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Feitas" value={`${stats.pct}%`} />
        </section>

        <AddTaskForm onAdd={addTask} />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-card/60 rounded-2xl p-1 h-11">
            <TabsTrigger value="active" className="rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">Ativas</TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">Todas</TabsTrigger>
            <TabsTrigger value="done" className="rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">Feitas</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="space-y-2 pb-12">
          {fetching ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/60 animate-float" />
              <p>Nada por aqui. Adicione sua primeira tarefa acima.</p>
            </div>
          ) : (
            visible.map((t) => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-4 bg-gradient-card shadow-card border border-border/40">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
