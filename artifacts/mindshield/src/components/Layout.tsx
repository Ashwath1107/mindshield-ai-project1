import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  LayoutDashboard, 
  Camera, 
  Mic, 
  Wind,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/camera', label: 'Face Scan', icon: Camera },
  { href: '/voice', label: 'Voice Scan', icon: Mic },
  { href: '/stress-relief', label: 'Relief', icon: Wind },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r-white/5 h-screen sticky top-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 p-[1px]">
            <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <h1 className="font-display font-bold text-xl tracking-wide text-gradient">
            MindShield
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 z-10", isActive ? "text-cyan-400" : "group-hover:text-cyan-400 transition-colors")} />
                <span className="z-10 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative h-screen overflow-y-auto overflow-x-hidden pb-20 md:pb-0 scroll-smooth">
        <div className="max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-t-white/5 z-50 px-2 py-2 flex items-center justify-around pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg relative min-w-[4rem]",
                isActive ? "text-cyan-400" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
