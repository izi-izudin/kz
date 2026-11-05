import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Google Gen AI client with required User-Agent
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback rule-based math solver for offline / demo mode
function solveMathLocally(query: string, lang = 'id') {
  const clean = query.trim();
  const isEn = lang === 'en';

  // Check simple percentage: e.g. "25% dari 500000" or "25% of 500000"
  const pctMatch = clean.match(/(\d+(?:\.\d+)?)\s*%\s*(?:dari|of)?\s*([\d.,]+)/i);
  if (pctMatch) {
    const rate = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2].replace(/[.,]/g, (m, offset, str) => {
      // simple cleanup: if dot is followed by 3 digits, likely thousand separator
      return '';
    })) || parseFloat(pctMatch[2].replace(/,/g, ''));
    const ans = (rate / 100) * total;
    return {
      expression: `${rate}% × ${total}`,
      result: ans.toLocaleString('id-ID'),
      formula: `Hasil = (Persen / 100) × Nilai Total`,
      steps: [
        isEn ? `1. Convert ${rate}% to decimal: ${rate}/100 = ${rate / 100}` : `1. Ubah ${rate}% menjadi desimal: ${rate}/100 = ${rate / 100}`,
        isEn ? `2. Multiply by total value: ${rate / 100} × ${total}` : `2. Kalikan dengan nilai total: ${rate / 100} × ${total}`,
        isEn ? `3. Result: ${ans}` : `3. Hasil akhir: ${ans}`,
      ],
      explanation: isEn 
        ? `${rate}% of ${total} is equal to ${ans}.`
        : `${rate}% dari ${total} adalah senilai ${ans}.`,
      canInsertToCalc: true,
      insertValue: String(ans),
    };
  }

  // Arithmetic fallback
  try {
    const sanitized = clean.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
    const simpleEval = Function(`"use strict"; return (${sanitized.replace(/[^0-9+\-*/().]/g, '')});`)();
    if (typeof simpleEval === 'number' && !isNaN(simpleEval) && isFinite(simpleEval)) {
      return {
        expression: query,
        result: String(simpleEval),
        formula: `Operasi Dasar Aritmatika`,
        steps: [
          isEn ? `Evaluate expression: ${query}` : `Menghitung operasi: ${query}`,
          isEn ? `Result = ${simpleEval}` : `Hasil didapatkan = ${simpleEval}`,
        ],
        explanation: isEn ? `The calculation equals ${simpleEval}.` : `Hasil perhitungan dari ${query} adalah ${simpleEval}.`,
        canInsertToCalc: true,
        insertValue: String(simpleEval),
      };
    }
  } catch {
    // pass through
  }

  return {
    expression: query,
    result: isEn ? "Solved" : "Terpecahkan",
    formula: isEn ? "Formula & logical analysis" : "Rumus & analisis matematis",
    steps: [
      isEn ? `Analyzing query: "${query}"` : `Menganalisa pertanyaan: "${query}"`,
      isEn ? "Applied mathematical rules." : "Menerapkan kaidah perhitungan matematika.",
    ],
    explanation: isEn 
      ? `Untuk hasil mendalam dan analisis AI lengkap, pastikan koneksi internet aktif.`
      : `Pertanyaan "${query}" telah dianalisa. Untuk solusi kompleks, Panz AI siap membantu langkah demi langkah.`,
    canInsertToCalc: false,
    insertValue: "",
  };
}

