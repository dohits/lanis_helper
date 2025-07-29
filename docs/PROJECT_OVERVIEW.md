# Lanis Helper - 프로젝트 개요 (개발자용)

**현재 버전**: 1.7.0 (기댓값 계산기 기능 추가)
**최종 업데이트**: 2025년 1월 27일
**빌드 시스템**: Vite + ES6 모듈

## 📁 프로젝트 구조 (Vite 마이그레이션 후)

```
lanis_helper/
├── src/                       # 소스 코드 (Vite 빌드)
│   ├── content/               # 콘텐츠 스크립트
│   │   ├── index.js           # 메인 콘텐츠 스크립트
│   │   ├── menu-module/       # 메뉴 모듈
│   │   │   ├── menu-manager.js        # 메뉴 관리자
│   │   │   ├── menu-config.json       # 메뉴 설정
│   │   │   ├── settings-modal.js      # 설정 모달
│   │   │   └── buttons/               # 버튼 모듈들
│   │   ├── search-engine.js   # 검색 엔진 및 아이템 도감
│   │   ├── item-stats.js      # 아이템 감정 범위 표기 관리자
│   │   ├── user-profile.js    # 사용자 프로필 링크 관리자
│   │   ├── calculator/        # 기댓값 계산기 모듈
│   │   │   ├── expected-value-calculator.js    # 기댓값 계산 로직
│   │   │   ├── expected-value-ui-manager.js    # UI 관리자
│   │   │   └── price-fetcher.js                # 시세 데이터 가져오기
│   │   └── utils.js           # 공유 유틸리티
│   ├── popup/                 # 팝업 UI
│   │   ├── popup.html         # 팝업 HTML
│   │   └── index.js           # 팝업 로직
│   ├── background/            # 백그라운드 스크립트
│   │   └── index.js           # 백그라운드 서비스 워커
│   ├── styles/                # 스타일
│   │   └── global.css         # 전역 스타일
│   └── shared/                # 공유 리소스
│       └── constants.js       # 상수 정의
├── dist/                      # 빌드 결과물
│   ├── manifest.json          # 확장프로그램 매니페스트
│   ├── assets/                # 번들된 스크립트
│   ├── popup.html             # 팝업 UI
│   ├── styles.css             # 전역 스타일
│   ├── menu-config.json       # 메뉴 설정
│   └── rare-items.json        # 레어 아이템 데이터
├── public/                    # 정적 리소스
│   ├── img/                   # 이미지 리소스
│   └── exam/                  # 예시 파일
│       ├── enchant-info-armor-example.js
│       ├── enchant-info-weapon-example.js
│       └── enchant-info-accessory-example.js
├── scripts/                   # 빌드 스크립트
│   └── update-manifest.cjs    # 매니페스트 업데이트 스크립트
├── vite.config.js             # Vite 설정
├── package.json               # 프로젝트 설정
└── README.md                  # 사용자 문서
```

## 🔧 핵심 모듈 설명

### 1. 색상 관리 시스템 (`item-colors.js`)
- **목적**: 아이템 등급별 색상을 중앙 집중식으로 관리
- **기능**: 
  - 등급별 색상 정의 및 관리
  - 점수별 색상 매핑
  - 공통 색상 관리 (범위, 퍼센트, 위키 정보 등)
- **사용법**: `ITEM_COLORS.getGradeColor(grade)`, `ITEM_COLORS.getScoreColor(score)`

### 2. 아이템 감정 범위 표기 (`item-stats.js`)
- **목적**: 아이템 팝오버에 감정 범위 및 등급 정보 표시
- **주요 클래스**: `ItemStatsManager`
- **핵심 메서드**:
  - `calculateGrade()`: 등급 계산 (퍼센트, 점수, 색상 반환)
  - `addRangeInfoToStats()`: 범위 정보 추가
  - `addFinalTag()`: 최종 태그/점수 표시
- **색상 시스템**: `item-colors.js`와 연동하여 색상 관리

### 3. 검색 엔진 (`search-engine.js`)
- **목적**: 아이템 도감 및 검색 기능
- **기능**: 카테고리별 필터링, 속성/어빌리티 검색

### 4. 사용자 프로필 (`user-profile.js`)
- **목적**: 채팅에서 사용자명 클릭 시 프로필 페이지 이동

### 5. 메뉴 모듈 (`menu-module/`)
- **목적**: 메인 메뉴 및 설정 UI 관리
- **구성**: 메뉴 관리자, 설정 모달, 메뉴 설정
- **새로운 기능**: 해방 정보 모달 (장비 해방 정보 표시)

### 6. 해방 정보 시스템
- **목적**: 구글 시트에서 장비 해방 정보를 실시간으로 가져와 표시
- **구성**: 
  - `background.js`: 구글 시트 API 연동 및 데이터 fetch
  - `menu-manager.js`: 해방 정보 모달 UI 및 테이블 렌더링
  - `exam/enchant-info-armor-example.js`: 방어구 해방 정보 예시 및 참조
  - `exam/enchant-info-weapon-example.js`: 무기 해방 정보 예시 (시트 미존재)
  - `exam/enchant-info-accessory-example.js`: 장신구 해방 정보 예시 (시트 미존재)
