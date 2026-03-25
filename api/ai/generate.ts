import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, key } = req.body;

    const apiKey = key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "Missing API Key",
        message: "Gemini API key is required."
      });
    }

    const userText = String(prompt || "");

    // ✅ FINAL CORRECT PAYLOAD
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userText }
          ]
        }
      ]
    };

    console.log("🔥 NEW VERSION RUNNING");
    console.log("FINAL PAYLOAD:", JSON.stringify(geminiPayload));

    // ✅ FINAL WORKING ENDPOINT (IMPORTANT)
    const GEMINI_ENDPOINT =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(GEMINI_ENDPOINT, geminiPayload, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30000
    });

    const candidates = response.data?.candidates || [];
    const parts = candidates[0]?.content?.parts || [];

    const output = parts
      .map((p: any) => p.text || "")
      .join("")
      .trim();

    return res.status(200).json({
      text: output || "No response generated.",
      reply: output || "No response generated.",
      message: output || "No response generated."
    });

  } catch (error: any) {
    console.error("[Gemini Error]:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      error: "AI request failed",
      message: error.response?.data?.error?.message || error.message
    });
  }
}