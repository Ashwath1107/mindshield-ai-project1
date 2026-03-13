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
  { href: '/', label: 'Home', icon: Home, color: 'text-violet-400', activeBg: 'from-violet-600/20 to-purple-600/10', border: 'border-violet-500/30' },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare, color: 'text-blue-400', activeBg: 'from-blue-600/20 to-cyan-600/10', border: 'border-blue-500/30' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400', activeBg: 'from-indigo-600/20 to-violet-600/10', border: 'border-indigo-500/30' },
  { href: '/camera', label: 'Face Scan', icon: Camera, color: 'text-fuchsia-400', activeBg: 'from-fuchsia-600/20 to-pink-600/10', border: 'border-fuchsia-500/30' },
  { href: '/voice', label: 'Voice Scan', icon: Mic, color: 'text-emerald-400', activeBg: 'from-emerald-600/20 to-teal-600/10', border: 'border-emerald-500/30' },
  { href: '/stress-relief', label: 'Relief Hub', icon: Wind, color: 'text-amber-400', activeBg: 'from-amber-600/20 to-orange-600/10', border: 'border-amber-500/30' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-50 border-r border-white/[0.06]"
        style={{ background: 'rgba(15,12,30,0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/[0.05]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/30">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-lg leading-none text-gradient">MindShield</h1>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Emotional AI</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={cn(
                      "absolute inset-0 rounded-2xl border bg-gradient-to-r",
                      item.activeBg, item.border
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 z-10 transition-colors",
                  isActive ? item.color : "group-hover:" + item.color
                )} />
                <span className="z-10 font-medium text-sm">{item.label}</span>

                {isActive && (
                  <motion.div
                    className="ml-auto z-10 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color.replace('text-', '').replace('-400', '') }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/[0.05]">
          <div className="rounded-2xl p-3 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-300 font-semibold mb-1">💜 Mental Health First</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">If you're in crisis, please call 988 or text HOME to 741741</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative h-screen overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] px-2 py-2 flex items-center justify-around"
        style={{ background: 'rgba(15,12,30,0.92)', backdropFilter: 'blur(20px)' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl relative min-w-[3.5rem] transition-colors",
                isActive ? item.color : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-br", item.activeBg)}
                />
              )}
              <item.icon className="w-5 h-5 mb-1 z-10" />
              <span className="text-[9px] font-medium z-10">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
