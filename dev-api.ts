import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '50mb' }));

// Simple middleware to map /api/* to /api/*.ts
app.all('/api/*', async (req, res) => {
  const apiPath = req.path.replace(/^\/api\//, '');
  const filePath = path.join(__dirname, 'api', apiPath);
  
  try {
    // Try to import the handler from the file
    // We try .ts first, then /index.ts
    let handler;
    try {
      const module = await import(`./api/${apiPath}.ts`);
      handler = module.default;
    } catch (e) {
      const module = await import(`./api/${apiPath}/index.ts`);
      handler = module.default;
    }

    if (typeof handler === 'function') {
      // Mock VercelRequest and VercelResponse
      // Vercel's req/res are very similar to Express's
      await handler(req, res);
    } else {
      res.status(404).json({ error: `API route not found: ${req.path}` });
    }
  } catch (error: any) {
    console.error(`Error handling API route ${req.path}:`, error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
});
