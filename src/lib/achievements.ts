import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Task = Tables<"tasks">;

export const ACHIEVEMENT_DEFS = {
  first_task: {
    title: "Você ganhou um docinho! 🍬",
    description: "Sua primeira tarefa concluída — Cinnamoroll está orgulhoso!",
    icon: "🍬",
  },
  five_tasks: {
    title: "Cinco doces na cestinha! 🧁",
    description: "Você concluiu 5 tarefas. Continue assim!",
    icon: "🧁",
  },
  ten_tasks: {
    title: "Mestre dos docinhos! 🍰",
    description: "10 tarefas concluídas. Impressionante!",
    icon: "🍰",
  },
  perfect_week: {
    title: "Semana perfeita! ✨",
    description: "Todas as suas metas da semana foram cumpridas. Personalize seu Cinnamoroll!",
    icon: "✨",
  },
  early_bird: {
    title: "Madrugadora aplicada! ☁️",
    description: "Concluiu uma tarefa antes do meio-dia.",
    icon: "☁️",
  },
} as const;

export type AchievementCode = keyof typeof ACHIEVEMENT_DEFS;

async function unlock(userId: string, code: AchievementCode) {
  const def = ACHIEVEMENT_DEFS[code];
  const { data, error } = await supabase
    .from("achievements")
    .insert({ user_id: userId, code, title: def.title, description: def.description, icon: def.icon })
    .select()
    .maybeSingle();
  if (!error && data) {
    toast.success(def.title, { description: def.description, duration: 5000 });
    return true;
  }
  return false;
}

export async function checkAchievementsAfterDone(userId: string, allTasks: Task[], justCompleted: Task) {
  const doneTasks = allTasks.filter((t) => t.is_done);
  const doneCount = doneTasks.length;

  // first task
  if (doneCount === 1) await unlock(userId, "first_task");
  if (doneCount === 5) await unlock(userId, "five_tasks");
  if (doneCount === 10) await unlock(userId, "ten_tasks");

  // early bird
  const hour = new Date().getHours();
  if (hour < 12) await unlock(userId, "early_bird");

  // perfect week: any task due this week and ALL of them done
  const now = new Date();
  const day = now.getDay(); // 0=sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  const weekTasks = allTasks.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date + "T00:00:00");
    return d >= monday && d < sunday;
  });
  if (weekTasks.length >= 3 && weekTasks.every((t) => t.is_done)) {
    await unlock(userId, "perfect_week");
  }
}
