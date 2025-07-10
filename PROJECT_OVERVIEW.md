# Lanis Helper - 프로젝트 개요

## 📋 프로젝트 소개

Lanis Helper는 Lanis 채팅 플랫폼과 위키에서 사용자 경험을 향상시키는 크롬 확장프로그램입니다. 사용자 이름 클릭을 통한 프로필 페이지 이동, 레어 아이템 데이터 수집 등 다양한 기능을 제공하며, 각 기능을 개별적으로 on/off할 수 있는 설정 시스템을 포함합니다.

## 🏗️ 프로젝트 구조

```
lanis_helper/
├── manifest.json          # 확장프로그램 설정 파일
├── popup.html             # 설정 창 UI
├── popup.js               # 설정 창 제어 로직
├── content.js             # 메인 기능 로직 (페이지 주입)
├── popup.css              # 스타일시트
├── img/                   # 아이콘 이미지
│   ├── lanis16.png
│   └── lanis128.png
├── README.md              # 사용자용 문서
└── PROJECT_OVERVIEW.md    # 개발자용 문서 (현재 파일)
```

## 🔧 기술 스택

- **Manifest Version**: 3 (최신 Chrome 확장프로그램 표준)
- **언어**: JavaScript (ES6+)
- **스타일**: CSS3
- **마크업**: HTML5
- **브라우저 지원**: Chrome, Mises (모바일)

## 📁 파일별 역할

### 1. manifest.json
**역할**: 확장프로그램의 메타데이터와 권한 설정

**주요 설정**:
- `manifest_version`: 3
- `permissions`: storage, tabs
- `action`: 확장프로그램 아이콘 클릭 시 popup.html 표시
- `content_scripts`: 모든 웹페이지에 content.js 주입

### 2. popup.html
**역할**: 확장프로그램 설정 창 UI

**구조**:
- 헤더: "Lanis Helper 설정"
- 기능별 토글 스위치
- 각 기능에 대한 설명
- 크롤링 섹션: "레어 아이템 데이터 수집" 버튼

### 3. popup.js
**역할**: 설정 창의 기능 제어 및 설정 저장

**주요 함수**:
- `loadSettings()`: 저장된 설정 로드
- `saveSettings()`: 설정 변경 시 저장 및 현재 탭에 알림
- `startCrawling()`: 크롤링 기능 시작

### 4. content.js
**역할**: 웹페이지에 주입되어 실제 기능을 수행하는 메인 로직

**주요 기능**:
- 사용자 프로필 링크 기능
- 레어 아이템 크롤링 기능
- 설정 기반 기능 제어
- 동적 콘텐츠 처리 (MutationObserver)

### 5. popup.css
**역할**: 사용자 이름 클릭 스타일 및 UI 스타일 정의

## 🚀 주요 기능

### 1. 사용자 프로필 링크 기능
- **감지 대상**: `li[id^="message-"]` 구조의 메시지
- **처리 로직**: 
  1. 첫 번째 `span` 요소를 사용자 이름으로 인식
  2. 콜론(`:`) 이전 부분만 추출
  3. 클릭 시 `https://lanis.me/users/사용자이름`으로 이동
- **시각적 피드백**: 파란색 텍스트, 밑줄, 포인터 커서

### 2. 레어 아이템 크롤링 기능
- **동작 방식**: Lanis 위키 페이지에서 레어 아이템 정보 자동 수집
- **데이터 저장**: Chrome 로컬 스토리지에 JSON 형태로 저장
- **서버 부하 방지**: 200ms 지연으로 안전한 크롤링

### 3. 설정 시스템
- **저장 방식**: Chrome Sync Storage
- **실시간 적용**: 설정 변경 시 즉시 반영
- **개별 제어**: 각 기능을 독립적으로 on/off 가능

## 🔄 메시지 전달 시스템

```javascript
// popup.js → content.js
chrome.tabs.sendMessage(tabId, {
  action: 'settingsChanged',
  settings: settings
});

// content.js에서 수신
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsChanged') {
    // 설정 처리
  }
});
```

## 💾 데이터 저장 구조

