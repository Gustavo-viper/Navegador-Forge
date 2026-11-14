import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { allowedHosts: [".up.railway.app"] },
  test: { environment: "node" },
} as Parameters<typeof defineConfig>[0]);
