# 새 팝오버 위치 자동 조절 설계

작성일: 2026-06-10

## 배경

장비 스카우터 팝오버는 화면 밖으로 넘치면 위치가 자동 조절된다. 이 동작은 전역 `PopoverPositionObserver`가 담당하는데, 팝오버가 **열릴 때 1회만** 보정한다. 신규 팝오버(스크롤 팝오버의 효과/시세, 어빌 클릭 카드)는 콘텐츠를 그 뒤에 덧붙이고(특히 시세는 비동기로 더 늦게) 그만큼 커지지만, 추가 후 **재보정이 없어** 화면 밖으로 넘친다. 콘텐츠 추가 직후·비동기 채움 직후에 동일한 보정을 호출해 이 격차를 메운다.

## 기존 동작 (재사용 대상)

`PopoverPositionObserver.calculateAndAdjustPosition`의 보정 규칙:
- 세로만 조절(가로는 MUI 자동 배치에 맡김).
- 하단 이탈(`rect.bottom > vh - 20`) → `top = vh - height - 20`.
- 상단 이탈(`rect.top < 20`) → `top = 20`.
- 내용이 길면(`height > vh - 40`) `maxHeight = vh - 40` + `overflowY: auto`.

## 요구사항

1. **스크롤 팝오버**: 효과+시세 행을 추가한 직후, 그리고 비동기 시세를 채운 직후 각각 팝오버 paper 위치를 보정한다.
2. **어빌 클릭 카드**: 비동기 시세로 카드가 커진 직후 위치를 재계산한다(기존 `position()`의 뷰포트 클램프 재실행).
3. **보정 규칙은 기존 장비 동작과 동일**(세로 전용 + maxHeight 스크롤).
4. **DRY**: 보정 로직을 공유 유틸로 분리하고 `PopoverPositionObserver`도 이를 사용하도록 정리한다. 장비 `RangeInfoAdder`의 위치 보정 사본은 위험 회피를 위해 건드리지 않는다.
5. 모든 보정은 안전(요소 없으면 무동작), 페이지 영향 없음.

## 아키텍처

- **신규 공유 모듈** `src/content/dom-modules/item-stats/popover-position.js`
  - `computePaperAdjustment(rect, viewportHeight, margin = 20)` — **순수 함수**. `{ top?, maxHeight? }` 반환. 하단/상단 이탈 시 `top`, 긴 내용 시 `maxHeight`. 상단 이탈 보정이 하단 보정을 덮어쓴다(기존 순서 유지). DOM/네트워크 비의존 → Node 검증 가능.
  - `calculateAndAdjustPaper(paper)` — `paper.getBoundingClientRect()` 측정 후 `computePaperAdjustment` 결과를 `paper.style.top`/`maxHeight`/`overflowY`에 적용.
  - `adjustPaperPosition(paper, delay = 100)` — 렌더 안정화용 `setTimeout` 래퍼.
- **`PopoverPositionObserver`**: `adjustPopoverPosition`이 popover에서 `.MuiPaper-root`를 찾아 `adjustPaperPosition(paper)`를 호출하도록 변경. 내부 `calculateAndAdjustPosition`은 공유 유틸로 대체.
- **`ScrollAbilityAdder`**: `processScrollPopover`에서 행 추가 직후 `adjustPaperPosition(paper)`; `loadPrice`가 paper를 받아 시세 렌더 직후 `adjustPaperPosition(paper)` 재호출.
- **`AbilityPopoverView`**: `reposition()` 추가 — 열려 있으면 `this.position(this.el, this.anchor)` 재실행.
- **`AbilityClickPopoverManager`**: `loadPrice`에서 `view.setPriceLines(...)` 직후 `view.reposition()` 호출.

## 데이터 흐름

```
스크롤 팝오버:
  processScrollPopover → 행 추가 → adjustPaperPosition(paper)
                       → loadPrice(row, ability, paper) → 시세 렌더 → adjustPaperPosition(paper)

어빌 클릭 카드:
  openFor → view.open → loadPrice → fetchScrollPrice → view.setPriceLines → view.reposition()

전역(기존):
  PopoverPositionObserver: MuiPopover-root 추가 시 adjustPaperPosition(paper) (열릴 때 1회)
```

## 에러 처리

- `calculateAndAdjustPaper`/`adjustPaperPosition`는 `paper`가 없으면 무동작.
- `reposition`은 카드가 열려 있지 않으면(`this.el`/`this.anchor` 없음) 무동작.
- 보정 호출은 기존 try/catch 경로 안에서 일어나며 실패해도 콘텐츠 표시에는 영향 없음.

## 테스트

- 순수 `computePaperAdjustment` Node 검증: 하단 이탈 → top 위로, 상단 이탈 → top=20, 긴 내용 → maxHeight, 범위 내 → 빈 객체, 상단·하단 동시 → top=20 우선.
- DOM/뷰포트 의존부(`calculateAndAdjustPaper`, 카드 reposition)는 `npm run build` + 수동 확인: 화면 하단 근처에서 스크롤/어빌 팝오버를 열어 효과·시세가 채워질 때 위로 밀리는지, 내용이 길면 스크롤되는지.
