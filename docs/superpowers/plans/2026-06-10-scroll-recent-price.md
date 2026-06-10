# 팝오버 하단 최근 거래가 표기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스크롤 팝오버와 어빌 클릭 팝오버 하단에 해당 스크롤(`제작 스크롤:<어빌명>`)의 최근 거래가·30일 평균가를 비동기로 표시한다.

**Architecture:** 시세 조회는 기존 `OfficialPriceFetcher`(24h 인메모리 캐시·중복요청 제거 내장)를 공유 싱글톤으로 재사용한다. 순수 로직(이름 구성·금액 포맷·표시 라인)을 DOM/네트워크 비의존 유틸로 분리해 Node로 검증하고, 네트워크 호출은 얇은 서비스로 감싼다. 두 팝오버는 즉시 렌더 후 가격 섹션을 비동기로 채우며, 응답 도착 시 `isConnected`로 레이스를 가드한다.

**Tech Stack:** Vanilla JS (ES modules), Vite 7, Chrome Extension. 순수 로직은 Node `.mjs`로 검증, DOM/네트워크 통합은 `npm run build` + 수동 확인.

---

## File Structure

- **Create** `src/content/dom-modules/scroll-price/scroll-price-utils.js` — 순수: `scrollItemName`, `formatGold`, `isNoData`, `priceLines`. DOM/네트워크 비의존.
- **Create** `src/content/dom-modules/scroll-price/ScrollPriceService.js` — 공유 싱글톤 `OfficialPriceFetcher` + `async fetchScrollPrice(abilityName)`.
- **Create** `scripts/verify-scroll-price.mjs` — 순수 유틸 Node 검증.
- **Modify** `src/content/dom-modules/item-stats/ScrollAbilityAdder.js` — 효과 행 뒤 가격 행 추가 + 비동기 로드 + cleanup.
- **Modify** `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js` — 카드에 가격 섹션 placeholder + `setPriceLines`.
- **Modify** `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js` — `openFor`에서 비동기 시세 로드.
- **Modify** `public/exam/item-popover-example.html`, `public/exam/ability-click-popover-example.html` — 가격 행 예시 추가.

재사용(수정 없음): `src/content/calculator/official-price-fetcher.js`(`getCurrentPrices`).

---

## Task 1: 순수 시세 유틸 + Node 검증

**Files:**
- Create: `src/content/dom-modules/scroll-price/scroll-price-utils.js`
- Create: `scripts/verify-scroll-price.mjs`

- [ ] **Step 1: 검증 스크립트 작성 (실패 먼저)**

Create `scripts/verify-scroll-price.mjs`:

```js
import {
  scrollItemName,
  formatGold,
  isNoData,
  priceLines
} from '../src/content/dom-modules/scroll-price/scroll-price-utils.js';

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

check('scrollItemName', scrollItemName('과부하'), '제작 스크롤:과부하');
check('formatGold comma', formatGold(1234567), '1,234,567 Gold');
check('formatGold round', formatGold(1000000.6), '1,000,001 Gold');
check('formatGold zero', formatGold(0), '0 Gold');

check('isNoData null', isNoData(null), true);
check('isNoData zeros', isNoData({ recent: 0, average: 0 }), true);
check('isNoData hasRecent', isNoData({ recent: 5, average: 0 }), false);

check('priceLines data', priceLines({ hasData: true, recent: 1234567, average: 1000000 }),
  ['최근 거래가: 1,234,567 Gold', '30일 평균: 1,000,000 Gold']);
check('priceLines empty', priceLines({ hasData: false, recent: 0, average: 0 }),
  ['최근 거래 내역 없음']);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
```

- [ ] **Step 2: 실패 확인**

Run: `node scripts/verify-scroll-price.mjs`
Expected: FAIL — `scroll-price-utils.js` 모듈 없음(ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: 유틸 구현**

Create `src/content/dom-modules/scroll-price/scroll-price-utils.js`:

```js
// 스크롤 시세 표시용 순수 유틸 (DOM/네트워크 비의존, Node 검증 가능)

// 시세 조회용 아이템명: '제작 스크롤:<어빌명>' (등급 무관, 이름만)
export function scrollItemName(abilityName) {
  return `제작 스크롤:${abilityName}`;
}

// 금액 포맷: 천단위 콤마 + ' Gold' (정수 반올림)
export function formatGold(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('en-US')} Gold`;
}

