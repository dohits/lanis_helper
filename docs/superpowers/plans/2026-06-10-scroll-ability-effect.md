# 스크롤 어빌리티 효과 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스크롤 팝오버(`제작 스크롤:<어빌명>`)에 해당 어빌리티의 실제 효과를 본문 하단에 표시한다.

**Architecture:** 순수 파싱/매칭 로직을 DOM·chrome 비의존 유틸로 분리하고(Node로 검증 가능), 이를 사용하는 `ScrollAbilityAdder` DOM 모듈을 추가한다. `ItemStatsProcessor`가 기존 위력/무게 감정 패스에 더해 스크롤 팝오버 전용 패스를 호출한다. 전체 어빌리티(직업·장비)를 대상으로 공백 정규화 매칭한다.

**Tech Stack:** Vanilla JS (ES modules), Vite 7, Chrome Extension. 테스트 러너 없음 — 순수 로직은 Node `.mjs` 스크립트, 통합은 `npm run build` + 예시 HTML로 검증.

---

## File Structure

- **Create** `src/content/dom-modules/item-stats/scroll-ability-utils.js` — 순수 함수: `normalizeAbilityName`, `extractScrollAbilityName`, `findAbilityEffect`. DOM/chrome/JSON 미의존(Node에서 import 가능).
- **Create** `src/content/dom-modules/item-stats/ScrollAbilityAdder.js` — 위 유틸 + `AbilityInfoDataManager`를 사용해 스크롤 팝오버에 효과 행을 추가하는 클래스.
- **Modify** `src/content/dom-modules/item-stats/ItemStatsProcessor.js` — `ScrollAbilityAdder` 통합(생성/init 로드/process/remove).
- **Create** `scripts/verify-scroll-ability.mjs` — 순수 유틸을 실제 `ability-data.json`에 대해 검증하는 Node 스크립트.
- **Modify** `public/exam/item-popover-example.html` — 스크롤 팝오버 원본/처리 후 예시 추가(참조 문서).

---

## Task 1: 순수 파싱/매칭 유틸 + Node 검증

**Files:**
- Create: `src/content/dom-modules/item-stats/scroll-ability-utils.js`
- Create: `scripts/verify-scroll-ability.mjs`

- [ ] **Step 1: 검증 스크립트 작성 (실패하는 테스트 먼저)**

Create `scripts/verify-scroll-ability.mjs`:

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  extractScrollAbilityName,
  findAbilityEffect
} from '../src/content/dom-modules/item-stats/scroll-ability-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, '../src/shared/ability-data.json'), 'utf-8')
);

let failed = 0;
function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// 어빌명 추출: 끝의 (금) 같은 괄호부 제거 후 콜론 뒤
check('extract basic', extractScrollAbilityName('제작 스크롤:과부하(금)'), '과부하');
check('extract fullwidth colon', extractScrollAbilityName('제작 스크롤：천운(은)'), '천운');
check('extract no colon -> null', extractScrollAbilityName('고통의 나이프'), null);

// 매칭: 전체 어빌(장비/직업) 대상, 공백 정규화
check('equip ability (과부하)', findAbilityEffect(data, '과부하'), '스킬 데미지가 25% 증가하지만, MP 소비가 30% 증가한다.');
check('spacing normalize (냉기 돌풍 -> 냉기돌풍)', findAbilityEffect(data, '냉기 돌풍'), '매 공격마다 10% 확률로 상대방을 빙결 상태로 만든다.');
check('job ability (블록)', findAbilityEffect(data, '블록'), '적의 공격을 3.5% 확률로 무효화');
check('not found -> null', findAbilityEffect(data, '존재하지않는어빌'), null);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
```

- [ ] **Step 2: 실패 확인**

Run: `node scripts/verify-scroll-ability.mjs`
Expected: FAIL — `scroll-ability-utils.js` 모듈을 찾을 수 없어 import 에러(ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: 유틸 구현**

Create `src/content/dom-modules/item-stats/scroll-ability-utils.js`:

```js
// 스크롤 어빌리티 매칭 유틸 (순수 함수 — DOM/chrome/JSON 비의존, Node 검증 가능)

// 어빌명 정규화: 공백(일반/NBSP) 제거 후 소문자화 (표기 차이 흡수: '냉기 돌풍' ↔ '냉기돌풍')
export function normalizeAbilityName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[\s ]/g, '').toLowerCase();
}

