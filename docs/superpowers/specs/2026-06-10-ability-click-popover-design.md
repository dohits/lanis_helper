# 어빌리티 이름 클릭 → 효과 팝오버 설계

작성일: 2026-06-10

## 배경

스크롤 교환 페이지(`https://lanis.me/refinery?section=craft&tab=scroll-exchange`)에는 어빌리티 이름이 일반 텍스트로 나열되지만, 그 어빌리티의 실제 효과를 볼 방법이 없다. 어빌리티 이름을 클릭하면 효과를 보여주는 커스텀 팝오버를 띄워 사용자가 어떤 스크롤을 교환할지 판단하도록 돕는다.

기존 "스크롤 팝오버 효과 표시" 기능은 사이트가 띄우는 팝오버에 효과를 덧붙이는 방식이었다. 이 기능은 사이트가 팝오버를 제공하지 않으므로, 우리가 직접 팝오버를 생성하고 클릭 이벤트를 붙인다.

## 대상 DOM 구조

스크롤 교환 행 예시:

```html
<div class="MuiBox-root css-1gvspc2">
  <div class="MuiBox-root css-1fjtzvx">
    <div class="MuiBox-root css-2hjtak">
      <span class="MuiBox-root css-1rvpxpb">은</span>
      <p class="MuiTypography-root MuiTypography-body2 css-15p2vbb">마나 비전</p>
    </div>
    <span class="MuiTypography-root MuiTypography-caption css-6275ju">보유 2</span>
  </div>
  <!-- 수량 조절 버튼들 -->
</div>
```

- 어빌리티 이름: `p.MuiTypography-body2` (예: `마나 비전`)
- 등급: 이름 바로 앞 형제 `<span>` (예: `은`)
- emotion 해시 클래스(`css-15p2vbb`, `css-2hjtak` 등)는 사이트 배포 시 변할 수 있으므로 의존하지 않는다.

## 요구사항

1. **표시 항목**: 어빌리티의 `효과` 텍스트만 표시한다.
2. **팝오버 스타일**: 사이트 MUI 팝오버와 유사한 다크 카드. 헤더(어빌명 + 등급 + 타입 라벨 `어빌리티`) + 본문(효과).
3. **트리거**: 어빌리티 이름 클릭.
4. **클릭 가능 표시**: 감지된 어빌리티 이름에 커서 포인터 + 미세 점선 밑줄을 부여해 클릭 가능함을 알린다.
5. **감지 (해시 비의존)**: 앞에 등급 `<span>` 형제를 가진 `p.MuiTypography-body2`를 후보로 삼되, 그 정규화된 텍스트가 `ability-data.json`의 실제 어빌명과 매칭될 때만 클릭 대상으로 마킹한다. 매칭 실패(효과 데이터 없음) 항목은 클릭 비활성.
6. **닫기**: 바깥 클릭 / 같은 이름 재클릭(토글) / Esc.
7. **동시 표시**: 한 번에 하나의 팝오버만.
8. **위치**: 클릭한 요소 아래에 앵커하고 뷰포트 경계를 벗어나면 보정한다.
9. **토글**: 기존 아이템 스카우터 설정(`showItemStats`)에 연동한다. OFF면 마킹/팝오버를 비활성화하고 추가 요소를 정리한다.
10. **idempotent**: 이미 마킹된 요소(`lh-ability-clickable`)는 재마킹하지 않는다.

## 아키텍처

기존 DOM 모듈 패턴을 따른다.

- **신규 매니저** `src/content/dom-modules/ability-click-popover/AbilityClickPopoverManager.js`
  - `init()`: 어빌 데이터 로드(`AbilityInfoDataManager` 재사용), 위임 클릭 리스너 등록, 스캐너용 MutationObserver 시작.
  - 스캐너: 옵저버 틱마다 미처리 어빌명 요소를 찾아 마킹한다(`lh-ability-clickable` 클래스 + 커서/밑줄 인라인 스타일). 마킹 시 매칭된 어빌명을 `data-ability` 속성에 저장한다.
  - 위임 클릭 리스너(document 단일): 클릭 타깃이 `.lh-ability-clickable`이면 팝오버를 토글한다.
  - 팝오버 빌더: 다크 카드 DOM 생성(`textContent`만 사용, XSS 안전). 등급은 DOM 등급 span에서 읽는다.
  - 위치 계산: 클릭 요소 기준 아래 앵커 + 뷰포트 보정.
  - `destroy()`/`cleanup()`: 옵저버 해제, 리스너 제거, 마킹/팝오버 정리.
- **매칭 유틸**: 기존 `src/content/dom-modules/item-stats/scroll-ability-utils.js`의 `normalizeAbilityName`, `findAbilityEffect`를 재사용한다.
- **등록**: `DOMModulesManager`의 `modules`에 추가하고 `init()`/`destroy()`에서 호출.
- **설정 연동**: `showItemStats`가 OFF면 스캐너/팝오버를 동작시키지 않고, 켜져 있을 때만 마킹한다. 기존 `SettingsManager`/`window.utils.SettingsManager` 패턴을 따른다.

## 데이터 흐름

```
MutationObserver (스크롤 교환 페이지 DOM 변경)
  → AbilityClickPopoverManager 스캐너
    → 후보 p(등급 span 형제 보유) 탐색
    → 정규화 텍스트가 어빌 데이터와 매칭되면 lh-ability-clickable 마킹 + data-ability 저장

document click (위임)
  → 타깃이 .lh-ability-clickable?
    → 기존 팝오버 닫기(있으면)
    → 같은 요소 재클릭이면 토글로 종료
    → findAbilityEffect로 효과 조회 → 다크 카드 팝오버 생성 → 요소 아래 앵커 + 경계 보정

바깥 클릭 / Esc → 팝오버 닫기
```

## 에러 처리

- 어빌 데이터 로드 실패 시 번들 데이터 폴백(`getAbilityDataFromFile`).
- 매칭 실패 시 마킹하지 않음(클릭 비활성).
- 모든 DOM 처리는 try/catch로 감싸 페이지 기능에 영향을 주지 않는다.
- 확장 컨텍스트 무효화 등 설정 조회 오류는 기존 패턴대로 경고 후 기본값으로 진행.

## 테스트

- 단위 수준: 어빌명 매칭은 기존 `scroll-ability-utils`로 검증됨(재사용). 신규 순수 로직(후보 판정: "등급 span 형제 + 데이터 매칭")이 있으면 분리해 Node로 검증한다.
- 통합 수준: 예시 HTML 또는 실제 페이지에서 — 어빌명에 클릭 표시가 생기는지, 클릭 시 효과 카드가 뜨는지, 바깥 클릭/재클릭/Esc로 닫히는지, 동시 1개만 뜨는지, `showItemStats` OFF 시 비활성/정리되는지 확인.
- `npm run build` 성공.
```
