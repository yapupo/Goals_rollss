import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { THEMES, ThemeKey } from "@/lib/themes";
import { useTheme } from "@/hooks/useTheme";
import { Loader2, Lock, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomizePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("achievements").select("code").eq("code", "perfect_week").maybeSingle(),
      ]);
      setProfile(p);
      setUnlocked(!!a);
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user || fetching) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>;
  }

  const choose = async (k: ThemeKey) => {
    if (!unlocked && k !== "cinnamoroll") {
      toast.error("Tema bloqueado 🔒", { description: "Conclua todas as suas metas da semana para desbloquear!" });
      return;
    }
    await setTheme(k);
    toast.success(`Tema ${THEMES[k].name} aplicado! ${THEMES[k].emoji}`);
  };

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} />
      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-end gap-3">
          <Mascot mood={unlocked ? "happy" : "think"} size={110} />
          <SpeechBubble className="flex-1 mb-2">
            {unlocked
              ? "Você desbloqueou a personalização! Escolha um amiguinho do mundo Hello Kitty pra deixar tudo com a sua cara 🤍"
              : "Pra desbloquear novos temas, conclua todas as suas metas durante uma semana! Por enquanto, só o Cinnamoroll tá disponível ☁️"}
          </SpeechBubble>
        </div>

        {!unlocked && (
          <div className="rounded-3xl p-4 bg-pink-soft/60 border border-pink-soft text-sm flex items-center gap-2 text-pink-foreground">
            <Sparkles className="w-4 h-4" />
            Conquista necessária: <strong>Semana perfeita ✨</strong>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
            const t = THEMES[k];
            const locked = !unlocked && k !== "cinnamoroll";
            const active = theme === k;
            return (
              <button
                key={k}
                onClick={() => choose(k)}
                className={cn(
                  "text-left rounded-3xl p-5 border-2 transition-bounce relative overflow-hidden",
                  active ? "border-primary shadow-cloud" : "border-border bg-white hover:border-primary/50",
                  locked && "opacity-60"
                )}
              >
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 80% 20%, hsl(${t.vars.primarySoft}) 0%, transparent 60%), radial-gradient(circle at 20% 90%, hsl(${t.vars.pink} / 0.5) 0%, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-2xl mb-1">{t.emoji}</p>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      <span className="w-5 h-5 rounded-full border border-white/60" style={{ background: `hsl(${t.vars.primary})` }} />
                      <span className="w-5 h-5 rounded-full border border-white/60" style={{ background: `hsl(${t.vars.pink})` }} />
                      <span className="w-5 h-5 rounded-full border border-white/60" style={{ background: `hsl(${t.vars.accent})` }} />
                    </div>
                    {locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Check className="w-3 h-3" /> em uso</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}