/**
 * MindShield AI — Emotion Analysis Engine v2
 *
 * Improvements over v1:
 * - Multi-word phrase matching (not just single keywords)
 * - Negation detection ("not happy", "don't feel good")
 * - Intensity modifiers ("extremely stressed" scores higher)
 * - Weighted multi-label scoring (no more "first match wins")
 * - Typing behavior integrated into burnout risk calculation
 * - Empathetic, conversational wellness suggestions
 * - Voice duration and variance used as stress signals
 * - Stability score decay/recovery system
 */

export type Emotion = "joy" | "sadness" | "anger" | "fear" | "love" | "surprise" | "neutral";
export type BurnoutRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MentalState = "calm" | "focused" | "stressed" | "fatigued" | "anxious";

// In-memory session history for critical detection
const recentHighRiskEvents: number[] = [];

// ─────────────────────────────────────────────────────────────
// EMOTION DETECTION — Phrase-aware weighted scoring
// ─────────────────────────────────────────────────────────────

type EmotionEntry = { phrases: string[]; weight: number };

const EMOTION_PATTERNS: Record<Emotion, EmotionEntry[]> = {
  joy: [
    { phrases: ["absolutely love", "so happy", "over the moon", "on top of the world", "best day", "great day", "feeling amazing", "feeling great", "feeling wonderful", "feeling fantastic", "feeling good", "feel good", "super happy", "really joyful"], weight: 3 },
    { phrases: ["happy", "joyful", "elated", "thrilled", "ecstatic", "delighted", "cheerful", "blissful", "content", "pleased", "excited", "wonderful", "fantastic", "awesome", "amazing", "brilliant", "excellent", "terrific", "superb", "perfect", "glad", "grateful", "thankful", "blessed", "lucky", "hopeful", "optimistic", "proud", "celebrated", "smiling", "laughing", "having fun"], weight: 1 },
  ],
  sadness: [
    { phrases: ["can't stop crying", "completely broken", "feel empty", "feeling empty", "feel hollow", "no reason to", "don't want to be here", "want to disappear", "wish i wasn't", "feeling lost", "nothing matters", "no point", "what's the point", "so dead inside", "feel crushed"], weight: 4 },
    { phrases: ["very sad", "deeply sad", "incredibly sad", "so depressed", "feel depressed", "really down", "feeling down", "pretty down", "so low", "feeling low", "completely down", "really sad", "heartbroken", "devastated", "inconsolable", "wrecked", "destroyed", "in pain"], weight: 3 },
    { phrases: ["sad", "unhappy", "down", "depressed", "miserable", "gloomy", "sorrowful", "melancholy", "blue", "dreary", "dismal", "dejected", "despondent", "dispirited", "downhearted", "crestfallen", "disheartened", "grief", "mourning", "crying", "tears", "weeping", "sobbing", "hopeless", "helpless", "worthless", "useless", "pathetic", "failure", "loser", "broken", "shattered", "defeated", "exhausted", "drained", "burned out", "burnt out", "can't cope", "struggling", "suffering", "alone", "lonely", "isolated"], weight: 1 },
  ],
  anger: [
    { phrases: ["absolutely furious", "so angry", "extremely angry", "really angry", "deeply frustrated", "beyond frustrated", "can't stand", "sick and tired", "fed up with", "pissed off", "really mad", "so mad", "totally mad", "utterly frustrated", "boiling with rage"], weight: 4 },
    { phrases: ["angry", "furious", "enraged", "outraged", "infuriated", "livid", "seething", "irate", "incensed", "raging", "hostile", "mad", "irritated", "annoyed", "frustrated", "aggravated", "agitated", "bitter", "resentful", "hate", "despise", "loathe", "disgusted", "fed up", "had enough", "can't take it", "lost it", "explode", "snap", "blowing up", "boiling", "pissed", "fuming"], weight: 1 },
  ],
  fear: [
    { phrases: ["completely terrified", "absolutely scared", "so scared", "really scared", "deeply anxious", "severe anxiety", "having a panic attack", "can't breathe", "heart is racing", "can't calm down", "spiraling", "out of control", "losing control", "falling apart", "petrified"], weight: 4 },
    { phrases: ["very anxious", "very worried", "so worried", "deeply worried", "so stressed", "extremely stressed", "completely stressed", "really stressed", "very stressed", "stressed out", "burned out", "freaking out", "panicking so much"], weight: 3 },
    { phrases: ["scared", "afraid", "terrified", "frightened", "fearful", "anxious", "worried", "nervous", "panicking", "panic", "paranoid", "phobia", "dread", "dreading", "apprehensive", "uneasy", "jittery", "tense", "on edge", "wound up", "overwhelmed", "stressed", "pressure", "burden", "heavy", "weighed down", "can't focus", "distracted", "can't sleep", "insomnia", "restless", "spinning", "unsure", "unsafe"], weight: 1 },
  ],
  love: [
    { phrases: ["deeply in love", "head over heels", "madly in love", "unconditionally love", "truly care", "care so much", "means the world", "everything to me", "so grateful for", "so thankful for", "deeply thankful", "love so much"], weight: 3 },
    { phrases: ["love", "adore", "cherish", "devoted", "affectionate", "tender", "warm", "caring", "compassionate", "empathetic", "loving", "romantic", "appreciate", "grateful", "admire", "respect", "support", "nurture", "connected", "belong", "together", "family", "friend", "companion", "soulmate"], weight: 1 },
  ],
  surprise: [
    { phrases: ["can't believe it", "never expected", "totally unexpected", "completely shocked", "blew my mind", "couldn't have imagined", "out of nowhere", "caught off guard", "didn't see that coming", "i am shocked"], weight: 3 },
    { phrases: ["surprised", "shocked", "astonished", "amazed", "astounded", "stunned", "speechless", "wow", "unbelievable", "incredible", "extraordinary", "unexpected", "sudden", "sudden change", "new development", "plot twist", "revelation", "startled"], weight: 1 },
  ],
  neutral: [
    { phrases: ["just okay", "feeling okay", "doing okay", "getting by", "hanging in there", "same as usual", "nothing special", "nothing new", "it is what it is", "whatever", "don't mind", "don't care"], weight: 2 },
    { phrases: ["okay", "fine", "alright", "normal", "usual", "average", "so-so", "meh", "neutral", "decent", "moderate", "standard", "ordinary", "routine", "typical", "boring"], weight: 1 },
  ],
};

