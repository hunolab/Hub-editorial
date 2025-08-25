import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <BookOpen className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
            <span className="font-display font-bold text-xl text-foreground">
              Literare Books
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
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
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                    <Home className="h-4 w-4 mr-2" />
                    Início
                  </Button>
                </Link>
                <Link to="/submit">
                  <Button className="btn-hero">
                    Enviar Capítulo
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};