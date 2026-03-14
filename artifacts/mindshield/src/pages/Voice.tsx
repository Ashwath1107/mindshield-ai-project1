import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Mic, Square, Activity, Volume2, AlertCircle, CheckCircle2, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getEmotionColors } from '@/lib/utils';

type VoiceResult = {
  voice_emotion: string;
  confidence: number;
  burnout_risk: string;
};

const EMOTION_ADVICE: Record<string, string> = {
  angry: "Your voice carries tension. Take 5 slow, deep breaths before continuing. Try the breathing exercise in the Relief tab.",
  sad: "I hear heaviness in your voice. It's okay to feel this way. Consider reaching out to someone you trust or trying a short meditation.",
  calm: "Your voice reflects calm and stability. Keep nurturing this mindset with regular breaks and mindful moments.",
  happy: "Your voice sounds positive! Channel this energy into your tasks. Your mental health is in a good place right now.",
  neutral: "Your voice is stable. Maintain this balance with regular hydration, movement, and short breaks.",
};

const RESOURCES = [
  { name: "Crisis Text Line", desc: "Text HOME to 741741", color: "from-rose-500 to-pink-600" },
  { name: "NAMI Helpline", desc: "1-800-950-6264", color: "from-purple-500 to-violet-600" },
  { name: "BetterHelp", desc: "betterhelp.com", color: "from-cyan-500 to-blue-600" },
  { name: "7 Cups", desc: "7cups.com — Free listening", color: "from-emerald-500 to-teal-600" },
];

export function Voice() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(40).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Animate bars when recording using real microphone data
  useEffect(() => {
    if (isRecording && analyzerRef.current) {
      const analyzer = analyzerRef.current;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        analyzer.getByteFrequencyData(dataArray);
        const step = Math.floor(bufferLength / 40);
        const heights = Array.from({ length: 40 }, (_, i) => {
          const val = dataArray[i * step] || 0;
          return Math.max(5, (val / 255) * 90 + 5);
        });
        setBarHeights(heights);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(animFrameRef.current);
    } else {
      setBarHeights(Array(40).fill(10));
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up Web Audio API for visualization
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close();

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const duration = (Date.now() - startTimeRef.current) / 1000;
        setIsAnalyzing(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];

            const res = await fetch('/api/voice-analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio_data: base64, duration }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setResult(data);
          } catch (err) {
            setError("Analysis failed. Please try recording again.");
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.onerror = () => { 
          setError("Failed to read audio file");
          setIsAnalyzing(false);
        };
      };

      recorder.onerror = () => {
        setError("Recording error occurred. Please try again.");
        setIsRecording(false);
      };

      startTimeRef.current = Date.now();
      recorder.start(100);
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone access denied. Please allow microphone permissions in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Could not start recording. Please try again.");
      }
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const emotionGradients: Record<string, string> = {
    calm: "from-emerald-500 to-teal-600",
    happy: "from-yellow-400 to-orange-500",
    neutral: "from-cyan-400 to-blue-500",
    sad: "from-blue-500 to-indigo-600",
    angry: "from-red-500 to-rose-600",
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-full p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/30">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Vocal Emotion Scanner
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Speak naturally for a few seconds. Our AI detects emotional signals in your voice tone, pitch, and cadence.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main recorder card */}
          <div className="lg:col-span-2">
            <div className={cn(
              "relative rounded-3xl p-8 border overflow-hidden transition-all duration-700",
              isRecording
                ? "bg-gradient-to-br from-violet-900/40 to-cyan-900/20 border-violet-500/40 shadow-2xl shadow-violet-500/20"
                : "bg-white/[0.03] border-white/10"
            )}>

              {/* Animated ring when recording */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-violet-500/30"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}

              {/* Waveform Visualizer */}
              <div className="flex items-center justify-center gap-[3px] h-28 mb-10">
                {barHeights.map((h, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "rounded-full w-[5px] transition-colors",
                      isRecording
                        ? i % 3 === 0 ? "bg-violet-400" : i % 3 === 1 ? "bg-pink-400" : "bg-cyan-400"
                        : "bg-white/15"
                    )}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.1 }}
                    style={{ minHeight: 4 }}
                  />
                ))}
              </div>

              {/* Record button */}
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  onClick={isRecording ? stopRecording : startRecording}
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "w-28 h-28 rounded-full flex items-center justify-center text-white font-bold shadow-2xl transition-all duration-300 relative",
                    isRecording
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40"
                      : "bg-gradient-to-br from-violet-600 to-cyan-500 shadow-violet-500/40 hover:scale-105"
                  )}
                >
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-white/20"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                  {isRecording
                    ? <Square className="w-10 h-10 fill-white" />
                    : <Mic className="w-12 h-12" />}
                </motion.button>

                <p className={cn(
                  "font-semibold text-sm tracking-widest uppercase",
                  isRecording ? "text-red-400" : "text-muted-foreground"
                )}>
                  {isRecording ? "● Recording… Tap to Stop" : "Tap to Speak"}
                </p>

                {isRecording && (
                  <p className="text-xs text-muted-foreground">Speak for at least 3 seconds for best results</p>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Playback */}
              {audioUrl && !isRecording && (
                <div className="mt-6 flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
                  <Volume2 className="w-5 h-5 text-cyan-400 shrink-0" />
                  <audio src={audioUrl} controls className="w-full h-8" />
                </div>
              )}

              {/* Analyzing state */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-6 flex items-center gap-3 text-violet-400"
                >
                  <Activity className="w-5 h-5 animate-spin" />
                  <p className="text-sm font-medium">Analyzing vocal frequencies…</p>
                </motion.div>
              )}
            </div>

            {/* Result panel */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-display font-bold text-lg">Analysis Complete</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Voice Emotion", value: result.voice_emotion, colors: getEmotionColors(result.voice_emotion) },
                      { label: "Confidence", value: `${(result.confidence * 100).toFixed(0)}%`, colors: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
                      { label: "Burnout Risk", value: result.burnout_risk, colors: getEmotionColors(result.burnout_risk) },
                    ].map(({ label, value, colors }) => (
                      <div key={label} className={cn("rounded-2xl border p-4 text-center", colors)}>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">{label}</p>
                        <p className="text-xl font-display font-bold capitalize">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Emotion gradient bar */}
                  <div className={cn(
                    "rounded-2xl p-5 bg-gradient-to-r text-white",
                    emotionGradients[result.voice_emotion] || "from-violet-600 to-cyan-500"
                  )}>
                    <Brain className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-sm leading-relaxed font-medium">
                      {EMOTION_ADVICE[result.voice_emotion] || "Keep monitoring your emotional state for better wellbeing insights."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resources sidebar */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-display font-bold mb-4 text-white/90">Mental Health Resources</h3>
              <div className="flex flex-col gap-3">
                {RESOURCES.map((r) => (
                  <div key={r.name} className={cn(
                    "rounded-2xl p-4 bg-gradient-to-br text-white",
                    r.color
                  )}>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs opacity-80 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-display font-bold mb-3 text-white/90">How it works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Click the mic and speak naturally",
                  "AI analyzes your tone, pitch & cadence",
                  "Emotion is detected from vocal patterns",
                  "Personalized advice is given instantly",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
