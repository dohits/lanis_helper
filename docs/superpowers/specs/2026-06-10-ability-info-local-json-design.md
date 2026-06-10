# 어빌리티 정보 → 로컬 JSON 전환 설계

작성일: 2026-06-10

## 배경 / 문제

현재 `어빌리티 정보` 모달은 모달을 열 때마다 구글 스프레드시트를 실시간 CSV로
fetch 한다.

- 데이터 출처: 구글 시트 ID `1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo`
- fetch URL: `https://docs.google.com/spreadsheets/d/{시트ID}/export?format=csv`
- 흐름: `AbilityInfoModal.loadData()` → `new AbilityInfoAPI().fetchAbilityInfo()`
  → `GoogleSheetAPI.fetchCSVData()` (10초 타임아웃, 3회 재시도, 캐싱 없음)

아이템 정보(`src/shared/item-data.json`)는 이미 번들에 포함된 로컬 JSON을
정적 import + Chrome 스토리지 버전 캐싱으로 사용한다. 어빌리티 정보도 동일한
방식으로 전환해, 네트워크 의존성을 제거하고 아이템 데이터와 패턴을 통일한다.

추후 어빌리티 데이터는 설정 모달뿐 아니라 **아이템 스카우터(`item-stats`)**
에서도 사용될 수 있으므로, 데이터 접근 계층을 공용으로 설계한다.

## 목표

- 어빌리티 정보를 구글 시트 실시간 fetch → 번들 로컬 JSON 로드로 전환
- 데이터 접근을 공용 매니저로 캡슐화 (모달 + 향후 아이템 스카우터 재사용)
- 기존 모달 동작(검색/직업 토글/렌더링, 표시 행 집합)을 100% 동일하게 유지

## 비목표 (YAGNI)

- 아이템 스카우터 측 실제 연동 구현 (이번 범위 아님 — 매니저만 재사용 가능하게)
- JSON 자동 재생성 파이프라인 / 빌드 스크립트 (수동 1회 생성)
- 어빌리티 데이터 스키마 변경, 컬럼 추가/가공

## 데이터 파일: `src/shared/ability-data.json`

- 객체 배열. 키는 모달이 그대로 읽는 컬럼과 정확히 일치:
  `직업`, `전직`, `어빌리티명`, `효과`, `무기 타입 효과`, `숙련도`
- 기존 `AbilityInfoAPI.fetchAbilityInfo()`와 **동일한 파싱/필터 로직**으로 생성:
  - 헤더 trim, 각 셀 trim
  - **필터: `직업 && 어빌리티명 && 효과`가 모두 truthy 인 행만 포함**
  - ⚠️ 결과적으로 `[특수] 부드러운 검`처럼 효과가 빈 행은 제외됨 — 이는 현재
    동작과 동일하며, 동작 일치 유지를 위해 의도적으로 같은 필터를 적용한다.
- 생성 방법: 시트를 1회 fetch(CSV) → 위 로직으로 파싱 → JSON 직렬화하여 커밋.

## 데이터 매니저: `src/content/dom-modules/ability-info/AbilityInfoDataManager.js` (신규)

`RareItemsDataManager`(`dom-modules/search-engine/`)를 본뜬 공용 클래스.

- `import abilityData from '../../../shared/ability-data.json'`
- 버전 키: `chrome.runtime.getManifest().version`
- 스토리지 키: `abilityInfo`(데이터), `abilityInfoVersion`(버전)
- 공개 인터페이스:
  - `async load(): Promise<Array>` — 어빌리티 객체 배열 반환
    - Chrome 스토리지에서 캐시 확인 → 버전 일치 시 캐시 데이터 사용
    - 없거나 버전 불일치 시 import 한 JSON 사용 후 스토리지에 갱신 저장
    - 오류 시 import 한 JSON으로 폴백, 항상 배열 반환(실패해도 `[]`)
- 소비처는 매니저만 알면 되며, 데이터 출처(JSON/캐시)는 캡슐화된다.

## 모달 변경: `src/content/menu-module/modal/settings/ability-info-modal.js`

- import 교체: `AbilityInfoAPI` → `AbilityInfoDataManager`
- `loadData()` 내부: `new AbilityInfoAPI().fetchAbilityInfo()` (응답 `{success,data}`)
  호출을 `await new AbilityInfoDataManager().load()` (배열 직접 반환)로 교체
  - 성공 분기 조건을 `result.success && result.data` → `Array.isArray(data) && data.length`
    형태로 조정 (반환 형태 변화 반영)
- 검색/토글/렌더링 등 그 외 로직은 데이터 형태가 동일하므로 변경 없음

## 정리(삭제)

- `src/api/googleSheetLoad/abilityInfoAPI.js` 파일 삭제 (이 모달에서만 사용됨)
- `src/shared/constants.js`의 `SHEET_IDS.ABILITY_INFO` 항목 제거
  - 보존용 시트 ID: `1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo`
    (향후 JSON 수동 재생성이 필요하면 위 ID로 동일 URL에서 CSV를 받는다)
- `src/api/googleSheetLoad/index.js`(공통 `GoogleSheetAPI` 베이스)는 다른 API
  (`equipmentDrawAPI`, `equipmentSettingLoadAPI`)가 사용하므로 **유지**

## 데이터 흐름 (변경 후)

```
src/shared/ability-data.json  (번들 정적 import)
   ↓
AbilityInfoDataManager.load()         ← 버전 기반 Chrome 스토리지 캐싱
   ↓
AbilityInfoModal.loadData()  /  (향후) 아이템 스카우터
```

## 검증

- 빌드(vite)가 JSON import를 정상 번들하는지 확인 (Vite는 JSON import 기본 지원)
- 모달을 열어 표 렌더링/직업 토글/검색이 기존과 동일하게 동작하는지 확인
- 표시되는 행 집합이 기존(효과 빈 행 제외)과 일치하는지 확인
- 네트워크 차단 상태에서도 데이터가 표시되는지 확인 (로컬 로드 검증)
- 삭제 후 `AbilityInfoAPI` / `SHEET_IDS.ABILITY_INFO` 참조가 남아있지 않은지 확인
