import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, key, provider } = req.body;
  const userText = String(prompt || "").trim();

  if (!userText) {
    return res.status(400).json({
      error: "Missing Prompt",
      message: "Prompt is required."
    });
  }

  const callGemini = async () => {
    const apiKey = String(key || "").trim();
    if (!apiKey) throw new Error("Missing Gemini API Key");

    console.log("🔥 TRYING GEMINI (USER KEY)");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: userText }]
        }
      ]
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

    if (!text) throw new Error("Gemini returned empty response");

    return text;
  };

  const callOpenRouter = async () => {
    const apiKey = String(key || "").trim();
    if (!apiKey) throw new Error("Missing OpenRouter API Key");

    console.log("⚡ TRYING OPENROUTER (USER KEY)");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: userText }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || "";

    if (!text) throw new Error("OpenRouter returned empty response");

    return text;
  };

  try {
    let output = "";

    if (provider === "openrouter") {
      output = await callOpenRouter();
    } else {
      output = await callGemini();
    }

    return res.status(200).json({
      text: output,
      reply: output,
      message: output
    });

  } catch (error: any) {
    console.error("❌ AI ERROR:", error?.message || error);

    return res.status(500).json({
      error: "AI request failed",
      message: error?.message || "Unknown error"
    });
  }
}