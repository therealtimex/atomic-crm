import express from "express";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

const app = express();
// Use PORT environment variable (same as frontend) or fall back to 3002 to avoid conflict with RealTimeX desktop app (3001)
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory (production build)
const distPath = join(__dirname, "..", "dist");
app.use(express.static(distPath));

/**
 * POST /api/migrate
 *
 * Executes database migrations using the Supabase CLI
 *
 * Body:
 * - projectRef: Supabase project ID
 * - dbPassword: Database password (optional, used if access token not provided)
 * - accessToken: Supabase access token (recommended)
 *
 * Returns: Server-Sent Events stream with migration logs
 */
app.post("/api/migrate", async (req, res) => {
  const { projectRef, dbPassword, accessToken } = req.body;

  // Validation
  if (!projectRef) {
    return res.status(400).json({ error: "projectRef is required" });
  }

  if (!accessToken && !dbPassword) {
    return res.status(400).json({
      error: "Either accessToken or dbPassword must be provided",
    });
  }

  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (message) => {
    res.write(message + "\n");
  };

  try {
    sendLog("🔧 Starting database migration process...");
    sendLog("");

    // Path to migration script
    const scriptPath = join(__dirname, "..", "scripts", "migrate.sh");

    // Prepare environment variables
    const env = {
      ...process.env,
      SUPABASE_PROJECT_ID: projectRef,
    };

    // Add access token or password
    if (accessToken) {
      env.SUPABASE_ACCESS_TOKEN = accessToken;
      sendLog("✓ Using Supabase access token for authentication");
    } else {
      env.SUPABASE_DB_PASSWORD = dbPassword;
      sendLog("✓ Using database password for authentication");
    }

    sendLog("");
    sendLog("📦 Executing migration script...");
    sendLog("─".repeat(60));
    sendLog("");

    // Execute migration script
    const child = spawn("bash", [scriptPath], {
      env,
      cwd: join(__dirname, ".."),
    });

    let hasError = false;

    // Stream stdout
    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          sendLog(line);
        }
      });
    });

    // Stream stderr
    child.stderr.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          // Check for common error patterns
          if (
            line.includes("error") ||
            line.includes("Error") ||
            line.includes("ERROR")
          ) {
            sendLog(`❌ ${line}`);
            hasError = true;
          } else {
            sendLog(`⚠️  ${line}`);
          }
        }
      });
    });

    // Handle process completion
    child.on("close", (code) => {
      sendLog("");
      sendLog("─".repeat(60));

      if (code === 0 && !hasError) {
        sendLog("");
        sendLog("✅ Migration completed successfully!");
        sendLog("");
        sendLog("🎉 Your database is now ready to use.");
        sendLog("📝 The application will reload automatically...");
      } else {
        sendLog("");
        sendLog(`❌ Migration failed with exit code: ${code}`);
        sendLog("");
        sendLog("💡 Troubleshooting tips:");
        sendLog("   1. Verify your Supabase credentials are correct");
        sendLog("   2. Ensure your project has the required permissions");
        sendLog(
          "   3. Check if Supabase CLI is installed (npm install -g supabase)",
        );
        sendLog("   4. Review the error messages above for specific issues");
        sendLog("");
        sendLog(
          "📚 For more help, visit: https://github.com/therealtimex/realtimex-crm/issues",
        );
      }

      res.end();
    });

    // Handle process errors
    child.on("error", (error) => {
      sendLog("");
      sendLog(`❌ Failed to start migration process: ${error.message}`);
      sendLog("");
      sendLog("💡 This usually means:");
      sendLog("   - Bash is not available on your system");
      sendLog("   - The migration script is not executable");
      sendLog("   - There are permission issues");
      sendLog("");
      sendLog(
        "Please try running the migration manually using the CLI instructions.",
      );
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      if (!child.killed) {
        child.kill();
        console.log("Migration process terminated - client disconnected");
      }
    });
  } catch (error) {
    sendLog("");
    sendLog(`❌ Unexpected error: ${error.message}`);
    sendLog("");
    sendLog("Please try again or use the manual migration instructions.");
    res.end();
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "realtimex-crm-server",
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  });
});

// SPA fallback - serve index.html for all non-API routes (client-side routing)
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(join(distPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 RealTimeX CRM v${packageJson.version} server running on http://localhost:${PORT}`,
  );
  console.log(`📦 Package: ${packageJson.name}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`📡 Migration API: POST http://localhost:${PORT}/api/migrate`);
  console.log(`🏥 Health check: GET http://localhost:${PORT}/api/health`);
});
