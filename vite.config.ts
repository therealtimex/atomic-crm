import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import createHtmlPlugin from "vite-plugin-simple-html";
import { execSync, spawn } from "child_process";
import packageJson from "./package.json";

// Get latest migration timestamp at build time
function getLatestMigrationTimestamp() {
  try {
    const timestamp = execSync("node ./scripts/get-latest-migration-timestamp.mjs", {
      encoding: "utf8",
    }).trim();
    return timestamp;
  } catch {
    console.warn("Warning: Could not determine latest migration timestamp");
    return "unknown";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const latestMigrationTimestamp = getLatestMigrationTimestamp();

  const define = {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
    "import.meta.env.VITE_LATEST_MIGRATION_TIMESTAMP": JSON.stringify(latestMigrationTimestamp),
  };

  if (mode === "production") {
    Object.assign(define, {
      "import.meta.env.VITE_IS_DEMO": JSON.stringify(env.VITE_IS_DEMO),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY,
      ),
      "import.meta.env.VITE_INBOUND_EMAIL": JSON.stringify(
        env.VITE_INBOUND_EMAIL,
      ),
    });
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        open: process.env.NODE_ENV !== "CI",
        filename: "./dist/stats.html",
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            mainScript: `src/main.tsx`,
          },
        },
      }),
      {
        name: 'api-migrate',
        configureServer(server) {
          server.middlewares.use('/api/migrate', async (req, res, next) => {
            if (req.method !== 'POST') return next();

            try {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              
              let body = {};
              try {
                body = JSON.parse(Buffer.concat(buffers).toString());
              } catch (e) {
                // ignore
              }

              const { projectRef, dbPassword, accessToken } = body;

              res.writeHead(200, {
                "Content-Type": "text/plain",
                "Transfer-Encoding": "chunked",
                "X-Content-Type-Options": "nosniff"
              });

              const log = (msg) => res.write(`${msg}\n`);
              log("🚀 Starting migration (Dev Mode)...");

              const runStreamedCommand = (cmd, args, env = process.env) => {
                return new Promise((resolve, reject) => {
                  let finalCmd = cmd;
                  let finalArgs = args;
                  
                  // Login TTY Trick for macOS/Linux using 'expect'
                  const isLogin = args.includes('login') && args.some(a => a.includes('supabase'));
                  
                  if (isLogin && !env.SUPABASE_ACCESS_TOKEN) {
                      const fullCmd = `${cmd} ${args.join(' ')}`;
                      const expectScript = `
                        spawn ${fullCmd}
                        expect "Press Enter"
                        send "\r"
                        set timeout -1
                        expect eof
                      `;
                      finalCmd = 'expect';
                      finalArgs = ['-c', expectScript];
                  }

                  const proc = spawn(finalCmd, finalArgs, {
                    cwd: process.cwd(),
                    shell: true,
                    env,
                    // Use pipe to capture output
                    stdio: ['ignore', 'pipe', 'pipe']
                  });

                  proc.stdout.on('data', (d) => {
                    const str = d.toString();
                    log(str.trim());
                  });
                  
                  proc.stderr.on('data', (d) => log(d.toString().trim()));

                  proc.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Command failed with code ${code}`));
                  });
                });
              };

              // Prepare ENV
              const env = { ...process.env };
              if (accessToken) {
                  env.SUPABASE_ACCESS_TOKEN = accessToken;
                  log("🔑 Using provided Access Token.");
              }

              // 1. Check Login
              // Skip if token provided
              if (!accessToken) {
                  log("Checking Supabase authentication...");
                  try {
                    await runStreamedCommand("npx", ["supabase", "projects", "list"]);
                    log("✅ Authenticated.");
                  } catch (e) {
                    log("⚠️ Not authenticated. Launching login browser...");
                    try {
                      await runStreamedCommand("npx", ["supabase", "login"]);
                      log("✅ Login successful!");
                    } catch (err) {
                      log("❌ Login failed.");
                      res.end();
                      return;
                    }
                  }
              }

              // 2. Run Migrate
              if (projectRef) {
                log(`Running migration for ${projectRef}...`);
                
                env.SUPABASE_PROJECT_ID = projectRef;
                if (dbPassword) env.SUPABASE_DB_PASSWORD = dbPassword;
                
                const migrateScript = "./scripts/migrate.sh";
                try {
                  await runStreamedCommand("chmod", ["+x", migrateScript]);
                  await runStreamedCommand(migrateScript, [], env);
                  log("✅ Migration completed!");
                } catch (err) {
                  log(`❌ Migration failed: ${err.message}`);
                }
              } else {
                log("❌ No project ref provided.");
              }

              res.end();
            } catch (e) {
              console.error(e);
              res.statusCode = 500;
              res.end(e.message);
            }
          });
        }
      }
    ],
    define,
    base: "./",
    esbuild: {
      keepNames: true,
    },
    build: {
      sourcemap: true,
    },
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