### 설정 데이터 (Chrome Sync Storage)
```javascript
{
  profileLink: true,    // 사용자 프로필 링크 기능
  feature2: false,      // 향후 추가될 기능
  feature3: false       // 향후 추가될 기능
}
```

### 크롤링 데이터 (Chrome Local Storage)
```javascript
[
  {
    "name": "아이템명",
    "power_min": 10,
    "power_max": 15,
    "weight_min": 5,
    "weight_max": 8
  }
]
```

## 🎯 개발 가이드

### 새 기능 추가 방법

#### 1. 설정 UI 추가 (popup.html)
```html
<div class="feature-item">
  <div>
    <div class="feature-name">새 기능명</div>
    <div class="description">기능 설명</div>
  </div>
  <label class="toggle-switch">
    <input type="checkbox" id="newFeature">
    <span class="slider"></span>
  </label>
</div>
```

#### 2. 설정 로직 추가 (popup.js)
```javascript
// 이벤트 리스너
document.getElementById('newFeature').addEventListener('change', saveSettings);

// 설정 로드에 추가
chrome.storage.sync.get({
  profileLink: true,
  newFeature: false  // 새 기능
}, function(items) {
  document.getElementById('newFeature').checked = items.newFeature;
});

// 설정 저장에 추가
const settings = {
  profileLink: document.getElementById('profileLink').checked,
  newFeature: document.getElementById('newFeature').checked  // 새 기능
};
```

#### 3. 기능 로직 추가 (content.js)
```javascript
// 설정에 새 기능 추가
let settings = {
  profileLink: true,
  newFeature: false  // 새 기능
};

// 새 기능 함수 추가
function processNewFeature() {
  // 기능 로직
}

// 기능 제거 함수
function removeNewFeature() {
  // 기능 제거 로직
}

// 설정 변경 시 새 기능 처리
if (settings.newFeature) {
  processNewFeature();
} else {
  removeNewFeature();
}
```

## 🔍 디버깅 방법

### 1. 콘솔 로그 확인
- F12 → Console 탭에서 오류 및 로그 확인
- `console.log()` 추가하여 디버깅

### 2. 확장프로그램 디버깅
- `chrome://extensions/` → 개발자 모드 활성화
- 확장프로그램의 "검사" 버튼으로 popup 디버깅

### 3. Content Script 디버깅
- 웹페이지에서 F12 → Console 탭
- content.js의 로그 및 오류 확인

### 4. 크롤링 데이터 확인
- Chrome 개발자 도구 → Application → Storage → Local Storage
- `rareItems` 키에서 수집된 데이터 확인

## 🐛 알려진 이슈 및 해결방법

### 1. "Could not establish connection" 오류
**원인**: content script가 로드되지 않은 탭에서 메시지 전송 시도
**해결**: popup.js에 오류 처리 추가 (이미 해결됨)

### 2. 설정이 적용되지 않는 경우
**원인**: 페이지 새로고침 필요
**해결**: F5로 페이지 새로고침

### 3. 사용자 이름이 인식되지 않는 경우
**원인**: DOM 구조 변경
**해결**: content.js의 셀렉터 수정 필요

### 4. 크롤링이 작동하지 않는 경우
**원인**: Lanis 위키 페이지가 아닌 곳에서 실행
**해결**: 올바른 위키 페이지에서 실행

## 📝 업데이트 로그

### v1.0 (현재 버전)
- ✅ 사용자 프로필 링크 기능 구현
- ✅ 설정 시스템 구현
- ✅ 실시간 설정 적용
- ✅ 오류 처리 추가
- ✅ 모바일 호환성 고려
- ✅ 레어 아이템 크롤링 기능 통합
- ✅ Chrome 로컬 스토리지 저장 기능

### 향후 계획
- [ ] 기능 2 구현
- [ ] 기능 3 구현
- [ ] 성능 최적화
- [ ] 추가 설정 옵션
- [ ] 크롤링 데이터 내보내기 기능

## 🤝 기여 방법

1. 이슈 리포트: 버그 발견 시 상세한 설명과 함께 리포트
2. 기능 제안: 새로운 기능 아이디어 제안
3. 코드 개선: 성능 최적화 및 코드 품질 개선

---

**마지막 업데이트**: 2025년 1월
**버전**: 1.0
**개발자**: 도희님 