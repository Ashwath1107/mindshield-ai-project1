import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAnalyzeVoice } from '@workspace/api-client-react';
import type { VoiceAnalysisResponse } from '@workspace/api-client-react';
import { Mic, Square, Activity, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, getEmotionColors } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Voice() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceAnalysisResponse | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  
  const analyzeMutation = useAnalyzeVoice();
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const rawBase64 = base64String.split(',')[1];
          const duration = (Date.now() - startTimeRef.current) / 1000;
          
          analyzeMutation.mutate(
            { data: { audio_data: rawBase64, duration } },
            { onSuccess: (res) => setResult(res) }
          );
        };
      };

      startTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone permissions to record.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  // Fake visualizer bars
  const bars = Array.from({ length: 40 });

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Vocal Tonality Analysis</h1>
          <p className="text-muted-foreground">Detect hidden stress, anger, or sadness in your voice frequencies.</p>
        </header>

        <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          {/* Animated background glow during recording */}
          {isRecording && (
            <div className="absolute inset-0 bg-primary/10 opacity-50 animate-pulse pointer-events-none" />
          )}

          {/* Visualizer */}
          <div className="flex items-center justify-center gap-1 h-32 mb-12 w-full">
            {bars.map((_, i) => {
              const height = isRecording 
                ? `${Math.random() * 80 + 10}%` 
                : '10%';
              
              return (
                <motion.div
                  key={i}
                  className={cn("w-2 rounded-full", isRecording ? "bg-cyan-400" : "bg-white/20")}
                  animate={{ height }}
                  transition={{ 
                    duration: 0.2, 
                    repeat: isRecording ? Infinity : 0, 
                    repeatType: "mirror",
                    delay: i * 0.05
                  }}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center z-10">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                isRecording 
                  ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/40" 
                  : "bg-white text-background hover:scale-105 shadow-white/20"
              )}
            >
              {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
            </button>
            <p className="mt-4 font-medium text-sm tracking-widest uppercase">
              {isRecording ? "Recording... Tap to Stop" : "Tap to Record"}
            </p>
          </div>

          {audioUrl && !isRecording && (
            <div className="mt-8 flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <audio src={audioUrl} controls className="h-8 w-[250px] outline-none" />
            </div>
          )}
        </div>

        {/* Results */}
        {(analyzeMutation.isPending || result) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 glass-card rounded-2xl p-6"
          >
            {analyzeMutation.isPending ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 animate-spin text-primary mb-4" />
                <p>Analyzing vocal frequencies...</p>
              </div>
            ) : result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-muted-foreground uppercase mb-2">Detected Emotion</p>
                  <p className={cn("text-2xl font-bold font-display capitalize", getEmotionColors(result.voice_emotion).split(' ')[0])}>
                    {result.voice_emotion}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-muted-foreground uppercase mb-2">Confidence</p>
                  <p className="text-2xl font-bold font-display text-white">
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-muted-foreground uppercase mb-2">Burnout Risk</p>
                  <p className={cn("text-2xl font-bold font-display capitalize", getEmotionColors(result.burnout_risk).split(' ')[0])}>
                    {result.burnout_risk || 'LOW'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
