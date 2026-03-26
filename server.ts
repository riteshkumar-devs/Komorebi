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

  // API routes go here
  app.get("/api/health", (req, res) => {
    console.log("Health check request received");
    res.json({ status: "ok" });
  });

  // AI Proxy Endpoint
  app.post("/api/ai/generate", async (req, res) => {
    console.log("Incoming AI request:", {
      provider: req.body.provider,
      model: req.body.model,
      hasKey: !!req.body.key,
      contentsType: typeof req.body.contents
    });
    const { provider, key, baseUrl, model, contents, systemInstruction, responseMimeType } = req.body;

    if (!key) {
      return res.status(400).json({ error: "API key is required" });
    }

    try {
      switch (provider) {
        case 'openai':
        case 'openrouter': {
          const defaultBaseUrl = provider === 'openai' ? "https://api.openai.com/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
          const defaultModel = provider === 'openai' ? "gpt-4o" : "google/gemini-2.0-flash-001";
          
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
              model: model || defaultModel,
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
                  "X-Title": "Japanese Learning App"
                } : {})
              }
            }
          );
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
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-3-flash-preview"}:generateContent?key=${key}`;
          
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
      console.error("AI Proxy Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "AI Provider Error", 
        details: error.response?.data || error.message 
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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
