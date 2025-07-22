# Vite 도입 및 마이그레이션 계획 (Chrome Extension)

## 목적
- 최신 JS/TS, import/export, 모듈화, 번들링, 개발 편의성(Vite) 도입
- 크롬 익스텐션 구조에 맞는 안전한 마이그레이션

## 주요 주의사항
- **manifest.json**의 entry(배경, 컨텐츠, 팝업 등)와 Vite 번들 결과물 경로/파일명 반드시 일치
- **content script, background, popup, options 등** 각 엔트리별로 entry 분리 필요
- **output 파일명, 경로, 타입(esm/cjs/iife 등)** 명확히 지정
- **Vite 기본 output은 ESM, 크롬 익스텐션은 IIFE/UMD 권장** (manifest v3 기준)
- **import/export 사용 시 반드시 번들된 결과물만 manifest에서 참조**
- **vite-plugin-chrome-extension** 등 공식 플러그인 활용 권장
- **dev/build 환경 분리** (dev: HMR, build: 번들 결과물)
- **manifest.json, static asset, 이미지 등 public 디렉토리로 관리**
- **MV3 service worker는 반드시 background.js로 번들**

## 폴더/파일 구조 예시
```
lanis_helper/
  manifest.json
  vite.config.js
  public/
    ... (정적 자원)
  src/
    background/
      index.js
    content/
      index.js
    popup/
      index.js
      popup.html
      popup.css
    menu-module/
      ... (기존 코드)
```

## 진행 계획
1. **Vite 설치 및 기본 설정**
   - `npm install --save-dev vite vite-plugin-chrome-extension`
   - `vite.config.js` 생성 (entry, output, manifest 연동 등)
2. **public/ 디렉토리로 manifest.json, 이미지 등 이동**
3. **src/ 하위에 각 entry point(index.js 등) 분리**
4. **menu-manager.js 등 기존 코드 import/export 모듈화**
5. **import/export, 최신 문법 적용, window 전역 사용 제거**
6. **dev 서버(vite dev)로 개발, build(vite build)로 번들 결과물 확인**
7. **manifest.json에서 번들된 js/css만 참조하도록 경로 수정**
8. **기존 기능 100% 유지, 모든 메뉴/모달/검색/필터/토글 등 직접 테스트**
9. **문서화 및 문제 발생 시 즉시 기록/롤백**

## 체크리스트
- [ ] manifest.json entry와 번들 결과물 경로/파일명 일치
- [ ] 각 entry별로 src/ 하위에 index.js 분리
- [ ] import/export 모듈화, window 전역 사용 제거
- [ ] 번들 결과물만 manifest에서 참조
- [ ] dev/build 환경 모두 정상 동작 확인
- [ ] 기존 기능 100% 유지, 직접 테스트
- [ ] 문제 발생 시 즉시 기록 및 롤백

## 참고
- [vite-plugin-chrome-extension 공식](https://github.com/Jonghakseo/vite-chrome-extension)
- [MV3 service worker 번들링 예시](https://github.com/Jonghakseo/vite-chrome-extension/blob/main/examples/service-worker/) 