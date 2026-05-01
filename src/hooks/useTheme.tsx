import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { applyTheme, cacheTheme, loadCachedTheme, ThemeKey } from "@/lib/themes";

type Ctx = { theme: ThemeKey; setTheme: (t: ThemeKey) => Promise<void> };
const ThemeCtx = createContext<Ctx>({ theme: "cinnamoroll", setTheme: async () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeKey>(() => loadCachedTheme());

  // apply on mount
  useEffect(() => { applyTheme(theme); }, [theme]);

  // load from profile when user logs in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      const t = (data?.theme as ThemeKey) ?? "cinnamoroll";
      setThemeState(t);
      cacheTheme(t);
    })();
  }, [user]);

  const setTheme = useCallback(async (t: ThemeKey) => {
    setThemeState(t);
    cacheTheme(t);
    if (user) await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
  }, [user]);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);