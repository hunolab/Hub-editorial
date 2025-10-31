// src/layouts/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import { SidebarComponent } from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <SidebarComponent open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content - se adapta ao tamanho do sidebar */}
      <motion.main
        className="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden"
        animate={{
          marginLeft: sidebarOpen ? 256 : 64, // 256px = aberto, 64px = ícones
        }}
        initial={{ marginLeft: 64 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}