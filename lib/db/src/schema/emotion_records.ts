import { pgTable, text, serial, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emotionRecordsTable = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  message: text("message"),
  emotion: text("emotion").notNull(),
  hidden_emotion: text("hidden_emotion"),
  burnout_risk: text("burnout_risk").notNull(),
  mental_state: text("mental_state"),
  voice_emotion: text("voice_emotion"),
  face_emotion: text("face_emotion"),
  typing_speed: real("typing_speed"),
  pause_time: real("pause_time"),
  backspace_count: integer("backspace_count"),
  stability_score: real("stability_score"),
  wellness_suggestions: text("wellness_suggestions"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertEmotionRecordSchema = createInsertSchema(emotionRecordsTable).omit({ id: true, timestamp: true });
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;
export type EmotionRecord = typeof emotionRecordsTable.$inferSelect;
