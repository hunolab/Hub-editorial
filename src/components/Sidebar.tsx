// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calculator, BookOpen, Package, Warehouse, 
  BarChart3, Send, Home, LogOut, Edit3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
    { label: "Comercial", href: "/dashboard/comercial", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Revisor IA", href: "/dashboard/revisor", icon: <Edit3 className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r z-50 flex flex-col transition-all duration-300",
          open ? "w-64" : "w-16",
          "md:hover:w-64 md:hover:shadow-lg"
        )}
        onMouseEnter={() => {
          if (window.innerWidth >= 768) setOpen(true);
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 768) setOpen(false);
        }}
        onClick={() => {
          if (window.innerWidth < 768) setOpen(!open);
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center p-4 border-b">
          <Logo open={open} />
        </div>

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(e) => {
                if (window.innerWidth < 768) {
                  e.preventDefault();
                  setOpen(false);
                  setTimeout(() => navigate(link.href), 300);
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {/* Ícone com Tooltip */}
              <div className="relative group/tooltip flex-shrink-0">
                {link.icon}
                {!open && (
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                    {link.label}
                  </span>
                )}
              </div>

              {/* Texto animado */}
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ 
                  opacity: open ? 1 : 0,
                  width: open ? 'auto' : 0
                }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {link.label}
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-1 border-t">
          <Link
            to="/submit"
            onClick={(e) => {
              if (window.innerWidth < 768) {
                e.preventDefault();
                setOpen(false);
                setTimeout(() => navigate('/submit'), 300);
              }
            }}
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors group"
          >
            <div className="relative group/tooltip flex-shrink-0">
              <Send className="h-5 w-5" />
              {!open && (
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                  Enviar Capítulo
                </span>
              )}
            </div>
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              Enviar Capítulo
            </motion.span>
          </Link>

          <Link
            to="/"
            onClick={(e) => {
              if (window.innerWidth < 768) {
                e.preventDefault();
                setOpen(false);
                setTimeout(() => navigate('/'), 300);
              }
            }}
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors group"
          >
            <div className="relative group/tooltip flex-shrink-0">
              <Home className="h-5 w-5" />
              {!open && (
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                  Início
                </span>
              )}
            </div>
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              Início
            </motion.span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
          >
            <div className="relative group/tooltip flex-shrink-0">
              <LogOut className="h-5 w-5" />
              {!open && (
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                  Sair
                </span>
              )}
            </div>
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              Sair
            </motion.span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Logo com animação
const Logo = ({ open }: { open: boolean }) => (
  <Link to="/" className="flex items-center gap-2">
    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-sm">L</span>
    </div>
    <motion.span
      initial={{ opacity: 0, width: 0 }}
      animate={{ 
        opacity: open ? 1 : 0,
        width: open ? 'auto' : 0
      }}
      transition={{ duration: 0.2 }}
      className="font-semibold text-foreground whitespace-nowrap overflow-hidden"
    >
      Literare
    </motion.span>
  </Link>
);