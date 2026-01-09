#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import http from "node:http";
import { input, confirm } from "@inquirer/prompts";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the pre-built dist folder in the npm package
const DIST_PATH = join(__dirname, "..", "dist");
const SCRIPTS_PATH = join(__dirname, "..", "scripts");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   RealTimeX CRM Production Server     ║
║                                       ║
╘═══════════════════════════════════════╝
`);

  // --- Argument and Environment Variable Parsing ---
  const args = process.argv.slice(2);
  const nonInteractiveYes = args.includes("-y");
  const nonInteractiveNo = args.includes("-n");

  const supabaseUrlFromEnv = process.env.SUPABASE_URL;
  const supabaseAnonKeyFromEnv = process.env.SUPABASE_ANON_KEY;

  // --- Port Configuration ---
  let port = 6173; // Default port
  const portIndex = args.indexOf("--port");
  if (portIndex !== -1 && args[portIndex + 1]) {
    const customPort = parseInt(args[portIndex + 1], 10);
    if (!isNaN(customPort) && customPort > 0 && customPort < 65536) {
      port = customPort;
    } else {
      console.error("❌ Invalid port number. Using default port 6173.");
    }
  }

  // Check if dist folder exists
  if (!existsSync(DIST_PATH)) {
    console.error("❌ Error: Production build not found.");
    console.error(
      "Please ensure realtimex-crm is properly installed with the dist folder.",
    );
    process.exit(1);
  }

  // --- Determine if Supabase configuration should run ---
  let configureNow;
  if (nonInteractiveNo) {
    configureNow = false;
  } else if (nonInteractiveYes || supabaseUrlFromEnv) {
    configureNow = true;
  } else {
    console.log("\n📝 Supabase Configuration\n");
    console.log(
      "You can configure Supabase now or later via Settings → Database in the app.\n",
    );
    configureNow = await confirm({
      message: "Configure Supabase now?",
      default: true,
    });
  }

  if (configureNow) {
    // --- Get Supabase Credentials ---
    let supabaseUrl = supabaseUrlFromEnv;
    let supabaseAnonKey = supabaseAnonKeyFromEnv;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log("\n📝 Supabase Configuration\n");
      console.log("First, ensure you are logged in to the Supabase CLI.");
      console.log("Run `npx supabase login` if you haven't already.\n");
    }

    if (!supabaseUrl) {
      supabaseUrl = await input({
        message: "Supabase URL:",
        validate: (value) => {
          if (!value.trim()) return "Supabase URL is required";
          if (!value.includes("supabase.co") && !value.includes("localhost"))
            return "URL should be a valid Supabase project URL";
          return true;
        },
      });
    } else {
      console.log(`Using SUPABASE_URL from environment.`);
    }

    if (!supabaseAnonKey) {
      supabaseAnonKey = await input({
        message: "Supabase Publishable API Key (anon key):",
        validate: (value) => {
          if (!value.trim()) return "Supabase Publishable API Key is required";
          return true;
        },
      });
    } else {
      console.log(`Using SUPABASE_ANON_KEY from environment.`);
    }

    // --- Save Configuration ---
    console.log("\n✅ Configuration saved!");
    console.log(
      "Note: You can update configuration anytime via Settings → Database in the app.\n",
    );
    const configPath = join(tmpdir(), "realtimex-crm-config.txt");
    const configContent = `Supabase Configuration:
URL: ${supabaseUrl}
Publishable API Key (anon key): ${supabaseAnonKey}

To configure the app:
1. Open the app in your browser
2. Go to Settings → Database
3. Enter these credentials
`;
    await writeFile(configPath, configContent);
    console.log(`Configuration details saved to: ${configPath}\n`);

    // --- Supabase CLI Commands ---
    const runSupabaseCommand = async (command, message) => {
      const packageRoot = join(__dirname, "..");
      console.log(`\n${message} (from package root: ${packageRoot})