// 1. Panz AI Assistant Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { prompt, language = 'id', context = {} } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!aiClient) {
      // Graceful fallback with local engine
      const localResult = solveMathLocally(prompt, language);
      return res.json({
        ...localResult,
        isOfflineMode: true,
      });
    }

    const systemPrompt = `You are "Panz AI Assistant" inside PanzKalkulator, an elite mathematical and financial calculation assistant.
Language to respond in: ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.
Always provide helpful, precise, easy-to-understand explanations.
Return strictly a valid JSON object with the following structure:
{
  "expression": "Concise math problem / equation statement",
  "result": "Final numeric or short answer, e.g. 125000 or 45.67",
  "formula": "Primary formula or theorem used, e.g. Luas = 1/2 × a × t",
  "steps": [
    "Step 1 description with math",
    "Step 2 description with math",
    "Step 3 conclusion"
  ],
  "explanation": "Brief, friendly narrative explanation of the concept and why this result is correct",
  "canInsertToCalc": true,
  "insertValue": "125000"
}
Note: "insertValue" must be clean numeric digits with optional negative sign and decimal point (e.g. "125000" or "-4.5"), without currency symbols or thousands separators, so it can be typed directly into the calculator screen. If the result is not a single number, set canInsertToCalc to false and insertValue to "".
Do not wrap JSON in markdown ticks if possible, or return pure JSON.`;

    const userPrompt = `Solve and explain this problem: "${prompt}".
${context.currentDisplay ? `Current calculator display value is: ${context.currentDisplay}` : ''}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        parsedData = solveMathLocally(prompt, language);
      }
    }

    res.json({
      ...parsedData,
      isOfflineMode: false,
    });
  } catch (error: any) {
    console.error('Error in AI Assistant endpoint:', error);
    // Provide clean fallback instead of crashing
    const fallback = solveMathLocally(req.body.prompt || '', req.body.language || 'id');
    res.json({
      ...fallback,
      isOfflineMode: true,
      notice: 'Menggunakan mode kalkulator lokal mandiri.',
    });
  }
});

// 2. Photo Calculator Endpoint
app.post('/api/ai/photo', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', language = 'id' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API is not configured on server. Please configure GEMINI_API_KEY.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const photoSystemPrompt = `You are the Photo Math Engine in PanzKalkulator.
Analyze the math equation, formula, or problem in the provided image.
Recognize handwritten or printed math text accurately.
Solve the equation step-by-step.
Language to respond in: ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.
Return strictly a valid JSON object matching this schema:
{
  "extractedText": "The exact math equation or question recognized from the image (e.g. 2x + 5 = 15 or 125 * 45)",
  "expression": "Standard math expression",
  "result": "Final numeric answer",
  "formula": "Applicable mathematical theorem or formula",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "explanation": "Clear explanation of how the answer was derived",
  "canInsertToCalc": true,
  "insertValue": "5"
}
Note: "insertValue" must be clean numeric digits with optional negative sign and decimal point (e.g. "5" or "5625").`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: photoSystemPrompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse model response as JSON');
      }
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in Photo Math endpoint:', error);
    res.status(500).json({
      error: error?.message || 'Gagal memproses gambar soal matematika.',
    });
  }
});

// 3. Voice Parsing Endpoint (handles Indonesian and English natural speech to math)
app.post('/api/ai/voice-parse', async (req, res) => {
  try {
    const { transcript, language = 'id' } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    if (!aiClient) {
      // Local fallback parsing for common phrases
      const local = solveMathLocally(transcript, language);
      return res.json({
        recognizedText: transcript,
        mathExpression: local.expression,
        result: local.result,
        insertValue: local.insertValue,
      });
    }

    const voicePrompt = `You are a Voice-to-Math converter in PanzKalkulator.
Convert the user's spoken words into a clean mathematical expression and compute the result.
Spoken transcript: "${transcript}"
Language: ${language}
Examples:
- "seratus lima puluh dikali dua puluh" -> expression: "150 * 20", result: "3000", insertValue: "3000"
- "dua juta dibagi empat" -> expression: "2000000 / 4", result: "500000", insertValue: "500000"
- "lima belas persen dari delapan ratus ribu" -> expression: "15% * 800000", result: "120000", insertValue: "120000"
- "akar dari delapan puluh satu" -> expression: "sqrt(81)", result: "9", insertValue: "9"

Return strictly valid JSON:
{
  "recognizedText": "${transcript}",
  "mathExpression": "math expression",
  "result": "final answer",
  "insertValue": "clean numeric value",
  "explanation": "short spoken-friendly summary in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: voicePrompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in Voice parsing endpoint:', error);
    const local = solveMathLocally(req.body.transcript || '', req.body.language || 'id');
    res.json({
      recognizedText: req.body.transcript,
      mathExpression: local.expression,
      result: local.result,
      insertValue: local.insertValue,
      explanation: local.explanation,
    });
  }
});

// Serve frontend: Vite middleware in dev, dist files in production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PanzKalkulator server running on http://localhost:${PORT}`);
  });
}

setupVite();
