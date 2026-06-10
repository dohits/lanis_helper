# 팝오버 하단 최근 거래가 표기 설계

작성일: 2026-06-10

## 배경

직전에 추가한 두 팝오버 — (1) 스크롤 팝오버 효과 표시(`ScrollAbilityAdder`), (2) 어빌 이름 클릭 효과 팝오버(`AbilityClickPopoverManager`/`AbilityPopoverView`) — 하단에 해당 스크롤의 최근 거래가와 30일 평균가를 덧붙인다. 장비 아이템 팝오버는 두 기능의 대상이 아니므로 자연히 제외된다.

가격은 공식 사이트 API(`https://lanis.me/api/exchange/market-price`)를 기존 래퍼로 재사용해 조회한다.

## 기존 자산 재사용

- `src/content/calculator/official-price-fetcher.js`의 `OfficialPriceFetcher`
  - `async getCurrentPrices(itemName)` → 정상 시 `{ average, recent, min, max, count }`, 실패/`marketPrice` 없음 시 `null`. 무거래면 값들이 0.
  - 백엔드 `MarketPriceAPI`(`src/api/officialAPI/marketPriceAPI.js`)는 `price_<itemName>` 키 **24시간 인메모리 캐시 + 진행 중 동일요청 중복 제거**를 내장.
  - 콘텐츠 스크립트에서 직접 `fetch`(manifest `host_permissions: https://lanis.me/*`), `Authorization: Bearer <localStorage token>`.

## 요구사항

1. **조회 키**: 두 팝오버 모두 `제작 스크롤:<어빌명>` 형식의 정확한 한글 아이템명으로 조회한다. 등급(금/은/동)은 시세에 무관하며 이름으로만 조회한다(동일 이름의 다른 등급 아이템은 존재하지 않음).
   - 스크롤 팝오버: 이미 추출한 어빌명으로 `제작 스크롤:${어빌명}` 구성.
   - 어빌 클릭 팝오버: 클릭한 어빌명으로 동일 구성.
2. **표시 내용** (효과 아래 새 섹션):
   - `최근 거래가: 1,234,567 Gold` (priceHistory 마지막 항목의 average = `recent`)
   - `30일 평균: 1,000,000 Gold` (`average`) — **건수 표기 없음**
   - 무데이터/실패 시: `최근 거래 내역 없음` (단일 메시지)
3. **무데이터 판정**: `getCurrentPrices` 결과가 `null`이거나 `recent`와 `average`가 모두 0이면 무데이터로 본다.
4. **비동기 로딩**: 팝오버는 즉시 렌더되고, 가격 섹션은 먼저 `거래가 불러오는 중…`을 표시했다가 응답 후 교체한다.
5. **레이스 가드**: 응답이 오기 전에 팝오버가 닫히거나 교체될 수 있으므로, 갱신 직전 대상 요소의 `isConnected`를 확인하고 끊겼으면 갱신하지 않는다.
6. **캐싱**: 기존 `MarketPriceAPI`의 24시간 인메모리 캐시 + 중복요청 제거를 그대로 사용한다. 공유 싱글톤 `OfficialPriceFetcher` 1개를 두 기능이 공유해 같은 스크롤은 세션 내 하루 1회만 실제 요청한다. (영속 캐시는 비범위.)
7. **토글**: 두 기능 모두 기존 `showItemStats` 게이팅을 상속한다(별도 설정 없음). 가격은 효과 표시 경로에 붙으므로 동일하게 켜짐/꺼짐에 따른다.
8. **금액 포맷**: 천단위 콤마 + ` Gold` (예: `1,234,567 Gold`). 소수점 없는 정수로 반올림.

## 아키텍처

- **신규 공유 모듈** `src/content/dom-modules/scroll-price/ScrollPriceService.js`
  - 모듈 싱글톤 `const fetcher = new OfficialPriceFetcher();` (두 기능 공유 → 캐시 공유).
  - `scrollItemName(abilityName)` → `제작 스크롤:${abilityName}` (순수 함수).
  - `formatGold(n)` → `Math.round(n).toLocaleString('en-US') + ' Gold'` (순수 함수).
  - `async fetchScrollPrice(abilityName)` → `{ hasData, recent, average }`. 내부에서 `fetcher.getCurrentPrices(scrollItemName(abilityName))` 호출, 무데이터 판정 적용. try/catch로 실패 시 `{ hasData: false, recent: 0, average: 0 }`.
- **스크롤 팝오버**(`ScrollAbilityAdder`): 효과 행을 추가한 뒤, 같은 박스에 가격 행(`.scroll-price-info`, placeholder=`거래가 불러오는 중…`)을 추가하고 `fetchScrollPrice`를 비동기 호출해 채운다. 갱신 전 `row.isConnected` 가드.
- **어빌 클릭 팝오버**(`AbilityPopoverView` + `AbilityClickPopoverManager`): 카드 본문 아래에 가격 섹션(placeholder) 영역을 만들고, 매니저가 `openFor`에서 `fetchScrollPrice`를 비동기 호출해 채운다. 갱신 전 해당 요소 `isConnected` 가드(카드 교체/닫힘 대비).
- 가격 텍스트/포맷/이름 구성은 공유 서비스가 담당하고, 각 팝오버는 자신의 스타일로 행/섹션을 렌더한다(뷰 관심사 분리).

## 데이터 흐름

```
(스크롤 팝오버) ScrollAbilityAdder.processScrollPopover
  → 효과 행 추가 → 가격 행(placeholder) 추가
  → fetchScrollPrice(어빌명) → (응답) row.isConnected면 최근/평균 또는 '최근 거래 내역 없음'으로 교체

(어빌 클릭 팝오버) AbilityClickPopoverManager.openFor
  → view.open(... 가격 섹션 placeholder 포함)
  → fetchScrollPrice(어빌명) → (응답) 섹션 isConnected면 교체

ScrollPriceService.fetchScrollPrice
  → fetcher.getCurrentPrices('제작 스크롤:'+어빌명)  // 24h 캐시/중복제거 내장
  → { hasData, recent, average }
```

## 에러 처리

- `getCurrentPrices`는 자체적으로 실패 시 `null`을 반환(내부 try/catch). 서비스는 추가로 try/catch하여 항상 `{ hasData, recent, average }`를 반환.
- 비로그인/401 등도 `null` 경로로 흡수 → `최근 거래 내역 없음`.
- 비동기 콜백의 DOM 갱신은 `isConnected` 가드 + try/catch로 페이지에 영향 없음.

## 테스트

- 순수 로직: `scrollItemName`(이름 구성), `formatGold`(콤마/Gold/반올림), 무데이터 판정 헬퍼를 Node 스크립트로 검증한다(네트워크 비의존). `fetchScrollPrice`의 네트워크 부분은 단위 테스트 비대상(브라우저 인증 필요).
- 통합: `npm run build` 성공. 예시 HTML 또는 실제 페이지에서 — 두 팝오버 하단에 로딩→가격/무데이터 표기, 팝오버 닫은 뒤 늦게 온 응답이 오류 없이 무시되는지, 같은 스크롤 재조회 시 캐시로 즉시 표시되는지 확인.
```
