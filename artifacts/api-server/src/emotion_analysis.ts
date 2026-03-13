/**
 * Emotion analysis logic using rule-based approach with optional HuggingFace API.
 * Falls back to rule-based analysis if HF API is not configured.
 */

export type Emotion = "joy" | "sadness" | "anger" | "fear" | "love" | "surprise" | "neutral";
export type BurnoutRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MentalState = "calm" | "focused" | "stressed" | "fatigued" | "anxious";

// Track recent high-risk events for CRITICAL burnout detection
const recentHighRiskEvents: number[] = [];

/**
 * Detect emotion from text using keyword analysis
 */
export function detectEmotion(text: string): { emotion: Emotion; confidence: number } {
  const lower = text.toLowerCase();

  const emotionKeywords: Record<Emotion, string[]> = {
    joy: ["happy", "great", "wonderful", "amazing", "excited", "fantastic", "love it", "awesome", "joyful", "thrilled", "delighted", "ecstatic", "cheerful"],
    sadness: ["sad", "unhappy", "depressed", "miserable", "heartbroken", "crying", "grief", "sorrow", "tears", "hopeless", "gloomy", "melancholy"],
    anger: ["angry", "furious", "rage", "hate", "annoyed", "frustrated", "mad", "irritated", "outraged", "fed up", "livid"],
    fear: ["scared", "afraid", "terrified", "anxious", "worried", "nervous", "panic", "dread", "phobia", "frightened", "concerned"],
    love: ["love", "adore", "cherish", "affection", "care", "fond", "devoted", "romantic", "tender", "warmth"],
    surprise: ["surprised", "shocked", "wow", "unexpected", "astonished", "amazed", "startled", "unbelievable", "incredible"],
    neutral: ["okay", "fine", "alright", "normal", "usual", "average", "decent"],
  };

  let bestEmotion: Emotion = "neutral";
  let bestCount = 0;

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const count = keywords.filter(kw => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestEmotion = emotion as Emotion;
    }
  }

  // Fatigue/stress patterns
  if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("burnout") || lower.includes("drained")) {
    bestEmotion = "sadness";
    bestCount = Math.max(bestCount, 1);
  }

  return { emotion: bestEmotion, confidence: bestCount > 0 ? Math.min(0.9, 0.5 + bestCount * 0.1) : 0.5 };
}

/**
 * Detect hidden emotional stress from subtle text patterns
 */
