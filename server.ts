import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Accept: ${req.headers.accept}`);
    next();
  });

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Proxy Endpoint
  app.post(["/api/ai/generate", "/api/ai/generate/"], async (req, res) => {
    console.log(`AI Proxy Headers:`, JSON.stringify(req.headers));
    const { provider, key, baseUrl, model, contents, systemInstruction, responseMimeType } = req.body;

    if (!key) {
      return res.status(400).json({ error: "API key is required" });
    }

    try {
      const sanitizedBody = { ...req.body, key: '***' };
      console.log(`Processing AI request:`, JSON.stringify(sanitizedBody));
      switch (provider) {
        case 'openai':
        case 'openrouter':
        case 'custom': {
          let targetModel = model;
          if (provider === 'openrouter') {
            // Map common model names to OpenRouter format if needed
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
            ""; // Custom must provide baseUrl or it will fail
          
          const defaultModel = 
            provider === 'openai' ? "gpt-4o" : 
            provider === 'openrouter' ? "google/gemini-2.0-flash-001" : 
            "gpt-3.5-turbo"; // Default for custom if not specified
          
          let userContent = contents;
          if (Array.isArray(contents)) {
            userContent = contents.map(c => {
              if (typeof c === 'string') return c;
              return c.parts?.map((p: any) => p.text).join('\n') || c.text || "";
            }).join('\n');
          } else if (typeof contents === 'object' && contents.parts) {
            userContent = contents.parts.map((p: any) => p.text).join('\n');
          }

          const response = await axios.post(
            baseUrl || defaultBaseUrl,
            {
              model: targetModel || defaultModel,
              messages: [
                ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                { role: "user", content: userContent }
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
              }
            }
          );
          console.log(`AI Provider ${provider} responded with status: ${response.status}`);
          return res.json({ text: response.data.choices[0].message.content });
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
          return res.json({ text: response.data.content[0].text });
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
          // For Gemini, we can still use the SDK on frontend or proxy it here
          // If we proxy it here, we use the REST API
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash"}:generateContent?key=${key}`;
          
          // Handle multimodal contents if needed
          let parts = [];
          if (typeof contents === 'string') {
            parts = [{ text: contents }];
          } else if (Array.isArray(contents)) {
            parts = contents.map(c => {
              if (c.text) return { text: c.text };
              if (c.inlineData) return { inlineData: c.inlineData };
              return c;
            });
          } else if (contents.parts) {
            parts = contents.parts;
          }

          const response = await axios.post(url, {
            contents: [{ parts }],
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: {
              responseMimeType: responseMimeType || "text/plain"
            }
          });

          const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
          return res.json({ text });
        }
      }
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error("AI Proxy Error:", errorData);
      res.status(error.response?.status || 500).json({ 
        error: "AI Provider Error", 
        details: typeof errorData === 'object' ? JSON.stringify(errorData) : errorData
      });
    }
  });

  // Catch-all for unmatched API routes
  app.all("/api/*", (req, res) => {
    console.warn(`Unmatched API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KOMOREBI_SERVER_STARTUP_SUCCESS: Running on http://localhost:${PORT}`);
  });
}

startServer();
