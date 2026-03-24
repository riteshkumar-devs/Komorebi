import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { prompt, contents, key } = req.body;

    // ✅ API key (ENV fallback)
    const apiKey = key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "API key missing" });
    }

    // ✅ Normalize input
    const finalText = prompt || contents;

    if (!finalText) {
      return res.status(400).json({ error: "No input text provided" });
    }

    // ✅ Stable Gemini endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: finalText }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // ✅ ROBUST PARSING (FIXED)
    let text = "No response from AI";

    if (data?.candidates?.length > 0) {
      const parts = data.candidates[0]?.content?.parts;

      if (Array.isArray(parts)) {
        text = parts
          .map((p: any) => p.text || "")
          .join("")
          .trim();
      }
    }

    if (!text) {
      text = "No response from AI";
    }

    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("AI Proxy Error:", error);

    return res.status(500).json({
      error: "AI Proxy Request Failed",
      message: error.message || "Unknown error"
    });
  }
}