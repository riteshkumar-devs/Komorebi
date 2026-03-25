import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "Missing API Key",
        message: "GEMINI_API_KEY not found in environment variables."
      });
    }

    const userText = String(prompt || "").trim();

    if (!userText) {
      return res.status(400).json({
        error: "Missing Prompt",
        message: "Prompt is required."
      });
    }

    console.log("🔥 GOOGLE GENAI SDK RUNNING");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: userText }
          ]
        }
      ]
    });

    console.log("✅ RAW GOOGLE RESPONSE:", JSON.stringify(response, null, 2));

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "No response generated.";

    return res.status(200).json({
      text,
      reply: text,
      message: text
    });

  } catch (error: any) {
    console.error("❌ GOOGLE GENAI ERROR MESSAGE:", error?.message);
    console.error("❌ GOOGLE GENAI ERROR OBJECT:", error);

    return res.status(500).json({
      error: "AI request failed",
      message: error?.message || "Unknown error"
    });
  }
}