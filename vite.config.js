import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy to GitHub Pages at https://<user>.github.io/<repo>/,
// set BASE_PATH to "/<repo>/" (with leading + trailing slashes).
// Vercel/Netlify can leave it as "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
});
