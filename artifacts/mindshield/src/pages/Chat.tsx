import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useTypingTracker } from '@/hooks/use-typing-tracker';
import { useAnalyzeEmotion } from '@workspace/api-client-react';
import type { AnalyzeResponse } from '@workspace/api-client-react';
import { Send, Activity, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getEmotionColors } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: AnalyzeResponse;
};

export function Chat() {
  const { text, handleKeyDown, handleChange, reset, getMetrics } = useTypingTracker();
  const analyzeMutation = useAnalyzeEmotion();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello. I am MindShield AI. How are you feeling today? Take your time, I am analyzing both your words and your typing patterns to understand your mental state.'
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || analyzeMutation.isPending) return;

    const metrics = getMetrics();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: metrics.message };
    
    setMessages(prev => [...prev, userMsg]);
    reset();

    analyzeMutation.mutate(
      { data: metrics },
      {
        onSuccess: (data) => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.wellness_suggestions[0] || "I notice some stress. Let's take a moment.",
            analysis: data
          };
          setMessages(prev => [...prev, aiMsg]);
        },
        onError: () => {
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I had trouble analyzing that. Please try again.'
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col h-full max-h-screen p-4 md:p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Therapeutic Chat</h1>
            <p className="text-sm text-muted-foreground">Real-time typing behavior & semantic analysis</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full glass-panel border-cyan-500/30 text-cyan-300">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Tracking Keystroke Dynamics
          </div>
        </header>

        <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[85%] md:max-w-[70%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-5 py-4 rounded-2xl shadow-lg",
                    msg.role === 'user' 
                      ? "bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-sm" 
                      : "glass-card rounded-tl-sm text-foreground"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-cyan-400 font-medium text-xs uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> MindShield AI
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {msg.analysis && (
                  <div className="mt-3 flex flex-wrap gap-2 w-full">
                    <Badge label="Emotion" value={msg.analysis.emotion} />
                    <Badge label="Risk" value={msg.analysis.burnout_risk} />
                    <Badge label="State" value={msg.analysis.mental_state} />
                    {msg.analysis.hidden_emotion && (
                      <Badge label="Hidden" value={msg.analysis.hidden_emotion} isWarning />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {analyzeMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex max-w-[80%] mr-auto items-start">
               <div className="px-5 py-4 rounded-2xl glass-card rounded-tl-sm flex gap-2 items-center text-muted-foreground">
                 <div className="w-2 h-2 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                 <span className="ml-2 text-xs">Analyzing psychometrics...</span>
               </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-auto pt-4 relative">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div className="relative w-full">
              <textarea
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (we're analyzing your typing speed & pauses)"
                className="w-full min-h-[60px] max-h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
            </div>
            <button 
              type="submit"
              disabled={!text.trim() || analyzeMutation.isPending}
              className="h-[60px] px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20 flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function Badge({ label, value, isWarning = false }: { label: string, value: string, isWarning?: boolean }) {
  const colors = getEmotionColors(value);
  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", colors, isWarning && "animate-pulse")}>
      <span className="opacity-70 uppercase tracking-wider text-[10px]">{label}:</span>
      {isWarning && <AlertCircle className="w-3 h-3" />}
      <span className="capitalize">{value}</span>
    </div>
  );
}
