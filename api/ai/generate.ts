import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed. Please use POST to access the AI Proxy." });
  }

  try {
    const { provider, key, baseUrl, model, contents, systemInstruction, responseMimeType } = req.body;

    if (!key) {
      return res.status(400).json({ error: "API key is required" });
    }

    const sanitizedBody = { ...req.body, key: '***' };
    console.log(`[AI Proxy] Processing request:`, JSON.stringify(sanitizedBody));

    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'custom': {
        let targetModel = model;
        if (provider === 'openrouter') {
          if (!model || model.includes('gemini')) {
            if (model === 'gemini-3-flash-preview') {
              targetModel = 'google/gemini-2.0-flash-001';
            } else if (model === 'gemini-3.1-pro-preview') {
              targetModel = 'google/gemini-pro-1.5';
            } else {
              targetModel = 'google/gemini-2.0-flash-001';
            }
          }
        }

        const defaultBaseUrl = 
          provider === 'openai' ? "https://api.openai.com/v1/chat/completions" : 
          provider === 'openrouter' ? "https://openrouter.ai/api/v1/chat/completions" : 
          "";
        
        const defaultModel = 
          provider === 'openai' ? "gpt-4o" : 
          provider === 'openrouter' ? "google/gemini-2.0-flash-001" : 
          "gpt-3.5-turbo";
        
        let userContent = contents;
        if (Array.isArray(contents)) {
          userContent = contents.map(c => {
            if (typeof c === 'string') return c;
            return c.parts?.map((p: any) => p.text).join('\n') || c.text || "";
          }).join('\n');
        } else if (contents && typeof contents === 'object' && contents.parts) {
          userContent = contents.parts.map((p: any) => p.text).join('\n');
        }

        const response = await axios.post(
          baseUrl || defaultBaseUrl,
          {
            model: targetModel || defaultModel,
            messages: [
              ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
              { role: "user", content: userContent || "" }
            ],
            response_format: responseMimeType === "application/json" ? { type: "json_object" } : undefined
          },
          {
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
              ...(provider === 'openrouter' ? {
                "HTTP-Referer": "https://ais-dev-crgco6vlf2kgfzw2voqzza-570758212111.asia-southeast1.run.app",
                "X-Title": "Komorebi Japanese Learning"
              } : {})
            },
            timeout: 30000
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          return res.status(200).json({ text: response.data.choices[0].message.content });
        } else {
          throw new Error(`Unexpected response format from ${provider}: ${JSON.stringify(response.data)}`);
        }
      }

      case 'anthropic': {
        const response = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: model || "claude-3-5-sonnet-20240620",
            max_tokens: 1024,
            system: systemInstruction,
            messages: [{ role: "user", content: contents }]
          },
          {
            headers: {
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json"
            }
          }
        );
        return res.status(200).json({ text: response.data.content[0].text });
      }

      case 'huggingface': {
        const response = await axios.post(
          baseUrl || `https://api-inference.huggingface.co/models/${model || "gpt2"}`,
          { inputs: contents },
          {
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            }
          }
        );
        return res.status(200).json({ text: Array.isArray(response.data) ? response.data[0].generated_text : response.data.generated_text });
      }

      case 'ollama': {
        const response = await axios.post(
          `${baseUrl || "http://localhost:11434"}/api/generate`,
          {
            model: model || "llama3",
            prompt: contents,
            system: systemInstruction,
            stream: false
          }
        );
        return res.status(200).json({ text: response.data.response });
      }

      case 'gemini':
      default: {
        let geminiModel = model || "gemini-1.5-flash";
        if (geminiModel === 'gemini-3-flash-preview') geminiModel = 'gemini-2.0-flash';
        if (geminiModel === 'gemini-3.1-pro-preview') geminiModel = 'gemini-1.5-pro';

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`;
        
        let parts = [];
        if (typeof contents === 'string') {
          parts = [{ text: contents }];
        } else if (Array.isArray(contents)) {
          parts = contents.map(c => {
            if (c.text) return { text: c.text };
            if (c.inlineData) return { inlineData: c.inlineData };
            return c;
          });
        } else if (contents && contents.parts) {
          parts = contents.parts;
        } else {
          parts = [{ text: String(contents || "") }];
        }

        const response = await axios.post(url, {
          contents: [{ parts }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            responseMimeType: responseMimeType || "text/plain"
          }
        }, { timeout: 30000 });

        const candidate = response.data.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
          return res.status(200).json({ text: "Response blocked by safety filters." });
        }
        
        const text = candidate?.content?.parts?.[0]?.text;
        if (text !== undefined) {
          return res.status(200).json({ text });
        } else {
          throw new Error(`Gemini API returned no text. Finish reason: ${candidate?.finishReason}. Full response: ${JSON.stringify(response.data)}`);
        }
      }
    }
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("[AI Proxy Error]:", errorData);
    
    return res.status(error.response?.status || 500).json({ 
      error: "AI Proxy Request Failed", 
      message: typeof errorData === 'string' ? errorData : (errorData.error?.message || errorData.message || JSON.stringify(errorData)),
      details: errorData
    });
  }
}
