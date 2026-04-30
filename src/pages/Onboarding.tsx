import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";
import { Loader2 } from "lucide-react";

const schema = z.string().trim().min(1, "Conta seu nome 🥺").max(40, "Máx. 40 caracteres");

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    supabase.from("profiles").select("display_name, has_onboarded").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.has_onboarded) navigate("/dashboard", { replace: true });
      else if (data?.display_name) setName(data.display_name);
    });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(name);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: parsed.data, has_onboarded: true })
      .eq("id", user.id);
    setBusy(false);
    if (error) { toast.error("Algo deu errado, tenta de novo?"); return; }
    toast.success(`Prazer, ${parsed.data}! ☁️`);
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-hero">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-4">
          <Mascot mood="hello" size={160} />
          <SpeechBubble className="mt-2 max-w-[280px]">
            Oi~ eu sou o Cinnamoroll! Como você gostaria de ser chamada(o)? 🤍
          </SpeechBubble>
        </div>

        <Card className="bg-white rounded-3xl shadow-cloud border border-border p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-semibold">Seu nome</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria"
                maxLength={40}
                autoFocus
                className="h-12 mt-1.5 rounded-2xl text-base bg-secondary/40"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-pop text-base">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vamos lá! ☁️"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
