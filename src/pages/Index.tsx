import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Cloud, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImg from "@/assets/cyber-hero.jpg";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="container max-w-6xl flex items-center justify-between py-5 px-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Flow List</span>
        </div>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="relative">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background" aria-hidden />

        <div className="container max-w-4xl text-center px-4 pt-16 pb-24">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border/50 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" /> Cybercore productivity
          </span>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            Tarefas que <span className="bg-gradient-primary bg-clip-text text-transparent">fluem</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
            Flow List é o seu app de tarefas com vibe pastel cyber. Organize, conclua e flua, com tudo sincronizado na nuvem.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button asChild size="lg" className="h-12 px-7 rounded-2xl bg-gradient-primary shadow-glow hover:shadow-soft transition-smooth text-base">
              <Link to="/auth">Começar grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-2xl bg-card/60 backdrop-blur text-base">
              <a href="#features">Ver recursos</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="container max-w-5xl px-4 py-20 grid sm:grid-cols-3 gap-4">
        <Feature icon={<Zap />} title="Rápido e leve" desc="Crie, conclua e organize tarefas em segundos, sem fricção." />
        <Feature icon={<Cloud />} title="Sincronizado" desc="Suas tarefas em qualquer dispositivo, sempre atualizadas." />
        <Feature icon={<CheckCircle2 />} title="Foco no que importa" desc="Prioridades e prazos para fluir nas suas metas." />
      </section>

      <footer className="container max-w-6xl px-4 py-10 text-center text-sm text-muted-foreground border-t border-border/40">
        Feito com ✨ no estilo cybercore pastel.
      </footer>
    </main>
  );
};

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl p-6 bg-gradient-card shadow-card border border-border/40 transition-smooth hover:shadow-soft hover:-translate-y-1">
      <div className="w-11 h-11 rounded-2xl bg-gradient-primary shadow-soft flex items-center justify-center text-primary-foreground mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

export default Index;
