import { Tables } from "@/integrations/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks">;

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-accent text-accent-foreground border-transparent",
  medium: "bg-secondary text-secondary-foreground border-transparent",
  high: "bg-highlight text-highlight-foreground border-transparent",
};
const priorityLabel: Record<Task["priority"], string> = {
  low: "Baixa", medium: "Média", high: "Alta",
};

interface Props {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <div className={cn(
      "group flex items-start gap-3 p-4 rounded-2xl bg-gradient-card shadow-card border border-border/40 transition-smooth hover:shadow-soft",
      task.is_done && "opacity-60"
    )}>
      <Checkbox
        checked={task.is_done}
        onCheckedChange={(v) => onToggle(task.id, !!v)}
        className="mt-1 h-5 w-5 rounded-md"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium leading-snug", task.is_done && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className={cn("rounded-full text-xs", priorityStyles[task.priority])}>
            {priorityLabel[task.priority]}
          </Badge>
          {task.due_date && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-smooth text-muted-foreground hover:text-destructive"
        aria-label="Remover tarefa"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
