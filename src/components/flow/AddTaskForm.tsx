import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Priority = Tables<"tasks">["priority"];

interface Props {
  onAdd: (data: { title: string; priority: Priority; due_date: string | null }) => Promise<void>;
}

export function AddTaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > 200) return;
    setBusy(true);
    await onAdd({ title: trimmed, priority, due_date: dueDate || null });
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="glass rounded-3xl p-4 shadow-soft border border-border/40 space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="O que você precisa fazer? ✨"
        maxLength={200}
        className="h-12 text-base rounded-2xl border-border/50 bg-card/60"
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="h-11 rounded-xl bg-card/60 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Prioridade baixa</SelectItem>
            <SelectItem value="medium">Prioridade média</SelectItem>
            <SelectItem value="high">Prioridade alta</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-11 rounded-xl bg-card/60 sm:w-44"
        />
        <Button type="submit" disabled={busy || !title.trim()} className="h-11 rounded-xl bg-gradient-primary shadow-soft hover:shadow-glow transition-smooth flex-1 sm:flex-none">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>
    </form>
  );
}
