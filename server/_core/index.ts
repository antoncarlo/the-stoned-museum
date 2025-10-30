import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeCronJobs } from "../cron/scheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Health check endpoint for Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV 
    });
  });
  
  // Basic ping endpoint
  app.get("/ping", (_req, res) => {
    res.status(200).send("pong");
  });
  
  // OAuth callback under /api/oauth/callback
  try {
    registerOAuthRoutes(app);
  } catch (error) {
    console.error("Error registering OAuth routes:", error);
  }
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Health check available at: http://0.0.0.0:${port}/health`);
    
    // Initialize cron jobs in production AFTER server is ready
    if (process.env.NODE_ENV === "production") {
      setTimeout(() => {
        try {
          console.log("Initializing cron jobs...");
          initializeCronJobs();
          console.log("Cron jobs initialized successfully");
        } catch (error) {
          console.error("Error initializing cron jobs:", error);
        }
      }, 2000); // Wait 2 seconds after server start
    } else {
      console.log("\n⚠️  Cron jobs disabled in development mode");
      console.log("   To test cron jobs, run: pnpm tsx server/cron/mining-rewards.ts");
      console.log("   Or: pnpm tsx server/cron/staking-rewards.ts\n");
    }
  });
  
  // Handle server errors
  server.on("error", (error) => {
    console.error("Server error:", error);
  });
}

startServer().catch(console.error);
