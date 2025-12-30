import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import createHtmlPlugin from "vite-plugin-simple-html";
import { execSync } from "child_process";
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
