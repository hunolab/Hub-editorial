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

      {/* Main Content */}
      <motion.main
        className="flex-1 transition-all duration-300 overflow-x-hidden"
        animate={{
          marginLeft: sidebarOpen ? 260 : 60, // 260px = sidebar aberto, 60px = ícone
        }}
        initial={{ marginLeft: 60 }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}