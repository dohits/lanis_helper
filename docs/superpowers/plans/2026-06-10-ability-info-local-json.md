# 어빌리티 정보 로컬 JSON 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어빌리티 정보 모달이 구글 시트 실시간 fetch 대신 번들된 로컬 JSON에서 데이터를 로드하도록 전환한다 (아이템 데이터와 동일한 정적 import + Chrome 스토리지 버전 캐싱 패턴).

**Architecture:** 시트를 1회 fetch 해 `src/shared/ability-data.json`을 생성하고, 공용 `AbilityInfoDataManager`가 정적 import + 버전 캐싱으로 이를 제공한다. 모달은 이 매니저만 사용한다 (향후 아이템 스카우터도 재사용 가능). 기존 `abilityInfoAPI.js`와 `SHEET_IDS.ABILITY_INFO`는 제거한다.

**Tech Stack:** Chrome 확장(MV3), Vite 7 (JSON import 기본 지원), 순수 ES 모듈. 테스트 러너 없음 → 검증은 생성 스크립트 내장 assert + `npm run build` + 모달 수동 확인.

---

## File Structure

- **Create** `scripts/generate-ability-data.cjs` — 시트 CSV를 fetch·파싱·검증해 JSON을 쓰는 1회성 dev 유틸 (기존 `scripts/update-manifest.cjs`와 동일 계층). 향후 재생성에도 사용.
- **Create** `src/shared/ability-data.json` — 어빌리티 객체 배열 (생성 결과물).
- **Create** `src/content/dom-modules/ability-info/AbilityInfoDataManager.js` — 공용 데이터 매니저 (`RareItemsDataManager` 패턴).
- **Modify** `src/content/menu-module/modal/settings/ability-info-modal.js` — API 호출을 매니저로 교체.
- **Delete** `src/api/googleSheetLoad/abilityInfoAPI.js` — 더 이상 사용 안 함.
- **Modify** `src/shared/constants.js:6` — `SHEET_IDS.ABILITY_INFO` 항목 제거.

> 참고: `SHEET_IDS.PRICE_DATA`(constants.js:7)가 어빌리티와 **동일한 시트 ID** `1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo`를 쓰므로, ID 값 자체는 코드베이스에 계속 남는다. `ABILITY_INFO` 키만 지운다.

---

### Task 1: 어빌리티 데이터 생성 스크립트 + JSON 생성

**Files:**
- Create: `scripts/generate-ability-data.cjs`
- Create: `src/shared/ability-data.json` (스크립트 실행 산출물)

- [ ] **Step 1: 생성 스크립트 작성**

`scripts/generate-ability-data.cjs` — 기존 `GoogleSheetAPI.parseCSV` / `fetchAbilityInfo` 로직을 그대로 포팅한다. Node 18+ 전역 `fetch` 사용. CSV 파서는 `src/api/googleSheetLoad/index.js`의 `parseCSV`와 동일하게 따옴표·`""`·`\r\n`을 처리한다.

```javascript
// 어빌리티 정보 시트를 fetch 해 src/shared/ability-data.json 을 생성하는 1회성 유틸.
// 재생성: `node scripts/generate-ability-data.cjs`
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const OUT = path.join(__dirname, '..', 'src', 'shared', 'ability-data.json');

// src/api/googleSheetLoad/index.js 의 parseCSV 와 동일한 파서
function parseCSV(csv) {
  const rows = [];
  let row = [];
  let val = '';
  let inQuotes = false;
  let i = 0;
  while (i < csv.length) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"') {
        if (csv[i + 1] === '"') { val += '"'; i++; }
        else { inQuotes = false; }
      } else { val += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(val); val = ''; }
      else if (c === '\n' || c === '\r') {
        if (val !== '' || row.length > 0) {
          row.push(val); rows.push(row); row = []; val = '';
        }
        if (c === '\r' && csv[i + 1] === '\n') i++;
      } else { val += c; }
    }
    i++;
  }
  if (val !== '' || row.length > 0) { row.push(val); rows.push(row); }
  return rows;
}

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const rows = parseCSV(csv);
  if (!rows || rows.length < 2) throw new Error('데이터가 충분하지 않습니다.');

  // fetchAbilityInfo 와 동일: 헤더 trim, 셀 trim, (직업 && 어빌리티명 && 효과) 필터
  const header = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((cols) => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
    return obj;
  }).filter((r) => r['직업'] && r['어빌리티명'] && r['효과']);

  // 내장 검증
  if (data.length === 0) throw new Error('필터 후 데이터가 0건입니다.');
  const required = ['직업', '전직', '어빌리티명', '효과', '무기 타입 효과', '숙련도'];
  for (const key of required) {
    if (!(key in data[0])) throw new Error(`헤더 누락: ${key}`);
  }
  const badRow = data.find((r) => !r['효과']);
  if (badRow) throw new Error('효과가 빈 행이 포함됨 (필터 오류)');

  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`생성 완료: ${OUT} (${data.length}건)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: 스크립트 실행해 JSON 생성**

