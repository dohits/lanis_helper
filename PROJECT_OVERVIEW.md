# Lanis Helper - 프로젝트 개요 (개발자용)

**현재 버전**: 1.3.1  
**최종 업데이트**: 2025년 1월

## 📁 프로젝트 구조

```
lanis_helper/
├── manifest.json              # 확장프로그램 매니페스트
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
├── rare-items.json            # 레어 아이템 데이터
├── menu-module/               # 메뉴 모듈
│   ├── menu-manager.js        # 메뉴 관리자
│   ├── menu-config.json       # 메뉴 설정
│   └── settings-modal.js      # 설정 모달
├── img/                       # 이미지 리소스
└── exam/                      # 예시 파일
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

## 🔍 디버깅

### 주요 로그 포인트
- `ItemStatsManager`: 아이템 매칭, 등급 계산
- 색상 시스템: 색상 매핑 오류
- 팝오버 위치 조정: 위치 계산 오류

### 개발자 도구 활용
- Chrome DevTools → Console
- Elements 탭에서 DOM 구조 확인
- Network 탭에서 데이터 로드 확인 