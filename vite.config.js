import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["assets/antelope.svg", "assets/Cipher-logo.png"],
      manifest: {
        name: "CIPHER - IT Students' Executive Council",
        short_name: "CIPHER",
        description: "Official IT Students' Executive Council of MIT Academy of Engineering.",
        theme_color: "#08111E",
        background_color: "#08111E",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "assets/Cipher-logo.png",
            sizes: "any",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  build: {
    outDir: "bin",
    emptyOutDir: true
  }
});