// getCurrentPrices 결과로 무데이터 판정 (null이거나 recent/average 모두 0)
export function isNoData(result) {
  if (!result) return true;
  return !result.recent && !result.average;
}

// 표시 라인 배열 생성
// hasData면 ['최근 거래가: X Gold', '30일 평균: Y Gold'], 아니면 ['최근 거래 내역 없음']
export function priceLines(result) {
  if (!result || !result.hasData) {
    return ['최근 거래 내역 없음'];
  }
  return [
    `최근 거래가: ${formatGold(result.recent)}`,
    `30일 평균: ${formatGold(result.average)}`
  ];
}
```

- [ ] **Step 4: 통과 확인**

Run: `node scripts/verify-scroll-price.mjs`
Expected: 모든 PASS 후 `All checks passed`, exit 0.

- [ ] **Step 5: 커밋**

```bash
git add src/content/dom-modules/scroll-price/scroll-price-utils.js scripts/verify-scroll-price.mjs
git commit -m "feat: 스크롤 시세 표시 순수 유틸 추가"
```

---

## Task 2: ScrollPriceService (시세 조회 서비스)

**Files:**
- Create: `src/content/dom-modules/scroll-price/ScrollPriceService.js`

- [ ] **Step 1: 서비스 구현**

Create `src/content/dom-modules/scroll-price/ScrollPriceService.js`:

```js
// 스크롤 시세 조회 서비스 (공유 싱글톤 페처 — 24h 캐시/중복요청 제거 재사용)
import OfficialPriceFetcher from '../../calculator/official-price-fetcher.js';
import { scrollItemName, isNoData } from './scroll-price-utils.js';

// 모듈 싱글톤: 두 기능이 공유하여 같은 스크롤은 세션 내 하루 1회만 실제 요청
const fetcher = new OfficialPriceFetcher();

// 어빌명 → { hasData, recent, average }
export async function fetchScrollPrice(abilityName) {
  try {
    const result = await fetcher.getCurrentPrices(scrollItemName(abilityName));
    if (isNoData(result)) {
      return { hasData: false, recent: 0, average: 0 };
    }
    return { hasData: true, recent: result.recent || 0, average: result.average || 0 };
  } catch (error) {
    console.warn('[ScrollPrice] 시세 조회 실패:', error);
    return { hasData: false, recent: 0, average: 0 };
  }
}
```

- [ ] **Step 2: 빌드 스모크 체크**

Run: `npm run build`
Expected: 성공. (이 서비스는 아직 어디서도 import되지 않아 번들 그래프에 미포함일 수 있음 — 전체 검증은 Task 3에서. import 경로 `../../calculator/official-price-fetcher.js`와 `./scroll-price-utils.js`가 `scroll-price/` 기준으로 맞는지만 확인.)

- [ ] **Step 3: 커밋**

```bash
git add src/content/dom-modules/scroll-price/ScrollPriceService.js
git commit -m "feat: 스크롤 시세 조회 서비스(공유 싱글톤 페처) 추가"
```

---

## Task 3: 스크롤 팝오버에 가격 행 추가

**Files:**
- Modify: `src/content/dom-modules/item-stats/ScrollAbilityAdder.js`

먼저 파일을 READ 하여 현재 내용을 확인한다.

- [ ] **Step 1: import 추가**

상단 import 블록(현재 2~3행: `AbilityInfoDataManager`, `scroll-ability-utils`) 다음에 추가:

```js
import { fetchScrollPrice } from '../scroll-price/ScrollPriceService.js';
import { priceLines } from '../scroll-price/scroll-price-utils.js';
```

- [ ] **Step 2: 효과 행 뒤에 가격 행 추가**

`processScrollPopover`의 마지막 줄:
```js
    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));
