import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hacktoberfest-swag.com",
  output: "static",
  build: { format: "file" },
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 500,
        ignored: [
          "**/.astro/**",
          "**/.git/**",
          "**/.idea/**",
          "**/.venv/**",
          "**/__pycache__/**",
          "**/dist/**",
          "**/node_modules/**",
          "**/test-results/**",
          "**/venv/**",
        ],
      },
    },
  },
});
