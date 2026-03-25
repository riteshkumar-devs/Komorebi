import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Missing API Key" });
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: String(prompt || "") }]
        }
      ]
    };

    console.log("🔥 FINAL REAL FIX");

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey   // ✅ IMPORTANT CHANGE
        }
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({
      text,
      reply: text,
      message: text
    });

  } catch (error: any) {
    console.error("❌ ERROR:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      error: "Failed",
      message: error.response?.data?.error?.message || error.message
    });
  }
}