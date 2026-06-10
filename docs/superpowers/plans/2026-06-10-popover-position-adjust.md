# 새 팝오버 위치 자동 조절 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스크롤 팝오버와 어빌 클릭 카드가 콘텐츠(효과·비동기 시세) 추가로 커질 때, 장비 스카우터와 동일하게 화면 밖으로 넘치지 않도록 위치를 자동 보정한다.

**Architecture:** 기존 `PopoverPositionObserver`의 세로 전용 보정 로직을 공유 유틸(`popover-position.js`)로 분리하고, 순수 계산부(`computePaperAdjustment`)를 Node로 검증한다. 스크롤 팝오버는 행 추가 직후·비동기 시세 채움 직후 보정을 호출하고, 어빌 클릭 카드는 시세 채움 직후 기존 `position()`을 재실행한다.

**Tech Stack:** Vanilla JS (ES modules), Vite 7, Chrome Extension. 순수 계산은 Node `.mjs`, DOM/뷰포트 의존부는 빌드 + 수동 확인.

---

## File Structure

- **Create** `src/content/dom-modules/item-stats/popover-position.js` — 순수 `computePaperAdjustment` + DOM 적용 `calculateAndAdjustPaper` + 지연 래퍼 `adjustPaperPosition`.
- **Create** `scripts/verify-popover-position.mjs` — 순수 계산 Node 검증.
- **Modify** `src/content/dom-modules/item-stats/PopoverPositionObserver.js` — 공유 유틸 사용으로 정리.
- **Modify** `src/content/dom-modules/item-stats/ScrollAbilityAdder.js` — 행/시세 추가 후 보정 호출.
- **Modify** `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js` — `reposition()` 추가.
- **Modify** `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js` — 시세 채움 후 `reposition()` 호출.

`RangeInfoAdder.js`(장비 위치 보정 사본)는 의도적으로 수정하지 않는다.

---

## Task 1: 공유 위치 유틸 + Node 검증

**Files:**
- Create: `src/content/dom-modules/item-stats/popover-position.js`
- Create: `scripts/verify-popover-position.mjs`

- [ ] **Step 1: 검증 스크립트 작성 (실패 먼저)**

Create `scripts/verify-popover-position.mjs`:

```js
import { computePaperAdjustment } from '../src/content/dom-modules/item-stats/popover-position.js';

let failed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}: got ${a}, expected ${e}`);
  }
}

const vh = 800; // 뷰포트 높이, margin=20 → 하단 임계 780, maxHeight 임계 760

// 범위 내 → 보정 없음
check('in bounds', computePaperAdjustment({ top: 100, bottom: 300, height: 200 }, vh), {});

// 하단 이탈 (bottom 790 > 780), height 200 → top = 800-200-20 = 580
check('bottom overflow', computePaperAdjustment({ top: 590, bottom: 790, height: 200 }, vh), { top: 580 });

// 상단 이탈 (top 10 < 20) → top = 20
check('top overflow', computePaperAdjustment({ top: 10, bottom: 210, height: 200 }, vh), { top: 20 });

// 긴 내용 (height 900 > 760) + 하단 이탈 → top=max(20,800-900-20)=20, maxHeight=760
check('tall content', computePaperAdjustment({ top: 50, bottom: 950, height: 900 }, vh), { top: 20, maxHeight: 760 });

// 상단·하단 동시: 하단이 top=580 설정 후 상단이 top=20으로 덮어씀
check('both overflow top wins', computePaperAdjustment({ top: 10, bottom: 790, height: 200 }, vh), { top: 20 });

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
```

- [ ] **Step 2: 실패 확인**

Run: `node scripts/verify-popover-position.mjs`
Expected: FAIL — `popover-position.js` 모듈 없음(ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: 유틸 구현**

Create `src/content/dom-modules/item-stats/popover-position.js`:

```js
// 팝오버 paper 위치 자동 조절 (세로 전용 + 긴 내용 스크롤). 가로는 MUI 자동 배치에 맡김.

// 순수: 뷰포트 기준 세로 보정값 계산 → { top?, maxHeight? }
// - 하단 이탈(rect.bottom > vh - margin): top 위로
// - 상단 이탈(rect.top < margin): top = margin (하단 보정을 덮어씀 — 기존 순서 유지)
// - 내용이 길면(rect.height > vh - 2*margin): maxHeight = vh - 2*margin
export function computePaperAdjustment(rect, viewportHeight, margin = 20) {
  const adjustment = {};
  if (rect.bottom > viewportHeight - margin) {
    adjustment.top = Math.max(margin, viewportHeight - rect.height - margin);
  }
  if (rect.top < margin) {
    adjustment.top = margin;
  }
  if (rect.height > viewportHeight - margin * 2) {
    adjustment.maxHeight = viewportHeight - margin * 2;
  }
  return adjustment;
}