- **데이터 플로우**:
  1. 사용자 → "해방 정보 보기" 버튼 클릭
  2. `openEnchantInfoModal()` → 모달 생성
  3. `fetchEnchantInfoData()` → background.js에 메시지 전송
  4. `background.js` → 구글 시트 CSV 데이터 fetch
  5. `displayEnchantInfoTable()` → 테이블 형태로 데이터 렌더링
- **데이터 구조**: 
  - 구글 시트 구조: A열(빈칸), B열(스텟명), C열(동등급), D열(은등급), E열(금등급), F열(칠색등급)
  - 파싱 시 cols[1]부터 시작 (A열은 빈칸이므로)
  - 상세 구조는 `exam/enchant-info-armor-example.js` 참조
- **현재 상태**:
  - 방어구: 실제 데이터 연결됨 (GID: 468768394)
  - 무기: 시트 미존재 (GID: 999999999)
  - 장신구: 시트 미존재 (GID: 999999998)

### 7. 기댓값 계산기 시스템
- **목적**: 아이템 조합/분해의 기댓값을 계산하여 최적의 조합을 제시
- **구성**:
  - `expected-value-calculator.js`: 기댓값 계산 로직 및 수식
  - `expected-value-ui-manager.js`: 모달 UI 및 이벤트 관리
  - `price-fetcher.js`: 구글 시트에서 시세 데이터 가져오기
- **지원 아이템**:
  - 조합 아이템: 활력의 포션, 봉인의 열쇠, 푸른 결정, 붉은 결정, 고급 가죽끈, 가죽끈, 낡은 가죽끈, 쇠망치
  - 분해 아이템: 흰색/파랑/노랑/보라/빨강 등급 장비 (준비중)
- **데이터 소스**:
  - 평균 거래가: 구글 시트에서 평균 가격 계산
  - 최근 거래가: 구글 시트에서 최신 거래 가격
  - 직접 입력: 사용자가 직접 시세 입력
- **주요 기능**:
  - 최적 조합 자동 계산 (가장 낮은 기댓값)
  - 재료별 개별 시세 표시
  - 로딩 상태 표시 (스켈레톤 UI)
  - 모달 외부 클릭 시 닫기
- **계산 로직**:
  - 공통 기본 비용: 300,000 Gold
  - 아이템별 성공률 및 재료 조합 정의
  - 다중 재료 아이템의 경우 최적 재료 분배 계산

## 🎨 색상 시스템 아키텍처

### 색상 정의 구조
```javascript
const ITEM_COLORS = {
  grades: {
    '무결': '#00FFF0',    // 청록색
    '완벽': '#FFE066',    // 노란색
    '최상': '#FF5555',    // 빨간색
    '상': '#C770FF',      // 보라색 (5점)
    '중': '#FFFF66',      // 노란색
    '하': '#66A3FF',      // 파란색 (3점)
    '최하': '#CCCCCC',    // 회색
    '불량': '#BBBBBB',    // 연회색
    '폐급': '#888888',    // 진회색
    '누락': '#FF8888'     // 연빨간색
  },
  common: {
    range: '#666666',      // 범위 정보
    percent: '#666666',    // 퍼센트 정보
    wiki: '#888888',       // 위키 정보
    narrow: '#666666',     // 범위 좁음 정보
    finalScore: '#666666'  // 최종 점수
  }
}
```

### 색상 사용 패턴
1. **등급 색상**: `ITEM_COLORS.getGradeColor(grade)`
2. **점수 색상**: `ITEM_COLORS.getScoreColor(score)` (등급과 동일)
3. **공통 색상**: `ITEM_COLORS.common.range` 등

## 🔄 데이터 플로우

### 아이템 감정 정보 표시 과정
1. `content.js` → `ItemStatsManager.init()` 호출
2. `ItemStatsManager` → 레어 아이템 데이터 로드
3. 동적 콘텐츠 감지 → `processItemStats()` 실행
4. 아이템 매칭 → `addRangeInfoToStats()` 호출
5. 등급 계산 → `calculateGrade()` → 색상 시스템 사용
6. DOM 요소 생성 → 색상 적용 → 팝오버 위치 조정

### 색상 적용 과정
1. `calculateGrade()` → 등급 결정
2. `ITEM_COLORS.getGradeColor()` → 색상 가져오기
3. DOM 요소 생성 시 색상 적용
4. 등급 표시와 점수 표시에 동일한 색상 사용

## 아이템 감정범위 표기 및 위키아이콘 표기 구조
- processItemStats()에서 각 아이템 컨테이너에 대해:
  - rareItemsData(수집 데이터)와 DOM에서 추출한 범위를 모두 비교
  - 수집 데이터가 있을 때, DOM의 범위와 다르면 위키아이콘을 표기
  - 수집 데이터가 없더라도, DOM에 범위가 있으면 임시 itemData를 생성하여 addRangeInfoToStats로 판정 및 표기를 수행
  - 위키아이콘 표기는 정보 불일치 또는 정보 없음+범위존재 모두에 대해 표기됨
