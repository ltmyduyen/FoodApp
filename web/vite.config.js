import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"), // ✅ alias tới folder shared
    },
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/firestore"],
  },
  server: {
    fs: {
      // ✅ Cho phép Vite đọc file ra ngoài /web (vd: ../shared)
      allow: [".."],
    },
    // ✅ Nếu bạn muốn chạy web ở IP nội bộ
    host: true,
    port: 5173,
  },
});
