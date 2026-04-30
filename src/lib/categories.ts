import { Briefcase, BookOpen, Heart, Sparkles, LucideIcon } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"tasks">["category"];

export const CATEGORIES: { value: Category; label: string; icon: LucideIcon; color: string }[] = [
  { value: "work",     label: "Trabalho",       icon: Briefcase, color: "bg-cat-work text-foreground" },
  { value: "study",    label: "Estudo",         icon: BookOpen,  color: "bg-cat-study text-foreground" },
  { value: "personal", label: "Metas pessoais", icon: Heart,     color: "bg-cat-personal text-foreground" },
  { value: "other",    label: "Outros",         icon: Sparkles,  color: "bg-cat-other text-foreground" },
];

export const categoryMeta = (c: Category) => CATEGORIES.find((x) => x.value === c)!;
