import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: Boolean(getAi()),
    timestamp: new Date().toISOString(),
  });
});

// AI Timetable Generation from Natural Language Prompt
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, type, institution } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAi();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please use the built-in Automatic Wizard or configure your Gemini API Key in the Settings menu.',
      });
    }

    const systemInstruction = `You are an expert academic and organizational timetable scheduling assistant.
Your task is to take a natural language description of a timetable request and generate a complete, structured JSON timetable object.
Return ONLY valid raw JSON with NO markdown formatting, NO backticks, NO explanation.
The JSON must follow this exact schema:
{
  "name": "string (e.g. Mechanical Engineering Sem 4)",
  "institutionName": "string",
  "subTitle": "string",
  "type": "school" | "college" | "university" | "study" | "work" | "personal" | "workout" | "custom",
  "days": [
    { "id": "mon", "name": "Monday", "shortName": "Mon" }
  ],
  "timeSlots": [
    { "id": "s1", "name": "Period 1", "start": "09:00", "end": "10:00", "isBreak": false },
    { "id": "lunch", "name": "Lunch Break", "start": "13:00", "end": "14:00", "isBreak": true, "breakType": "lunch" }
  ],
  "entries": [
    {
      "id": "e1",
      "dayId": "mon",
      "slotId": "s1",
      "title": "Mathematics",
      "shortCode": "MATH",
      "teacher": "Prof. Alan",
      "room": "Room 101",
      "color": "#dbeafe",
      "textColor": "#1e40af",
      "icon": "BookOpen",
      "category": "Core"
    }
  ]
}
Make sure every day and slot combination has reasonable distribution according to user prompt. Include lunch or tea breaks if requested or appropriate. Colors should be pleasing Tailwind pastel hexes (e.g. #dbeafe, #fef3c7, #e0e7ff, #fce7f3, #dcfce7, #ffedd5, #ccfbf1).
Icons should be standard Lucide icon names (BookOpen, Calculator, Cpu, Database, Network, Code, Terminal, Activity, Dumbbell, Coffee, Users, FileText).`;

    const userMessage = `Create a timetable with the following requirements:
Prompt: "${prompt}"
Type preference: "${type || 'college'}"
Institution preference: "${institution || 'Timetable Studio'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    // Clean potential markdown backticks
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('AI Generate Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate timetable with AI',
    });
  }
});

// AI Timetable Modification / Tweak
app.post('/api/ai/edit', async (req, res) => {
  try {
    const { instruction, currentTimetable } = req.body;
    if (!instruction || !currentTimetable) {
      return res.status(400).json({ error: 'Instruction and current timetable required' });
    }

    const ai = getAi();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please configure your key in Settings.',
      });
    }

    const systemInstruction = `You are an AI assistant that edits an existing timetable according to a user's instruction.
You will receive the user's natural language instruction and the current timetable JSON.
Modify the timetable accordingly (e.g., change colors, reschedule a subject, rename, add a break, restyle, etc.).
Return ONLY the updated raw JSON matching the timetable schema with NO markdown and NO explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Instruction: "${instruction}"\nCurrent Timetable JSON:\n${JSON.stringify(currentTimetable)}`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const updated = JSON.parse(cleaned);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('AI Edit Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to edit timetable with AI',
    });
  }
});

// Vite middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Timetable Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
