import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Vercel Serverless Function: AI Proxy for Google Gemini API
 * 
 * STRICT IMPLEMENTATION:
 * 1. Ignores 'contents' from frontend.
 * 2. Only reads 'prompt' and 'key' from req.body.
 * 3. Formats request exactly for Gemini API.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1. Only read prompt and key from body
    const { prompt, key } = req.body;
    
    // 2. API Key: Use request body key, fallback to process.env.GEMINI_API_KEY
    const apiKey = key || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: "Missing API Key", 
        message: "Gemini API key is required." 
      });
    }

    // 3. Convert input safely to string
    const userText = String(prompt || "");

    // 4. Construct EXACT Gemini Payload
    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: userText }
          ]
        }
      ]
    };

    // 5. Call Gemini API (gemini-1.5-flash)
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(GEMINI_ENDPOINT, geminiPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    // 6. Robust Response Parsing
    const candidates = response.data?.candidates || [];
    const firstCandidate = candidates[0];
    const parts = firstCandidate?.content?.parts || [];
    
    // Combine all text parts
    const combinedText = parts
      .map((part: any) => part.text || "")
      .join("")
      .trim();

    // 7. Return Standardized Response Format
    return res.status(200).json({
      text: combinedText || "No response generated.",
      reply: combinedText || "No response generated.",
      message: combinedText || "No response generated."
    });

  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || {};
    
    console.error("[Gemini Proxy Error]:", error.message);

    return res.status(statusCode).json({
      error: "AI Proxy Request Failed",
      message: errorData.error?.message || error.message || "An unexpected error occurred.",
      details: errorData
    });
  }
}
