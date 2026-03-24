import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.all("/api/*", async (req, res, next) => {
    const apiPath = req.path.replace(/^\/api\//, "");
    
    // Try to find the file in /api
    const possiblePaths = [
      path.join(__dirname, "api", `${apiPath}.ts`),
      path.join(__dirname, "api", apiPath, "index.ts"),
      path.join(__dirname, "api", `${apiPath}.js`),
      path.join(__dirname, "api", apiPath, "index.js"),
    ];

    let filePath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (filePath) {
      try {
        // Use dynamic import for the handler
        // Note: For .ts files, tsx handles this automatically
        const module = await import(filePath);
        const handler = module.default;

        if (typeof handler === "function") {
          // Mock VercelRequest and VercelResponse
          await handler(req, res);
        } else {
          res.status(404).json({ error: `API route handler not found in ${filePath}` });
        }
      } catch (error: any) {
        console.error(`Error handling API route ${req.path}:`, error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
      }
    } else {
      // If not an API route, let Vite handle it
      next();
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
