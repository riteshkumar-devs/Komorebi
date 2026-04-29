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
  const response = await axios.post(url, {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      responseMimeType: responseMimeType || "text/plain"
    }
  });
  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  return res.json({ text });
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
    const { provider, key, baseUrl, model, contents, systemInstruction, responseMimeType } = req.body;

    if (!key) {
      return res.status(400).json({ error: "API key is required" });
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

          const defaultModel = provider === 'openai' ? "gpt-4o" : 
                               provider === 'xai' ? "grok-beta" :
                               "google/gemini-2.0-flash-001";
          
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
              model: model || defaultModel,
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

      console.error(`AI Proxy Error [${provider}]:`, JSON.stringify(errorData || errorMessage, null, 2));
      
      // Extract the most useful error message from the provider's response
      let providerError = "AI Provider Error";
      if (errorData) {
        // Handle common error structures
        if (typeof errorData === 'string') {
          providerError = errorData;
        } else if (typeof errorData.error === 'string') {
          providerError = errorData.error;
        } else if (errorData.error && typeof errorData.error.message === 'string') {
          providerError = errorData.error.message;
        } else if (errorData.message && typeof errorData.message === 'string') {
          providerError = errorData.message;
        } else if (errorData.error && typeof errorData.error === 'object') {
          // Deep nested error messages (OpenRouter sometimes has this)
          providerError = errorData.error.message || JSON.stringify(errorData.error);
        } else {
          providerError = JSON.stringify(errorData);
        }
      } else if (errorMessage) {
        providerError = errorMessage;
      }

      // Cleanup some common ugly strings
      if (providerError.includes("Check the documentation for more details")) {
        providerError = providerError.split(".")[0];
      }

      res.status(errorStatus).json({ 
        error: providerError, 
        details: errorData || errorMessage,
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
