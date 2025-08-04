// utils 모듈 import
import utils from './utils.js';

// 설정 창 제어 로직
document.addEventListener('DOMContentLoaded', function() {
  // 설정 로드 (async 함수이므로 .then() 사용)
  loadSettings().catch(error => {
    console.warn('설정 로드 실패:', error);
  });
  
  // 이벤트 리스너 추가
  document.getElementById('profileLink').addEventListener('change', saveSettings);
  document.getElementById('showItemStats').addEventListener('change', saveSettings);
  

});

// 설정 로드
async function loadSettings() {
  const items = await utils.SettingsManager.getSettings({
    profileLink: true,
    showItemStats: true
  });
  document.getElementById('profileLink').checked = items.profileLink;
  document.getElementById('showItemStats').checked = items.showItemStats;
}

// 설정 저장
function saveSettings() {
  const settings = {
    profileLink: document.getElementById('profileLink').checked,
    showItemStats: document.getElementById('showItemStats').checked
  };
  
  utils.SettingsManager.setSettings(settings).then(() => {
    // 현재 활성화된 탭에 설정 변경 알림
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

 