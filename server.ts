import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/ai/coach', async (req, res) => {
    const { module, prompt, context } = req.body as {
      module?: 'coach' | 'tutor' | 'social' | 'finance';
      prompt?: string;
      context?: string;
    };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Порожній запит до AI.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'Зовнішня модель не підключена. Використано локальний аналіз.',
      });
    }

    const roleInstructions: Record<string, string> = {
      coach:
        'Ти — персональний AI-коуч системи Personal Life OS (методологія Kaizen). Відповідай українською мовою. Давай конкретні, збалансовані поради без моралізаторства. Поважай відпочинок користувача. Спирайся лише на переданий мінімальний контекст.',
      tutor:
        'Ти — AI-репетитор у Personal Life OS. Пояснюй складні теми простою українською мовою, формуй короткі міні-тести (3 питання) та практичні вправи.',
      social:
        'Ти — делікатний AI-тренер комунікації. Допомагай українською мовою готуватися до розмов, переговорів і знайомств, давай практичні фрази та вправи для впевненості.',
      finance:
        'Ти — персональний фінансовий аналітик. Аналізуй доходи, витрати та бюджети українською мовою, пропонуй реалістичні кроки економії без тиску.',
    };

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = roleInstructions[module ?? 'coach'] ?? roleInstructions.coach;
      const fullContents = context
        ? `Мінімальний дозволений контекст користувача:\n${context}\n\nЗапит користувача:\n${prompt.trim()}`
        : prompt.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: fullContents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        return res.status(502).json({ error: 'Порожня відповідь від моделі.' });
      }
      return res.json({ reply: text, source: 'gemini' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка звернення до AI.';
      console.error('Gemini API error:', message);
      return res.status(500).json({
        error: 'GEMINI_REQUEST_FAILED',
        message: 'Не вдалося отримати відповідь від зовнішньої моделі.',
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Life OS running at http://localhost:${PORT}`);
  });
}

startServer();
