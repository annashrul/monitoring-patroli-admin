import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * MapLibre GL v6 memecah worker menjadi 2 file ESM:
 *   maplibre-gl-worker.mjs  → import "./maplibre-gl-shared.mjs"
 *   maplibre-gl-shared.mjs
 * Saat worker diimpor dengan `?url`, Vite hanya meng-emit file worker-nya
 * (import relatif tidak diproses). Di dev server, import relatif resolve dari
 * node_modules sehingga aman — tetapi di hosting statis (Vercel, dll.) browser
 * meminta /assets/maplibre-gl-shared.mjs → 404 → worker gagal → peta blank.
 * Plugin ini menyalin file shared ke dist/assets agar import relatif worker
 * tetap bisa di-resolve di production.
 */
function copyMaplibreSharedWorkerAsset() {
  const workerSrc = 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs';
  const sharedSrc = 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs';
  let needsShared = false;
  try {
    needsShared = readFileSync(workerSrc, 'utf8').includes('./maplibre-gl-shared.mjs');
  } catch {
    needsShared = false;
  }
  return {
    name: 'copy-maplibre-shared-worker-asset',
    apply: 'build',
    generateBundle() {
      if (!needsShared) return;
      try {
        // Nama file TANPA hash: import worker adalah literal "./maplibre-gl-shared.mjs".
        this.emitFile({
          type: 'asset',
          fileName: 'assets/maplibre-gl-shared.mjs',
          source: readFileSync(sharedSrc),
        });
      } catch {
        // maplibre-gl tidak terpasang — biarkan build tetap jalan.
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyMaplibreSharedWorkerAsset()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['leaflet-draw'],
  },
});
