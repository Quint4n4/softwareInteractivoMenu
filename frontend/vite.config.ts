import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0, necesario dentro de Docker
    port: 5173,
  },
});
