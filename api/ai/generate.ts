import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    console.log("🔥 SDK VERSION RUNNING");

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(userText);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      text: text || "No response generated.",
      reply: text || "No response generated.",
      message: text || "No response generated."
    });

  } catch (error: any) {
    console.error("❌ GEMINI SDK ERROR:", error);

    return res.status(500).json({
      error: "AI request failed",
      message: error?.message || "Unknown error"
    });
  }
}