`);
      const proc = spawn("npx", ["supabase", ...command], {
        stdio: "inherit",
        shell: true,
        cwd: packageRoot,
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0) {
            console.log(
              `✅ Supabase command 'supabase ${command.join(" ")}' completed successfully.`,
            );
            resolve();
          } else {
            console.error(
              `❌ Supabase command 'supabase ${command.join(" ")}' failed with code ${code}.`,
            );
            reject(new Error(`Supabase command failed with code ${code}`));
          }
        });
        proc.on("error", (err) => {
          console.error(
            `❌ Failed to start Supabase command 'supabase ${command.join(" ")}': ${err.message}`,
          );
          reject(err);
        });
      });
    };

    const projectRefMatch = supabaseUrl.match(
      /https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/,
    );
    if (projectRefMatch && projectRefMatch[1]) {
      const projectRef = projectRefMatch[1];
      try {
        await runSupabaseCommand(
          ["link", "--project-ref", projectRef],
          `🔗 Linking to Supabase project '${projectRef}'...`,
        );

        let runDbPush = nonInteractiveYes;
        if (!nonInteractiveYes && !nonInteractiveNo) {
          runDbPush = await confirm({
            message: "Run `npx supabase db push` to apply migrations?",
            default: true,
          });
        }

        if (runDbPush) {
          try {
            await runSupabaseCommand(
              ["db", "push"],
              "🚀 Running `npx supabase db push`...",
            );
          } catch (error) {
            console.error("Continuing without successful db push.");
          }
        }

        let runFunctionsDeploy = nonInteractiveYes;
        if (!nonInteractiveYes && !nonInteractiveNo) {
          runFunctionsDeploy = await confirm({
            message: "Run `npx supabase functions deploy` to deploy functions?",
            default: true,
          });
        }

        if (runFunctionsDeploy) {
          try {
            await runSupabaseCommand(
              ["functions", "deploy"],
              "🚀 Running `npx supabase functions deploy`...",
            );
          } catch (error) {
            console.error("Continuing without successful functions deploy.");
          }
        }
      } catch (error) {
        console.error(
          "Could not link to Supabase project. Skipping db push and functions deploy.",
        );
      }
    } else {
      console.warn(
        "Could not extract project reference from Supabase URL. Skipping link, db push, and functions deploy.",
      );
    }
  }

  // --- Start Production Server ---
  console.log("\n🚀 Starting production server...");
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://127.0.0.1:${port}\n`);

  if (!configureNow) {
    console.log(
      "💡 Configure Supabase via Settings → Database in the app after it loads.\n",
    );
  }

  console.log("Press Ctrl+C to stop the server.\n");

  const server = http.createServer(async (req, res) => {
    // Basic CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // --- API: Migrate Endpoint ---
    if (req.url === "/api/migrate" && req.method === "POST") {
      try {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }

        let body = {};
        try {
          body = JSON.parse(Buffer.concat(buffers).toString());
        } catch (e) {
          // Ignore parse error
        }

        const { projectRef, dbPassword, accessToken } = body;

        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
        });

        const log = (msg) => {
          res.write(`${msg}\n`);
        };

        log("🚀 Starting migration process...");

        // Helper to run command and stream output
        const runStreamedCommand = (cmd, args, env = process.env) => {
          return new Promise((resolve, reject) => {
            let finalCmd = cmd;
            let finalArgs = args;

            // Login TTY Trick using 'expect' (only if we need interactive login)
            // If token is provided, we don't use this.
            const isLogin =
              args.includes("login") &&
              args.some((a) => a.includes("supabase"));

            if (isLogin && !env.SUPABASE_ACCESS_TOKEN) {
              const fullCmd = `${cmd} ${args.join(" ")}`;
              const expectScript = `
                        spawn ${fullCmd}
                        expect "Press Enter"
                        send "\r"
                        set timeout -1
                        expect eof
                    `;
              finalCmd = "expect";
              finalArgs = ["-c", expectScript];
            }

            const proc = spawn(finalCmd, finalArgs, {
              cwd: join(__dirname, ".."),
              shell: true,
              env,
              stdio: ["ignore", "pipe", "pipe"],
            });

            proc.stdout.on("data", (d) => {
              const str = d.toString();
              log(str.trim());
            });

            proc.stderr.on("data", (d) => log(d.toString().trim()));

            proc.on("close", (code) => {
              if (code === 0) resolve();
              else reject(new Error(`Command failed with code ${code}`));
            });
          });
        };

        // Prepare environment
        const env = { ...process.env };
        if (accessToken) {
          env.SUPABASE_ACCESS_TOKEN = accessToken;
          log("🔑 Using provided Access Token.");
        }

        // 1. Supabase Login Check / Login
        // Skip if we have a token (we assume it works)
        if (!accessToken) {
          log("Checking Supabase authentication...");
          try {
            // Check if logged in by listing projects
            await runStreamedCommand("npx", ["supabase", "projects", "list"]);
            log("✅ Authenticated with Supabase.");
          } catch (e) {
            log("⚠️ Not authenticated. Launching login browser...");
            log(
              "👉 Please complete the login in the browser window that opens.",
            );
            try {
              await runStreamedCommand("npx", ["supabase", "login"]);
              log("✅ Login successful!");
            } catch (loginErr) {
              log("❌ Login failed. Please provide an Access Token instead.");
              res.end();
              return;
            }
          }
        }

        // 2. Run Migrate Script
        if (projectRef) {
          log(`Running migration for project: ${projectRef}`);
          // Add project-specific vars
          env.SUPABASE_PROJECT_ID = projectRef;
          if (dbPassword) env.SUPABASE_DB_PASSWORD = dbPassword;

          const migrateScript = join(SCRIPTS_PATH, "migrate.sh");

          try {
            // Ensure script is executable
            await runStreamedCommand("chmod", ["+x", migrateScript]);
            await runStreamedCommand(migrateScript, [], env);
            log("✅ Migration completed successfully!");
          } catch (err) {
            log(`❌ Migration failed: ${err.message}`);
          }
        } else {
          log("❌ Error: Project Reference ID is missing.");
        }

        res.end();
      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(`Internal Server Error: ${err.message}`);
      }
      return;
    }

    // --- Static File Serving ---
    let cleanUrl = req.url.split("?")[0];
    let filePath = join(DIST_PATH, cleanUrl === "/" ? "index.html" : cleanUrl);

    if (!existsSync(filePath)) {
      // SPA Fallback: serve index.html for non-existent paths (unless it looks like a file)
      if (!cleanUrl.includes(".")) {
        filePath = join(DIST_PATH, "index.html");
      } else {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
    }

    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    // console.log(`Server running at http://localhost:${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n\n👋 Stopping server...");
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
