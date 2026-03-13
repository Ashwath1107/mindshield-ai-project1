import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Target, Palette, Timer, Play, Pause, RotateCcw, Music, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StressRelief() {
  const [activeTab, setActiveTab] = useState<'breathe' | 'reaction' | 'color' | 'meditate'>('breathe');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Binaural beats ambient music using Web Audio API
  const startMusic = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Theta binaural beat (6Hz) – relaxation & meditation frequency
    const baseFreq = 200; // carrier
    const beatFreq = 6;   // binaural beat

    // Left ear
    const oscL = ctx.createOscillator();
    const panL = ctx.createStereoPanner();
    oscL.frequency.value = baseFreq;
    oscL.type = 'sine';
    panL.pan.value = -1;
    oscL.connect(panL);
    panL.connect(masterGain);
    oscL.start();

    // Right ear (slightly different frequency = binaural beat)
    const oscR = ctx.createOscillator();
    const panR = ctx.createStereoPanner();
    oscR.frequency.value = baseFreq + beatFreq;
    oscR.type = 'sine';
    panR.pan.value = 1;
    oscR.connect(panR);
    panR.connect(masterGain);
    oscR.start();

    // Ambient drone – low pad
    const pad1 = ctx.createOscillator();
    const padGain1 = ctx.createGain();
    pad1.frequency.value = 80;
    pad1.type = 'triangle';
    padGain1.gain.value = 0.06;
    pad1.connect(padGain1);
    padGain1.connect(masterGain);
    pad1.start();

    // Soft high harmonic
    const pad2 = ctx.createOscillator();
    const padGain2 = ctx.createGain();
    pad2.frequency.value = 320;
    pad2.type = 'sine';
    padGain2.gain.value = 0.03;
    // Add slow LFO modulation to pad2 for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(pad2.frequency);
    lfo.start();
    pad2.connect(padGain2);
    padGain2.connect(masterGain);
    pad2.start();

    oscillatorsRef.current = [oscL, oscR, pad1, pad2, lfo];
    setMusicPlaying(true);
  }, []);

  const stopMusic = useCallback(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
      setTimeout(() => {
        oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        oscillatorsRef.current = [];
      }, 1100);
    }
    setMusicPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
      audioCtxRef.current?.close();
    };
  }, []);

  const tabs = [
    { id: 'breathe', label: 'Breathe', icon: Wind, gradient: 'from-cyan-500 to-blue-600' },
    { id: 'reaction', label: 'Focus', icon: Target, gradient: 'from-amber-500 to-orange-600' },
    { id: 'color', label: 'Colors', icon: Palette, gradient: 'from-pink-500 to-purple-600' },
    { id: 'meditate', label: 'Meditate', icon: Timer, gradient: 'from-emerald-500 to-teal-600' },
  ] as const;

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 md:p-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Stress Relief Hub
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Tools to calm your mind and restore balance instantly.</p>
          </div>

          {/* Meditation Music Toggle */}
          <button
            onClick={musicPlaying ? stopMusic : startMusic}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-300 border",
              musicPlaying
                ? "bg-gradient-to-r from-violet-600/30 to-cyan-600/30 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/10"
                : "bg-white/5 border-white/10 text-muted-foreground hover:border-violet-500/30 hover:text-violet-300"
            )}
          >
            {musicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <Music className="w-4 h-4" />
            {musicPlaying ? "Music On" : "Play Music"}
          </button>
        </header>

        {musicPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2 text-violet-300 text-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            🎵 Binaural theta waves playing (6 Hz) — best with headphones for full effect
          </motion.div>
        )}

        {/* Tab Nav */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 px-2 rounded-2xl font-medium text-sm transition-all duration-300 border relative overflow-hidden",
                  isActive
                    ? "text-white border-transparent shadow-lg"
                    : "bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                )}
              >
                {isActive && (
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 -z-0", tab.gradient)} />
                )}
                <tab.icon className="w-5 h-5 z-10" />
                <span className="z-10 text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="h-full"
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

// ——————————————————————————————————————————————————
// Breathing Exercise
// ——————————————————————————————————————————————————
function BreathingExercise() {
  const phases: { name: 'Inhale' | 'Hold' | 'Exhale' | 'Rest'; duration: number; color: string; desc: string }[] = [
    { name: 'Inhale', duration: 4, color: '#06b6d4', desc: 'Breathe in slowly through your nose' },
    { name: 'Hold', duration: 4, color: '#7c3aed', desc: 'Hold gently — feel the fullness' },
    { name: 'Exhale', duration: 6, color: '#10b981', desc: 'Release slowly through your mouth' },
    { name: 'Rest', duration: 2, color: '#6366f1', desc: 'Rest before the next breath' },
  ];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = phases[phaseIndex];
  const isExpand = phase.name === 'Inhale' || phase.name === 'Hold';

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhaseIndex(i => (i + 1) % phases.length);
    }, phase.duration * 1000);
    return () => clearTimeout(timeout);
  }, [phaseIndex]);

  return (
    <div className="min-h-[500px] rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{ background: `radial-gradient(circle at center, ${phase.color}40, transparent 70%)` }}
        transition={{ duration: phase.duration, ease: "easeInOut" }}
      />

      {/* Outer pulse ring */}
      {phase.name === 'Inhale' && (
        <motion.div
          className="absolute rounded-full border border-cyan-400/30"
          animate={{ width: ['200px', '400px'], height: ['200px', '400px'], opacity: [0.6, 0] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {/* Main breathing circle */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        animate={{
          width: isExpand ? '220px' : '120px',
          height: isExpand ? '220px' : '120px',
          boxShadow: `0 0 60px ${phase.color}60`,
        }}
        transition={{ duration: phase.duration, ease: "easeInOut" }}
        style={{ backgroundColor: `${phase.color}20`, border: `2px solid ${phase.color}50` }}
      >
        <motion.div
          className="rounded-full"
          animate={{ width: isExpand ? '160px' : '80px', height: isExpand ? '160px' : '80px' }}
          transition={{ duration: phase.duration, ease: "easeInOut" }}
          style={{ backgroundColor: `${phase.color}30` }}
        />
      </motion.div>

      <motion.h2
        key={phase.name}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mt-10 text-3xl font-display font-bold tracking-widest"
        style={{ color: phase.color }}
      >
        {phase.name}
      </motion.h2>

      <p className="mt-2 text-muted-foreground text-sm">{phase.desc}</p>

      {/* Phase indicators */}
      <div className="flex gap-2 mt-8">
        {phases.map((p, i) => (
          <div
            key={p.name}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === phaseIndex ? '32px' : '8px',
              backgroundColor: i === phaseIndex ? phase.color : '#ffffff20'
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground/60">4-4-6-2 box breathing · lowers cortisol in 2 minutes</p>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Reaction Game
// ——————————————————————————————————————————————————
function ReactionGame() {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'done'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const startTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setGameState('waiting');
    setReactionTime(null);
    const delay = Math.random() * 3500 + 1500;
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTime.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      clearTimeout(timeoutRef.current!);
      setReactionTime(-1);
      setGameState('done');
    } else if (gameState === 'ready') {
      const t = Date.now() - startTime.current;
      setReactionTime(t);
      if (!best || t < best) setBest(t);
      setGameState('done');
    }
  };

  const getRating = (ms: number) => {
    if (ms < 200) return { label: "Superhuman", color: "#f59e0b" };
    if (ms < 280) return { label: "Excellent", color: "#10b981" };
    if (ms < 380) return { label: "Good", color: "#06b6d4" };
    return { label: "Keep practicing", color: "#8b5cf6" };
  };

  return (
    <div className="min-h-[500px] rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-display font-bold mb-1 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Focus Reset Game</h2>
      <p className="text-muted-foreground text-sm mb-10">Click the moment you see green — train your focus and reset your mind.</p>

      {best && <p className="text-xs text-amber-400 mb-4">🏆 Best: {best}ms</p>}

      {gameState === 'idle' ? (
        <motion.button
          onClick={start}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-amber-500/30"
        >
          Start Game
        </motion.button>
      ) : (
        <motion.div
          onClick={handleClick}
          whileTap={{ scale: 0.96 }}
          className={cn(
            "w-72 h-72 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none",
            gameState === 'waiting' && "bg-amber-500/10 border-2 border-amber-500/50",
            gameState === 'ready' && "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_80px_rgba(16,185,129,0.5)]",
            gameState === 'done' && "bg-white/5 border border-white/10"
          )}
        >
          {gameState === 'waiting' && (
            <div className="text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-amber-400 font-bold">Wait for it…</p>
              <p className="text-xs text-muted-foreground mt-1">Don't click yet!</p>
            </div>
          )}
          {gameState === 'ready' && (
            <div className="text-center text-white">
              <div className="text-5xl mb-3">🟢</div>
              <p className="text-2xl font-display font-bold">CLICK!</p>
            </div>
          )}
          {gameState === 'done' && (
            <div className="text-center flex flex-col items-center gap-4">
              {reactionTime === -1 ? (
                <>
                  <div className="text-4xl">🚫</div>
                  <p className="text-rose-400 font-bold text-lg">Too Early!</p>
                </>
              ) : (
                <>
                  <p className="text-5xl font-display font-bold text-cyan-400">{reactionTime}ms</p>
                  {reactionTime && <p className="font-medium" style={{ color: getRating(reactionTime).color }}>{getRating(reactionTime).label}</p>}
                </>
              )}
              <button onClick={start} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-sm transition-colors">
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ——————————————————————————————————————————————————
// Color Relaxation
// ——————————————————————————————————————————————————
function ColorRelaxation() {
  const palettes = [
    { name: "Ocean Depths", colors: ["#0c1a4e", "#0d4f8c", "#0891b2", "#06b6d4"], mood: "Calm & Clear" },
    { name: "Aurora Forest", colors: ["#052e16", "#166534", "#15803d", "#4ade80"], mood: "Grounded & Fresh" },
    { name: "Twilight", colors: ["#1e1b4b", "#4c1d95", "#7c3aed", "#a78bfa"], mood: "Peaceful & Dreamy" },
    { name: "Sunset Healing", colors: ["#451a03", "#92400e", "#d97706", "#fbbf24"], mood: "Warm & Nurturing" },
    { name: "Rose Quartz", colors: ["#4c0519", "#9f1239", "#e11d48", "#fb7185"], mood: "Loving & Tender" },
  ];

  const [index, setIndex] = useState(0);
  const palette = palettes[index];

  useEffect(() => {
    const int = setInterval(() => setIndex(i => (i + 1) % palettes.length), 6000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="min-h-[500px] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(135deg, ${palette.colors.join(', ')})` }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center p-8">
        <motion.div
          key={palette.name}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-10 max-w-md"
        >
          <Palette className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold text-white mb-1">{palette.name}</h2>
          <p className="text-white/60 mb-6">{palette.mood}</p>
          <p className="text-sm text-white/50 leading-relaxed">
            Let the colors wash over you. Breathe slowly. Allow each hue to shift your nervous system toward calm.
          </p>
        </motion.div>

        {/* Palette dots */}
        <div className="flex gap-2 justify-center mt-8">
          {palettes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === index ? "w-8 h-3 bg-white" : "w-3 h-3 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// Meditation Timer
// ——————————————————————————————————————————————————
function MeditationTimer() {
  const TOTAL = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0) setCompleted(true);
      return;
    }
    const int = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(int);
  }, [isRunning, timeLeft]);

  const toggle = () => {
    if (completed) return;
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(TOTAL);
    setCompleted(false);
  };

  const progress = ((TOTAL - timeLeft) / TOTAL) * 100;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-[500px] rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Soft background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isRunning ? 1 : 0 }}
        style={{ background: 'radial-gradient(circle at center, rgba(16,185,129,0.08), transparent 70%)' }}
        transition={{ duration: 2 }}
      />

      <h2 className="text-2xl font-display font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
        1-Minute Mind Reset
      </h2>
      <p className="text-muted-foreground text-sm mb-10 text-center max-w-xs">
        Close your eyes. Focus on your breath. Let thoughts pass like clouds.
      </p>

      {/* Timer ring */}
      <div className="relative w-56 h-56 mb-10">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke="url(#medGradient)" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
            transition={{ duration: 1, ease: "linear" }}
          />
          <defs>
            <linearGradient id="medGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {completed ? (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-4xl mb-1">✨</div>
              <p className="text-emerald-400 font-bold text-sm">Complete!</p>
            </motion.div>
          ) : (
            <>
              <span className="text-5xl font-display font-bold text-white">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {isRunning ? "Breathe slowly…" : "Press play"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <motion.button
          onClick={toggle}
          whileTap={{ scale: 0.92 }}
          disabled={completed}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 disabled:opacity-40"
        >
          {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
        </motion.button>
        <button
          onClick={reset}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-muted-foreground flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Inhale 4s · Hold 4s · Exhale 6s
        </motion.div>
      )}
    </div>
  );
}
