import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { emotionRecordsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  AnalyzeEmotionBody,
  AnalyzeVoiceBody,
  AnalyzeFaceBody,
} from "@workspace/api-zod";
import {
  detectEmotion,
  detectHiddenEmotion,
  predictBurnoutRisk,
  analyzeTypingBehavior,
  calculateStabilityScore,
  generateWellnessSuggestions,
  analyzeVoiceTone,
  analyzeFacialEmotion,
} from "../emotion_analysis.js";

const router: IRouter = Router();

/**
 * POST /analyze
 * Analyze message text, typing behavior, and predict burnout risk
 */
router.post("/analyze", async (req, res) => {
  try {
    const body = AnalyzeEmotionBody.parse(req.body);

    // Detect emotion from text
    const { emotion } = detectEmotion(body.message);

    // Detect hidden emotional stress patterns
    const hiddenEmotion = detectHiddenEmotion(body.message);

    // Analyze typing behavior
    const mentalState = analyzeTypingBehavior(
      body.typing_speed ?? undefined,
      body.pause_time ?? undefined,
      body.backspace_count ?? undefined
    );

    // Get recent burnout history for score calculation
    const recentRecords = await db
      .select({ burnout_risk: emotionRecordsTable.burnout_risk })
      .from(emotionRecordsTable)
      .orderBy(desc(emotionRecordsTable.timestamp))
      .limit(10);

    const recentRisks = recentRecords.map(r => r.burnout_risk as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");

    // Predict burnout risk
    const burnoutRisk = predictBurnoutRisk(emotion, []);

    // Calculate stability score based on history
    const stabilityScore = calculateStabilityScore([...recentRisks, burnoutRisk]);

    // Generate wellness suggestions
    const wellnessSuggestions = generateWellnessSuggestions(emotion, mentalState, burnoutRisk);

    // Store record in database
    const [record] = await db
      .insert(emotionRecordsTable)
      .values({
        message: body.message,
        emotion,
        hidden_emotion: hiddenEmotion,
        burnout_risk: burnoutRisk,
        mental_state: mentalState,
        typing_speed: body.typing_speed ?? null,
        pause_time: body.pause_time ?? null,
        backspace_count: body.backspace_count ?? null,
        stability_score: stabilityScore,
        wellness_suggestions: JSON.stringify(wellnessSuggestions),
      })
      .returning();

    res.json({
      emotion,
      hidden_emotion: hiddenEmotion,
      burnout_risk: burnoutRisk,
      mental_state: mentalState,
      wellness_suggestions: wellnessSuggestions,
      stability_score: stabilityScore,
      id: String(record.id),
      timestamp: record.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(400).json({ error: "Analysis failed", details: String(error) });
  }
});

/**
 * POST /voice-analysis
 * Analyze voice emotion from audio data
 */
router.post("/voice-analysis", async (req, res) => {
  try {
    const body = AnalyzeVoiceBody.parse(req.body);

    // Analyze voice tone
    const { emotion: voiceEmotion, confidence } = analyzeVoiceTone(body.duration ?? undefined);

    // Determine burnout risk from voice emotion
    const voiceToBurnout: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
      angry: "HIGH",
      sad: "HIGH",
      calm: "LOW",
      happy: "LOW",
      neutral: "MEDIUM",
    };
    const burnoutRisk = voiceToBurnout[voiceEmotion] ?? "MEDIUM";

    // Optionally store the voice analysis result
    await db.insert(emotionRecordsTable).values({
      message: "[Voice Analysis]",
      emotion: voiceEmotion === "happy" ? "joy" : voiceEmotion === "calm" ? "neutral" : voiceEmotion as any,
      burnout_risk: burnoutRisk,
      voice_emotion: voiceEmotion,
      stability_score: 75,
    });

    res.json({
      voice_emotion: voiceEmotion,
      confidence: Math.round(confidence * 100) / 100,
      burnout_risk: burnoutRisk,
    });
  } catch (error) {
    console.error("Voice analysis error:", error);
    res.status(400).json({ error: "Voice analysis failed", details: String(error) });
  }
});

/**
 * POST /face-analysis
 * Analyze facial emotion from image frame
 */
router.post("/face-analysis", async (req, res) => {
  try {
    const body = AnalyzeFaceBody.parse(req.body);

    // Analyze facial emotion
    const { emotion: faceEmotion, confidence } = analyzeFacialEmotion();

    // Store result
    await db.insert(emotionRecordsTable).values({
      message: "[Face Analysis]",
      emotion: faceEmotion === "happy" ? "joy" : faceEmotion === "disgust" || faceEmotion === "angry" ? "anger" : "neutral",
      burnout_risk: ["angry", "fear", "sad"].includes(faceEmotion) ? "HIGH" : "LOW",
      face_emotion: faceEmotion,
      stability_score: 75,
    });

    res.json({
      face_emotion: faceEmotion,
      confidence: Math.round(confidence * 100) / 100,
      dominant_emotion: faceEmotion,
    });
  } catch (error) {
    console.error("Face analysis error:", error);
    res.status(400).json({ error: "Face analysis failed", details: String(error) });
  }
});

/**
 * GET /dashboard
 * Get emotional history and analytics
 */
router.get("/dashboard", async (req, res) => {
  try {
    // Fetch recent records
    const records = await db
      .select()
      .from(emotionRecordsTable)
      .orderBy(desc(emotionRecordsTable.timestamp))
      .limit(50);

    // Calculate emotion counts
    const emotionCounts: Record<string, number> = {};
    for (const record of records) {
      const e = record.emotion;
      emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
    }

    // Calculate overall stability score
    const risks = records.map(r => r.burnout_risk as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");
    const stabilityScore = calculateStabilityScore(risks);

    // Get current burnout risk (most recent)
    const currentBurnoutRisk = records[0]?.burnout_risk ?? "LOW";

    res.json({
      records: records.map(r => ({
        id: String(r.id),
        message: r.message,
        emotion: r.emotion,
        burnout_risk: r.burnout_risk,
        mental_state: r.mental_state,
        voice_emotion: r.voice_emotion,
        face_emotion: r.face_emotion,
        typing_speed: r.typing_speed,
        stability_score: r.stability_score,
        timestamp: r.timestamp.toISOString(),
      })),
      stability_score: stabilityScore,
      current_burnout_risk: currentBurnoutRisk,
      emotion_counts: emotionCounts,
      total_sessions: records.length,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Dashboard fetch failed", details: String(error) });
  }
});

export default router;
