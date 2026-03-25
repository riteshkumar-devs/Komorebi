import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST
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

    // Ensure string
    const userText = String(prompt || "");

    // ✅ FIXED PAYLOAD (role added)
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

    console.log("FINAL PAYLOAD:", JSON.stringify(geminiPayload));

    const GEMINI_ENDPOINT =
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(GEMINI_ENDPOINT, geminiPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const candidates = response.data?.candidates || [];
    const parts = candidates[0]?.content?.parts || [];

    const combinedText = parts
      .map((part: any) => part.text || "")
      .join("")
      .trim();

    return res.status(200).json({
      text: combinedText || "No response generated.",
      reply: combinedText || "No response generated.",
      message: combinedText || "No response generated."
    });

  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || {};

    console.error("[Gemini Proxy Error]:", error.response?.data || error.message);

    return res.status(statusCode).json({
      error: "AI Proxy Request Failed",
      message: errorData.error?.message || error.message,
      details: errorData
    });
  }
}