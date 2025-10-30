import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// Compatibility for Node.js < 20 (import.meta.dirname not available)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Resolve candidate locations for built client assets.
  // Handles different bundling outcomes where __dirname may point to /app or /app/dist.
  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
  ];

  let distPath: string | undefined;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }

  console.log(`[Static Files] __dirname is: ${__dirname}`);
  console.log(`[Static Files] NODE_ENV is: ${process.env.NODE_ENV}`);
  console.log(`[Static Files] Candidate paths: ${candidates.join(' | ')}`);
  console.log(`[Static Files] Selected path: ${distPath ?? '(none found)'}`);
  
  if (!distPath || !fs.existsSync(distPath)) {
    console.error(
      `❌ Could not find the build directory in any candidate path`
    );
    console.error(`   Make sure to run 'pnpm run build' first`);
    console.error(`   Expected structure: dist/public/ with index.html and assets/`);
    
    // List what's actually in the dist directory for debugging
    const distRoot = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distRoot)) {
      console.log(`📁 Contents of ${distRoot}:`);
      try {
        const contents = fs.readdirSync(distRoot);
        contents.forEach(item => {
          const itemPath = path.join(distRoot, item);
          const isDir = fs.statSync(itemPath).isDirectory();
          console.log(`   ${isDir ? '📁' : '📄'} ${item}`);
        });
      } catch (error) {
        console.error(`   Error reading directory: ${error}`);
      }
    }
  } else {
    console.log(`✅ Found build directory: ${distPath}`);
    // List contents for debugging
    try {
      const contents = fs.readdirSync(distPath);
      console.log(`📁 Static files available: ${contents.join(', ')}`);
    } catch (error) {
      console.error(`   Error reading static files: ${error}`);
    }
  }

  app.use(express.static(distPath ?? path.resolve(process.cwd(), "dist", "public")));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve((distPath ?? path.resolve(process.cwd(), "dist", "public")), "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`❌ index.html not found at: ${indexPath}`);
      res.status(404).send(`
        <h1>Build Error</h1>
        <p>The application build is incomplete. index.html not found.</p>
        <p>Expected location: ${indexPath}</p>
        <p>Please run 'pnpm run build' and try again.</p>
      `);
    }
  });
}
