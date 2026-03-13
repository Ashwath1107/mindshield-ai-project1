import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Target, Palette, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StressRelief() {
  const [activeTab, setActiveTab] = useState<'breathe' | 'reaction' | 'color' | 'meditate'>('breathe');

  const tabs = [
    { id: 'breathe', label: 'Breathing', icon: Wind },
    { id: 'reaction', label: 'Focus Game', icon: Target },
    { id: 'color', label: 'Color Therapy', icon: Palette },
    { id: 'meditate', label: '1-Min Meditate', icon: Timer },
  ] as const;

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold">Stress Relief Hub</h1>
          <p className="text-muted-foreground mt-2">Tools to recalibrate your mind and lower cortisol levels instantly.</p>
        </header>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all relative z-10",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white/80 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="stress-tab" 
                    className="absolute inset-0 bg-primary/40 rounded-xl border border-primary/50 -z-10 shadow-lg shadow-primary/20"
                  />
                )}
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 glass-card rounded-3xl overflow-hidden relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full flex items-center justify-center p-6"
            >
              {activeTab === 'breathe' && <BreathingExercise />}
              {activeTab === 'reaction' && <ReactionGame />}
              {activeTab === 'color' && <ColorRelaxation />}
              {activeTab === 'meditate' && <MeditationTimer />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

// ----------------------------------------------------
// Sub-components for Stress Relief Tools
// ----------------------------------------------------

function BreathingExercise() {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const cycle = () => {
      setPhase('Inhale');
      timeout = setTimeout(() => {
        setPhase('Hold');
        timeout = setTimeout(() => {
          setPhase('Exhale');
          timeout = setTimeout(cycle, 6000); // Exhale 6s
        }, 2000); // Hold 2s
      }, 4000); // Inhale 4s
    };
    
    cycle();
    return () => clearTimeout(timeout);
  }, []);

  const scale = phase === 'Inhale' ? 1.8 : phase === 'Exhale' ? 1 : 1.8;
  const color = phase === 'Inhale' ? 'bg-cyan-500' : phase === 'Hold' ? 'bg-primary' : 'bg-blue-500';

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
        className={cn("w-32 h-32 rounded-full blur-xl absolute opacity-30", color)}
        animate={{ scale }}
        transition={{ duration: phase === 'Inhale' ? 4 : phase === 'Exhale' ? 6 : 2, ease: "easeInOut" }}
      />
      <motion.div 
        className={cn("w-32 h-32 rounded-full flex items-center justify-center shadow-2xl relative z-10 bg-white/10 border border-white/20 backdrop-blur-md")}
        animate={{ scale }}
        transition={{ duration: phase === 'Inhale' ? 4 : phase === 'Exhale' ? 6 : 2, ease: "easeInOut" }}
      >
      </motion.div>
      <h2 className="mt-16 text-3xl font-display font-bold tracking-widest z-20">
        {phase}...
      </h2>
      <p className="mt-2 text-muted-foreground text-sm z-20">Follow the circle to regulate your heart rate</p>
    </div>
  );
}

function ReactionGame() {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'done'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const startTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setGameState('waiting');
    setReactionTime(null);
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTime.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      clearTimeout(timeoutRef.current!);
      setGameState('done');
      setReactionTime(-1); // too early
    } else if (gameState === 'ready') {
      const time = Date.now() - startTime.current;
      setReactionTime(time);
      setGameState('done');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center">
      <h2 className="text-2xl font-bold font-display mb-2">Focus Reset Game</h2>
      <p className="text-muted-foreground mb-12 max-w-md">Distract your mind from stress by focusing completely on a single task.</p>
      
      {gameState === 'idle' ? (
        <button onClick={start} className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/30">
          Start Game
        </button>
      ) : (
        <div 
          onClick={handleClick}
          className={cn(
            "w-64 h-64 rounded-3xl flex items-center justify-center cursor-pointer transition-colors shadow-2xl",
            gameState === 'waiting' ? "bg-amber-500/20 border-2 border-amber-500 hover:bg-amber-500/30" : 
            gameState === 'ready' ? "bg-emerald-500 text-white font-bold text-2xl shadow-[0_0_50px_rgba(16,185,129,0.5)]" : 
            "bg-white/5 border border-white/10"
          )}
        >
          {gameState === 'waiting' && <span className="text-amber-500 font-bold">Wait for Green...</span>}
          {gameState === 'ready' && <span>CLICK NOW!</span>}
          {gameState === 'done' && (
            <div className="flex flex-col items-center">
              {reactionTime === -1 ? (
                <span className="text-rose-500 font-bold mb-4">Too Early!</span>
              ) : (
                <>
                  <span className="text-3xl font-display font-bold text-cyan-400 mb-2">{reactionTime} ms</span>
                  <span className="text-sm text-muted-foreground mb-4">Excellent Focus</span>
                </>
              )}
              <button onClick={start} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium text-sm">
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ColorRelaxation() {
  const colors = [
    "from-blue-900 via-indigo-900 to-purple-900",
    "from-teal-900 via-emerald-900 to-cyan-900",
    "from-rose-900 via-pink-900 to-fuchsia-900"
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const int = setInterval(() => {
      setIndex(prev => (prev + 1) % colors.length);
    }, 5000);
    return () => clearInterval(int);
  }, []);

  return (
    <motion.div 
      className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-[5000ms] ease-in-out flex flex-col items-center justify-center", colors[index])}
    >
      <div className="text-center bg-black/20 p-8 rounded-3xl backdrop-blur-md border border-white/5">
        <Palette className="w-12 h-12 text-white/50 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-display text-white mb-2">Color Therapy</h2>
        <p className="text-white/60">Watch the colors blend. Let your thoughts pass by.</p>
      </div>
    </motion.div>
  );
}

function MeditationTimer() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let int: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      int = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(int);
  }, [isRunning, timeLeft]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => { setIsRunning(false); setTimeLeft(60); };

  const progress = ((60 - timeLeft) / 60) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md">
      <h2 className="text-2xl font-bold font-display mb-12">One Minute Reset</h2>
      
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        {/* SVG Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle 
            cx="50" cy="50" r="45" fill="none" 
            stroke="url(#gradient)" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={283}
            animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
            transition={{ duration: 1, ease: "linear" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="text-5xl font-display font-bold text-white tracking-widest">
          00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={toggle}
          className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
        >
          {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        <button 
          onClick={reset}
          className="w-16 h-16 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
