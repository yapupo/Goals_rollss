import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { calcStreak } from "./streak";

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
  night_owl: {
    title: "Coruja noturna 🌙",
    description: "Concluiu uma tarefa depois das 22h. Descansa um pouquinho!",
    icon: "🌙",
  },
  streak_3: {
    title: "Sequência de 3 dias 🔥",
    description: "Três dias seguidos concluindo tarefas. Tá voando!",
    icon: "🔥",
  },
  streak_7: {
    title: "Sequência de 7 dias 🌟",
    description: "Uma semana inteira de foco. Cinnamoroll tá impressionado!",
    icon: "🌟",
  },
  on_time: {
    title: "No prazinho ⏰",
    description: "Concluiu uma tarefa no mesmo dia do prazo. Organizada!",
    icon: "⏰",
  },
  twenty_tasks: {
    title: "Vinte vitórias! 🏆",
    description: "20 tarefas concluídas. Você é uma máquina de fofura produtiva!",
    icon: "🏆",
  },
  master_supreme: {
    title: "Mestre Supremo 👑",
    description: "50 tarefas concluídas. Cinnamoroll te coroou rainha do foco!",
    icon: "👑",
  },
  marathoner: {
    title: "Maratonista 🏃‍♀️",
    description: "10 sessões de Pomodoro concluídas. Fôlego de campeã!",
    icon: "🏃‍♀️",
  },
  iron_focus: {
    title: "Foco de Aço 🛡️",
    description: "4 Pomodoros seguidos sem pular o break. Disciplina pura!",
    icon: "🛡️",
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
  if (doneCount === 20) await unlock(userId, "twenty_tasks");
  if (doneCount === 50) await unlock(userId, "master_supreme");

  // hora do dia
  const hour = new Date().getHours();
  if (hour < 12) await unlock(userId, "early_bird");
  if (hour >= 22) await unlock(userId, "night_owl");

  // no prazo
  if (justCompleted.due_date) {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (justCompleted.due_date === todayKey) await unlock(userId, "on_time");
  }

  // streaks
  const streak = calcStreak(allTasks);
  if (streak >= 3) await unlock(userId, "streak_3");
  if (streak >= 7) await unlock(userId, "streak_7");

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

export async function unlockAchievement(userId: string, code: AchievementCode) {
  return unlock(userId, code);
}
