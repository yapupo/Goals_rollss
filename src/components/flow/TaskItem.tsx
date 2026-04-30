import { Tables } from "@/integrations/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryMeta } from "@/lib/categories";

type Task = Tables<"tasks">;

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-secondary text-secondary-foreground border-transparent",
  medium: "bg-accent text-accent-foreground border-transparent",
  high: "bg-pink text-pink-foreground border-transparent",
};
const priorityLabel: Record<Task["priority"], string> = { low: "Baixa", medium: "Média", high: "Alta" };

interface Props {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const cat = categoryMeta(task.category);
  const Icon = cat.icon;
  return (
    <div className={cn(
      "group flex items-start gap-3 p-4 rounded-3xl bg-white shadow-soft border border-border transition-bounce hover:-translate-y-0.5",
      task.is_done && "opacity-60"
    )}>
      <Checkbox
        checked={task.is_done}
        onCheckedChange={(v) => onToggle(task.id, !!v)}
        className="mt-1 h-5 w-5 rounded-md"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold leading-snug", task.is_done && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className={cn("rounded-full text-xs gap-1 border-transparent", cat.color)}>
            <Icon className="w-3 h-3" /> {cat.label}
          </Badge>
          <Badge variant="outline" className={cn("rounded-full text-xs", priorityStyles[task.priority])}>
            {priorityLabel[task.priority]}
          </Badge>
          {task.due_date && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-smooth text-muted-foreground hover:text-destructive"
        aria-label="Remover tarefa">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
