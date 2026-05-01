import { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

/**
 * Calcula a sequência (em dias) de dias consecutivos com pelo menos
 * uma tarefa concluída, contando para trás a partir de hoje.
 * Usa updated_at como proxy de "quando foi concluída".
 */
export function calcStreak(tasks: Task[]): number {
  const doneDays = new Set<string>();
  for (const t of tasks) {
    if (!t.is_done) continue;
    const d = new Date(t.updated_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    doneDays.add(key);
  }
  if (doneDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Permite começar de hoje OU ontem (para não zerar antes do fim do dia atual)
  const todayKey = fmt(cursor);
  if (!doneDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (doneDays.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;