# 어빌리티 이름 클릭 → 효과 팝오버 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스크롤 교환 페이지에서 어빌리티 이름을 클릭하면 그 어빌리티의 효과를 다크 카드 팝오버로 보여준다.

**Architecture:** 신규 DOM 모듈을 둘로 분리한다 — `AbilityPopoverView`(단일 팝오버 엘리먼트의 생성·위치·열기/닫기)와 `AbilityClickPopoverManager`(어빌 데이터 로드, MutationObserver 스캔/마킹, 위임 클릭 처리, `showItemStats` 게이팅). 어빌명 매칭은 기존 `scroll-ability-utils`의 `findAbilityEffect`를 재사용한다. `DOMModulesManager`에 등록하고 기존 `processItemStats`/`removeItemStats` 라이프사이클에 `setEnabled(true/false)`로 연결한다.

**Tech Stack:** Vanilla JS (ES modules), Vite 7, Chrome Extension. 테스트 러너 없음 — 매칭 로직은 기존 `scripts/verify-scroll-ability.mjs`로 이미 검증됨(재사용), DOM 통합은 `npm run build` + 예시 HTML + 수동 브라우저 확인.

---

## File Structure

- **Create** `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js` — 단일 팝오버 카드의 DOM 생성/위치 계산/열기·닫기. 한 번에 하나만 존재.
- **Create** `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js` — 어빌 데이터 로드, 옵저버 스캔/마킹, document 위임 클릭·Esc 처리, enable/disable 게이팅, destroy. `AbilityPopoverView` 사용.
- **Modify** `src/content/dom-modules/DOMModulesManager.js` — 신규 매니저 등록 및 라이프사이클 연결.
- **Create** `public/exam/ability-click-popover-example.html` — 스크롤 교환 행 + 생성되는 팝오버 예시(참조 문서).

재사용(수정 없음): `src/content/dom-modules/item-stats/scroll-ability-utils.js`(`findAbilityEffect`), `src/content/dom-modules/ability-info/AbilityInfoDataManager.js`(`load`, `getAbilityDataFromFile`).

---

## Task 1: AbilityPopoverView (팝오버 카드 뷰)

**Files:**
- Create: `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js`

- [ ] **Step 1: 뷰 모듈 구현**

Create `src/content/dom-modules/ability-click-popover/AbilityPopoverView.js`:

```js
// 어빌리티 효과 팝오버(단일 카드) 뷰 — 생성/위치/열기/닫기만 담당
const POPOVER_ID = 'lh-ability-popover';

class AbilityPopoverView {
  constructor() {
    this.el = null;      // 현재 팝오버 엘리먼트
    this.anchor = null;  // 팝오버를 띄운 기준 요소
  }

  // anchor에 대해 이미 열려 있는가 (토글 판정용)
  isOpenFor(anchor) {
    return this.el !== null && this.anchor === anchor;
  }

  isOpen() {
    return this.el !== null;
  }

  // 주어진 노드가 팝오버 내부인가 (바깥 클릭 판정용)
  contains(node) {
    return this.el ? this.el.contains(node) : false;
  }

  // 팝오버 열기 ({ abilityName, grade, effect })
  open(anchor, data) {
    this.close();
    const card = this.buildCard(data);
    document.body.appendChild(card);
    this.el = card;
    this.anchor = anchor;
    this.position(card, anchor);
  }

  close() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this.anchor = null;
  }

  // 다크 카드 DOM 생성 (textContent만 사용 — XSS 안전)
  buildCard({ abilityName, grade, effect }) {
    const card = document.createElement('div');
    card.id = POPOVER_ID;
    card.style.cssText = [
      'position: absolute',
      'z-index: 99999',
      'max-width: 280px',
      'background: #2b2b2b',
      'color: #eee',
      'border: 1px solid rgba(255,255,255,0.15)',
      'border-radius: 8px',
      'box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      'padding: 10px 12px',
      'font-size: 0.85rem',
      'line-height: 1.45'
    ].join(';');

    // 헤더: 어빌명 + (등급) + 타입 라벨
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px;';

    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-weight: bold; color: #fff;';
    nameSpan.textContent = abilityName;
    header.appendChild(nameSpan);

    if (grade) {
      const gradeSpan = document.createElement('span');
      gradeSpan.style.cssText = 'color: #aaa; font-size: 0.8rem;';
      gradeSpan.textContent = `(${grade})`;
      header.appendChild(gradeSpan);
    }

    const typeSpan = document.createElement('span');
    typeSpan.style.cssText = 'margin-left: auto; color: #888; font-size: 0.75rem;';
    typeSpan.textContent = '어빌리티';
    header.appendChild(typeSpan);

    // 구분선
    const divider = document.createElement('div');
    divider.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.12); margin: 0 0 6px 0;';

    // 본문: 효과
    const body = document.createElement('p');
    body.style.cssText = 'margin: 0; color: #ddd;';
    body.textContent = effect;

    card.appendChild(header);
    card.appendChild(divider);
    card.appendChild(body);
    return card;
  }

  // 기준 요소 아래에 앵커하고 뷰포트 경계를 보정
  position(card, anchor) {
    const rect = anchor.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    let left = rect.left + scrollX;
    let top = rect.bottom + scrollY + 6;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    // 경계 보정 (배치 후 실제 크기로 계산)
    const popRect = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (popRect.right > vw - 8) {
      left = Math.max(8 + scrollX, vw - popRect.width - 8 + scrollX);
      card.style.left = `${left}px`;
    }
    if (popRect.bottom > vh - 8) {
      // 아래 공간 부족 → 기준 요소 위로
      top = rect.top + scrollY - popRect.height - 6;
      card.style.top = `${Math.max(8 + scrollY, top)}px`;
    }
  }
}

export default AbilityPopoverView;
```

