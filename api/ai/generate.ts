import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // ✅ accept both prompt & contents
    const { provider, key, baseUrl, model, contents, prompt, systemInstruction, responseMimeType } = req.body;

    // ✅ fallback to ENV key
    const apiKey = key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    // ✅ normalize input
    let finalContent = contents || prompt;

    if (!finalContent) {
      return res.status(400).json({ error: "No content provided" });
    }

    switch (provider) {

      // =========================
      // GEMINI (MAIN FIXED PART)
      // =========================
      case 'gemini':
      default: {
        let geminiModel = model || "gemini-1.5-flash";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

        const response = await axios.post(
          url,
          {
            contents: [
              {
                parts: [{ text: finalContent }]
              }
            ],
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
            generationConfig: {
              responseMimeType: responseMimeType || "text/plain"
            }
          },
          { timeout: 30000 }
        );

        const text =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response from AI";

        return res.status(200).json({ text });
      }

      // =========================
      // OPENAI / OPENROUTER
      // =========================
      case 'openai':
      case 'openrouter': {
        const response = await axios.post(
          baseUrl ||
            (provider === 'openai'
              ? "https://api.openai.com/v1/chat/completions"
              : "https://openrouter.ai/api/v1/chat/completions"),
          {
            model: model || "gpt-4o",
            messages: [
              ...(systemInstruction
                ? [{ role: "system", content: systemInstruction }]
                : []),
              { role: "user", content: finalContent }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          }
        );

        return res.status(200).json({
          text: response.data?.choices?.[0]?.message?.content || "No response"
        });
      }

      // =========================
      // FALLBACK
      // =========================
      default:
        return res.status(400).json({ error: "Unsupported provider" });
    }

  } catch (error: any) {
    console.error("[AI Proxy Error]:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      error: "AI Proxy Request Failed",
      message:
        error.response?.data?.error?.message ||
        error.message ||
        "Unknown error"
    });
  }
}