import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

// 프로덕션용 설정
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      input: {
        background: 'src/background/index.js',
        content: 'src/content/index.js',
        popup: 'src/popup/index.js'
      },
      output: {
        // Chrome 확장 프로그램용 설정
        format: 'es', // ES 모듈 유지
        globals: {
          chrome: 'chrome'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 개발 중에는 console 유지
        drop_debugger: true
      }
    },
    // 소스맵 설정
    sourcemap: false, // 프로덕션에서는 소스맵 비활성화
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000
  }
}) 