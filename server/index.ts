<<<<<<< HEAD
// server/index.ts
import http from "http";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
=======
import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
>>>>>>> 71c8e1181e7d60110b544f185db42c3e8d795026

const app = express();

// basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// trust proxy (useful when behind load balancers / reverse proxies)
app.set("trust proxy", true);

// Simple, configurable CORS for APIs (set CORS_ORIGIN in env for production)
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN ?? "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// request logging for /api routes (your original implementation)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  // capture body for logs
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 160) {
        logLine = logLine.slice(0, 159) + "…";
      }
<<<<<<< HEAD
      log(logLine);
=======

      console.log(logLine);
>>>>>>> 71c8e1181e7d60110b544f185db42c3e8d795026
    }
  });

  next();
});

(async () => {
  // register routes (your existing function)
  // NOTE: registerRoutes should set up all routes and ideally return an http.Server
  const maybeServer = await registerRoutes(app);

  // Error-handling middleware (send JSON then log - do NOT re-throw)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";

    // send safe error response to client
    res.status(status).json({ message });

    // log details for server operators
    log(`ERROR ${status} - ${message}`);
    if (err && err.stack) {
      log(err.stack);
    }
    // do not throw — allow graceful shutdown or process-level handlers to decide
  });

<<<<<<< HEAD
  // dev vs production: keep your Vite setup behavior
  if (app.get("env") === "development") {
    await setupVite(app, maybeServer as unknown as http.Server);
=======
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === 'development') {
    const { setupVite } = await import('./vite');
    await setupVite(app, server);
>>>>>>> 71c8e1181e7d60110b544f185db42c3e8d795026
  } else {
    const { serveStatic } = await import('./vite');
    serveStatic(app);
  }

<<<<<<< HEAD
  // add a lightweight healthcheck endpoint (useful for Render / load balancers)
  app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

  // Ensure we have an http.Server to listen on
  // registerRoutes might already return an http.Server; otherwise create one.
  const server: http.Server =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    maybeServer && typeof (maybeServer as any)?.listen === "function"
      ? (maybeServer as http.Server)
      : http.createServer(app);

  // Always use the PORT environment variable first (Render sets this).
  // Fallback to 5000 for local dev if PORT is not set.
  const port = Number(process.env.PORT ?? 5000);
  const host = process.env.HOST ?? "0.0.0.0";

  server.listen(
    {
      port,
      host,
      // reusePort is useful on some platforms for load balancing; Node >= 16 supports it
      // keep it, but it's optional and will be ignored where unsupported.
      reusePort: true as unknown as boolean,
    },
    () => {
      log(`serving on ${host}:${port} (env=${process.env.NODE_ENV ?? "unknown"})`);
    }
  );

  // Graceful shutdown helpers
  const shutdown = (signal: string) => {
    log(`Received ${signal}. Shutting down gracefully...`);
    // stop accepting new connections
    server.close((err) => {
      if (err) {
        log(`Error during server close: ${err.message ?? err}`);
        // force exit if close failed
        process.exit(1);
      } else {
        log("Closed remaining connections. Exiting.");
        process.exit(0);
      }
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      log("Force exiting after timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Crash handlers - log and exit (so orchestrator can restart)
  process.on("uncaughtException", (err) => {
    log("uncaughtException: " + (err?.stack ?? err));
    // give logs a moment to flush
    setTimeout(() => process.exit(1), 100).unref();
  });
  process.on("unhandledRejection", (reason) => {
    log("unhandledRejection: " + (reason as any)?.toString?.() ?? String(reason));
    setTimeout(() => process.exit(1), 100).unref();
=======
  // ALWAYS serve the app on the port specified in the environment variable PORT

  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    console.log(`serving on port ${port}`);
>>>>>>> 71c8e1181e7d60110b544f185db42c3e8d795026
  });
})();