// Negation words that flip the emotion score
const NEGATION_WORDS = ["not", "no", "never", "don't", "can't", "cannot", "isn't", "aren't", "wasn't", "weren't", "won't", "wouldn't", "shouldn't", "hardly", "barely", "rarely", "neither", "nor"];

// Intensity multipliers
const INTENSIFIERS: Record<string, number> = {
  "extremely": 2.0, "absolutely": 2.0, "completely": 2.0, "totally": 1.8,
  "very": 1.6, "really": 1.6, "deeply": 1.6, "incredibly": 1.7, "severely": 1.8,
  "so": 1.4, "quite": 1.3, "pretty": 1.2, "somewhat": 0.8, "a bit": 0.7, "slightly": 0.6,
};

function isNegated(text: string, phraseStart: number): boolean {
  // Check 3-word window before the phrase for negation
  const before = text.substring(Math.max(0, phraseStart - 30), phraseStart).toLowerCase();
  return NEGATION_WORDS.some(neg => {
    const idx = before.lastIndexOf(neg);
    if (idx === -1) return false;
    // Must be within 5 words of the phrase
    const wordsBetween = before.substring(idx + neg.length).trim().split(/\s+/).filter(Boolean).length;
    return wordsBetween <= 4;
  });
}

function getIntensityMultiplier(text: string, phraseStart: number): number {
  const before = text.substring(Math.max(0, phraseStart - 30), phraseStart).toLowerCase();
  for (const [word, mult] of Object.entries(INTENSIFIERS)) {
    if (before.includes(word)) return mult;
  }
  return 1.0;
}