- [ ] **Step 2: 빌드 스모크 체크**

Run: `npm run build`
Expected: 성공(에러 없음). (이 파일은 아직 import되지 않아 번들 그래프에 포함되지 않을 수 있음 — 전체 검증은 Task 3에서 수행. 여기서는 빌드가 깨지지 않는지만 확인.)

- [ ] **Step 3: 커밋**

```bash
git add src/content/dom-modules/ability-click-popover/AbilityPopoverView.js
git commit -m "feat: 어빌 효과 팝오버 카드 뷰(AbilityPopoverView) 추가"
```

---

## Task 2: AbilityClickPopoverManager (감지·마킹·이벤트)

**Files:**
- Create: `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js`

- [ ] **Step 1: 매니저 모듈 구현**

Create `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js`:

```js
// 어빌리티 이름 클릭 → 효과 팝오버 매니저
import AbilityInfoDataManager from '../ability-info/AbilityInfoDataManager.js';
import { findAbilityEffect } from '../item-stats/scroll-ability-utils.js';
import AbilityPopoverView from './AbilityPopoverView.js';

const CLICKABLE_CLASS = 'lh-ability-clickable';

class AbilityClickPopoverManager {
  constructor() {
    this.dataManager = new AbilityInfoDataManager();
    this.abilityList = [];
    this.enabled = true;
    this.observer = null;
    this.view = new AbilityPopoverView();
    // 이벤트 핸들러 바인딩 (제거 가능하도록 안정 참조 유지)
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async init() {
    // 어빌 데이터 로드 (실패 시 번들 폴백)
    try {
      this.abilityList = await this.dataManager.load();
    } catch (error) {
      console.warn('[AbilityClickPopover] 어빌 데이터 로드 실패, 번들 데이터 사용:', error);
      this.abilityList = this.dataManager.getAbilityDataFromFile();
    }

    // 초기 활성 상태를 설정에서 읽음 (showItemStats 연동)
    this.enabled = await this.loadEnabledSetting();

    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
    this.startObserver();

    if (this.enabled) this.scan();
  }

  // itemStatsSettings.showItemStats 읽기 (기본 true)
  loadEnabledSetting() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['itemStatsSettings'], (result) => {
          const s = result && result.itemStatsSettings;
          resolve(s ? s.showItemStats !== false : true);
        });
      } catch (error) {
        resolve(true);
      }
    });
  }

  // 외부(라이프사이클)에서 활성/비활성 전환
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.scan();
    } else {
      this.view.close();
      this.unmarkAll();
    }
  }

  startObserver() {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        setTimeout(() => {
          if (this.enabled) this.scan();
        }, 100);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // 어빌명 후보 탐색 및 클릭 가능 마킹
  scan() {
    try {
      const candidates = document.querySelectorAll('p.MuiTypography-root.MuiTypography-body2');
      candidates.forEach((p) => {
        if (p.classList.contains(CLICKABLE_CLASS)) return;
        if (!this.isAbilityNameElement(p)) return;
        const text = p.textContent.trim();
        const effect = findAbilityEffect(this.abilityList, text);
        if (!effect) return; // 데이터에 없는 이름은 비활성
        this.markClickable(p, text);
      });
    } catch (error) {
      console.warn('[AbilityClickPopover] 스캔 오류:', error);
    }
  }

  // 등급 span 형제를 가진 어빌명 p 구조인지 (해시 비의존 판정)
  isAbilityNameElement(p) {
    const prev = p.previousElementSibling;
    if (!prev || prev.tagName !== 'SPAN') return false;
    const gradeText = prev.textContent.trim();
    // 등급 라벨은 짧다(보통 1~2자). 비거나 너무 길면 어빌 행이 아님.
    if (gradeText.length < 1 || gradeText.length > 3) return false;
    return true;
  }

  markClickable(p, abilityName) {
    p.classList.add(CLICKABLE_CLASS);
    p.dataset.lhAbility = abilityName;
    p.style.cursor = 'pointer';
    p.style.textDecoration = 'underline dotted';
    p.style.textUnderlineOffset = '2px';
  }

  unmarkAll() {
    document.querySelectorAll('.' + CLICKABLE_CLASS).forEach((p) => {
      p.classList.remove(CLICKABLE_CLASS);
      delete p.dataset.lhAbility;
      p.style.cursor = '';
      p.style.textDecoration = '';
      p.style.textUnderlineOffset = '';
    });
  }

  onDocumentClick(event) {
    const target = event.target.closest
      ? event.target.closest('.' + CLICKABLE_CLASS)
      : null;

    if (target && this.enabled) {
      event.preventDefault();
      event.stopPropagation();
      // 같은 요소 재클릭 → 토글로 닫기
      if (this.view.isOpenFor(target)) {
        this.view.close();
        return;
      }
      this.openFor(target);
      return;
    }

    // 팝오버 바깥 클릭 → 닫기 (내부 클릭은 무시)
    if (this.view.isOpen() && !this.view.contains(event.target)) {
      this.view.close();
    }
  }

  onKeyDown(event) {
    if (event.key === 'Escape') this.view.close();
  }

  openFor(anchor) {
    const abilityName = anchor.dataset.lhAbility;
    const effect = findAbilityEffect(this.abilityList, abilityName);
    if (!effect) return;
    const gradeEl = anchor.previousElementSibling;
    const grade = gradeEl ? gradeEl.textContent.trim() : '';
    this.view.open(anchor, { abilityName, grade, effect });
  }

  destroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.view.close();
    this.unmarkAll();
  }
}

export default AbilityClickPopoverManager;
```

