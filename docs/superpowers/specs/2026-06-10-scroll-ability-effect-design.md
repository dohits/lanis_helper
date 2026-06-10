# 스크롤 어빌리티 효과 표시 설계

작성일: 2026-06-10

## 배경

아이템 스카우터는 현재 장비 아이템 팝오버의 위력/무게 범위만 감정한다. 신규 카테고리로 "스크롤" 아이템 팝오버가 추가되었고, `제작 스크롤:<어빌리티명>` 형태의 팝오버에 대해 해당 어빌리티의 실제 효과를 팝오버 본문 하단에 덧붙여 표시하려 한다.

## 대상 팝오버 구조

스크롤 팝오버는 기존 장비 팝오버와 DOM 구조가 다르다 (위력/무게 없음).

```html
<div class="MuiPaper-root ... MuiPopover-paper css-szzq31">
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
```

## 요구사항

1. **감지**: 아이템명에 `스크롤`이 포함되고 `:`가 있으면 스크롤 팝오버로 판정. `제작 스크롤` 외 다른 스크롤 타입도 동일 패턴으로 자동 대응.
2. **어빌명 추출**: 아이템명 textContent에서 끝의 괄호부(`(금)` 등 색상/등급)를 제거한 뒤 `:` 뒤 텍스트를 어빌명으로 사용. 예) `제작 스크롤:과부하(금)` → `과부하`.
3. **매칭**: `ability-data.json` 전체(직업·장비 어빌리티 모두)에서 `어빌리티명` 매칭. 스크롤에는 장비 어빌뿐 아니라 직업 어빌도 들어갈 수 있으므로 전체를 대상으로 한다.
   - 공백/특수문자를 정규화한 뒤 비교한다 (`냉기 돌풍` ↔ `냉기돌풍` 같은 표기 차이 흡수).
   - 동일명 중복 시 첫 매칭을 사용한다.
4. **표시 내용**: 매칭된 어빌리티의 `효과` 텍스트만 본문 아래 새 행으로 추가한다. `무기 타입 효과`/`숙련도`는 표시하지 않는다.
5. **매칭 실패**: 아무것도 표시하지 않고 팝오버를 변경하지 않는다.
6. **토글**: 기존 아이템 스카우터 설정(`showItemStats`)에 연동한다. 별도 설정을 추가하지 않는다.
7. **idempotent**: `scroll-ability-processed` 클래스로 중복 처리를 방지하고, `removeItemStats()`에서 추가 요소를 정리한다.

## 아키텍처

기존 단일책임 모듈 패턴(`RangeInfoAdder`, `FinalTagAdder`)을 따른다.

- **새 모듈** `src/content/dom-modules/item-stats/ScrollAbilityAdder.js`
  - `AbilityInfoDataManager`로 어빌 데이터를 로드(이미 존재, Chrome 스토리지 캐싱 포함).
  - `processScrollPopover(container)`: 스크롤 팝오버 컨테이너를 받아 어빌명 추출 → 매칭 → 효과 행 추가.
  - 어빌명 정규화 헬퍼(공백/특수문자 제거)와 효과 행 생성 헬퍼를 포함.
  - 추가 요소 제거용 정리 메서드(또는 제거 시 셀렉터로 정리).
- **`ItemStatsProcessor`**
  - `init()`에서 `ScrollAbilityAdder` 인스턴스를 생성하고 어빌 데이터를 로드.
  - `processItemStats()`에 스크롤 팝오버 전용 패스를 추가. 스크롤 팝오버는 위력/무게 패스의 셀렉터와 겹치지 않도록 별도 감지한다.
  - `removeItemStats()`에서 스크롤 추가 요소도 정리.
- **예시 HTML**: `public/exam/item-popover-example.html`에 스크롤 팝오버 원본/처리 후 예시를 추가.

## 데이터 흐름

```
DynamicContentObserver (DOM 변경)
  → ItemStatsManager.processItemStats()
    → ItemStatsProcessor.processItemStats()
      → (기존) 장비 위력/무게 감정 패스
      → (신규) 스크롤 팝오버 감지 패스
        → ScrollAbilityAdder.processScrollPopover(container)
          → 어빌명 추출 → 정규화 매칭 → 효과 행 append → scroll-ability-processed 마킹
```

## 에러 처리

- 어빌 데이터 로드 실패 시 스크롤 패스를 조용히 건너뛴다(기존 패스 영향 없음).
- 어빌명 추출 실패/매칭 실패 시 팝오버 미변경.
- 모든 처리는 try/catch로 감싸 다른 아이템 처리에 영향을 주지 않는다.

## 테스트

- 단위 수준: 어빌명 추출(괄호 제거, 콜론 분리)과 정규화 매칭 로직을 예시 입력으로 검증.
- 통합 수준: `public/exam/item-popover-example.html`의 스크롤 팝오버 예시로 효과 행이 올바르게 추가되는지, 재처리 시 중복되지 않는지, `removeItemStats()`로 정리되는지 확인.
```
