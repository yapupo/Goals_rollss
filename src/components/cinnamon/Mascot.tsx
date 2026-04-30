import hello from "@/assets/cinnamon-hello.webp";
import happy from "@/assets/cinnamon-happy.webp";
import think from "@/assets/cinnamon-think.webp";
import sleep from "@/assets/cinnamon-sleep.webp";
import { cn } from "@/lib/utils";

const MAP = { hello, happy, think, sleep } as const;
type Mood = keyof typeof MAP;

interface Props {
  mood?: Mood;
  className?: string;
  size?: number;
  float?: boolean;
}

export function Mascot({ mood = "hello", className, size = 140, float = true }: Props) {
  return (
    <img
      src={MAP[mood]}
      alt={`Cinnamoroll ${mood}`}
      width={size}
      height={size}
      className={cn("select-none drop-shadow-sm", float && "animate-float", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
