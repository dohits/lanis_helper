import { defineConfig } from 'vite'

export default defineConfig({
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
    // 개발용 설정
    minify: false, // 개발 중에는 압축하지 않음
    sourcemap: true, // 개발용 소스맵 활성화
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000
  }
}) 