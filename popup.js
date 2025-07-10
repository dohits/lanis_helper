// 설정 창 제어 로직
document.addEventListener('DOMContentLoaded', function() {
  // 설정 로드
  loadSettings();
  
  // 이벤트 리스너 추가
  document.getElementById('profileLink').addEventListener('change', saveSettings);
  document.getElementById('showItemStats').addEventListener('change', saveSettings);
  document.getElementById('feature2').addEventListener('change', saveSettings);
  document.getElementById('feature3').addEventListener('change', saveSettings);
  
  // 크롤링 버튼 이벤트
  document.getElementById('crawlButton').addEventListener('click', startCrawling);
});

// 설정 로드
function loadSettings() {
  chrome.storage.sync.get({
    profileLink: true,
    showItemStats: true,
    feature2: false,
    feature3: false
  }, function(items) {
    document.getElementById('profileLink').checked = items.profileLink;
    document.getElementById('showItemStats').checked = items.showItemStats;
    document.getElementById('feature2').checked = items.feature2;
    document.getElementById('feature3').checked = items.feature3;
  });
}

// 설정 저장
function saveSettings() {
  const settings = {
    profileLink: document.getElementById('profileLink').checked,
    showItemStats: document.getElementById('showItemStats').checked,
    feature2: document.getElementById('feature2').checked,
    feature3: document.getElementById('feature3').checked
  };
  
  chrome.storage.sync.set(settings, function() {
    // 현재 활성화된 탭에 설정 변경 알림 (오류 처리 추가)
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'settingsChanged',
          settings: settings
        }).catch(function(error) {
          // content script가 로드되지 않은 경우 무시
        });
      }
    });
  });
}

  // API 수집 시작
  function startCrawling() {
  const button = document.getElementById('crawlButton');
  const status = document.getElementById('status');
  
  // 버튼 비활성화
  button.disabled = true;
  button.textContent = '수집 중...';
  status.textContent = '레어 아이템 데이터를 수집하고 있습니다...';
  
  // 현재 활성 탭에서 크롤링 실행
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      // chrome:// URL인지 확인
      if (tabs[0].url.startsWith('chrome://')) {
        status.textContent = 'Chrome 내부 페이지에서는 사용할 수 없습니다. 일반 웹페이지에서 시도해주세요.';
        button.disabled = false;
        button.textContent = '레어 아이템 데이터 수집';
        return;
      }
      
      // content script가 로드되었는지 먼저 확인
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'ping'
      }).then(function(response) {
        // content script가 로드되어 있으면 API 수집 실행
        if (response && response.success) {
          return chrome.tabs.sendMessage(tabs[0].id, {
            action: 'startCrawling'
          });
        } else {
          throw new Error('Content script not loaded');
        }
      }).catch(function(error) {
        // content script가 로드되지 않았으면 강제로 주입
        return chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }).then(function() {
          // 주입 후 API 수집 실행
          return chrome.tabs.sendMessage(tabs[0].id, {
            action: 'startCrawling'
          });
        });
      }).then(function(response) {
        if (response && response.success) {
          if (response.message && response.message.includes('기존 데이터 사용')) {
            status.textContent = `${response.message} (${response.count}개 아이템)`;
          } else {
            status.textContent = `${response.message} (${response.count}개 아이템)`;
          }
        } else {
          status.textContent = `수집 실패: ${response.message || '알 수 없는 오류'}`;
        }
      }).catch(function(error) {
        status.textContent = `오류 발생: ${error.message || '알 수 없는 오류'}`;
      }).finally(function() {
        // 버튼 다시 활성화
        button.disabled = false;
        button.textContent = '레어 아이템 데이터 수집';
      });
    }
  });
} 