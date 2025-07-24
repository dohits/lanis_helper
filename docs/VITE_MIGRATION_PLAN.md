# VITE_MIGRATION_PLAN.md

## 2025-07 최신 반영 (v1.6.0)

- 아이템 시세 그래프 모달 UI/UX 대폭 개선 (모달 80% 확장, 차트 영역 최대화, flex 레이아웃)
- Chart.js maintainAspectRatio: false, min-height 등으로 차트가 항상 꽉 차게 표시
- 가격 90,000 이하 데이터는 시세 계산에서 제외
- robust CSV 파싱(쉼표/따옴표 포함 필드)
- 무기해방 시트(GID: 337738977) 연동, 방어구/무기 모두 지원
- 장비해방(방어구/무기) 시트 열 구조 변경(F~J열)
- info 영역 텍스트: 검색어, 최근 판매가, 평균 판매가를 각각 한 줄씩 줄바꿈하여 표시
- 라벨링: "최근 거래", "n건 이전 거래" 등으로 직관적 표기

---

## 📋 프로젝트 현황 (v1.5.1)

### 현재 구조
```
lanis_helper/
├── manifest.json              # 확장프로그램 매니페스트 (v3)
├── background.js              # 백그라운드 서비스 워커
├── content.js                 # 메인 콘텐츠 스크립트
├── popup.html                 # 팝업 UI
├── popup.js                   # 팝업 로직
├── popup.css                  # 팝업 스타일
├── styles.css                 # 전역 스타일
├── item-colors.js             # 아이템 색상 관리 시스템
├── item-stats.js              # 아이템 감정 범위 표기 관리자
├── search-engine.js           # 검색 엔진 및 아이템 도감
├── user-profile.js            # 사용자 프로필 링크 관리자
├── utils.js                   # 유틸리티 함수
├── rare-items.json            # 레어 아이템 데이터
├── menu-module/               # 메뉴 모듈
│   ├── menu-manager.js        # 메뉴 관리자 (핵심)
│   ├── menu-config.json       # 메뉴 설정
│   └── settings-modal.js      # 설정 모달
├── img/                       # 이미지 리소스
└── exam/                      # 예시 파일
    ├── ability-info-example.js
    ├── enchant-info-armor-example.js
    ├── enchant-info-weapon-example.js
    └── enchant-info-accessory-example.js
```

### 주요 기능
- **아이템 도감**: 카테고리별 필터링, 속성/어빌리티 검색
- **장비 해방 정보**: 구글 시트 연동, 실시간 데이터 표시
- **어빌리티 정보**: 구글 시트 연동, 직업별 토글 필터
- **아이템 감정 범위 표기**: 등급별 색상 시스템
- **사용자 프로필 링크**: 채팅에서 사용자명 클릭 시 프로필 이동
- **메뉴 시스템**: 토글 버튼, 설정 관리

## 🎯 마이그레이션 목적

### 기술적 개선
- **모듈화**: ES6 import/export 시스템 도입
- **번들링**: Vite를 통한 최적화된 번들 생성
- **개발 편의성**: HMR, TypeScript 지원, 최신 문법
- **성능 최적화**: 코드 분할, 트리 쉐이킹
- **유지보수성**: 구조화된 코드베이스

### 기능적 유지
- **100% 기능 호환성**: 기존 기능 모두 유지
- **사용자 경험**: UI/UX 변경 없음
- **데이터 연동**: 구글 시트 API 연동 유지
- **크로스 브라우저**: Chrome, Mises 브라우저 지원

## 🏗️ 마이그레이션 후 구조

```
lanis_helper/
├── manifest.json              # 매니페스트 (public/로 이동)
├── vite.config.js             # Vite 설정
├── package.json               # 의존성 관리
├── public/                    # 정적 자원
│   ├── manifest.json          # 매니페스트
│   ├── img/                   # 이미지 리소스
│   └── exam/                  # 예시 파일
├── src/                       # 소스 코드
│   ├── background/
│   │   └── index.js           # 백그라운드 서비스 워커
│   ├── content/
│   │   ├── index.js           # 메인 콘텐츠 스크립트
│   │   ├── menu-manager.js    # 메뉴 관리자
│   │   ├── item-stats.js      # 아이템 감정 범위 표기
│   │   ├── search-engine.js   # 검색 엔진
│   │   ├── user-profile.js    # 사용자 프로필
│   │   └── utils.js           # 유틸리티
│   ├── popup/
│   │   ├── index.js           # 팝업 로직
│   │   ├── popup.html         # 팝업 UI
│   │   └── popup.css          # 팝업 스타일
│   ├── styles/
│   │   ├── global.css         # 전역 스타일
│   │   └── item-colors.js     # 색상 시스템
│   └── shared/
│       ├── constants.js       # 상수 정의
│       └── types.js           # 타입 정의 (TypeScript 도입 시)
└── dist/                      # 빌드 결과물 (자동 생성)
    ├── background.js
    ├── content.js
    ├── popup.js
    └── assets/
```

## 📦 의존성 계획

### 핵심 의존성
```json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-chrome-extension": "^1.0.0",
    "@types/chrome": "^0.0.250",
    "typescript": "^5.0.0"
  }
}
```

