# MindShield AI – Predictive Emotional Guardian

## Overview

Full-stack AI web application that detects mental and emotional state through multiple signals: chat messages, typing behavior, voice tone, and facial expressions. Predicts burnout risk and provides wellness recommendations.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/mindshield)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── mindshield/          # React + Vite frontend (port 20778, path /)
│   └── api-server/          # Express API server (port 8080, path /api)
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen config
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas from OpenAPI
│   └── db/                  # Drizzle ORM schema + DB connection
```

## Features

1. **AI Chat Interface** – Detects emotion, hidden stress, burnout risk from typed messages. Tracks typing speed, pauses, and backspaces.
2. **Emotional Dashboard** – Charts showing emotion timeline, burnout risk, stability score (0-100), emotion distribution.
3. **Camera Page** – Webcam facial emotion detection (happy/sad/angry/fear/neutral).
4. **Voice Page** – Microphone voice emotion analysis (angry/sad/calm/happy/neutral).
5. **Stress Relief Zone** – Breathing exercise, reaction speed game, color relaxation, 1-minute meditation timer.

## API Endpoints

- `GET /api/healthz` – Health check
- `POST /api/analyze` – Analyze message + typing behavior → emotion, burnout risk, wellness suggestions
- `POST /api/voice-analysis` – Analyze voice emotion from audio
- `POST /api/face-analysis` – Analyze facial emotion from image frame
- `GET /api/dashboard` – Get full emotional history and analytics

## Database Schema

- `emotion_records` – Stores all analysis records with emotion, burnout_risk, mental_state, typing metrics, stability_score, timestamps

## Emotion Classes

- **Text emotions**: joy, sadness, anger, fear, love, surprise, neutral
- **Voice emotions**: angry, sad, calm, happy, neutral
- **Face emotions**: happy, sad, angry, fear, neutral, surprise, disgust
- **Mental states**: calm, focused, stressed, fatigued, anxious
- **Burnout risk levels**: LOW, MEDIUM, HIGH, CRITICAL

## Running

- Frontend: `pnpm --filter @workspace/mindshield run dev`
- API Server: `pnpm --filter @workspace/api-server run dev`
- DB Push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
