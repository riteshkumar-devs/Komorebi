import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchGeminiDirectly(url: string, contents: any, systemInstruction: any, responseMimeType: string, res: any) {
  try {
    const response = await axios.post(url, {
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        responseMimeType: responseMimeType || "text/plain"
      }
    });
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Gemini returned an empty response", details: response.data });
    }
    return res.json({ text });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || error.message;
    console.error("Gemini Direct Error:", JSON.stringify(data, null, 2));
    return res.status(status).json({ error: "Gemini Direct API Error", details: data });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Proxy Endpoint
  app.post("/api/ai/generate", async (req, res) => {
    console.log(`[AI Request] Provider: ${req.body.provider}, Model: ${req.body.model}`);
    const { provider, key, baseUrl, model, contents, systemInstruction, responseMimeType } = req.body;

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return res.status(400).json({ error: `API key is required for ${provider || 'AI'}. Please enter your API key in Settings.` });
    }

    try {
      const trimmedKey = key.trim();
      switch (provider) {
        case 'openai':
        case 'openrouter':
        case 'xai': {
          let finalBaseUrl = baseUrl;
          if (!finalBaseUrl) {
            if (provider === 'openai') finalBaseUrl = "https://api.openai.com/v1/chat/completions";
            else if (provider === 'openrouter') finalBaseUrl = "https://openrouter.ai/api/v1/chat/completions";
            else if (provider === 'xai') finalBaseUrl = "https://api.x.ai/v1/chat/completions";
          } else if (!finalBaseUrl.endsWith('/chat/completions')) {
            finalBaseUrl = finalBaseUrl.replace(/\/+$/, '') + '/chat/completions';
          }

          let targetModel = model?.trim() || "";
          
          if (provider === 'openrouter') {
            if (!targetModel || targetModel === 'google/gemini-2.0-flash-exp:free' || targetModel === 'google/gemini-2.0-pro-exp-02-05:free' || targetModel === 'google/gemini-2.0-flash-001' || targetModel === 'mistralai/mistral-7b-instruct:free') {
              targetModel = 'openrouter/free';
            } else if (targetModel === 'meta-llama/llama-3.3-70b-instruct:free') {
              targetModel = 'openrouter/free';
            }
          }

          const defaultModel = provider === 'openai' ? "gpt-4o" : 
                               provider === 'xai' ? "grok-beta" :
                               provider === 'openrouter' ? "openrouter/free" :
                               "gemini-2.0-flash";
          
          let messages = [];
          if (systemInstruction) {
            messages.push({ role: "system", content: systemInstruction });
          }

          if (Array.isArray(contents)) {
            // Handle Gemini-style history conversion
            contents.forEach(c => {
              const role = c.role === 'model' ? 'assistant' : 'user';
              let content = "";
              if (typeof c === 'string') content = c;
              else if (Array.isArray(c.parts)) {
                content = c.parts.map((p: any) => p.text).join('\n');
              } else if (c.text) {
                content = c.text;
              }
              messages.push({ role, content });
            });
          } else {
            let userContent = contents;
            if (typeof contents === 'object' && contents.parts) {
              userContent = contents.parts.map((p: any) => p.text).join('\n');
            }
            messages.push({ role: "user", content: userContent });
          }

          const response = await axios.post(
            finalBaseUrl,
            {
              model: targetModel || defaultModel,
              messages: messages,
              response_format: responseMimeType === "application/json" ? { type: "json_object" } : undefined
            },
            {
              headers: {
                "Authorization": `Bearer ${trimmedKey}`,
                "Content-Type": "application/json",
                ...(provider === 'openrouter' ? {
                  "HTTP-Referer": req.headers.referer || "https://komorebi.app",
                  "X-Title": "Komorebi Japanese Language Platform"
                } : {})
              },
              timeout: 90000 // 90 second timeout
            }
          );

          if (response.data.error) {
            console.error(`AI Proxy Error inside data [${provider}]:`, JSON.stringify(response.data.error, null, 2));
            throw new Error(`AI provider ${provider} error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
          }

          if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
            console.error(`AI Proxy Invalid Response Structure [${provider}]:`, JSON.stringify(response.data, null, 2));
            throw new Error(`AI provider ${provider} returned an empty choices array or invalid structure.`);
          }

          const content = response.data.choices[0].message?.content || response.data.choices[0].text || "";
          
          if (!content && content !== "") {
            console.error(`AI Proxy Empty Content [${provider}]:`, JSON.stringify(response.data.choices[0], null, 2));
            throw new Error(`AI provider ${provider} returned a response with no content.`);
          }

          return res.json({ text: content });
        }

        case 'anthropic': {
          const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: model || "claude-3-5-sonnet-20240620",
              max_tokens: 1024,
              system: systemInstruction,
              messages: Array.isArray(contents) ? contents.map(c => ({
                role: c.role === 'model' ? 'assistant' : 'user',
                content: typeof c === 'string' ? c : (c.parts?.[0]?.text || c.text || "")
              })) : [{ role: "user", content: contents }]
            },
            {
              headers: {
                "x-api-key": trimmedKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
              }
            }
          );
          return res.json({ text: response.data.content[0].text });
        }

        case 'huggingface': {
          const response = await axios.post(
            baseUrl || `https://api-inference.huggingface.co/models/${model || "gpt2"}`,
            { inputs: contents },
            {
              headers: {
                "Authorization": `Bearer ${trimmedKey}`,
                "Content-Type": "application/json"
              }
            }
          );
          return res.json({ text: Array.isArray(response.data) ? response.data[0].generated_text : response.data.generated_text });
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
          return res.json({ text: response.data.response });
        }

        case 'gemini':
        default: {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${trimmedKey}`;
          
          let contentParts = [];
          if (typeof contents === 'string') {
            contentParts = [{ text: contents }];
          } else if (Array.isArray(contents)) {
            if (contents.length > 0 && contents[0].parts) {
              return fetchGeminiDirectly(url, contents, systemInstruction, responseMimeType, res);
            }
            contentParts = contents.map(c => {
              if (typeof c === 'string') return { text: c };
              if (c.text) return { text: c.text };
              if (c.inlineData) return { inlineData: c.inlineData };
              return c;
            });
          } else if (contents.parts) {
            contentParts = contents.parts;
          }

          const response = await axios.post(url, {
            contents: [{ role: 'user', parts: contentParts }],
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: {
              responseMimeType: responseMimeType || "text/plain"
            }
          });

          const candidate = response.data.candidates?.[0];
          const text = candidate?.content?.parts?.[0]?.text;
          
          if (!text) {
            if (candidate?.finishReason === "SAFETY") {
              return res.json({ text: "I'm sorry, I cannot generate that response due to safety restrictions. Please try a different query." });
            }
            return res.json({ text: "The AI was unable to generate a response. Please try reframing your prompt." });
          }
          
          return res.json({ text });
        }
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorStatus = error.response?.status || 500;
      const errorMessage = error.message;

      console.error(`AI Proxy Error [${provider}] (Status ${errorStatus}):`, JSON.stringify(errorData || errorMessage, null, 2));
      
      // Extract the most useful error message from the provider's response
      let providerError = "AI Provider Error";
      let isHtml = false;

      if (errorData) {
        if (typeof errorData === 'string') {
          isHtml = errorData.trim().startsWith('<!doctype') || errorData.trim().startsWith('<html');
          providerError = isHtml ? "AI Provider returned an HTML error page." : errorData;
        } else if (errorData.error) {
          if (typeof errorData.error === 'string') {
            providerError = errorData.error;
          } else if (typeof errorData.error.message === 'string') {
            providerError = errorData.error.message;
          } else if (errorData.error.metadata && errorData.error.metadata.message) {
             providerError = errorData.error.metadata.message;
          } else {
            providerError = JSON.stringify(errorData.error);
          }
        } else if (errorData.message && typeof errorData.message === 'string') {
          providerError = errorData.message;
        } else {
          providerError = JSON.stringify(errorData);
        }
      } else if (errorMessage) {
        providerError = errorMessage;
      }

      // Final fallback if parsing failed or string is empty
      if (!providerError || providerError === '{}' || providerError === '""') {
        providerError = `AI Provider Error (Status ${errorStatus})`;
      }

      // Cleanup common provider error formats
      if (typeof providerError === 'string') {
        if (providerError.includes("Check the documentation for more details")) {
          providerError = providerError.split(".")[0];
        }
        if (errorStatus === 401 || providerError.toLowerCase().includes("missing authentication header") || providerError.toLowerCase().includes("invalid api key")) {
          providerError = `Authentication failed for ${provider}. Please verify that your API key is valid.`;
        } else if (providerError.includes("unavailable for free") || providerError.includes("No endpoints found") || providerError.includes("not a valid model ID")) {
          providerError = `${providerError} (Tip: Select "Free Models Router (Auto-selects active free model)" in Settings).`;
        }
      }

      console.log(`[AI Response Error] ${provider} -> status ${errorStatus}: ${providerError.substring(0, 100)}`);

      res.status(errorStatus).json({ 
        error: providerError, 
        details: isHtml ? "HTML response received from provider" : (errorData || errorMessage),
        provider: provider
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