```
을 다음으로 교체:
```js
    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));

    // 가격 행(placeholder) 추가 후 비동기 채움
    const priceRow = this.buildPriceRow();
    targetBox.appendChild(priceRow);
    this.loadPrice(priceRow, abilityName);
```

- [ ] **Step 3: 가격 행 빌더/로더/렌더러 메서드 추가**

`buildAbilityRow(...)` 메서드 정의 바로 다음에 아래 세 메서드를 추가:

```js
  // 가격 행(placeholder) 생성
  buildPriceRow() {
    const row = document.createElement('div');
    row.className = 'scroll-price-info';
    row.style.cssText = 'margin-top: 4px;';

    const p = document.createElement('p');
    p.className = 'MuiTypography-root MuiTypography-body2';
    p.style.cssText = 'color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;';
    p.textContent = '거래가 불러오는 중…';

    row.appendChild(p);
    return row;
  }

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

  // 가격 라인들을 행에 렌더 (기존 내용 교체)
  renderPriceLines(row, lines) {
    row.textContent = '';
    lines.forEach((line) => {
      const p = document.createElement('p');
      p.className = 'MuiTypography-root MuiTypography-body2';
      p.style.cssText = 'color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;';
      p.textContent = line;
      row.appendChild(p);
    });
  }
```

- [ ] **Step 4: cleanup에 가격 행 정리 포함**

`cleanup` 메서드의 첫 줄:
```js
    root.querySelectorAll('.scroll-ability-info').forEach((el) => el.remove());
```
을 다음으로 교체:
```js
    root.querySelectorAll('.scroll-ability-info, .scroll-price-info').forEach((el) => el.remove());
```

- [ ] **Step 5: 빌드 검증 (서비스·유틸 체인 실제 검증)**

Run: `npm run build`
Expected: 성공. `ScrollAbilityAdder`는 `ItemStatsProcessor`를 통해 번들에 포함되므로, 이번 빌드가 `ScrollPriceService` + `scroll-price-utils` + `OfficialPriceFetcher` 체인을 실제로 컴파일·검증한다.

- [ ] **Step 6: 커밋**

```bash
git add src/content/dom-modules/item-stats/ScrollAbilityAdder.js
git commit -m "feat: 스크롤 팝오버 하단에 최근 거래가 표기"
```

---

## Task 4: 어빌 클릭 팝오버에 가격 섹션 추가

**Files:**
- Modify: `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js`
- Modify: `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js`

먼저 두 파일을 READ 한다.

### 4A. AbilityPopoverView

- [ ] **Step 1: 생성자에 priceEl 추가**

`constructor()`의 본문:
```js
    this.el = null;      // 현재 팝오버 엘리먼트
    this.anchor = null;  // 팝오버를 띄운 기준 요소
```
을 다음으로 교체:
```js
    this.el = null;      // 현재 팝오버 엘리먼트
    this.anchor = null;  // 팝오버를 띄운 기준 요소
    this.priceEl = null; // 가격 섹션 엘리먼트
```

- [ ] **Step 2: open()에서 priceEl 캐싱**

`open(anchor, data)`의 본문:
```js
    this.close();
    const card = this.buildCard(data);
    document.body.appendChild(card);
    this.el = card;
    this.anchor = anchor;
    this.position(card, anchor);
```
을 다음으로 교체:
```js
    this.close();
    const card = this.buildCard(data);
    document.body.appendChild(card);
    this.el = card;
    this.anchor = anchor;
    this.priceEl = card.querySelector('.lh-ability-price');
    this.position(card, anchor);
```

- [ ] **Step 3: close()에서 priceEl 정리**

`close()`의 본문 끝:
```js
    this.el = null;
    this.anchor = null;
  }
```
을 다음으로 교체:
```js
    this.el = null;
    this.anchor = null;
    this.priceEl = null;
  }
```

- [ ] **Step 4: buildCard에 가격 섹션 placeholder 추가**

`buildCard`의 본문에서, 본문 `<p>`(body)를 카드에 append하는 부분:
```js
    card.appendChild(header);
    card.appendChild(divider);
    card.appendChild(body);
    return card;
