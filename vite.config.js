import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Default config for Netlify deploy (root = project root, publish = dist)
export default defineConfig({
  plugins: [react()],
});
