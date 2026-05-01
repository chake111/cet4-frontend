import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    visualizer({
      open: false,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240, // 仅压缩大于 10KB 的文件
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    assetsInlineLimit: 4096, // 小于 4KB 的资源内联为 base64
    chunkSizeWarningLimit: 500, // chunk 大小警告阈值
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // 从路径中提取包名（支持 @scope/pkg 格式）
          const match = id.match(/node_modules[\/\\](?:@[^\/\\]+[\/\\])?[^\/\\]+/)
          if (!match) return
          const pkgName = match[0].split(/node_modules[\/\\]/)[1]
          if (['vue', 'vue-router', 'pinia'].includes(pkgName)) {
            return 'vue-vendor'
          }
          if (pkgName === 'element-plus' || pkgName === '@element-plus/icons-vue') {
            return 'element-plus'
          }
        },
      },
    },
  },
})
