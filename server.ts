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
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "50mb" }));

  // ---------------- HEALTH ----------------
  app.get("/api/health", (req, res) => {
    console.log("Health check request received");
    res.json({ status: "ok" });
  });

  // ---------------- MODEL VALIDATION ----------------
  const allowedModels = {
    gemini: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ],
    openai: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4.1",
      "gpt-4.1-mini"
    ],
    openrouter: [
      "google/gemini-2.0-flash-001",
      "google/gemini-2.0-flash-lite-001",
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "meta-llama/llama-3.1-8b-instruct:free",
      "deepseek/deepseek-chat"
    ],
    anthropic: [
      "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229"
    ],
    huggingface: [],
    ollama: []
  };

  function isModelAllowed(provider, model) {
    if (!model) return true;
    if (!allowedModels[provider]) return true;
    if (allowedModels[provider].length === 0) return true;
    return allowedModels[provider].includes(model);
  }

  function normalizeTextContent(contents) {
    if (typeof contents === "string") return contents;

    if (Array.isArray(contents)) {
      return contents
        .map((c) => {
          if (typeof c === "string") return c;
          if (c?.parts) {
            return c.parts.map((p) => p.text || "").join("\n");
          }
          if (c?.text) return c.text;
          return "";
        })
        .join("\n");
    }

    if (typeof contents === "object" && contents?.parts) {
      return contents.parts.map((p) => p.text || "").join("\n");
    }

    return String(contents || "");
  }

  function normalizeGeminiParts(contents) {
    let parts = [];

    if (typeof contents === "string") {
      parts = [{ text: contents }];
    } else if (Array.isArray(contents)) {
      parts = contents.flatMap((c) => {
        if (typeof c === "string") return [{ text: c }];
        if (c?.parts) return c.parts;
        if (c?.text) return [{ text: c.text }];
        if (c?.inlineData) return [{ inlineData: c.inlineData }];
        return [];
      });
    } else if (contents?.parts) {
      parts = contents.parts;
    }

    return parts;
  }

  // ---------------- AI PROXY ----------------
  app.post("/api/ai/generate", async (req, res) => {
    console.log("Incoming AI request:", {
      provider: req.body.provider,
      model: req.body.model,
      hasKey: !!req.body.key,
      contentsType: typeof req.body.contents
    });

    const {
      provider = "gemini",
      key,
      baseUrl,
      model,
      contents,
      systemInstruction,
      responseMimeType
    } = req.body;

    if (!key) {
      return res.status(400).json({ error: "API key is required" });
    }

    if (!isModelAllowed(provider, model)) {
      return res.status(400).json({
        error: `Model "${model}" is not allowed for provider "${provider}"`
      });
    }

    try {
      switch (provider) {
        // ---------------- OPENAI / OPENROUTER ----------------
        case "openai":
        case "openrouter": {
          const finalUrl =
            provider === "openai"
              ? "https://api.openai.com/v1/chat/completions"
              : baseUrl || "https://openrouter.ai/api/v1/chat/completions";

          const defaultModel =
            provider === "openai"
              ? "gpt-4o-mini"
              : "google/gemini-2.0-flash-001";

          const finalModel = model || defaultModel;
          const userContent = normalizeTextContent(contents);

          const payload = {
            model: finalModel,
            messages: [
              ...(systemInstruction
                ? [{ role: "system", content: systemInstruction }]
                : []),
              { role: "user", content: userContent }
            ]
          };

          if (responseMimeType === "application/json") {
            payload.response_format = { type: "json_object" };
          }

          const response = await axios.post(finalUrl, payload, {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              ...(provider === "openrouter"
                ? {
                    "HTTP-Referer": "https://your-app-url.com",
                    "X-Title": "Komorebi AI"
                  }
                : {})
            }
          });

          const text =
            response.data?.choices?.[0]?.message?.content || "";

          return res.json({ text });
        }

        // ---------------- ANTHROPIC ----------------
        case "anthropic": {
          const finalModel = model || "claude-3-5-sonnet-20240620";
          const userContent = normalizeTextContent(contents);

          const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: finalModel,
              max_tokens: 1024,
              system: systemInstruction,
              messages: [{ role: "user", content: userContent }]
            },
            {
              headers: {
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
              }
            }
          );

          const text = response.data?.content?.[0]?.text || "";
          return res.json({ text });
        }

        // ---------------- HUGGINGFACE ----------------
        case "huggingface": {
          const finalModel = model || "gpt2";
          const userContent = normalizeTextContent(contents);

          const response = await axios.post(
            baseUrl || `https://api-inference.huggingface.co/models/${finalModel}`,
            { inputs: userContent },
            {
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json"
              }
            }
          );

          const text = Array.isArray(response.data)
            ? response.data?.[0]?.generated_text || ""
            : response.data?.generated_text || "";

          return res.json({ text });
        }

        // ---------------- OLLAMA ----------------
        case "ollama": {
          const finalModel = model || "llama3";
          const userContent = normalizeTextContent(contents);

          const response = await axios.post(
            `${baseUrl || "http://localhost:11434"}/api/generate`,
            {
              model: finalModel,
              prompt: userContent,
              system: systemInstruction,
              stream: false
            }
          );

          return res.json({ text: response.data?.response || "" });
        }

        // ---------------- GEMINI ----------------
        case "gemini":
        default: {
          const finalModel = model || "gemini-2.0-flash";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${key}`;

          const parts = normalizeGeminiParts(contents);

          const response = await axios.post(url, {
            contents: [{ parts }],
            ...(systemInstruction
              ? {
                  systemInstruction: {
                    parts: [{ text: systemInstruction }]
                  }
                }
              : {}),
            generationConfig: {
              responseMimeType: responseMimeType || "text/plain"
            }
          });

          const text =
            response.data?.candidates?.[0]?.content?.parts
              ?.map((p) => p.text || "")
              .join("") || "";

          return res.json({ text });
        }
      }
    } catch (error) {
      console.error("AI Proxy Error:", error.response?.data || error.message);

      return res.status(error.response?.status || 500).json({
        error: "AI Provider Error",
        details: error.response?.data || error.message
      });
    }
  });

  // ---------------- VITE ----------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});