- [ ] **Step 2: 빌드 스모크 체크**

Run: `npm run build`
Expected: 성공. (아직 DOMModulesManager에서 import되지 않으므로 전체 검증은 Task 3에서. 빌드가 깨지지 않는지 확인.)

- [ ] **Step 3: 커밋**

```bash
git add src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js
git commit -m "feat: 어빌 이름 클릭 감지·팝오버 매니저(AbilityClickPopoverManager) 추가"
```

---

## Task 3: DOMModulesManager 통합

**Files:**
- Modify: `src/content/dom-modules/DOMModulesManager.js`

먼저 파일을 READ 하여 현재 내용을 확인한다. 현재 구조: 상단 import들, `constructor`의 `this.modules = { ... }`, `async init()`, `processItemStats()`, `removeItemStats()`, `destroy()`.

- [ ] **Step 1: import 추가**

기존 import 블록의 마지막 줄(현재 `import { NicknameChecker } from './nickname-checker/NicknameChecker.js';`) 다음에 추가:

```js
import AbilityClickPopoverManager from './ability-click-popover/AbilityClickPopoverManager.js';
```

- [ ] **Step 2: 모듈 등록**

현재 constructor의 `this.modules` 객체:
```js
    this.modules = {
      profileEnhancement: new ProfileEnhancementManager(),
      searchEngine: new SearchEngineManager(),
      itemStats: new ItemStatsManager(),
      nicknameChecker: new NicknameChecker()
    };
```
를 다음으로 교체:
```js
    this.modules = {
      profileEnhancement: new ProfileEnhancementManager(),
      searchEngine: new SearchEngineManager(),
      itemStats: new ItemStatsManager(),
      nicknameChecker: new NicknameChecker(),
      abilityClickPopover: new AbilityClickPopoverManager()
    };
```

- [ ] **Step 3: init에서 초기화**

