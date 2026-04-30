import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SpeechBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative bg-white rounded-3xl px-5 py-4 shadow-cloud border-2 border-primary-soft text-sm leading-relaxed text-foreground",
      "before:absolute before:left-[-10px] before:top-6 before:w-5 before:h-5 before:bg-white before:border-l-2 before:border-b-2 before:border-primary-soft before:rotate-45",
      className
    )}>
      {children}
    </div>
  );
}
