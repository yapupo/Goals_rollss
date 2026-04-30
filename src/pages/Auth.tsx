import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Mascot } from "@/components/cinnamon/Mascot";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/onboarding", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        toast.success("Conta criada! ☁️");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda(o) de volta 🤍");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Algo deu errado";
      if (msg.toLowerCase().includes("invalid login")) toast.error("E-mail ou senha incorretos");
      else if (msg.toLowerCase().includes("already registered")) toast.error("E-mail já cadastrado — faça login");
      else toast.error(msg);
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/onboarding` });
    if (result.error) { toast.error("Não foi possível entrar com Google"); setBusy(false); return; }
    if (result.redirected) return;
    navigate("/onboarding", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-hero">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center gap-1 mb-4">
          <Mascot mood="hello" size={120} float={false} />
          <span className="text-2xl font-bold">Goals Roll</span>
        </Link>

        <Card className="bg-white rounded-3xl shadow-cloud border border-border p-7">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "signin" ? "Que bom te ver de novo!" : "Vamos criar sua conta?"}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === "signin" ? "Entre para continuar suas metinhas" : "Cinnamoroll mal pode esperar pra te conhecer"}
          </p>

          <Button type="button" variant="outline" className="w-full h-11 rounded-2xl bg-white" onClick={handleGoogle} disabled={busy}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar com Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou com e-mail</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-11 rounded-2xl bg-secondary/40" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-2xl bg-secondary/40" required />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 shadow-pop">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "signin" ? "Entrar" : "Criar conta")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            {mode === "signin" ? "Novo por aqui? " : "Já tem conta? "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold hover:underline">
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}
