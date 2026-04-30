import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { AppHeader } from "@/components/cinnamon/AppHeader";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { ACHIEVEMENT_DEFS, AchievementCode } from "@/lib/achievements";
import { Loader2, Lock } from "lucide-react";

export default function AchievementsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState<Tables<"achievements">[]>([]);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [fetching, setFetching] = useState(true);

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

        <div className="grid sm:grid-cols-2 gap-3">
          {all.map(([code, def]) => {
            const got = unlockedCodes.has(code);
            return (
              <div key={code} className={`rounded-3xl p-5 border transition-bounce ${got ? "bg-white border-border shadow-cloud" : "bg-secondary/40 border-border opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${got ? "bg-pink-soft" : "bg-muted"}`}>
                    {got ? def.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{def.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