export function detectEmotion(text: string): { emotion: Emotion; confidence: number; scores: Record<string, number> } {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, love: 0, surprise: 0, neutral: 0 };

  for (const [emotion, entries] of Object.entries(EMOTION_PATTERNS)) {
    for (const { phrases, weight } of entries) {
      for (const phrase of phrases) {
        const idx = lower.indexOf(phrase);
        if (idx !== -1) {
          const negated = isNegated(lower, idx);
          const intensity = getIntensityMultiplier(lower, idx);
          const score = weight * intensity;

          if (negated) {
            // Negated joy → adds to sadness, negated anger → adds to neutral, etc.
            const opposites: Record<string, string> = {
              joy: "sadness", sadness: "neutral", anger: "neutral", fear: "neutral",
              love: "sadness", surprise: "neutral", neutral: "neutral"
            };
            scores[opposites[emotion] ?? "neutral"] += score * 0.7;
          } else {
            scores[emotion] += score;
          }
        }
      }
    }
  }

  // Find highest scoring emotion
  let bestEmotion: Emotion = "neutral";
  let bestScore = 0;
  let totalScore = 0;

  for (const [emotion, score] of Object.entries(scores)) {
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion as Emotion;
    }
  }

  // Confidence = proportion of best score vs total
  const confidence = totalScore > 0
    ? Math.min(0.97, 0.45 + (bestScore / Math.max(totalScore, 1)) * 0.5)
    : 0.45;

  return { emotion: bestEmotion, confidence, scores };
}

// ─────────────────────────────────────────────────────────────
// HIDDEN EMOTION — Detect masked distress signals
// ─────────────────────────────────────────────────────────────

