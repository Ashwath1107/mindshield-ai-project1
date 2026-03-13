import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Layout } from '@/components/Layout';
import { MessageSquare, Camera, Mic, Wind, ShieldCheck, Activity } from 'lucide-react';

export function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <Layout>
      <div className="relative min-h-full flex flex-col items-center px-4 py-12 md:py-24">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 -z-10 w-full h-full opacity-30 pointer-events-none">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Futuristic background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <motion.div 
          className="text-center max-w-3xl mx-auto space-y-6 z-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="w-20 h-20 relative">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MindShield Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-primary/30 text-sm font-medium text-cyan-300">
            <Activity className="w-4 h-4" />
            <span>Predictive Emotional Guardian</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight">
            Protect Your Mind with <br />
            <span className="text-gradient">AI Emotion Detection</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            MindShield monitors your typing patterns, facial expressions, voice tonality, and language to predict burnout before it happens and guide you back to balance.
          </motion.p>
          
          <motion.div variants={itemVariants} className="pt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <FeatureCard 
              to="/chat" 
              icon={MessageSquare} 
              title="Chat Analysis" 
              desc="Detect stress hidden in your words and typing speed." 
              color="from-blue-500/20 to-cyan-500/5"
              borderColor="border-blue-500/20"
            />
            <FeatureCard 
              to="/camera" 
              icon={Camera} 
              title="Face Scan" 
              desc="Real-time emotional detection via webcam." 
              color="from-purple-500/20 to-fuchsia-500/5"
              borderColor="border-purple-500/20"
            />
            <FeatureCard 
              to="/voice" 
              icon={Mic} 
              title="Voice Scan" 
              desc="Analyze micro-tremors in your voice to find hidden stress." 
              color="from-emerald-500/20 to-teal-500/5"
              borderColor="border-emerald-500/20"
            />
            <FeatureCard 
              to="/stress-relief" 
              icon={Wind} 
              title="Stress Relief" 
              desc="Instant tools to lower heart rate and restore calm." 
              color="from-rose-500/20 to-orange-500/5"
              borderColor="border-rose-500/20"
            />
          </motion.div>
          
          <motion.div variants={itemVariants} className="pt-12">
             <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-cyan-600 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <ShieldCheck className="w-5 h-5" />
              View Your Emotional Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}

function FeatureCard({ to, icon: Icon, title, desc, color, borderColor }: { to: string, icon: any, title: string, desc: string, color: string, borderColor: string }) {
  return (
    <Link href={to} className={`block p-6 rounded-2xl glass-card bg-gradient-to-br ${color} ${borderColor} hover:border-white/20 text-left group`}>
      <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2 font-display">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
    </Link>
  );
}
