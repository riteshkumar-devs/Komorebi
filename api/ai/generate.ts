import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Vercel Serverless Function: AI Proxy for Google Gemini API
 * 
 * This function acts as a secure bridge between the frontend and the Gemini API.
 * It handles request normalization, robust response parsing, and error management.
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
    // 2. Extract and Normalize Input
    // We accept both 'prompt' (simple) and 'contents' (Gemini-native) formats.
    const { prompt, contents, key: bodyKey } = req.body;
    
    // 3. API Key Management
    // Priority: Environment Variable > Request Body
    const apiKey = process.env.GEMINI_API_KEY || bodyKey;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: "Missing API Key", 
        message: "Gemini API key is required via environment variable or request body." 
      });
    }

    // 4. Construct Gemini Payload
    // We strictly use the gemini-1.5-flash model as requested.
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    let geminiPayload;
    
    if (contents) {
      // If native contents format is provided, use it directly
      geminiPayload = { contents };
    } else if (prompt) {
      // If simple prompt is provided, wrap it in Gemini's structure
      geminiPayload = {
        contents: [{
          parts: [{ text: String(prompt) }]
        }]
      };
    } else {
      return res.status(400).json({ 
        error: "Invalid Input", 
        message: "Please provide either a 'prompt' or 'contents' in the request body." 
      });
    }

    // 5. Call Gemini API
    const response = await axios.post(GEMINI_ENDPOINT, geminiPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30-second timeout for stability
    });

    // 6. Robust Response Parsing
    // Gemini responses can have multiple candidates and multiple parts.
    // We need to safely extract and combine all text parts.
    const candidates = response.data?.candidates || [];
    
    if (candidates.length === 0) {
      throw new Error("Gemini API returned no candidates.");
    }

    const firstCandidate = candidates[0];
    
    // Handle safety blocks
    if (firstCandidate.finishReason === 'SAFETY') {
      return res.status(200).json({
        text: "Response blocked by safety filters.",
        reply: "Response blocked by safety filters.",
        message: "Response blocked by safety filters."
      });
    }

    const parts = firstCandidate.content?.parts || [];
    
    // Combine all text parts into a single string
    let combinedText = parts
      .map((part: any) => part.text || "")
      .join("")
      .trim();

    // 7. Fallback for Empty Responses
    if (!combinedText) {
      // Sometimes Gemini returns a finishReason but no text parts
      const reason = firstCandidate.finishReason || "UNKNOWN";
      combinedText = `The AI could not generate a response. (Reason: ${reason})`;
    }

    // 8. Return Standardized Response Format (CRITICAL)
    // We provide the same text in three fields to ensure frontend compatibility.
    return res.status(200).json({
      text: combinedText,
      reply: combinedText,
      message: combinedText
    });

  } catch (error: any) {
    // 9. Comprehensive Error Handling
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