### 선택적 의존성
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "sass": "^1.69.0"
  }
}
```

## 🔄 마이그레이션 단계

### Phase 1: 기본 설정 (1-2일)
1. **Vite 설치 및 설정**
   ```bash
   npm init -y
   npm install --save-dev vite vite-plugin-chrome-extension
   ```

2. **vite.config.js 생성**
   ```javascript
   import { defineConfig } from 'vite'
   import { chromeExtension } from 'vite-plugin-chrome-extension'

   export default defineConfig({
     plugins: [chromeExtension()],
     build: {
       rollupOptions: {
         input: {
           background: 'src/background/index.js',
           content: 'src/content/index.js',
           popup: 'src/popup/index.js'
         }
       }
     }
   })
   ```

3. **폴더 구조 생성**
   - `src/` 디렉토리 생성
   - `public/` 디렉토리로 정적 자원 이동

### Phase 2: 코드 모듈화 (3-5일)
1. **background.js 마이그레이션**
   - `src/background/index.js`로 이동
   - 구글 시트 API 함수들을 별도 모듈로 분리

2. **content.js 마이그레이션**
   - `src/content/index.js`로 이동
   - 각 기능별 모듈 분리:
     - `menu-manager.js`
     - `item-stats.js`
     - `search-engine.js`
     - `user-profile.js`

3. **popup 마이그레이션**
   - `src/popup/` 디렉토리로 이동
   - CSS 모듈화

### Phase 3: 모듈 시스템 도입 (2-3일)
1. **import/export 변환**
   ```javascript
   // 기존: 전역 변수 사용
   window.menuManager = new MenuManager();
   
   // 변경: 모듈 시스템
   import { MenuManager } from './menu-manager.js';
   const menuManager = new MenuManager();
   ```

2. **공통 모듈 분리**
   - `src/shared/constants.js`: 상수 정의
   - `src/shared/utils.js`: 공통 유틸리티

3. **타입 안전성 (선택사항)**
   - TypeScript 도입 검토
   - JSDoc 주석 추가

### Phase 4: 스타일 시스템 개선 (1-2일)
1. **CSS 모듈화**
   - 전역 스타일을 컴포넌트별로 분리
   - CSS 변수 시스템 도입

2. **반응형 디자인 개선**
   - 모바일 최적화
   - 접근성 개선

### Phase 5: 빌드 및 테스트 (2-3일)
1. **빌드 시스템 검증**
   ```bash
   npm run build
   npm run dev
   ```

2. **기능 테스트**
   - 아이템 도감 필터링
   - 속성 토글 버튼
   - 구글 시트 연동
   - 메뉴 시스템
   - 팝업 기능

3. **크로스 브라우저 테스트**
   - Chrome
   - Mises 브라우저

## ⚠️ 주요 주의사항

### 1. 매니페스트 호환성
- **manifest.json**의 entry point와 번들 결과물 경로 일치 필수
- **content_scripts**의 파일 경로 수정 필요
- **background.service_worker** 경로 수정 필요

### 2. 전역 변수 처리
- `window` 객체 사용 제거
- 모듈 시스템으로 전환
- 크로스 스크립트 통신 방식 유지

### 3. 구글 시트 API 연동
- background.js의 API 요청 로직 유지
- 에러 처리 및 로깅 시스템 보존

### 4. 데이터 저장소
- `chrome.storage.local` 사용 방식 유지
- 데이터 구조 변경 없음

## 🧪 테스트 계획

### 기능별 테스트 체크리스트
- [ ] 아이템 도감 열기/닫기
- [ ] 카테고리 필터링 (무기/방어구/장신구)
- [ ] 속성 토글 버튼 (물/불/바람 등)
- [ ] 어빌리티 검색
- [ ] 장비 해방 정보 표시
- [ ] 어빌리티 정보 표시
- [ ] 사용자 프로필 링크
- [ ] 설정 토글 버튼
- [ ] 팝업 기능
- [ ] 구글 시트 연동

### 성능 테스트
- [ ] 초기 로딩 시간
- [ ] 메모리 사용량
- [ ] 번들 크기 최적화
- [ ] HMR 동작 확인

## 📚 참고 자료

- [vite-plugin-chrome-extension](https://github.com/Jonghakseo/vite-chrome-extension)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Vite 공식 문서](https://vitejs.dev/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 🚀 예상 효과

### 개발자 경험 개선
- **빠른 개발**: HMR로 즉시 변경사항 반영
- **코드 품질**: 모듈화로 유지보수성 향상
- **디버깅**: 소스맵으로 원본 코드 디버깅

### 사용자 경험 개선
- **빠른 로딩**: 번들 최적화로 성능 향상
- **안정성**: 모듈 시스템으로 에러 감소
- **확장성**: 새로운 기능 추가 용이

### 유지보수성 향상
- **코드 구조화**: 명확한 모듈 분리
- **타입 안전성**: TypeScript 도입 가능
- **문서화**: JSDoc 주석 시스템

---

**마이그레이션 완료 후**: v1.5.2 릴리즈 예정 (기술적 개선, 사용자 변경 없음) 

## 2025-07 최신 반영

- 아이템 시세 그래프 모달 UI/UX 대폭 개선 (모달 80% 확장, 차트 영역 최대화, flex 레이아웃)
- Chart.js maintainAspectRatio: false, min-height 등으로 차트가 항상 꽉 차게 표시
- 가격 90,000 이하 데이터는 시세 계산에서 제외
- robust CSV 파싱(쉼표/따옴표 포함 필드)
- 무기해방 시트(GID: 337738977) 연동, 방어구/무기 모두 지원
- 장비해방(방어구/무기) 시트 열 구조 변경(F~J열)
- info 영역 텍스트: 검색어, 최근 판매가, 평균 판매가를 각각 한 줄씩 줄바꿈하여 표시
- 라벨링: "최근 거래", "n건 이전 거래" 등으로 직관적 표기 