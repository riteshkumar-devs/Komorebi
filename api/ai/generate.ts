import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Vercel Serverless Function: AI Proxy for Google Gemini API
 * 
 * This function strictly enforces the Gemini API request format.
 * It ignores the 'contents' field from the frontend and only uses 'prompt'.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Security: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: "Method Not Allowed", 
      message: "Please use POST to access this endpoint." 
    });
  }

  try {
    // 2. Extract Input (Strictly use prompt, ignore contents)
    const { prompt, key: bodyKey } = req.body;
    
    // 3. API Key Management
    const apiKey = process.env.GEMINI_API_KEY || bodyKey;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: "Missing API Key", 
        message: "Gemini API key is required." 
      });
    }

    // 4. Normalize Input to String
    let userText = "";
    if (prompt === undefined || prompt === null) {
      return res.status(400).json({ 
        error: "Invalid Input", 
        message: "Please provide a 'prompt' in the request body." 
      });
    }

    if (typeof prompt === 'string') {
      userText = prompt;
    } else {
      // Safely convert any object/array to string
      userText = JSON.stringify(prompt);
    }

    // 5. Construct EXACT Gemini Payload
    // Requirement: contents must be an array of objects with parts array
    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: userText }
          ]
        }
      ]
    };

    // 6. Call Gemini API (Strictly gemini-1.5-flash)
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(GEMINI_ENDPOINT, geminiPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    // 7. Robust Response Parsing
    const candidates = response.data?.candidates || [];
    if (candidates.length === 0) {
      throw new Error("Gemini API returned no candidates.");
    }

    const firstCandidate = candidates[0];
    
    // Handle safety blocks
    if (firstCandidate.finishReason === 'SAFETY') {
      const safetyMsg = "Response blocked by safety filters.";
      return res.status(200).json({
        text: safetyMsg,
        reply: safetyMsg,
        message: safetyMsg
      });
    }

    const parts = firstCandidate.content?.parts || [];
    
    // Combine all text parts
    let combinedText = parts
      .map((part: any) => part.text || "")
      .join("")
      .trim();

    // Fallback for empty responses
    if (!combinedText) {
      const reason = firstCandidate.finishReason || "UNKNOWN";
      combinedText = `The AI could not generate a response. (Reason: ${reason})`;
    }

    // 8. Return Standardized Response Format
    return res.status(200).json({
      text: combinedText,
      reply: combinedText,
      message: combinedText
    });

  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || {};
    
    console.error("[Gemini Proxy Error]:", {
      status: statusCode,
      message: error.message,
      data: errorData
    });

    return res.status(statusCode).json({
      error: "AI Proxy Request Failed",
      message: errorData.error?.message || error.message || "An unexpected error occurred.",
      details: errorData
    });
  }
}
