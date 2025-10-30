// src/components/Navigation.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User, Home, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para efeito de navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth com Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setMenuState(false);
  };

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : 'inactive'}
        className="fixed z-50 w-full px-2 group"
      >
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'bg-background/80 max-w-5xl rounded-2xl border backdrop-blur-lg lg:px-5 shadow-sm'
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            
            {/* LOGO À ESQUERDA */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link to="/" aria-label="home" className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Literare Books" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.src = ''; // Remove imagem quebrada
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback se logo não carregar */}
                <div className="hidden items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <span className="font-bold text-xl text-foreground">Literare</span>
                </div>
              </Link>

              {/* Botão Mobile */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Fechar Menu' : 'Abrir Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className={cn(
                  "m-auto size-6 duration-200 transition-all",
                  menuState && "scale-0 opacity-0"
                )} />
                <X className={cn(
                  "absolute inset-0 m-auto size-6 duration-200 transition-all",
                  !menuState ? "-rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                )} />
              </button>
            </div>

            {/* MENU DESKTOP + MOBILE */}
            <div
              className={cn(
                "hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none",
                "bg-background border",
                "lg:group-data-[state=active]:flex",
                menuState && "block"
              )}
            >
              {/* Links Mobile */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {user ? (
                    <>
                      <li>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setMenuState(false)}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <button 
                          onClick={handleLogout} 
                          className="text-muted-foreground hover:text-destructive block duration-150 w-full text-left"
                        >
                          Sair
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link 
                          to="/" 
                          onClick={() => setMenuState(false)}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          Início
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/submit" 
                          onClick={() => setMenuState(false)}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          Enviar Capítulo
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/login" 
                          onClick={() => setMenuState(false)}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          Login
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* BOTÕES DESKTOP */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {user ? (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Início
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link to="/submit">Enviar Capítulo</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Link to="/login">Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navigation; // ← ESSENCIAL!