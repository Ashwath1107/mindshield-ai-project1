import { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { useTypingTracker } from '@/hooks/use-typing-tracker';
import { Send, Activity, Sparkles, AlertCircle, Mic, MicOff, Heart, ExternalLink, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getEmotionColors } from '@/lib/utils';

type AnalyzeResult = {
  emotion: string;
  hidden_emotion?: string | null;
  burnout_risk: string;
  mental_state: string;
  wellness_suggestions: string[];
  stability_score: number;
  emotion_confidence?: number;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: AnalyzeResult;
  isTyping?: boolean;
};

const MENTAL_HEALTH_RESOURCES = [
  { name: "Crisis Helpline", value: "988 (call/text)", icon: "🆘" },
  { name: "Crisis Text Line", value: "Text HOME to 741741", icon: "💬" },
  { name: "NAMI Helpline", value: "1-800-950-6264", icon: "🧠" },
  { name: "BetterHelp", value: "betterhelp.com", icon: "💙" },
];

// Empathetic AI responses based on emotion + full context
function buildAIResponse(data: AnalyzeResult): string {
  const { emotion, burnout_risk, mental_state, wellness_suggestions, hidden_emotion, emotion_confidence, stability_score } = data;

  // Opening — tone varies by emotion
  const openings: Record<string, string[]> = {
    sadness: [
      "I can hear the heaviness in your words, and I want you to know — what you're feeling is real and valid. 💙",
      "Thank you for trusting me with this. Sadness is one of the hardest feelings to sit with, and I'm right here with you.",
      "I hear you. You don't need to have answers right now — you just need to feel heard, and you are.",
    ],
    anger: [
      "Something is clearly bothering you deeply, and your frustration makes complete sense. I'm listening.",
      "Your anger is valid — it's often a signal that something important to you has been violated. Let's talk about it.",
      "It sounds like you've been holding a lot in. I'm here, and you can let it out.",
    ],
    fear: [
      "Anxiety and fear are exhausting to carry. You don't have to figure everything out right now — I'm here with you.",
      "I hear the worry in your words. Let's slow down together and take this one breath at a time.",
      "What you're feeling sounds overwhelming. That's completely understandable — and you don't have to face it alone.",
    ],
    joy: [
      "It's really wonderful to hear some positivity from you! ✨ Let's hold onto that feeling.",
      "I love hearing this! Your positive energy is genuinely contagious.",
    ],
    love: [
      "Connection and love are among the most powerful sources of wellbeing. It's beautiful that you have that.",
      "What a meaningful thing to share. Nurturing love — for others and yourself — is deeply healing.",
    ],
    surprise: [
      "Life certainly has a way of catching us off guard. How are you sitting with this unexpected development?",
      "Surprises can be disorienting — even good ones. I'm curious how this is landing for you.",
    ],
    neutral: [
      "Thank you for checking in. Even feeling 'okay' is worth exploring — sometimes 'fine' has layers beneath it.",
      "I appreciate you taking a moment to reflect. How are things really going beneath the surface?",
      "Steady is good. Let's make sure you're truly okay and not just pushing through.",
    ],
  };

  const openingPool = openings[emotion] ?? openings.neutral;
  const opening = openingPool[Math.floor(Math.random() * openingPool.length)];

  let response = opening + "\n\n";

  // Hidden emotion — empathetic reflection, not clinical
  if (hidden_emotion) {
    const crisisSignal = hidden_emotion.includes("⚠️");
    if (crisisSignal) {
      response += `💜 I need to pause here — something in the way you're writing tells me you may be in a really dark place right now. Please know that your life has enormous value, and help is available right now.\n\n`;
    } else {
      response += `I also picked up something beneath your words — it seems like there might be some **${hidden_emotion}** underneath. It's completely okay to sit with that. You don't have to pretend everything is fine here.\n\n`;
    }
  }

  // Mental state from typing
  if (mental_state === 'stressed') {
    response += `Your typing pattern also shows some tension — it's okay to slow down. This is a safe space.\n\n`;
  } else if (mental_state === 'fatigued') {
    response += `The way you're typing suggests you might be running on low energy right now. Please be gentle with yourself.\n\n`;
  } else if (mental_state === 'anxious') {
    response += `I noticed some hesitation in your typing — that sometimes reflects an anxious mind. That's completely okay.\n\n`;
  }

  // Burnout note
  if (burnout_risk === 'CRITICAL') {
    response += `⚠️ Your emotional stress indicators are at a critical level right now. Please don't try to push through this alone — reaching out to someone is a sign of strength, not weakness.\n\n`;
  } else if (burnout_risk === 'HIGH') {
    response += `Your stress indicators are elevated. I want to gently encourage you to rest and not push through this alone — small steps matter.\n\n`;
  }

  // Wellness guidance — render as natural conversation, not a bullet list
  if (wellness_suggestions.length > 0) {
    if (burnout_risk === 'CRITICAL' || hidden_emotion?.includes("⚠️")) {
      response += `Here's what I want you to do right now:\n`;
    } else if (emotion === 'joy' || emotion === 'love') {
      response += `A couple of things to keep this positive energy going:\n`;
    } else {
      response += `Here's what I think would help you most right now:\n`;
    }
    wellness_suggestions.slice(0, 3).forEach((s, i) => {
      response += `\n${i + 1}. ${s}`;
    });
  }

  return response.trim();
}

export function Chat() {
  const { text, handleKeyDown, handleChange, reset, getMetrics } = useTypingTracker();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello, I'm MindShield AI — your emotional support companion. 💜\n\nI analyze both your words and typing patterns to understand how you're truly feeling. Everything you share here is private.\n\nHow are you feeling today? You can type or use your voice 🎤",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Web Speech API voice input
  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');

      // Manually trigger the typing tracker to update text
      const syntheticEvent = {
        target: { value: transcript },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleChange(syntheticEvent);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [handleChange]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    const metrics = getMetrics();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: metrics.message };
    setMessages(prev => [...prev, userMsg]);
    reset();
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });

      if (!res.ok) throw new Error('API error');
      const data: AnalyzeResult = await res.json();

      const responseContent = buildAIResponse(data);

      // Show high-risk resources automatically
      if (data.burnout_risk === 'HIGH' || data.burnout_risk === 'CRITICAL') {
        setShowResources(true);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        analysis: data,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I had trouble connecting. Please check your network and try again. I'm here whenever you're ready.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full max-h-screen">

        {/* Header */}
        <header className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white">AI Support Chat</h1>
              <p className="text-xs text-muted-foreground">Emotional AI + Typing Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tracking
            </div>
            <button
              onClick={() => setShowResources(p => !p)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" /> Resources
            </button>
          </div>
        </header>

        {/* Resources panel */}
        <AnimatePresence>
          {showResources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-rose-900/20 to-violet-900/20 border-b border-rose-500/20">
                <p className="text-xs font-semibold text-rose-400 mb-3 uppercase tracking-wider">Mental Health Resources</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MENTAL_HEALTH_RESOURCES.map((r) => (
                    <div key={r.name} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-base mb-1">{r.icon}</p>
                      <p className="text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex flex-col",
                  msg.role === 'user' ? "items-end ml-auto max-w-[80%]" : "items-start mr-auto max-w-[85%]"
                )}
              >
                {/* Bubble */}
                <div className={cn(
                  "px-5 py-4 rounded-2xl shadow-lg",
                  msg.role === 'user'
                    ? "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white rounded-tr-sm"
                    : "bg-white/[0.05] border border-white/[0.1] rounded-tl-sm"
                )}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> MindShield AI
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Analysis badges */}
                {msg.analysis && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      { label: "Emotion", val: msg.analysis.emotion },
                      { label: "Risk", val: msg.analysis.burnout_risk },
                      { label: "State", val: msg.analysis.mental_state },
                    ].map(({ label, val }) => (
                      <span key={label} className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium border",
                        getEmotionColors(val)
                      )}>
                        <span className="opacity-60">{label}: </span>
                        <span className="capitalize">{val}</span>
                      </span>
                    ))}
                    {msg.analysis.hidden_emotion && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {msg.analysis.hidden_emotion}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      Score: {msg.analysis.stability_score}/100
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mr-auto">
              <div className="px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.1] rounded-tl-sm flex items-center gap-2 text-muted-foreground text-sm">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
                <span className="ml-1 text-xs">Analyzing…</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Voice listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mx-6 mb-2 flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Listening… speak now. Click the mic to stop.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-white/5">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">

            {/* Voice button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-violet-500/20 hover:border-violet-500/40 hover:text-violet-400"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening to your voice…" : "Type or speak how you're feeling…"}
                rows={1}
                className="w-full min-h-[48px] max-h-32 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-4 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-foreground placeholder:text-muted-foreground/50 resize-none transition-all text-sm"
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="h-12 px-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
            Your conversations are analyzed for emotional patterns. Not stored permanently.
          </p>
        </div>
      </div>
    </Layout>
  );
}