// paper 측정 후 보정값을 스타일에 적용
export function calculateAndAdjustPaper(paper) {
  if (!paper) return;
  const rect = paper.getBoundingClientRect();
  const adjustment = computePaperAdjustment(rect, window.innerHeight);
  if (adjustment.top != null) {
    paper.style.top = `${adjustment.top}px`;
  }
  if (adjustment.maxHeight != null) {
    paper.style.maxHeight = `${adjustment.maxHeight}px`;
    paper.style.overflowY = 'auto';
  }
}

// 렌더 안정화 대기 후 보정 (paper 없으면 무동작)
export function adjustPaperPosition(paper, delay = 100) {
  if (!paper) return;
  setTimeout(() => calculateAndAdjustPaper(paper), delay);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node scripts/verify-popover-position.mjs`
Expected: 모든 PASS 후 `All checks passed`, exit 0.

- [ ] **Step 5: 커밋**

```bash
git add src/content/dom-modules/item-stats/popover-position.js scripts/verify-popover-position.mjs
git commit -m "feat: 팝오버 위치 보정 공유 유틸 추가"
```

---

## Task 2: PopoverPositionObserver를 공유 유틸로 정리

**Files:**
- Modify: `src/content/dom-modules/item-stats/PopoverPositionObserver.js`

먼저 파일을 READ 한다. 현재 `adjustPopoverPosition(popover)`는 paper를 찾아 setTimeout 후 `calculateAndAdjustPosition(popover, paper)`를 호출하고, `calculateAndAdjustPosition`이 직접 경계 계산/적용을 한다.

- [ ] **Step 1: import 추가**

파일 최상단(첫 줄 주석 다음, `class` 선언 전)에 추가:

```js
import { adjustPaperPosition } from './popover-position.js';
```

- [ ] **Step 2: adjustPopoverPosition을 공유 유틸 사용으로 교체**

현재:
```js
  // 팝오버 위치 조정
  adjustPopoverPosition(popover) {
    const paper = popover.querySelector('.MuiPaper-root');
    if (!paper) return;

    // 팝오버가 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      this.calculateAndAdjustPosition(popover, paper);
    }, 100);
  }
```
를 다음으로 교체:
```js
  // 팝오버 위치 조정 (공유 유틸 사용)
  adjustPopoverPosition(popover) {
    const paper = popover.querySelector('.MuiPaper-root');
    adjustPaperPosition(paper);
  }
```

- [ ] **Step 3: 내부 calculateAndAdjustPosition 메서드 제거**

`calculateAndAdjustPosition(popover, paper) { ... }` 메서드 전체(주석 `// 위치 계산 및 조정`부터 닫는 `}`까지)를 삭제한다. (로직은 공유 유틸로 이전됨.) `startPopoverPositionObserver`, `init`, `destroy`는 그대로 둔다.

- [ ] **Step 4: 빌드 검증 (공유 유틸이 번들에 진입)**

Run: `npm run build`
Expected: 성공. `PopoverPositionObserver`는 `ItemStatsManager`를 통해 번들에 포함되므로, 이번 빌드가 `popover-position.js`를 실제 컴파일·검증한다. 모듈 수가 이전보다 1 증가(신규 파일).

- [ ] **Step 5: 커밋**

```bash
git add src/content/dom-modules/item-stats/PopoverPositionObserver.js
git commit -m "refactor: PopoverPositionObserver를 공유 위치 유틸로 정리"
```

---

## Task 3: 스크롤 팝오버 위치 보정

**Files:**
- Modify: `src/content/dom-modules/item-stats/ScrollAbilityAdder.js`

먼저 파일을 READ 한다.

- [ ] **Step 1: import 추가**

상단 import 블록(현재 마지막은 `import { priceLines } from '../scroll-price/scroll-price-utils.js';`) 다음에 추가:

```js
import { adjustPaperPosition } from './popover-position.js';
```

- [ ] **Step 2: 행 추가 직후 보정 + loadPrice에 paper 전달**

현재 `processScrollPopover`의 끝부분:
```js
    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));

    // 가격 행(placeholder) 추가 후 비동기 채움
    const priceRow = this.buildPriceRow();
    targetBox.appendChild(priceRow);
    this.loadPrice(priceRow, abilityName);
  }
```
를 다음으로 교체:
```js
    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));

    // 가격 행(placeholder) 추가 후 비동기 채움
    const priceRow = this.buildPriceRow();
    targetBox.appendChild(priceRow);
    this.loadPrice(priceRow, abilityName, paper);

    // 행 추가로 팝오버가 커졌으니 위치 보정 (장비 스카우터와 동일 동작)
    adjustPaperPosition(paper);
  }
```

- [ ] **Step 3: loadPrice가 paper를 받아 시세 채움 후 재보정**

