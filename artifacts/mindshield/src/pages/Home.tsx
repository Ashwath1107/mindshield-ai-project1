import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Layout } from '@/components/Layout';
import { MessageSquare, Camera, Mic, Wind, ShieldCheck, Activity, Brain, Sparkles, BarChart3 } from 'lucide-react';

const features = [
  {
    to: "/chat",
    icon: MessageSquare,
    title: "AI Support Chat",
    desc: "Talk freely. AI detects emotions & stress hidden in your words and typing rhythm.",
    gradient: "from-blue-600 to-cyan-500",
    glow: "shadow-blue-500/25",
    bg: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-500/20",
  },
  {
    to: "/camera",
    icon: Camera,
    title: "Face Emotion Scan",
    desc: "Real-time micro-expression analysis through your webcam.",
    gradient: "from-violet-600 to-fuchsia-500",
    glow: "shadow-violet-500/25",
    bg: "from-violet-500/10 to-fuchsia-500/5",
    border: "border-violet-500/20",
  },
  {
    to: "/voice",
    icon: Mic,
    title: "Voice Tone Analysis",
    desc: "Speak naturally — AI detects anger, sadness, and calm from your vocal tone.",
    gradient: "from-emerald-600 to-teal-500",
    glow: "shadow-emerald-500/25",
    bg: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-500/20",
  },
  {
    to: "/stress-relief",
    icon: Wind,
    title: "Stress Relief Hub",
    desc: "Breathing exercises, reaction games, color therapy & meditation music.",
    gradient: "from-rose-600 to-orange-500",
    glow: "shadow-rose-500/25",
    bg: "from-rose-500/10 to-orange-500/5",
    border: "border-rose-500/20",
  },
];

const stats = [
  { value: "7", label: "Emotions Detected", icon: Brain, color: "text-violet-400" },
  { value: "4", label: "Input Modalities", icon: Activity, color: "text-cyan-400" },
  { value: "100", label: "Stability Score", icon: Sparkles, color: "text-emerald-400" },
  { value: "Real‑time", label: "Burnout Prediction", icon: BarChart3, color: "text-pink-400" },
];

export function Home() {
  return (
    <Layout>
      <div className="relative min-h-full flex flex-col px-4 py-10 md:py-16 overflow-hidden">

        {/* Decorative animated background blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-pink-600/8 blur-[80px] pointer-events-none" />

        {/* Hero */}
        <motion.div
          className="text-center max-w-4xl mx-auto z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo + Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative float">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 p-0.5 shadow-2xl shadow-violet-500/40">
                <div className="w-full h-full rounded-[22px] bg-background/80 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}images/logo.png`}
                    alt="MindShield"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-violet-500/30 pulse-ring" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa'
            }}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Predictive Emotional Guardian · AI-Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-5xl md:text-7xl font-display font-black leading-[1.05] mb-6"
          >
            <span className="text-white">Your Mental Health,</span>
            <br />
            <span className="text-gradient">Understood by AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            MindShield reads your <span className="text-violet-400 font-semibold">typing patterns</span>,
            <span className="text-cyan-400 font-semibold"> facial expressions</span>,
            <span className="text-pink-400 font-semibold"> voice tone</span>, and
            <span className="text-emerald-400 font-semibold"> language</span> — predicting burnout before it hits and guiding you back to balance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 40px rgba(124,58,237,0.35), 0 4px 24px rgba(124,58,237,0.2)'
              }}
            >
              <MessageSquare className="w-5 h-5" />
              Start Chat Session
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/25 transition-all duration-300"
            >
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              View Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12 w-full z-10"
        >
          {stats.map(({ value, label, icon: Icon, color }) => (
            <div key={label} className="glass-card rounded-2xl p-4 text-center border border-white/8">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className={`text-2xl font-display font-black ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full z-10"
        >
          {features.map(({ to, icon: Icon, title, desc, gradient, glow, bg, border }) => (
            <Link
              key={to}
              href={to}
              className={`group block relative rounded-3xl border ${border} bg-gradient-to-br ${bg} p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glow}`}
            >
              {/* Hover glow overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} />

              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg shadow-${glow} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-base font-display font-bold mb-2 text-white relative z-10">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{desc}</p>

              <div className={`mt-4 text-xs font-semibold flex items-center gap-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent relative z-10`}>
                Explore →
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground/50 mt-10 z-10"
        >
          MindShield AI — Built for mental wellness · Hackathon Prototype · Your data stays private
        </motion.p>
      </div>
    </Layout>
  );
}