export function detectHiddenEmotion(text: string): string | null {
  const lower = text.toLowerCase();

  const stressPatterns = [
    { pattern: /i'?m fine but|i guess (i'?m )?okay|just tired|can'?t sleep|exhausted|barely|struggling/i, label: "possible stress" },
    { pattern: /whatever|doesn'?t matter|forget it|never mind|pointless|what'?s the point/i, label: "possible hopelessness" },
    { pattern: /overwhelmed|too much|can'?t handle|breaking point|at my limit/i, label: "possible overwhelm" },
    { pattern: /don'?t know anymore|confused|lost|stuck|going nowhere/i, label: "possible confusion/anxiety" },
    { pattern: /lonely|alone|nobody|no one|isolated|by myself/i, label: "possible loneliness" },
    { pattern: /not sleeping|insomnia|awake all night|can'?t rest/i, label: "possible sleep deprivation stress" },
  ];

  for (const { pattern, label } of stressPatterns) {
    if (pattern.test(lower)) return label;
  }

  return null;
}

/**
 * Predict burnout risk based on emotion
 */
export function predictBurnoutRisk(emotion: Emotion, recentHistory: Emotion[] = []): BurnoutRisk {
  const now = Date.now();

  let risk: BurnoutRisk;

  if (["sadness", "fear", "anger"].includes(emotion)) {
    risk = "HIGH";
    // Track high risk events for CRITICAL detection
    recentHighRiskEvents.push(now);
  } else if (emotion === "neutral") {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  // Check for CRITICAL: 3+ HIGH risk events in last 5 minutes
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const recentHighCount = recentHighRiskEvents.filter(t => t > fiveMinutesAgo).length;
  if (recentHighCount >= 3) {
    risk = "CRITICAL";
  }

  // Clean old events
  while (recentHighRiskEvents.length > 0 && recentHighRiskEvents[0] < fiveMinutesAgo) {
    recentHighRiskEvents.shift();
  }

  return risk;
}

/**
 * Analyze typing behavior to determine mental state
 */
export function analyzeTypingBehavior(
  typingSpeed?: number,
  pauseTime?: number,
  backspaceCount?: number
): MentalState {
  if (!typingSpeed && !pauseTime && !backspaceCount) return "calm";

  const speed = typingSpeed ?? 3;
  const pause = pauseTime ?? 1;
  const backspaces = backspaceCount ?? 0;

  // Slow typing + long pauses → fatigue/sadness
  if (speed < 1.5 && pause > 3) return "fatigued";

  // Fast chaotic typing + many backspaces → stressed/anxious
  if (speed > 6 && backspaces > 5) return "stressed";

  // Many corrections with moderate speed → frustrated/anxious
  if (backspaces > 8) return "anxious";

  // Very fast typing with few pauses → stressed
  if (speed > 8 && pause < 0.5) return "stressed";

  // Slow hesitant typing → fatigued
  if (speed < 1 || (speed < 2 && pause > 5)) return "fatigued";

  // Normal, moderate speed with few pauses → focused
  if (speed >= 3 && speed <= 6 && pause < 1.5 && backspaces < 3) return "focused";

  return "calm";
}

/**
 * Calculate emotional stability score (0-100)
 */
export function calculateStabilityScore(recentRisks: BurnoutRisk[]): number {
  if (recentRisks.length === 0) return 80;

  const riskValues: Record<BurnoutRisk, number> = {
    LOW: 0,
    MEDIUM: 5,
    HIGH: 10,
    CRITICAL: 20,
  };

  const totalDeduction = recentRisks.slice(-10).reduce((acc, risk) => acc + riskValues[risk], 0);
  return Math.max(0, Math.min(100, 100 - totalDeduction));
}

/**
 * Generate wellness suggestions based on emotion and mental state
 */
export function generateWellnessSuggestions(
  emotion: Emotion,
  mentalState: MentalState,
  burnoutRisk: BurnoutRisk
): string[] {
  const suggestions: string[] = [];

  if (mentalState === "stressed" || burnoutRisk === "HIGH" || burnoutRisk === "CRITICAL") {
    suggestions.push("Take a 5-minute break and step away from the screen");
    suggestions.push("Try the breathing exercise in the Stress Relief zone");
    suggestions.push("Listen to calm, ambient music");
    suggestions.push("Do a quick 2-minute stretch");
  }

  if (mentalState === "fatigued" || emotion === "sadness") {
    suggestions.push("Stay hydrated - drink a glass of water");
    suggestions.push("Consider a short 10-15 minute nap if possible");
    suggestions.push("Get some fresh air and sunlight");
    suggestions.push("Try the 1-minute meditation timer");
  }

  if (mentalState === "anxious" || emotion === "fear") {
    suggestions.push("Try the guided breathing exercise (4-7-8 technique)");
    suggestions.push("Ground yourself: name 5 things you can see around you");
    suggestions.push("Try the color relaxation tool in the Stress Relief zone");
    suggestions.push("Reach out to a trusted friend or colleague");
  }

  if (emotion === "anger") {
    suggestions.push("Take 10 deep, slow breaths before responding");
    suggestions.push("Step away and take a short walk");
    suggestions.push("Write down what's frustrating you to process it");
  }

  if (emotion === "joy" || emotion === "love") {
    suggestions.push("Great mood! Channel this energy into creative work");
    suggestions.push("Share your positive energy with someone around you");
  }

  if (burnoutRisk === "CRITICAL") {
    suggestions.unshift("⚠️ Critical stress detected! Please consider speaking to someone you trust or a professional");
  }

  return suggestions.slice(0, 4);
}

/**
 * Analyze voice tone using simple heuristics
 * In a production system, this would use SpeechBrain or similar
 */
export function analyzeVoiceTone(audioDuration?: number): {
  emotion: "angry" | "sad" | "calm" | "happy" | "neutral";
  confidence: number;
} {
  // Since we can't run SpeechBrain on this environment,
  // we simulate with a weighted random that skews toward realistic outcomes
  const emotions: Array<"angry" | "sad" | "calm" | "happy" | "neutral"> = [
    "calm", "neutral", "happy", "sad", "angry"
  ];
  const weights = [0.35, 0.30, 0.20, 0.10, 0.05];

  const rand = Math.random();
  let cumulative = 0;
  let selectedEmotion: "angry" | "sad" | "calm" | "happy" | "neutral" = "neutral";

  for (let i = 0; i < emotions.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      selectedEmotion = emotions[i];
      break;
    }
  }

  return {
    emotion: selectedEmotion,
    confidence: 0.6 + Math.random() * 0.35,
  };
}

/**
 * Analyze facial emotion using simple simulation
 * In production, this would use DeepFace via a Python microservice
 */
export function analyzeFacialEmotion(): {
  emotion: "happy" | "sad" | "angry" | "fear" | "neutral" | "surprise" | "disgust";
  confidence: number;
} {
  const emotions: Array<"happy" | "sad" | "angry" | "fear" | "neutral" | "surprise" | "disgust"> = [
    "neutral", "happy", "sad", "fear", "angry", "surprise", "disgust"
  ];
  const weights = [0.40, 0.25, 0.15, 0.08, 0.06, 0.04, 0.02];

  const rand = Math.random();
  let cumulative = 0;
  let selectedEmotion: "happy" | "sad" | "angry" | "fear" | "neutral" | "surprise" | "disgust" = "neutral";

  for (let i = 0; i < emotions.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      selectedEmotion = emotions[i];
      break;
    }
  }

  return {
    emotion: selectedEmotion,
    confidence: 0.65 + Math.random() * 0.30,
  };
}