Run: `node scripts/generate-ability-data.cjs`
Expected: `생성 완료: .../src/shared/ability-data.json (N건)` (N > 0, 에러 없이 종료)

- [ ] **Step 3: 산출물 형태 확인**

Run: `node -e "const d=require('./src/shared/ability-data.json'); console.log(d.length, JSON.stringify(d[0]))"`
Expected: 건수와 함께 첫 객체가 `직업/전직/어빌리티명/효과/무기 타입 효과/숙련도` 키를 가진 형태로 출력. (모든 행의 `효과`는 비어있지 않음 — 스크립트 내장 검증이 보장)

- [ ] **Step 4: 커밋**

```bash
git add scripts/generate-ability-data.cjs src/shared/ability-data.json
git commit -m "feat: 어빌리티 정보 로컬 JSON 및 생성 스크립트 추가"
```

---

### Task 2: 공용 AbilityInfoDataManager 작성

**Files:**
- Create: `src/content/dom-modules/ability-info/AbilityInfoDataManager.js`

- [ ] **Step 1: 매니저 작성**

`RareItemsDataManager`의 캐싱 패턴을 그대로 따르되 스토리지 키만 분리(`abilityInfo` / `abilityInfoVersion`)한다. JSON import 경로는 `RareItemsDataManager`와 동일 깊이(`../../../shared/`)다.

```javascript
// 어빌리티 정보 데이터 관리자 (공용 — 설정 모달 및 향후 아이템 스카우터에서 재사용)
import abilityData from '../../../shared/ability-data.json';

class AbilityInfoDataManager {
  // 번들된 JSON에서 데이터 반환
  getAbilityDataFromFile() {
    return abilityData || [];
  }

  // 현재 확장 프로그램 버전 (manifest 기준)
  getCurrentVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      return null;
    }
  }

  // 어빌리티 정보 로드 (버전 기반 Chrome 스토리지 캐싱, 항상 배열 반환)
  async load() {
    try {
      const currentVersion = this.getCurrentVersion();
      return await new Promise((resolve) => {
        chrome.storage.local.get(['abilityInfo', 'abilityInfoVersion'], (result) => {
          const cacheValid = result.abilityInfo
            && result.abilityInfo.length > 0
            && result.abilityInfoVersion === currentVersion;

          if (cacheValid) {
            resolve(result.abilityInfo);
          } else {
            const data = this.getAbilityDataFromFile();
            chrome.storage.local.set({
              abilityInfo: data,
              abilityInfoVersion: currentVersion,
              abilityInfoLastUpdate: Date.now()
            });
            resolve(data);
          }
        });
      });
    } catch (error) {
      console.error('[AbilityInfoDataManager] 어빌리티 정보 로드 실패:', error);
      return this.getAbilityDataFromFile();
    }
  }
}

export default AbilityInfoDataManager;
```

- [ ] **Step 2: 빌드로 import 해석 검증**

Run: `npm run build`
Expected: 빌드 성공 (에러 없음). `ability-data.json`이 번들에 포함되고 import 경로가 정상 해석됨.

- [ ] **Step 3: 커밋**

```bash
git add src/content/dom-modules/ability-info/AbilityInfoDataManager.js
git commit -m "feat: 공용 AbilityInfoDataManager 추가 (정적 import + 버전 캐싱)"
```

---

### Task 3: 모달이 매니저를 사용하도록 교체

**Files:**
- Modify: `src/content/menu-module/modal/settings/ability-info-modal.js:3` (import)
- Modify: `src/content/menu-module/modal/settings/ability-info-modal.js:110-128` (`loadData`)

- [ ] **Step 1: import 교체**

`ability-info-modal.js:3`의 다음 줄을

```javascript
import AbilityInfoAPI from '../../../../api/googleSheetLoad/abilityInfoAPI.js';
```

다음으로 교체:

```javascript
import AbilityInfoDataManager from '../../../dom-modules/ability-info/AbilityInfoDataManager.js';
```

- [ ] **Step 2: loadData 본문 교체**

`loadData(tableContainer, jobToggleSection)`의 `try` 블록 내부(현재 113~123행)를 교체한다. 기존:

