import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Site estático público: o healthcheck do Railway (healthcheck.railway.app) e domínios próprios precisam passar.
  preview: { allowedHosts: true },
  test: { environment: "node" },
} as Parameters<typeof defineConfig>[0]);
