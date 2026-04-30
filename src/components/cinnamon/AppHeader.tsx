import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Home, LogOut, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface Props { profile: Tables<"profiles"> | null }

export function AppHeader({ profile }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const initials = (profile?.display_name || user?.email || "?").slice(0, 2).toUpperCase();

  const NavBtn = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <Link to={to} className={cn(
      "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-smooth",
      pathname === to ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary"
    )}>{icon}<span className="hidden sm:inline">{label}</span></Link>
  );

  return (
    <header className="bg-white/80 backdrop-blur border-b border-border sticky top-0 z-10">
      <div className="container max-w-3xl flex items-center justify-between h-16 px-4">
        <Link to="/dashboard" className="flex items-center gap-1.5">
          <span className="text-2xl">☁️</span>
          <span className="font-bold text-lg hidden sm:inline">Goals Roll</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavBtn to="/dashboard" icon={<Home className="w-4 h-4" />} label="Início" />
          <NavBtn to="/calendar" icon={<Calendar className="w-4 h-4" />} label="Calendário" />
          <NavBtn to="/achievements" icon={<Trophy className="w-4 h-4" />} label="Conquistas" />
        </nav>
        <div className="flex items-center gap-2">
          <Avatar className="w-9 h-9 ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-pink-soft text-pink-foreground text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate("/"))} aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