// 스크롤 아이템명에서 어빌명 추출
// 예) "제작 스크롤:과부하(금)" -> "과부하"
// - 끝의 괄호부(색상/등급 표기, 반각/전각 모두)를 제거한 뒤 콜론(반각/전각) 뒤를 어빌명으로 사용
export function extractScrollAbilityName(itemNameText) {
  if (typeof itemNameText !== 'string') return null;
  const withoutTrailingParen = itemNameText
    .replace(/\s*[\(（][^\)）]*[\)）]\s*$/, '')
    .trim();
  const parts = withoutTrailingParen.split(/[:：]/);
  if (parts.length < 2) return null;
  const abilityName = parts.slice(1).join(':').trim();
  return abilityName || null;
}

// 어빌 목록에서 효과 찾기 (정규화 비교, 동일명 중복 시 첫 매칭)
export function findAbilityEffect(abilityList, abilityName) {
  if (!Array.isArray(abilityList)) return null;
  const target = normalizeAbilityName(abilityName);
  if (!target) return null;
  const match = abilityList.find(
    (item) => normalizeAbilityName(item && item['어빌리티명']) === target
  );
  return match && match['효과'] ? match['효과'] : null;
}
```

- [ ] **Step 4: 통과 확인**

Run: `node scripts/verify-scroll-ability.mjs`
Expected: PASS — 모든 check 출력 후 `All checks passed`, exit code 0.

(참고: Vite 7은 Node 20.19+/22.12+를 요구하며 해당 버전은 `.js` ESM 자동 감지가 기본 활성화되어 `.mjs`에서 `.js` 유틸 import가 동작한다.)

- [ ] **Step 5: 커밋**

```bash
git add src/content/dom-modules/item-stats/scroll-ability-utils.js scripts/verify-scroll-ability.mjs
git commit -m "feat: 스크롤 어빌명 파싱/매칭 순수 유틸 추가"
```

---

## Task 2: ScrollAbilityAdder DOM 모듈

**Files:**
- Create: `src/content/dom-modules/item-stats/ScrollAbilityAdder.js`

- [ ] **Step 1: 모듈 구현**

Create `src/content/dom-modules/item-stats/ScrollAbilityAdder.js`:

```js
// 스크롤 팝오버에 어빌리티 효과를 표시하는 모듈
import AbilityInfoDataManager from '../ability-info/AbilityInfoDataManager.js';
import { extractScrollAbilityName, findAbilityEffect } from './scroll-ability-utils.js';

class ScrollAbilityAdder {
  constructor() {
    this.dataManager = new AbilityInfoDataManager();
    this.abilityList = [];
  }

  // 어빌 데이터 로드 (실패 시 번들 데이터 폴백)
  async init() {
    try {
      this.abilityList = await this.dataManager.load();
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 어빌 데이터 로드 실패, 번들 데이터 사용:', error);
      this.abilityList = this.dataManager.getAbilityDataFromFile();
    }
  }

  // 문서 전체에서 스크롤 팝오버를 찾아 처리
  processScrollPopovers(root = document) {
    try {
      const papers = root.querySelectorAll('.MuiPaper-root.MuiPopover-paper, .MuiPopover-paper');
      papers.forEach((paper) => this.processScrollPopover(paper));
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 스크롤 팝오버 처리 중 오류:', error);
    }
  }

  // 단일 팝오버 처리
  processScrollPopover(paper) {
    if (!paper || paper.classList.contains('scroll-ability-processed')) return;

    // 아이템명 후보: 팝오버 내 첫 body2 단락
    const nameEl = paper.querySelector('p.MuiTypography-root.MuiTypography-body2');
    if (!nameEl) return;

    const nameText = nameEl.textContent.trim();
    // 스크롤 판정: 이름에 '스크롤' 포함 + 콜론(반각/전각) 존재
    if (!nameText.includes('스크롤') || !/[:：]/.test(nameText)) return;

    const abilityName = extractScrollAbilityName(nameText);
    if (!abilityName) return;

    // 어빌 데이터가 아직 로드 전이면 마킹하지 않고 다음 기회에 재시도
    if (!Array.isArray(this.abilityList) || this.abilityList.length === 0) return;

    const effect = findAbilityEffect(this.abilityList, abilityName);

    // 데이터는 있으나 매칭 실패한 경우도 재처리 방지 위해 마킹
    paper.classList.add('scroll-ability-processed');
    if (!effect) return; // 매칭 실패: 아무것도 표시하지 않음

    const targetBox =
      paper.querySelector('.MuiBox-root.css-1821gv5') ||
      paper.querySelector('.MuiBox-root');
    if (!targetBox) return;

    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));
  }

  // 효과 표시 행 생성
  buildAbilityRow(abilityName, effect) {
    const row = document.createElement('div');
    row.className = 'MuiBox-root scroll-ability-info';
    row.style.cssText =
      'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12);';

    const p = document.createElement('p');
    p.className = 'MuiTypography-root MuiTypography-body2';
    p.style.cssText = 'color: #66d9ef; font-size: 0.85rem; line-height: 1.4;';
    p.textContent = `${abilityName}: ${effect}`;

    row.appendChild(p);
    return row;
  }

  // 추가 요소 정리 (스카우터 OFF/해제 시)
  cleanup(root = document) {
    root.querySelectorAll('.scroll-ability-info').forEach((el) => el.remove());
    root
      .querySelectorAll('.scroll-ability-processed')
      .forEach((el) => el.classList.remove('scroll-ability-processed'));
  }
}