```
을 다음으로 교체:
```js
    // 가격 섹션(placeholder) — 매니저가 비동기로 채운다
    const price = document.createElement('div');
    price.className = 'lh-ability-price';
    price.style.cssText = 'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); color: #bbb; font-size: 0.8rem; line-height: 1.4;';
    price.textContent = '거래가 불러오는 중…';

    card.appendChild(header);
    card.appendChild(divider);
    card.appendChild(body);
    card.appendChild(price);
    return card;
```

- [ ] **Step 5: setPriceLines 메서드 추가**

`buildCard` 메서드 정의 다음(또는 `position` 앞)에 메서드 추가:
```js
  // 가격 섹션 갱신 (현재 카드가 열려 있고 섹션이 연결돼 있을 때만)
  setPriceLines(lines) {
    if (!this.priceEl || !this.priceEl.isConnected) return;
    this.priceEl.textContent = '';
    lines.forEach((line) => {
      const p = document.createElement('p');
      p.style.cssText = 'margin: 0;';
      p.textContent = line;
      this.priceEl.appendChild(p);
    });
  }
```

### 4B. AbilityClickPopoverManager

- [ ] **Step 6: import 추가**

상단 import 블록(현재 `AbilityPopoverView` import 포함) 다음에 추가:
```js
import { fetchScrollPrice } from '../scroll-price/ScrollPriceService.js';
import { priceLines } from '../scroll-price/scroll-price-utils.js';
```

- [ ] **Step 7: openFor에서 비동기 시세 로드**

`openFor(anchor)`의 본문 끝:
```js
    this.view.open(anchor, { abilityName, grade, effect });
  }
```
을 다음으로 교체:
```js
    this.view.open(anchor, { abilityName, grade, effect });
    this.loadPrice(anchor, abilityName);
  }

  // 비동기 시세 로드 후 가격 섹션 갱신 (같은 앵커 팝오버가 열려 있을 때만)
  async loadPrice(anchor, abilityName) {
    try {
      const result = await fetchScrollPrice(abilityName);
      if (!this.view.isOpenFor(anchor)) return;
      this.view.setPriceLines(priceLines(result));
    } catch (error) {
      console.warn('[AbilityClickPopover] 시세 표시 오류:', error);
    }
  }
```

- [ ] **Step 8: 빌드 검증**

Run: `npm run build`
Expected: 성공. `AbilityClickPopoverManager`/`AbilityPopoverView`는 `DOMModulesManager`를 통해 번들에 포함되어 가격 섹션 통합이 컴파일·검증된다.

- [ ] **Step 9: 커밋**

```bash
git add src/content/dom-modules/ability-click-popover/AbilityPopoverView.js src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js
git commit -m "feat: 어빌 클릭 팝오버에 최근 거래가 표기"
```

---

## Task 5: 예시 HTML 갱신 + 최종 검증

**Files:**
- Modify: `public/exam/item-popover-example.html`
- Modify: `public/exam/ability-click-popover-example.html`

먼저 두 파일을 READ 한다.

- [ ] **Step 1: 스크롤 팝오버 예시에 가격 행 추가**

`public/exam/item-popover-example.html`에서 스크롤 "처리 후" 예시의 효과 행:
```html
      <div class="MuiBox-root scroll-ability-info" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12);">
        <p class="MuiTypography-root MuiTypography-body2" style="color: #66d9ef; font-size: 0.85rem; line-height: 1.4;">과부하: 스킬 데미지가 25% 증가하지만, MP 소비가 30% 증가한다.</p>
      </div>
```
바로 다음에 가격 행을 추가(아래 블록으로 교체):
```html
      <div class="MuiBox-root scroll-ability-info" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12);">
        <p class="MuiTypography-root MuiTypography-body2" style="color: #66d9ef; font-size: 0.85rem; line-height: 1.4;">과부하: 스킬 데미지가 25% 증가하지만, MP 소비가 30% 증가한다.</p>
      </div>
      <div class="scroll-price-info" style="margin-top: 4px;">
        <p class="MuiTypography-root MuiTypography-body2" style="color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;">최근 거래가: 12,000,000 Gold</p>
        <p class="MuiTypography-root MuiTypography-body2" style="color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;">30일 평균: 10,500,000 Gold</p>
      </div>