현재 `init()`의 모듈 초기화 블록:
```js
      // 모든 DOM 모듈 초기화
      await this.modules.profileEnhancement.init();
      await this.modules.searchEngine.init();
      await this.modules.itemStats.init();
      this.modules.nicknameChecker.init();
```
를 다음으로 교체(마지막 줄 추가):
```js
      // 모든 DOM 모듈 초기화
      await this.modules.profileEnhancement.init();
      await this.modules.searchEngine.init();
      await this.modules.itemStats.init();
      this.modules.nicknameChecker.init();
      await this.modules.abilityClickPopover.init();
```

- [ ] **Step 4: processItemStats에서 활성화**

현재:
```js
  // 아이템 스탯 관련 메서드들
  async processItemStats() {
    await this.modules.itemStats.processItemStats();
  }
```
를 다음으로 교체:
```js
  // 아이템 스탯 관련 메서드들
  async processItemStats() {
    await this.modules.itemStats.processItemStats();
    // 어빌 클릭 팝오버도 showItemStats 연동 (켜짐)
    this.modules.abilityClickPopover.setEnabled(true);
  }
```

- [ ] **Step 5: removeItemStats에서 비활성화**

현재:
```js
  removeItemStats() {
    this.modules.itemStats.removeItemStats();
  }
```
를 다음으로 교체:
```js
  removeItemStats() {
    this.modules.itemStats.removeItemStats();
    // 어빌 클릭 팝오버도 showItemStats 연동 (꺼짐: 마킹 제거 + 팝오버 닫기)
    this.modules.abilityClickPopover.setEnabled(false);
  }
```

- [ ] **Step 6: destroy에서 정리**

현재 `destroy()`의 try 블록:
```js
      this.modules.profileEnhancement.destroy();
      this.modules.itemStats.removeItemStats();
      this.modules.nicknameChecker.destroy();
```
를 다음으로 교체(마지막 줄 추가):
```js
      this.modules.profileEnhancement.destroy();
      this.modules.itemStats.removeItemStats();
      this.modules.nicknameChecker.destroy();
      this.modules.abilityClickPopover.destroy();
```

- [ ] **Step 7: 전체 빌드 검증 (import 체인 실제 검증)**

Run: `npm run build`
Expected: 성공. 이제 `AbilityClickPopoverManager` → `AbilityPopoverView` → `scroll-ability-utils`/`AbilityInfoDataManager` 체인이 모두 번들 그래프에 포함되어 검증된다. 모듈 수가 이전보다 증가하는지 확인(신규 2개 파일 포함).

- [ ] **Step 8: 커밋**

```bash
git add src/content/dom-modules/DOMModulesManager.js
git commit -m "feat: DOMModulesManager에 어빌 클릭 팝오버 모듈 등록·연동"
```

---

## Task 4: 예시 HTML + 최종 검증

**Files:**
- Create: `public/exam/ability-click-popover-example.html`

- [ ] **Step 1: 예시 HTML 작성**

Create `public/exam/ability-click-popover-example.html`:

```html
<!--
어빌리티 이름 클릭 → 효과 팝오버 예시 (참조 문서)

대상 페이지: https://lanis.me/refinery?section=craft&tab=scroll-exchange

감지 규칙(AbilityClickPopoverManager):
- 후보: 앞에 등급 <span> 형제를 가진 p.MuiTypography-body2
- ability-data.json에 정규화 매칭되는 이름만 .lh-ability-clickable 로 마킹
  (커서 포인터 + 점선 밑줄). data-lh-ability 속성에 어빌명 저장.
- 클릭 시 AbilityPopoverView가 #lh-ability-popover 다크 카드를 요소 아래에 생성.
- 바깥 클릭 / 같은 이름 재클릭 / Esc 로 닫힘. 한 번에 하나만.
-->

<!-- 스크롤 교환 행 (원본) -->
<div class="MuiBox-root css-1gvspc2">
  <div class="MuiBox-root css-1fjtzvx">
    <div class="MuiBox-root css-2hjtak">
      <span class="MuiBox-root css-1rvpxpb">은</span>
      <p class="MuiTypography-root MuiTypography-body2 css-15p2vbb">마나 비전</p>
    </div>
    <span class="MuiTypography-root MuiTypography-caption css-6275ju">보유 2</span>
  </div>
</div>

<!-- 마킹 후 (클릭 가능 표시: 커서/점선 밑줄 + data 속성) -->
<div class="MuiBox-root css-1gvspc2">
  <div class="MuiBox-root css-1fjtzvx">
    <div class="MuiBox-root css-2hjtak">
      <span class="MuiBox-root css-1rvpxpb">은</span>
      <p class="MuiTypography-root MuiTypography-body2 css-15p2vbb lh-ability-clickable" data-lh-ability="마나 비전" style="cursor: pointer; text-decoration: underline dotted; text-underline-offset: 2px;">마나 비전</p>
    </div>
    <span class="MuiTypography-root MuiTypography-caption css-6275ju">보유 2</span>
  </div>
</div>

<!-- 클릭 시 생성되는 팝오버 카드 (AbilityPopoverView 출력 예시) -->
<div id="lh-ability-popover" style="position: absolute; z-index: 99999; max-width: 280px; background: #2b2b2b; color: #eee; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 10px 12px; font-size: 0.85rem; line-height: 1.45;">
  <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px;">
    <span style="font-weight: bold; color: #fff;">마나 비전</span>
    <span style="color: #aaa; font-size: 0.8rem;">(은)</span>
    <span style="margin-left: auto; color: #888; font-size: 0.75rem;">어빌리티</span>
  </div>
  <div style="border-top: 1px solid rgba(255,255,255,0.12); margin: 0 0 6px 0;"></div>
  <p style="margin: 0; color: #ddd;">MP 소비가 30% 증가하지만, 적중이 6% 증가하고 마법 방어력을 48만큼 관통한다.</p>
</div>
```