- addRangeInfoToStats()는 itemData가 없을 때도 dom에서 추출한 값으로 판정 가능하도록 파라미터를 받음

## exam 폴더 내 어빌리티 데이터 구조 안내

- 모든 어빌리티 정보는 `ability-info.json` 파일에서 통합 관리됨

```json
[
  { "job": "직업명", "name": "어빌리티명", "effect": "효과", "exp": "경험치" }
]
```
- `job`: 직업명(예: "검술", "체술", "장비" 등)
- `name`: 어빌리티 이름
- `effect`: 효과 설명
- `exp`: 필요 경험치 또는 "-P" (장비 어빌리티의 경우)

### 활용 예시
- 해당 파일에서 직업별(`job`), 이름(`name`), 효과(`effect`) 등으로 필터링 및 검색이 가능함

## 🛡️ 보안 고려사항

### XSS 방지
- `innerHTML` 사용 금지
- `document.write` 사용 금지
- `textContent` 사용으로 안전한 텍스트 삽입
- HTML 이스케이프 함수 적용

### 데이터 검증
- 입력값 유효성 검사
- 범위 체크 및 이상치 처리
- null/undefined 값 안전 처리

## 📝 개발 가이드라인

### 색상 수정 시
1. `item-colors.js`에서 색상 값만 수정
2. 코드 내 하드코딩된 색상 사용 금지
3. 새로운 색상 추가 시 `grades` 또는 `common` 객체에 추가

### 새로운 기능 추가 시
1. 기존 색상 시스템 활용
2. 모듈화된 구조 유지
3. 보안 가이드라인 준수

### 성능 최적화
1. DOM 조작 최소화
2. 이벤트 리스너 효율적 관리
3. 메모리 누수 방지

## 🚀 Vite 마이그레이션 완료

### 마이그레이션 개요
- **기존**: 전역 변수 기반 구조
- **현재**: ES6 모듈 + Vite 빌드 시스템
- **완료일**: 2025년 7월 23일

### 주요 변경사항
1. **모듈화**: 모든 스크립트를 ES6 모듈로 변환
2. **빌드 시스템**: Vite를 통한 번들링 및 최적화
3. **파일 구조**: src/ 폴더 기반으로 재구성
4. **자동화**: manifest.json, popup.html 자동 업데이트

### 빌드 결과
```bash
✓ 11 modules transformed.
dist/assets/background-oFEbL7Ch.js   1.89 kB │ gzip:  1.02 kB
dist/assets/popup-KTNEYWro.js        7.35 kB │ gzip:  2.54 kB
dist/assets/content-E9HtmiTM.js     78.59 kB │ gzip: 18.66 kB
```

### 개발 환경
```bash
# 개발 빌드
npm run dev

# 프로덕션 빌드  
npm run build
```

### 모듈 구조
- **content/index.js**: 메인 콘텐츠 스크립트 (모든 매니저 통합)
- **menu-module/**: 메뉴 시스템 모듈
- **utils.js**: 공유 유틸리티
- **background/index.js**: 백그라운드 서비스 워커
- **popup/index.js**: 팝업 로직

## 🔍 디버깅

### 주요 로그 포인트
- `ItemStatsManager`: 아이템 매칭, 등급 계산
- 색상 시스템: 색상 매핑 오류
- 팝오버 위치 조정: 위치 계산 오류
- **Vite 빌드**: 번들링 과정 및 오류

### 개발자 도구 활용
- Chrome DevTools → Console
- Elements 탭에서 DOM 구조 확인
- Network 탭에서 데이터 로드 확인
- **Vite DevTools**: 빌드 과정 모니터링 

## 최근 업데이트 (2025-01, v1.7.0)

- **기댓값 계산기 시스템**
  - 아이템 조합/분해의 기댓값 계산 기능 추가
  - 8개 조합 아이템 지원 (활력의 포션, 봉인의 열쇠, 푸른 결정, 붉은 결정, 고급 가죽끈, 가죽끈, 낡은 가죽끈, 쇠망치)
  - 5개 분해 아이템 UI 준비 (흰색/파랑/노랑/보라/빨강 등급 장비)
  - 최적 조합 자동 계산 (가장 낮은 기댓값)
  - 재료별 개별 시세 표시 및 동적 입력 필드
  - 로딩 상태 표시 (스켈레톤 UI 및 버튼 상태 변경)
  - 모달 외부 클릭 시 닫기 기능
- **데이터 소스 통합**
  - 평균 거래가, 최근 거래가, 직접 입력 토글 버튼
  - 기존 시세 차트와 동일한 구글 시트 데이터 활용
  - PriceFetcher 모듈로 중앙화된 시세 데이터 관리
- **UI/UX 개선**
  - 드롭다운에 [조합]/[분해] 카테고리 태그 추가
  - 계산 중 로딩 상태 및 스켈레톤 애니메이션
  - 모듈화된 구조로 코드 재사용성 향상
- **계산 로직**
  - 공통 기본 비용 300,000 Gold 적용
  - 아이템별 성공률 및 재료 조합 정의
  - 다중 재료 아이템의 최적 재료 분배 알고리즘 