```

(참고: 시세는 `제작 스크롤:과부하`로 조회. 위 금액은 예시 값.)

- [ ] **Step 2: 어빌 클릭 팝오버 예시에 가격 섹션 추가**

`public/exam/ability-click-popover-example.html`에서 팝오버 카드의 본문 `<p>` 줄:
```html
  <p style="margin: 0; color: #ddd;">MP 소비가 30% 증가하지만, 적중이 6% 증가하고 마법 방어력을 48만큼 관통한다.</p>
</div>
```
을 다음으로 교체:
```html
  <p style="margin: 0; color: #ddd;">MP 소비가 30% 증가하지만, 적중이 6% 증가하고 마법 방어력을 48만큼 관통한다.</p>
  <div class="lh-ability-price" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); color: #bbb; font-size: 0.8rem; line-height: 1.4;">
    <p style="margin: 0;">최근 거래가: 12,000,000 Gold</p>
    <p style="margin: 0;">30일 평균: 10,500,000 Gold</p>
  </div>
</div>
```

(참고: 시세는 `제작 스크롤:마나 비전`으로 조회. 위 금액은 예시 값.)

- [ ] **Step 3: 순수 유틸 회귀 검증**

Run: `node scripts/verify-scroll-price.mjs`
Expected: `All checks passed`, exit 0.

- [ ] **Step 4: 전체 빌드 검증**

Run: `npm run build`
Expected: 성공(에러 없음).

- [ ] **Step 5: 수동 브라우저 검증 (사용자)**

확장을 빌드해 확인:
1. 스크롤 팝오버를 열면 효과 아래에 `거래가 불러오는 중…` → 잠시 후 `최근 거래가` / `30일 평균` (또는 `최근 거래 내역 없음`)으로 바뀐다.
2. 스크롤 교환 페이지에서 어빌 이름 클릭 시 카드 하단에 동일하게 표시된다.
3. 같은 스크롤을 다시 열면 캐시로 즉시(추가 네트워크 없이) 표시된다.
4. 팝오버를 빠르게 닫았다 열어도 콘솔 오류 없이 동작한다(늦게 온 응답은 무시).
5. 아이템 스카우터 OFF 시 두 팝오버의 효과/가격 모두 비활성·정리된다.

- [ ] **Step 6: 커밋**

```bash
git add public/exam/item-popover-example.html public/exam/ability-click-popover-example.html
git commit -m "docs: 팝오버 예시에 최근 거래가 행 추가"
```

---

## Self-Review 체크리스트 결과

- **Spec coverage:** 조회 키 `제작 스크롤:<어빌명>`(scrollItemName, Task 1) · 두 팝오버 적용(Task 3·4) · 최근+30일평균 표시(priceLines, Task 1) · 무데이터 `최근 거래 내역 없음`(isNoData+priceLines, Task 1) · 비동기 로딩 placeholder(Task 3·4) · isConnected 레이스 가드(loadPrice/setPriceLines, Task 3·4) · 24h 캐시 공유 싱글톤(ScrollPriceService, Task 2) · showItemStats 상속(효과 경로에 부착, Task 3·4) · 금액 포맷 콤마+Gold 반올림(formatGold, Task 1) · 예시(Task 5) — 모두 매핑됨.
- **Placeholder scan:** 없음(모든 코드 블록 완전 기재; 예시 금액은 의도된 샘플 값).
- **Type consistency:** `fetchScrollPrice`→`{hasData,recent,average}`(Task 2) ↔ `priceLines(result)`(Task 1) ↔ 호출부(Task 3·4) 일치. `setPriceLines(lines)`(Task 4A) ↔ 매니저 호출(Task 4B) 일치. `.scroll-price-info`/`.lh-ability-price` 클래스(Task 3·4) ↔ 예시 HTML(Task 5) 일치.
```
