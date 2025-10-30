// src/components/Sidebar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calculator, BookOpen, Package, Warehouse, Send, Home, LogOut, Menu, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const SidebarComponent = ({ open, setOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const links = [
    { label: "Submissões", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Calculadora", href: "/dashboard/calculadora", icon: <Calculator className="h-5 w-5" /> },
    { label: "Referência", href: "/dashboard/referencia", icon: <BookOpen className="h-5 w-5" /> },
    { label: "Entregas", href: "/dashboard/logistica", icon: <Package className="h-5 w-5" /> },
    { label: "Estoque", href: "/dashboard/estoque", icon: <Warehouse className="h-5 w-5" /> },
    { label: "Revisor IA", href: "/dashboard/revisor", icon: <Edit3 className="h-5 w-5" /> }, // NOVO ITEM AQUI
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r z-40 transition-all duration-300 flex flex-col",
          open ? "w-64" : "w-16",
          "md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Logo open={open} />
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setOpen(!open)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {link.icon}
              <motion.span
                animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}
                className="text-sm font-medium"
              >
                {link.label}
              </motion.span>
            </Link>
          ))}
        </nav>

        <div className="p-3 space-y-1 border-t">
          <Link to="/submit" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent rounded-lg">
            <Send className="h-5 w-5" />
            <motion.span animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}>Enviar Capítulo</motion.span>
          </Link>
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent rounded-lg">
            <Home className="h-5 w-5" />
            <motion.span animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}>Início</motion.span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-destructive hover:bg-destructive/10 rounded-lg">
            <LogOut className="h-5 w-5" />
            <motion.span animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}>Sair</motion.span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Logo = ({ open }: { open: boolean }) => (
  <Link to="/" className="flex items-center gap-2">
    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-sm">L</span>
    </div>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      className="font-semibold text-foreground"
    >
      Literare
    </motion.span>
  </Link>
);