export default ScrollAbilityAdder;
```

- [ ] **Step 2: 빌드로 import/문법 검증**

Run: `npm run build`
Expected: 성공(에러 없이 `dist` 생성). `ScrollAbilityAdder.js`의 import 경로/문법 오류가 없음을 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/content/dom-modules/item-stats/ScrollAbilityAdder.js
git commit -m "feat: 스크롤 팝오버 어빌 효과 표시 모듈(ScrollAbilityAdder) 추가"
```

---

## Task 3: ItemStatsProcessor 통합

**Files:**
- Modify: `src/content/dom-modules/item-stats/ItemStatsProcessor.js`

- [ ] **Step 1: import 및 인스턴스 추가**

`ItemStatsProcessor.js` 상단 import 블록(현재 `FinalTagAdder` import 다음 줄)에 추가:

```js
import ScrollAbilityAdder from './ScrollAbilityAdder.js';
```

constructor를 다음과 같이 수정:

```js
  constructor() {
    this.gradeCalculator = new GradeCalculator();
    this.rangeInfoAdder = new RangeInfoAdder();
    this.finalTagAdder = new FinalTagAdder();
    this.scrollAbilityAdder = new ScrollAbilityAdder();
  }
```

- [ ] **Step 2: init에서 어빌 데이터 로드**

현재 비어있는 `init()`을 다음으로 교체:

```js
  async init() {
    // 위력/무게는 DOM 기반 계산이라 데이터 로드 불필요.
    // 스크롤 어빌 효과 표시를 위해 어빌 데이터만 로드한다.
    await this.scrollAbilityAdder.init();
  }
```

- [ ] **Step 3: processItemStats에 스크롤 패스 추가**

`processItemStats()`의 `try {` 바로 다음 줄(첫 `const itemContainers = ...` 위)에 추가:

```js
      // 스크롤 팝오버 전용 패스 (위력/무게가 없는 별도 구조)
      this.scrollAbilityAdder.processScrollPopovers();
```

- [ ] **Step 4: removeItemStats에 정리 추가**

`removeItemStats()` 메서드 끝(마지막 `processedElements.forEach(...)` 블록 다음)에 추가:

```js
    // 스크롤 어빌 효과 요소 정리
    this.scrollAbilityAdder.cleanup();
```

- [ ] **Step 5: 빌드 검증**

Run: `npm run build`
Expected: 성공. 통합된 `ItemStatsProcessor.js`가 에러 없이 번들됨.

- [ ] **Step 6: 커밋**

```bash
git add src/content/dom-modules/item-stats/ItemStatsProcessor.js
git commit -m "feat: ItemStatsProcessor에 스크롤 어빌 효과 패스 통합"
```

---

## Task 4: 예시 HTML 추가 + 최종 검증

**Files:**
- Modify: `public/exam/item-popover-example.html`

- [ ] **Step 1: 스크롤 팝오버 예시 추가**

`public/exam/item-popover-example.html` 파일 맨 끝(마지막 `</div>` 다음)에 추가:

```html

<!--
=== 스크롤 팝오버 구조 (신규 카테고리) ===
- 위력/무게가 없는 별도 구조 (css-18csvm3 래퍼)
- 아이템명: "제작 스크롤:<어빌명>" + 색상/등급 span (예: (금))
- 타입: "제작"
- 본문: "'<어빌명>' 어빌리티가 부여된 장비를 제작할 때 사용합니다."
- ScrollAbilityAdder가 이름에 '스크롤'+콜론이 있으면 어빌명을 추출하여
  ability-data.json에서 효과를 찾아 본문 하단에 .scroll-ability-info 행으로 추가한다.
-->

<!-- 스크롤 팝오버 원본 (스카우터 적용 전) -->
<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation8 MuiPopover-paper css-szzq31" tabindex="-1" style="--Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); opacity: 1; transform: none; top: 829px; left: 26px; transform-origin: 2.8px 0px;">
  <div class="MuiBox-root css-18csvm3">
    <div class="MuiBox-root css-1g9e0mr">
      <div class="MuiBox-root css-0">
        <p class="MuiTypography-root MuiTypography-body2 css-rgjqpd">제작 스크롤:과부하<span class="MuiTypography-root MuiTypography-body1 css-1003q18">(금)</span></p>
      </div>
      <div class="MuiBox-root css-171onha">
        <p class="MuiTypography-root MuiTypography-body2 css-nhjr0n">제작</p>
      </div>
    </div>
    <div class="MuiBox-root css-1821gv5">
      <div class="MuiBox-root css-0">
        <p class="MuiTypography-root MuiTypography-body2 css-nhjr0n">'과부하' 어빌리티가 부여된 장비를 제작할 때 사용합니다.</p>
      </div>
    </div>
  </div>
</div>

<!-- 스크롤 팝오버 처리 후 (ScrollAbilityAdder 적용: scroll-ability-info 행 추가, scroll-ability-processed 마킹) -->
<div class="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation8 MuiPopover-paper css-szzq31 scroll-ability-processed" tabindex="-1" style="--Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); opacity: 1; transform: none; top: 829px; left: 26px; transform-origin: 2.8px 0px;">
  <div class="MuiBox-root css-18csvm3">
    <div class="MuiBox-root css-1g9e0mr">
      <div class="MuiBox-root css-0">
        <p class="MuiTypography-root MuiTypography-body2 css-rgjqpd">제작 스크롤:과부하<span class="MuiTypography-root MuiTypography-body1 css-1003q18">(금)</span></p>
      </div>
      <div class="MuiBox-root css-171onha">
        <p class="MuiTypography-root MuiTypography-body2 css-nhjr0n">제작</p>
      </div>
    </div>
    <div class="MuiBox-root css-1821gv5">
      <div class="MuiBox-root css-0">
        <p class="MuiTypography-root MuiTypography-body2 css-nhjr0n">'과부하' 어빌리티가 부여된 장비를 제작할 때 사용합니다.</p>
      </div>
      <div class="MuiBox-root scroll-ability-info" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12);">
        <p class="MuiTypography-root MuiTypography-body2" style="color: #66d9ef; font-size: 0.85rem; line-height: 1.4;">과부하: 스킬 데미지가 25% 증가하지만, MP 소비가 30% 증가한다.</p>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 순수 유틸 회귀 검증**

Run: `node scripts/verify-scroll-ability.mjs`
Expected: PASS — `All checks passed`.

- [ ] **Step 3: 전체 빌드 검증**

Run: `npm run build`
Expected: 성공(에러 없음).

- [ ] **Step 4: 수동 브라우저 검증 (사용자)**

확장을 빌드해 게임 사이트에서 스크롤 아이템 팝오버를 연다. 확인 항목:
1. `제작 스크롤:<어빌명>` 팝오버 본문 하단에 `<어빌명>: <효과>` 행이 표시된다.
2. 팝오버를 다시 열어도 효과 행이 중복되지 않는다.
3. 아이템 스카우터를 OFF로 하면(또는 `removeItemStats` 경로) 효과 행이 제거된다.
4. 장비/일반 아이템 팝오버의 기존 위력/무게 감정은 영향받지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add public/exam/item-popover-example.html
git commit -m "docs: 스크롤 팝오버 예시(원본/처리 후) 추가"
```

---

## Self-Review 체크리스트 결과

- **Spec coverage:** 감지(Task 2/3) · 어빌명 추출(Task 1) · 전체 어빌 매칭+정규화(Task 1) · 효과만 표시(Task 2) · 매칭 실패 미표시(Task 2) · showItemStats 연동(기존 processItemStats 경로 재사용, Task 3) · idempotent+정리(Task 2/3) · 예시 HTML(Task 4) — 모두 태스크에 매핑됨.
- **Placeholder scan:** 없음(모든 코드 블록 완전 기재).
- **Type consistency:** `extractScrollAbilityName`/`normalizeAbilityName`/`findAbilityEffect`(Task 1) ↔ `ScrollAbilityAdder`(Task 2) ↔ `processScrollPopovers`/`cleanup` 호출(Task 3) 시그니처 일치.
```