```javascript
    try {
      // 직접 API 호출
      const abilityAPI = new AbilityInfoAPI();
      const result = await abilityAPI.fetchAbilityInfo();
      
      if (result && result.success && result.data) {
        this.data = result.data;
        this.createJobToggles(jobToggleSection);
        this.renderTable();
        this.bindSearchEvent();
      } else {
        this.showErrorMessage(tableContainer);
      }
    } catch (error) {
```

교체 후 (매니저는 `{success,data}`가 아니라 배열을 직접 반환하므로 조건 조정):

```javascript
    try {
      // 로컬 JSON 기반 데이터 매니저 사용
      const manager = new AbilityInfoDataManager();
      const data = await manager.load();

      if (Array.isArray(data) && data.length > 0) {
        this.data = data;
        this.createJobToggles(jobToggleSection);
        this.renderTable();
        this.bindSearchEvent();
      } else {
        this.showErrorMessage(tableContainer);
      }
    } catch (error) {
```

(`catch` 블록과 그 이후는 그대로 유지)

- [ ] **Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공. `AbilityInfoAPI` 미해석 import 에러가 없어야 함.

- [ ] **Step 4: 모달 동작 수동 확인**

`dist`를 Chrome 확장으로 로드 → 라니스 페이지에서 메뉴 → `어빌리티 정보` 열기.
Expected:
- 표가 기존과 동일하게 렌더링 (컬럼: 직업/전직/어빌리티명/효과/무기 타입 효과/숙련도)
- 직업 토글, 검색 동작 정상
- `[특수]` 등 효과가 빈 행은 표시되지 않음 (기존과 동일)
- 네트워크를 끊어도 데이터가 정상 표시 (로컬 로드 확인)

- [ ] **Step 5: 커밋**

```bash
git add src/content/menu-module/modal/settings/ability-info-modal.js
git commit -m "refactor: 어빌리티 정보 모달을 로컬 JSON 매니저로 전환"
```

---

### Task 4: 사용하지 않는 API / 상수 정리

**Files:**
- Delete: `src/api/googleSheetLoad/abilityInfoAPI.js`
- Modify: `src/shared/constants.js:6`

- [ ] **Step 1: 잔여 참조 확인 (삭제 전 안전 점검)**

Run: `grep -rn "AbilityInfoAPI\|abilityInfoAPI\|SHEET_IDS.ABILITY_INFO\|ABILITY_INFO" src/`
Expected: `constants.js`의 `ABILITY_INFO:` 정의 줄만 남아야 함 (모달은 Task 3에서 교체됨). 그 외 참조가 있으면 먼저 해결.

- [ ] **Step 2: abilityInfoAPI.js 삭제**

```bash
git rm src/api/googleSheetLoad/abilityInfoAPI.js
```

- [ ] **Step 3: SHEET_IDS.ABILITY_INFO 제거**

`src/shared/constants.js`에서 다음 줄(6행)을 삭제:

```javascript
  ABILITY_INFO: '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo',  // 어빌리티 정보 시트
```

> `PRICE_DATA`(7행)는 동일 ID를 유지하므로 그대로 둔다.

- [ ] **Step 4: 빌드로 미해석 import 없음 확인**

Run: `npm run build`
Expected: 빌드 성공 (삭제된 파일/상수를 참조하는 곳이 없어 에러 없음).

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: 미사용 abilityInfoAPI 및 ABILITY_INFO 시트 ID 제거"
```

---

## Self-Review

**Spec coverage:**
- JSON 파일 생성 + 동일 필터 동작 유지 → Task 1 ✓
- 공용 데이터 매니저 (정적 import + 버전 캐싱) → Task 2 ✓
- 모달 전환 (데이터 형태 동일, 조건만 조정) → Task 3 ✓
- abilityInfoAPI.js 삭제 + SHEET_IDS.ABILITY_INFO 제거 + index.js 유지 → Task 4 ✓
- 검증(빌드/모달/네트워크 차단/잔여 참조) → Task 1~4 각 Step ✓

**Placeholder scan:** 없음 — 모든 코드/명령/기대 출력 명시.

**Type/이름 일관성:**
- 매니저 클래스명 `AbilityInfoDataManager`, 공개 메서드 `load()` — Task 2 정의, Task 3 사용 일치 ✓
- 스토리지 키 `abilityInfo` / `abilityInfoVersion` — Task 2 내 일관 ✓
- JSON 키 `직업/전직/어빌리티명/효과/무기 타입 효과/숙련도` — Task 1 검증과 모달 렌더링 컬럼 일치 ✓
- import 경로: 매니저(`../../../dom-modules/ability-info/...` from 모달, `../../../shared/...` from 매니저) — `RareItemsDataManager` 깊이와 동일 ✓
