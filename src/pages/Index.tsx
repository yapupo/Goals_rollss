import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Mascot } from "@/components/cinnamon/Mascot";
import { SpeechBubble } from "@/components/cinnamon/SpeechBubble";

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
          <span className="text-2xl">☁️</span>
          <span className="font-bold text-xl">Goals Roll</span>
        </div>
        <Button asChild variant="ghost" className="rounded-full">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="container max-w-5xl px-4 pt-8 pb-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-soft text-pink-foreground text-xs font-semibold mb-4">
              <Sparkles className="w-3 h-3" /> com Cinnamoroll
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05]">
              Suas metas, <br />com um <span className="text-primary">amiguinho fofo</span> ☁️
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-md mx-auto md:mx-0">
              Goals Roll é seu app de metas e tarefas. Organize por categoria, marque prazos no calendário e desbloqueie conquistas com o Cinnamoroll.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center md:justify-start">
              <Button asChild size="lg" className="h-12 px-7 rounded-full bg-primary hover:bg-primary/90 shadow-pop text-base">
                <Link to="/auth">Começar grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-full bg-white text-base">
                <a href="#features">Ver recursos</a>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative flex justify-center">
            <div className="absolute inset-0 bg-gradient-pink rounded-[40%_60%_55%_45%/55%_45%_60%_40%] blur-2xl opacity-60" aria-hidden />
            <div className="relative flex flex-col items-center gap-3">
              <Mascot mood="hello" size={240} />
              <SpeechBubble className="max-w-[260px]">
                Oi! Eu sou o Cinnamoroll e vou te ajudar com suas metas! ☁️🤍
              </SpeechBubble>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container max-w-5xl px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Feature icon={<Heart />} title="Categorias" desc="Trabalho, estudo, metas pessoais — cada uma com sua cor." />
        <Feature icon={<Calendar />} title="Calendário" desc="Veja seus prazos no mês e planeje a semana." />
        <Feature icon={<Trophy />} title="Conquistas" desc="Ganhe docinhos e personalize seu Cinnamoroll." />
        <Feature icon={<Sparkles />} title="Mascote amigo" desc="Cinnamoroll te incentiva em cada tarefa." />
      </section>

      <footer className="container max-w-6xl px-4 py-10 text-center text-sm text-muted-foreground">
        Feito com 🤍 para suas metas mais fofas.
      </footer>
    </main>
  );
};

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl p-5 bg-white shadow-cloud border border-border transition-bounce hover:-translate-y-1">
      <div className="w-11 h-11 rounded-2xl bg-gradient-primary text-white flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

export default Index;
