import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned, because the backend's CORS allow-list (CORS_ORIGIN) defaults to exactly this origin.
    // Without `strictPort` Vite would silently move to 5174/5175 and every request would then fail
    // CORS with a message that looks nothing like "wrong port".
    port: 5173,
    strictPort: true,
  },
});
