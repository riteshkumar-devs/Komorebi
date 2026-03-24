import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Vercel Serverless Function: AI Proxy for Google Gemini API
 * 
 * This function ensures all requests to the Gemini API are correctly formatted
 * to avoid "INVALID_ARGUMENT" errors related to the 'contents' field.
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
    // 2. Extract Input
    const { prompt, contents, key: bodyKey } = req.body;
    
    // 3. API Key Management
    const apiKey = process.env.GEMINI_API_KEY || bodyKey;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: "Missing API Key", 
        message: "Gemini API key is required." 
      });
    }

    // 4. Normalize Input to String (Requirement: No plain objects/arrays in 'text')
    let rawInput = "";
    
    // Check 'contents' first, then 'prompt'
    const inputSource = contents !== undefined ? contents : prompt;

    if (inputSource === undefined || inputSource === null) {
      return res.status(400).json({ 
        error: "Invalid Input", 
        message: "Please provide either a 'prompt' or 'contents' in the request body." 
      });
    }

    if (typeof inputSource === 'string') {
      rawInput = inputSource;
    } else {
      // If it's an object or array, convert to string as per requirements
      rawInput = JSON.stringify(inputSource);
    }

    // 5. Construct STRICT Gemini Payload
    // Requirement: contents must be an array of objects with parts array
    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: rawInput }
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
