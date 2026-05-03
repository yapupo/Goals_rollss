import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { ACHIEVEMENT_DEFS, AchievementCode } from "@/lib/achievements";
import { Loader2, Lock, BookOpen, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AchievementsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState<Tables<"achievements">[]>([]);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showLocked, setShowLocked] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("achievements").select("*").order("unlocked_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setUnlocked(a ?? []); setProfile(p); setFetching(false);
    })();
  }, [user]);

  if (loading || !user || fetching) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>;

  const unlockedCodes = new Set(unlocked.map((u) => u.code));
  const all = Object.entries(ACHIEVEMENT_DEFS) as [AchievementCode, typeof ACHIEVEMENT_DEFS[AchievementCode]][];
  const customizeUnlocked = unlockedCodes.has("perfect_week");
  const unlockedList = all.filter(([code]) => unlockedCodes.has(code));
  const lockedList = all.filter(([code]) => !unlockedCodes.has(code));

  return (
    <main className="min-h-screen">
      <AppHeader profile={profile} />
      <div className="container max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-end gap-3">
          <Mascot mood="happy" size={110} />
          <SpeechBubble className="flex-1 mb-2">
            Olha quantas conquistas! Você já desbloqueou {unlocked.length} de {all.length} 🤍
          </SpeechBubble>
        </div>

        <Link
          to="/customize"
          className={`block rounded-3xl p-4 border-2 transition-bounce ${customizeUnlocked ? "bg-gradient-pink border-pink shadow-cloud hover:scale-[1.01]" : "bg-secondary/40 border-border"}`}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{customizeUnlocked ? "🎀" : "🔒"}</div>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {customizeUnlocked ? "Personalização desbloqueada!" : "Personalização do tema"}
              </p>
              <p className="text-xs text-muted-foreground">
                {customizeUnlocked
                  ? "Escolha um amiguinho do mundo Hello Kitty pra deixar tudo com a sua cara."
                  : "Conclua todas as suas metas durante uma semana pra desbloquear novos temas!"}
              </p>
            </div>
          </div>
        </Link>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Suas conquistas ({unlockedList.length})</h2>
            <Button variant="outline" size="sm" onClick={() => setShowLocked((v) => !v)} className="rounded-full text-xs gap-1.5">
              {showLocked ? <><EyeOff className="w-3.5 h-3.5" /> Esconder bloqueadas</> : <><BookOpen className="w-3.5 h-3.5" /> Ver bloqueadas ({lockedList.length})</>}
            </Button>
          </div>

          {unlockedList.length === 0 ? (
            <div className="rounded-3xl p-8 bg-white/60 border border-dashed border-border text-center text-sm text-muted-foreground">
              Nada desbloqueado ainda. Conclua tarefas pra começar a colecionar 🍬
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {unlockedList.map(([code, def]) => (
                <div key={code} className="rounded-3xl p-5 border bg-white border-border shadow-cloud transition-bounce hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-pink-soft">{def.icon}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{def.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showLocked && (
            <div className="space-y-2 animate-pop-in">
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide pt-2">Bloqueadas</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {lockedList.map(([code, def]) => (
                  <div key={code} className="rounded-3xl p-5 border bg-secondary/40 border-border opacity-70">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-muted">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">???</p>
                        <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