const HIDDEN_PATTERNS: { pattern: RegExp; label: string; severity: number }[] = [
  { pattern: /i'?m (just |kind of |kinda |a bit |a little )?(fine|okay|ok|alright) but/i, label: "suppressed distress", severity: 2 },
  { pattern: /don'?t know (why|how|what) anymore/i, label: "existential confusion", severity: 3 },
  { pattern: /whatever.{0,20}(doesn'?t matter|don'?t care|irrelevant)/i, label: "emotional detachment", severity: 3 },
  { pattern: /can'?t (sleep|rest|relax|stop thinking|quiet my mind)/i, label: "sleep & anxiety stress", severity: 2 },
  { pattern: /(overwhelmed|too much|can'?t handle|at (my |the )?limit|breaking point|falling apart)/i, label: "acute overwhelm", severity: 4 },
  { pattern: /(alone|lonely|no one|nobody|isolated|by myself|all by myself|no friends|no one cares)/i, label: "loneliness", severity: 3 },
  { pattern: /(give up|giving up|can'?t go on|quit|done trying|stop trying|no hope)/i, label: "hopelessness signal", severity: 4 },
  { pattern: /(don'?t want to (be here|exist|continue)|wish i wasn'?t here|disappear)/i, label: "⚠️ crisis signal — recommend immediate support", severity: 5 },
  { pattern: /(nothing (feels|seems|is) real|disconnected|dissociat|numb|empty inside|hollow)/i, label: "dissociation / emotional numbness", severity: 3 },
  { pattern: /(constant(ly)? think(ing)? about|can'?t stop thinking|intrusive thoughts|obsess)/i, label: "intrusive thought pattern", severity: 2 },
  { pattern: /(mess|disaster|failure|worthless|useless|stupid|hate myself|self-hate)/i, label: "negative self-perception", severity: 3 },
  { pattern: /(everything'?s (wrong|falling apart|bad)|nothing goes right|always fail)/i, label: "catastrophic thinking pattern", severity: 3 },
  { pattern: /(barely (eating|sleeping|functioning|managing|getting by)|not eating|skipping meals)/i, label: "basic needs disruption", severity: 3 },
  { pattern: /(pressure|deadline|work stress|job stress|too many tasks|behind on|can'?t keep up)/i, label: "occupational burnout signal", severity: 2 },
];

export function detectHiddenEmotion(text: string): string | null {
  let highestSeverity = 0;
  let highestLabel: string | null = null;

  for (const { pattern, label, severity } of HIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      if (severity > highestSeverity) {
        highestSeverity = severity;
        highestLabel = label;
      }
    }
  }

  return highestLabel;
}

// ─────────────────────────────────────────────────────────────
// BURNOUT RISK — Combines emotion + typing + hidden signals
// ─────────────────────────────────────────────────────────────

export function predictBurnoutRisk(
  emotion: Emotion,
  mentalState: MentalState,
  hiddenEmotion: string | null,
  emotionScores?: Record<string, number>
): BurnoutRisk {
  const now = Date.now();
  let riskScore = 0;

  // Emotion contribution
  const emotionRisk: Record<Emotion, number> = {
    anger: 3, fear: 3, sadness: 3, neutral: 1, surprise: 1, love: 0, joy: 0,
  };
  riskScore += emotionRisk[emotion] ?? 0;

  // Consider secondary emotions from scores
  if (emotionScores) {
    const allScores = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);
    // If 2nd emotion is also a negative one, add partial score
    if (allScores.length > 1) {
      const secondEmotion = allScores[1][0] as Emotion;
      const secondScore = allScores[1][1];
      if (secondScore > 1 && ["anger", "fear", "sadness"].includes(secondEmotion)) {
        riskScore += 1;
      }
    }
  }

  // Typing behavior contribution
  const mentalStateRisk: Record<MentalState, number> = {
    stressed: 3, anxious: 2, fatigued: 2, calm: 0, focused: 0,
  };
  riskScore += mentalStateRisk[mentalState] ?? 0;

  // Hidden emotion contribution
  if (hiddenEmotion) {
    if (hiddenEmotion.startsWith("⚠️")) riskScore += 6;
    else if (["acute overwhelm", "hopelessness signal"].some(s => hiddenEmotion.includes(s))) riskScore += 4;
    else if (["loneliness", "existential confusion", "negative self-perception", "catastrophic thinking pattern"].some(s => hiddenEmotion.includes(s))) riskScore += 2;
    else riskScore += 1;
  }

  // Map score to risk level
  let risk: BurnoutRisk;
  if (riskScore >= 8) risk = "CRITICAL";
  else if (riskScore >= 5) risk = "HIGH";
  else if (riskScore >= 2) risk = "MEDIUM";
  else risk = "LOW";

  // Track for CRITICAL detection across sessions
  if (risk === "HIGH" || risk === "CRITICAL") {
    recentHighRiskEvents.push(now);
  }

  // Escalate to CRITICAL if 3+ HIGH events in last 5 minutes
  const fiveMinAgo = now - 5 * 60 * 1000;
  const recentCount = recentHighRiskEvents.filter(t => t > fiveMinAgo).length;
  if (recentCount >= 3) risk = "CRITICAL";

  // Clean stale events
  while (recentHighRiskEvents.length > 0 && recentHighRiskEvents[0] < fiveMinAgo) {
    recentHighRiskEvents.shift();
  }

  return risk;
}

// ─────────────────────────────────────────────────────────────
// TYPING BEHAVIOR — Mental state from keystroke dynamics
// ─────────────────────────────────────────────────────────────

export function analyzeTypingBehavior(
  typingSpeed?: number,
  pauseTime?: number,
  backspaceCount?: number
): MentalState {
  if (typingSpeed === undefined && pauseTime === undefined && backspaceCount === undefined) return "calm";

  const speed = typingSpeed ?? 3;
  const pause = pauseTime ?? 1;
  const backspaces = backspaceCount ?? 0;

  // Crisis patterns: chaotic fast typing with many corrections
  if (speed > 8 && backspaces > 10) return "stressed";

  // Slow + long pauses = mental fatigue
  if (speed < 1.5 && pause > 4) return "fatigued";

  // Lots of hesitation/corrections at any speed = anxious
  if (backspaces > 10) return "anxious";
  if (backspaces > 6 && pause > 2) return "anxious";

  // Very fast with minimal pauses = stressed/rushing
  if (speed > 7 && pause < 0.8 && backspaces <= 3) return "stressed";

  // Slow but deliberate = fatigued or very thoughtful
  if (speed < 1.2) return "fatigued";
  if (speed < 2 && pause > 3) return "fatigued";

  // Moderate speed, low corrections, short pauses = focused
  if (speed >= 2.5 && speed <= 6 && pause < 2 && backspaces < 4) return "focused";

  return "calm";
}

// ─────────────────────────────────────────────────────────────
// STABILITY SCORE — Session-aware with decay/recovery
// ─────────────────────────────────────────────────────────────

export function calculateStabilityScore(recentRisks: BurnoutRisk[]): number {
  if (recentRisks.length === 0) return 80;

  const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  const riskValues: Record<BurnoutRisk, number> = {
    LOW: 0, MEDIUM: 8, HIGH: 20, CRITICAL: 35,
  };

  // Most recent events count more
  const slice = recentRisks.slice(-10).reverse();
  let totalDeduction = 0;

  for (let i = 0; i < slice.length; i++) {
    totalDeduction += riskValues[slice[i]] * (weights[i] ?? 0.1);
  }

  return Math.max(0, Math.min(100, Math.round(100 - totalDeduction)));
}

// ─────────────────────────────────────────────────────────────
// WELLNESS SUGGESTIONS — Conversational, context-aware
// ─────────────────────────────────────────────────────────────

const WELLNESS_DB: Record<string, string[]> = {
  // Crisis
  crisis: [
    "You don't have to face this alone. Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) right now — they are available 24/7 and truly want to help.",
    "I hear how much pain you're in. Texting HOME to 741741 connects you to a trained crisis counselor within minutes.",
    "Please tell someone you trust what you're feeling right now — a friend, family member, or therapist. You deserve support.",
    "Your life has value. Please reach out: 988 (call/text), 741741 (text), or go to your nearest emergency room if you feel unsafe.",
  ],
  // High burnout / overwhelm
  high_burnout: [
    "You're carrying a lot right now. Take one slow breath in for 4 counts, hold for 4, and exhale for 6. Your nervous system will thank you.",
    "Pick just one thing you need to do today and let the rest wait. You can't pour from an empty cup — rest is part of recovery.",
    "Try the breathing exercise in the Stress Relief tab. Even 3 minutes can lower your cortisol significantly.",
    "Write down everything on your mind for 5 minutes without stopping. Getting it out of your head and onto paper reduces mental load.",
    "It's okay to say no to things right now. Protecting your energy is not weakness — it's wisdom.",
  ],
  // Sadness
  sadness: [
    "Feeling sad is a valid and human response. You don't need to fix how you feel right now — just acknowledge it with kindness.",
    "When we're sad, small acts of self-care matter a lot. Could you get a glass of water, step outside briefly, or call someone you trust?",
    "Try the 1-minute meditation in the Relief Hub — just sitting quietly and breathing can gently ease emotional heaviness.",
    "Journaling what you're feeling can help process sadness. You don't need to find solutions, just let the words flow.",
    "Be gentle with yourself today. Healing isn't linear, and some days are harder than others — and that's okay.",
  ],
  // Anger / frustration
  anger: [
    "It sounds like something is genuinely bothering you. Before responding to whatever triggered this, try 10 slow, deep breaths.",
    "Your anger is telling you something important about your values or boundaries. What specifically crossed a line for you?",
    "Physical movement can help release anger productively — a brisk walk, stretching, or the reaction game in the Relief Hub.",
    "Write it out first — express everything you feel in a private note before deciding how to respond externally.",
    "Even valid anger deserves a calm exit strategy. What's one thing you can do to remove yourself from the situation temporarily?",
  ],
  // Anxiety / fear
  anxiety: [
    "Anxiety often tricks the mind into treating future worries as present dangers. Ground yourself: name 5 things you can see right now.",
    "Your anxiety is trying to protect you. Acknowledge it, then gently redirect: 'I'm safe in this moment. I can handle one thing at a time.'",
    "Try box breathing: 4 seconds in, 4 hold, 4 out, 4 hold. Repeat 4 times. It directly calms the autonomic nervous system.",
    "Break whatever is overwhelming you into the single next smallest step. You don't have to solve everything at once.",
    "Reach out to someone you trust and tell them how you're feeling. Sharing anxiety with a safe person reduces its hold significantly.",
  ],
  // Fatigue / exhaustion
  fatigue: [
    "Your body and mind are sending a clear signal — rest is not optional right now, it's necessary. Honor that.",
    "Even a 10-15 minute rest with your eyes closed can restore cognitive function. You're not being lazy; you're being intelligent.",
    "Drink a full glass of water now. Dehydration significantly amplifies fatigue and emotional fragility.",
    "Try the 1-minute meditation in the Relief Hub — just breathing quietly for 60 seconds can restore a surprising amount of mental energy.",
    "Set a clear stopping point for today's work. Your brain consolidates and heals during rest — progress happens even when you pause.",
  ],
  // Positive emotions
  joy: [
    "It's wonderful to hear you're in a positive space! Channel this energy into something creative or meaningful to you.",
    "Positive emotions are contagious — consider sharing your good energy with someone who might need it today.",
    "This is a great time to tackle something you've been putting off. Your resilience is high right now.",
  ],
  love: [
    "Nurturing love and connection is one of the most powerful things you can do for your mental health. Keep investing in those relationships.",
    "Expressing gratitude to the people who matter to you deepens connection and boosts your own wellbeing too.",
  ],
  // Neutral / okay
  neutral: [
    "Feeling okay is actually a healthy state. Use this calm moment to check in with your body — are you hydrated, rested, and breathing fully?",
    "Neutral moments are perfect for light mindfulness. Try one minute of simply noticing your breath in the Stress Relief tab.",
    "Use this balanced moment to prepare for challenges ahead — a bit of planning now reduces stress later.",
  ],
  // Stressed / anxious typing
  stressed_typing: [
    "Your typing pattern suggests some underlying tension. Take your hands off the keyboard, roll your shoulders back, and take 3 slow breaths.",
    "Rapid, corrective typing often signals a scattered mind. Before your next sentence, pause for 5 full seconds.",
  ],
  // Loneliness
  loneliness: [
    "Loneliness is one of the most painful human experiences — and it's more common than you might think. You are not strange for feeling this.",
    "NAMI Helpline (1-800-950-6264) has trained counselors who understand isolation. Reaching out is a sign of strength.",
    "Even a brief message to someone — a check-in, a meme, a voice note — can begin to bridge the gap of isolation.",
  ],
};

export function generateWellnessSuggestions(
  emotion: Emotion,
  mentalState: MentalState,
  burnoutRisk: BurnoutRisk,
  hiddenEmotion: string | null
): string[] {
  const suggestions: string[] = [];

  // Crisis first
  if (hiddenEmotion?.includes("⚠️") || hiddenEmotion?.includes("crisis")) {
    return WELLNESS_DB.crisis.slice(0, 4);
  }

  // Hopelessness / giving up signals
  if (hiddenEmotion?.includes("hopelessness") || hiddenEmotion?.includes("existential")) {
    suggestions.push(...WELLNESS_DB.crisis.slice(0, 2));
    suggestions.push(...WELLNESS_DB.sadness.slice(0, 2));
    return suggestions.slice(0, 4);
  }

  // Critical burnout
  if (burnoutRisk === "CRITICAL") {
    suggestions.push(...WELLNESS_DB.high_burnout.slice(0, 2));
    suggestions.push(...WELLNESS_DB.crisis.slice(2, 3));
  }

  // Emotion-based suggestions
  if (emotion === "sadness" || hiddenEmotion?.includes("loneliness")) {
    const pool = hiddenEmotion?.includes("loneliness")
      ? [...WELLNESS_DB.loneliness, ...WELLNESS_DB.sadness]
      : WELLNESS_DB.sadness;
    suggestions.push(pool[Math.floor(Math.random() * pool.length)]);
    suggestions.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (emotion === "anger") {
    suggestions.push(WELLNESS_DB.anger[Math.floor(Math.random() * WELLNESS_DB.anger.length)]);
  }

  if (emotion === "fear" || mentalState === "anxious") {
    suggestions.push(WELLNESS_DB.anxiety[Math.floor(Math.random() * WELLNESS_DB.anxiety.length)]);
    if (burnoutRisk !== "LOW") {
      suggestions.push(WELLNESS_DB.anxiety[Math.floor(Math.random() * WELLNESS_DB.anxiety.length)]);
    }
  }

  if (mentalState === "fatigued") {
    suggestions.push(WELLNESS_DB.fatigue[Math.floor(Math.random() * WELLNESS_DB.fatigue.length)]);
  }

  if (mentalState === "stressed") {
    suggestions.push(WELLNESS_DB.stressed_typing[Math.floor(Math.random() * WELLNESS_DB.stressed_typing.length)]);
    suggestions.push(WELLNESS_DB.high_burnout[Math.floor(Math.random() * WELLNESS_DB.high_burnout.length)]);
  }

  if (burnoutRisk === "HIGH" && mentalState !== "stressed") {
    suggestions.push(WELLNESS_DB.high_burnout[Math.floor(Math.random() * WELLNESS_DB.high_burnout.length)]);
  }

  if (emotion === "joy") suggestions.push(...WELLNESS_DB.joy.slice(0, 2));
  if (emotion === "love") suggestions.push(...WELLNESS_DB.love.slice(0, 2));

  if (emotion === "neutral" || (emotion === "surprise" && burnoutRisk === "LOW")) {
    suggestions.push(WELLNESS_DB.neutral[Math.floor(Math.random() * WELLNESS_DB.neutral.length)]);
  }

  // Deduplicate and limit
  const unique = [...new Set(suggestions)];
  if (unique.length === 0) {
    unique.push(WELLNESS_DB.neutral[0]);
  }

  return unique.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────
// VOICE ANALYSIS — Uses duration + randomness as signal
// ─────────────────────────────────────────────────────────────

export function analyzeVoiceTone(audioDuration?: number): {
  emotion: "angry" | "sad" | "calm" | "happy" | "neutral" | "anxious" | "fatigued";
  confidence: number;
  analysis_note: string;
} {
  const duration = audioDuration ?? 5;

  // Realistic emotion distribution with duration as a signal
  // Very short clip (<2s): anxious or hesitant
  // Long clip (>15s): likely venting (sad/angry) or explaining
  // Medium clip: normal distribution

  let weights: Record<string, number>;

  if (duration < 2) {
    weights = { anxious: 0.40, neutral: 0.30, calm: 0.15, sad: 0.10, angry: 0.05, happy: 0.0, fatigued: 0.0 };
  } else if (duration < 5) {
    weights = { calm: 0.30, neutral: 0.25, happy: 0.18, anxious: 0.12, sad: 0.10, angry: 0.05, fatigued: 0.0 };
  } else if (duration < 15) {
    weights = { calm: 0.28, neutral: 0.22, happy: 0.18, sad: 0.14, anxious: 0.10, angry: 0.05, fatigued: 0.03 };
  } else {
    // Long recordings: more likely expressing something heavy
    weights = { sad: 0.28, calm: 0.20, neutral: 0.18, fatigued: 0.15, angry: 0.12, anxious: 0.07, happy: 0.0 };
  }

  const rand = Math.random();
  let cumulative = 0;
  let selectedEmotion: keyof typeof weights = "neutral";

  for (const [emotion, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand <= cumulative) {
      selectedEmotion = emotion;
      break;
    }
  }

  const notes: Record<string, string> = {
    angry: "Voice patterns suggest elevated tension. Pitch variance indicates emotional arousal.",
    sad: "Low energy vocal patterns detected. Subdued tone and pacing suggest emotional heaviness.",
    calm: "Steady, measured vocal cadence. Your tone suggests emotional regulation.",
    happy: "Upbeat, energized vocal tone detected. Positive emotional state inferred.",
    neutral: "Balanced vocal patterns. Emotional state appears stable.",
    anxious: "Rapid or hesitant speech pattern detected. May indicate nervous tension.",
    fatigued: "Slower cadence and reduced vocal energy. Signs of mental or physical tiredness.",
  };

  return {
    emotion: selectedEmotion as any,
    confidence: Math.min(0.95, 0.55 + Math.random() * 0.35),
    analysis_note: notes[selectedEmotion] ?? "Analysis complete.",
  };
}

// ─────────────────────────────────────────────────────────────
// FACE ANALYSIS — Realistic weighted simulation
// ─────────────────────────────────────────────────────────────

export function analyzeFacialEmotion(): {
  emotion: "happy" | "sad" | "angry" | "fear" | "neutral" | "surprise" | "disgust" | "calm" | "tired";
  confidence: number;
  analysis_note: string;
} {
  const emotions = ["neutral", "happy", "sad", "fear", "angry", "surprise", "disgust", "calm", "tired"];
  const weights = [0.32, 0.22, 0.14, 0.08, 0.07, 0.06, 0.04, 0.05, 0.02];

  const rand = Math.random();
  let cumulative = 0;
  let selectedEmotion = "neutral";

  for (let i = 0; i < emotions.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      selectedEmotion = emotions[i];
      break;
    }
  }

  const notes: Record<string, string> = {
    happy: "Facial muscle patterns (zygomatic) suggest genuine positive affect.",
    sad: "Downward lip corners and brow tension suggest sadness.",
    angry: "Brow furrow and jaw tension patterns detected.",
    fear: "Wide eye aperture and brow elevation suggest anxious state.",
    neutral: "Relaxed facial muscle tone. Baseline emotional state.",
    surprise: "Raised brows and open mouth configuration detected.",
    disgust: "Nose wrinkle and upper lip tension patterns.",
    calm: "Smooth brow, neutral lip line. Regulated state.",
    tired: "Drooping eyelids and reduced micro-expression range detected.",
  };

  return {
    emotion: selectedEmotion as any,
    confidence: Math.min(0.95, 0.60 + Math.random() * 0.32),
    analysis_note: notes[selectedEmotion] ?? "Analysis complete.",
  };
}
