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
 * Full text + typing behavior emotion analysis
 */
router.post("/analyze", async (req, res) => {
  try {
    const body = AnalyzeEmotionBody.parse(req.body);

    // 1. Detect emotion from text (weighted phrase scoring)
    const { emotion, confidence, scores } = detectEmotion(body.message);

    // 2. Detect hidden / masked distress signals
    const hiddenEmotion = detectHiddenEmotion(body.message);

    // 3. Analyze typing behavior → mental state
    const mentalState = analyzeTypingBehavior(
      body.typing_speed ?? undefined,
      body.pause_time ?? undefined,
      body.backspace_count ?? undefined
    );

    // 4. Predict burnout risk (now uses emotion + mentalState + hiddenEmotion)
    const burnoutRisk = predictBurnoutRisk(emotion, mentalState, hiddenEmotion, scores);

    // 5. Get recent session history for stability score
    let recentRecords: any[] = [];
    recentRecords = await db
      .select({ burnout_risk: emotionRecordsTable.burnout_risk })
      .from(emotionRecordsTable)
      .orderBy(desc(emotionRecordsTable.timestamp))
      .limit(10);

    const recentRisks = recentRecords.map(r => r.burnout_risk as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");

    // 6. Calculate stability score (weighted, most-recent counts most)
    const stabilityScore = calculateStabilityScore([...recentRisks, burnoutRisk]);

    // 7. Generate wellness suggestions (context-aware, conversational)
    const wellnessSuggestions = generateWellnessSuggestions(emotion, mentalState, burnoutRisk, hiddenEmotion);

    // 8. Persist to DB
    let recordItem: any = { id: 1, timestamp: new Date() };
    const inserted = await db
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
    recordItem = inserted[0];

    let ai_response: string | undefined;

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MindShield AI"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { 
                role: "system", 
                content: `You are MindShield AI, an empathetic emotional support companion. The user's detected emotional state is: ${emotion}. Mentally they seem: ${mentalState}. Burnout risk level: ${burnoutRisk}. Provide a highly empathetic, helpful, and supportive response to their message expressing understanding of their feelings. Provide advice. Use markdown formatting lightly if helpful. Keep it concise, around 2-3 short paragraphs max.` 
              },
              { role: "user", content: body.message }
            ]
          })
        });

        if (orRes.ok) {
          const orData = await orRes.json() as any;
          if (orData.choices?.[0]?.message?.content) {
             ai_response = orData.choices[0].message.content;
          }
        }
      } catch (err) {
        console.error("OpenRouter fetch failed:", err);
      }
    }

    res.json({
      emotion,
      hidden_emotion: hiddenEmotion,
      burnout_risk: burnoutRisk,
      mental_state: mentalState,
      wellness_suggestions: wellnessSuggestions,
      stability_score: stabilityScore,
      emotion_confidence: Math.round(confidence * 100),
      ai_response,
      id: String(recordItem.id),
      timestamp: recordItem.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(400).json({ error: "Analysis failed", details: String(error) });
  }
});

/**
 * POST /voice-analysis
 */
router.post("/voice-analysis", async (req, res) => {
  try {
    const body = AnalyzeVoiceBody.parse(req.body);

    const { emotion: voiceEmotion, confidence, analysis_note } = analyzeVoiceTone(body.duration ?? undefined);

    const voiceToBurnout: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
      angry: "HIGH", anxious: "HIGH",
      sad: "HIGH", fatigued: "MEDIUM",
      neutral: "MEDIUM", calm: "LOW", happy: "LOW",
    };
    const burnoutRisk = voiceToBurnout[voiceEmotion] ?? "MEDIUM";

    await db.insert(emotionRecordsTable).values({
      message: "[Voice Analysis]",
      emotion: (voiceEmotion === "happy" ? "joy" : voiceEmotion === "calm" || voiceEmotion === "fatigued" ? "neutral" : voiceEmotion) as any,
      burnout_risk: burnoutRisk,
      voice_emotion: voiceEmotion,
      stability_score: burnoutRisk === "LOW" ? 80 : burnoutRisk === "MEDIUM" ? 60 : 40,
    });

    res.json({
      voice_emotion: voiceEmotion,
      confidence: Math.round(confidence * 100) / 100,
      burnout_risk: burnoutRisk,
      analysis_note,
    });
  } catch (error) {
    console.error("Voice analysis error:", error);
    res.status(400).json({ error: "Voice analysis failed", details: String(error) });
  }
});

/**
 * POST /face-analysis
 */
router.post("/face-analysis", async (req, res) => {
  try {
    const body = AnalyzeFaceBody.parse(req.body);

    const { emotion: faceEmotion, confidence, analysis_note } = analyzeFacialEmotion();

    const faceToBurnout: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
      angry: "HIGH", fear: "HIGH", sad: "HIGH",
      tired: "MEDIUM", disgust: "MEDIUM",
      neutral: "LOW", happy: "LOW", calm: "LOW", surprise: "LOW",
    };
    const burnoutRisk = faceToBurnout[faceEmotion] ?? "LOW";

    await db.insert(emotionRecordsTable).values({
      message: "[Face Analysis]",
      emotion: faceEmotion === "happy" || faceEmotion === "calm" ? "joy"
        : faceEmotion === "disgust" || faceEmotion === "angry" ? "anger"
        : faceEmotion === "tired" ? "sadness"
        : "neutral",
      burnout_risk: burnoutRisk,
      face_emotion: faceEmotion,
      stability_score: burnoutRisk === "LOW" ? 80 : burnoutRisk === "MEDIUM" ? 60 : 40,
    });

    res.json({
      face_emotion: faceEmotion,
      confidence: Math.round(confidence * 100) / 100,
      dominant_emotion: faceEmotion,
      analysis_note,
    });
  } catch (error) {
    console.error("Face analysis error:", error);
    res.status(400).json({ error: "Face analysis failed", details: String(error) });
  }
});

/**
 * GET /dashboard
 */
router.get("/dashboard", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(emotionRecordsTable)
      .orderBy(desc(emotionRecordsTable.timestamp))
      .limit(50);

    const emotionCounts: Record<string, number> = {};
    for (const record of records) {
      const e = record.emotion;
      emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
    }

    const risks = records.map(r => r.burnout_risk as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");
    const stabilityScore = calculateStabilityScore(risks);
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
      stability_score: isNaN(stabilityScore) ? 80 : stabilityScore,
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
