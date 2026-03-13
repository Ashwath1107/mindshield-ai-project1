import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmotionColors(emotionOrRisk: string | undefined): string {
  if (!emotionOrRisk) return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  
  const normalized = emotionOrRisk.toLowerCase();
  
  switch (normalized) {
    case "joy":
    case "love":
    case "happy":
    case "calm":
    case "low":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "neutral":
    case "focused":
      return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
    case "sadness":
    case "sad":
    case "fatigued":
    case "medium":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "anger":
    case "angry":
    case "stressed":
    case "high":
    case "critical":
    case "disgust":
      return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    case "fear":
    case "anxious":
    case "surprise":
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    default:
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  }
}