- [ ] **Step 2: 매칭 회귀 검증 (기존 스크립트 재사용)**

Run: `node scripts/verify-scroll-ability.mjs`
Expected: `All checks passed`, exit 0. (이 기능이 사용하는 `findAbilityEffect`가 여전히 정상인지 확인. `마나 비전` 효과 문자열은 `src/shared/ability-data.json`의 `마나 비전` 항목과 일치해야 함: `MP 소비가 30% 증가하지만, 적중이 6% 증가하고 마법 방어력을 48만큼 관통한다.`)

- [ ] **Step 3: 전체 빌드 검증**

Run: `npm run build`
Expected: 성공(에러 없음).

- [ ] **Step 4: 수동 브라우저 검증 (사용자)**

확장을 빌드해 `https://lanis.me/refinery?section=craft&tab=scroll-exchange`에서 확인:
1. 어빌리티 이름에 점선 밑줄 + 포인터 커서가 생긴다.
2. 이름 클릭 시 아래에 다크 카드 팝오버가 뜨고 효과가 보인다.
3. 같은 이름 재클릭 / 바깥 클릭 / Esc 로 닫힌다. 다른 이름 클릭 시 이전 팝오버는 닫히고 새 것만 뜬다(동시 1개).
4. 아이템 스카우터를 OFF 하면 점선 밑줄/포인터가 사라지고 클릭해도 팝오버가 안 뜬다. 다시 ON 하면 복구된다.
5. 데이터에 없는 텍스트(있다면)는 클릭 표시가 생기지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add public/exam/ability-click-popover-example.html
git commit -m "docs: 어빌 클릭 팝오버 예시 HTML 추가"
```

---

## Self-Review 체크리스트 결과

- **Spec coverage:** 효과만 표시(View body, Task 1) · 다크 카드 스타일/헤더(Task 1) · 클릭 트리거(Manager onDocumentClick, Task 2) · 클릭 가능 표시 커서/점선밑줄(markClickable, Task 2) · 해시 비의존 감지+데이터 매칭 게이트(isAbilityNameElement+findAbilityEffect, Task 2) · 닫기 바깥/재클릭/Esc(Task 2) · 동시 1개(View 단일 el, Task 1/2) · 위치 앵커+경계보정(position, Task 1) · showItemStats 연동(loadEnabledSetting + DOMModulesManager setEnabled, Task 2/3) · idempotent 마킹(CLICKABLE_CLASS 가드, Task 2) · 예시 HTML(Task 4) — 모두 매핑됨.
- **Placeholder scan:** 없음(모든 코드 블록 완전 기재).
- **Type consistency:** `AbilityPopoverView`의 `open(anchor, {abilityName, grade, effect})`/`close`/`isOpen`/`isOpenFor`/`contains`(Task 1) ↔ Manager에서의 호출(Task 2) 일치. `setEnabled`(Task 2) ↔ DOMModulesManager 호출(Task 3) 일치. `CLICKABLE_CLASS`/`data-lh-ability` 마킹(Task 2) ↔ 예시 HTML(Task 4) 일치.
```