현재:
```js
  // 비동기 시세 로드 후 행 갱신 (팝오버가 닫혔으면 무시)
  async loadPrice(row, abilityName) {
    try {
      const result = await fetchScrollPrice(abilityName);
      if (!row.isConnected) return;
      this.renderPriceLines(row, priceLines(result));
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 시세 표시 오류:', error);
    }
  }
```
를 다음으로 교체:
```js
  // 비동기 시세 로드 후 행 갱신 (팝오버가 닫혔으면 무시)
  async loadPrice(row, abilityName, paper) {
    try {
      const result = await fetchScrollPrice(abilityName);
      if (!row.isConnected) return;
      this.renderPriceLines(row, priceLines(result));
      // 비동기 시세로 높이가 바뀌었으니 위치 재보정
      adjustPaperPosition(paper);
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 시세 표시 오류:', error);
    }
  }
```

- [ ] **Step 4: 빌드 검증**

Run: `npm run build`
Expected: 성공(에러 없음).

- [ ] **Step 5: 커밋**

```bash
git add src/content/dom-modules/item-stats/ScrollAbilityAdder.js
git commit -m "feat: 스크롤 팝오버 콘텐츠 추가 후 위치 자동 보정"
```

---

## Task 4: 어빌 클릭 카드 위치 재계산 + 최종 검증

**Files:**
- Modify: `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js`
- Modify: `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js`

먼저 두 파일을 READ 한다.

### 4A. AbilityPopoverView

- [ ] **Step 1: reposition 메서드 추가**

`setPriceLines(lines) { ... }` 메서드 정의 바로 다음(또는 `position` 앞)에 추가:

```js
  // 콘텐츠 변경 등으로 카드 크기가 바뀐 뒤 위치 재계산 (열려 있을 때만)
  reposition() {
    if (this.el && this.anchor) {
      this.position(this.el, this.anchor);
    }
  }
```

### 4B. AbilityClickPopoverManager

- [ ] **Step 2: 시세 채움 직후 reposition 호출**

현재 `loadPrice`의 본문:
```js
      const result = await fetchScrollPrice(abilityName);
      if (!this.view.isOpenFor(anchor)) return;
      this.view.setPriceLines(priceLines(result));
```
를 다음으로 교체:
```js
      const result = await fetchScrollPrice(abilityName);
      if (!this.view.isOpenFor(anchor)) return;
      this.view.setPriceLines(priceLines(result));
      // 시세 3줄이 채워져 카드가 커졌으니 위치 재계산
      this.view.reposition();
```

- [ ] **Step 3: 순수 회귀 검증**

Run: `node scripts/verify-popover-position.mjs`
Expected: `All checks passed`, exit 0.

- [ ] **Step 4: 전체 빌드 검증**

Run: `npm run build`
Expected: 성공(에러 없음).

- [ ] **Step 5: 수동 브라우저 검증 (사용자)**

확장을 빌드해 확인:
1. 화면 하단 근처에서 스크롤 팝오버를 열면, 효과·시세가 채워지며 팝오버가 위로 밀려 화면 안에 들어온다.
2. 내용이 매우 길면 팝오버에 세로 스크롤이 생긴다.
3. 스크롤 교환 페이지에서 화면 하단 근처 어빌 이름을 클릭하면, 시세 3줄이 채워진 뒤 카드가 화면 안으로 재배치된다.
4. 장비 아이템 팝오버의 기존 위치 보정 동작은 그대로다(회귀 없음).

- [ ] **Step 6: 커밋**

```bash
git add src/content/dom-modules/ability-click-popover/AbilityPopoverView.js src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js
git commit -m "feat: 어빌 클릭 카드 시세 채움 후 위치 재계산"
```

---

## Self-Review 체크리스트 결과

- **Spec coverage:** 공유 유틸(computePaperAdjustment/calculateAndAdjustPaper/adjustPaperPosition, Task 1) · 기존 동일 규칙(세로+maxHeight, Task 1) · PopoverPositionObserver 정리(Task 2) · 스크롤 팝오버 행/시세 후 보정(Task 3) · 어빌 카드 reposition(Task 4) · RangeInfoAdder 미수정(전 태스크에서 손대지 않음) · 순수 검증(Task 1) — 모두 매핑됨.
- **Placeholder scan:** 없음(모든 코드 블록 완전 기재).
- **Type consistency:** `adjustPaperPosition(paper, delay)`(Task 1) ↔ PopoverPositionObserver(Task 2)·ScrollAbilityAdder(Task 3) 호출 일치. `computePaperAdjustment(rect, viewportHeight, margin)`(Task 1) ↔ verify(Task 1) 일치. `reposition()`(Task 4A) ↔ 매니저 호출(Task 4B) 일치. `loadPrice(row, abilityName, paper)` 시그니처 변경(Task 3 Step 2 호출부 + Step 3 정의) 일치.
