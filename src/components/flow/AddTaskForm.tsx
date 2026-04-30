import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { CATEGORIES, Category } from "@/lib/categories";

type Priority = Tables<"tasks">["priority"];

interface Props {
  onAdd: (data: { title: string; priority: Priority; due_date: string | null; category: Category }) => Promise<void>;
  defaultDate?: string | null;
}

export function AddTaskForm({ onAdd, defaultDate }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("personal");
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > 200) return;
    setBusy(true);
    await onAdd({ title: trimmed, priority, due_date: dueDate || null, category });
    setTitle("");
    setDueDate(defaultDate ?? "");
    setPriority("medium");
    setCategory("personal");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl p-4 shadow-cloud border border-border space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="O que você quer conquistar? ☁️"
        maxLength={200}
        className="h-12 text-base rounded-2xl border-border bg-secondary/40"
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="h-11 rounded-2xl bg-secondary/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="h-11 rounded-2xl bg-secondary/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-11 rounded-2xl bg-secondary/40 col-span-2 sm:col-span-1"
        />
        <Button type="submit" disabled={busy || !title.trim()} className="h-11 rounded-2xl bg-primary hover:bg-primary/90 shadow-pop col-span-2 sm:col-span-1">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>
    </form>
  );
}
