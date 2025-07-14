// 설정 창 제어 로직
document.addEventListener('DOMContentLoaded', function() {
  // 설정 로드
  loadSettings();
  
  // 이벤트 리스너 추가
  document.getElementById('profileLink').addEventListener('change', saveSettings);
  document.getElementById('showItemStats').addEventListener('change', saveSettings);
  document.getElementById('quickButtons').addEventListener('change', saveSettings);
  document.getElementById('feature2').addEventListener('change', saveSettings);
  document.getElementById('feature3').addEventListener('change', saveSettings);
  
  // 크롤링 버튼 이벤트
  document.getElementById('crawlButton').addEventListener('click', startCrawling);
  
  // 아이템 목록 보기 버튼 이벤트
  document.getElementById('viewItemsButton').addEventListener('click', showItemsList);
  
  // 모달 닫기 버튼 이벤트
  document.getElementById('closeModal').addEventListener('click', closeItemsModal);
  
  // 모달 외부 클릭 시 닫기
  document.getElementById('itemsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeItemsModal();
    }
  });
});

// 설정 로드
function loadSettings() {
  chrome.storage.sync.get({
    profileLink: true,
    showItemStats: true,
    quickButtons: true,
    feature2: false,
    feature3: false
  }, function(items) {
    document.getElementById('profileLink').checked = items.profileLink;
    document.getElementById('showItemStats').checked = items.showItemStats;
    document.getElementById('quickButtons').checked = items.quickButtons;
    document.getElementById('feature2').checked = items.feature2;
    document.getElementById('feature3').checked = items.feature3;
  });
}

// 설정 저장
function saveSettings() {
  const settings = {
    profileLink: document.getElementById('profileLink').checked,
    showItemStats: document.getElementById('showItemStats').checked,
    quickButtons: document.getElementById('quickButtons').checked,
    feature2: document.getElementById('feature2').checked,
    feature3: document.getElementById('feature3').checked
  };
  
  chrome.storage.sync.set(settings, function() {
    // 현재 활성화된 탭에 설정 변경 알림
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'settingsChanged',
          settings: settings
        }).catch(function(error) {
          // content script가 로드되지 않은 경우 무시
          console.log('설정 변경 알림 실패:', error);
        });
      }
    });
  });
}

// 아이템 목록 보기
function showItemsList() {
  const modal = document.getElementById('itemsModal');
  const itemsList = document.getElementById('itemsList');
  const itemsCount = document.getElementById('itemsCount');
  
  // 모달 표시
  modal.style.display = 'block';
  
  // 로딩 상태 표시
  itemsList.innerHTML = '<div style="text-align: center; color: #666;">아이템을 로드하는 중...</div>';
  itemsCount.textContent = '0';
  
  // chrome.storage.local에서 아이템 데이터 로드
  chrome.storage.local.get(['rareItems'], function(result) {
    if (result.rareItems && result.rareItems.length > 0) {
      const items = result.rareItems;
      
      // 아이템을 가나다순으로 정렬
      items.sort((a, b) => {
        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, 'ko');
      });
      
      // 아이템 목록 생성
      let itemsHtml = '';
      items.forEach((item, index) => {
        const itemName = item.name || '알 수 없는 아이템';
        const powerRange = item.power_min && item.power_max ? `${item.power_min}-${item.power_max}` : 'N/A';
        const weightRange = item.weight_min && item.weight_max ? `${item.weight_min}-${item.weight_max}` : 'N/A';
        const weaponType = item.weapon_type || 'N/A';
        const abilities = item.abilities && item.abilities.length > 0 ? item.abilities.join(', ') : 'N/A';
        
        // 타입이 N/A가 아닐 때만 괄호로 표시
        const typeDisplay = weaponType !== 'N/A' ? ` (${weaponType})` : '';
        
        itemsHtml += `
          <div style="padding: 8px; border-bottom: 1px solid #eee; background-color: white; margin-bottom: 5px; border-radius: 5px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 3px;">${itemName}${typeDisplay}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 2px;">
              위력: ${powerRange} | 무게: ${weightRange}
            </div>
            <div style="font-size: 10px; color: #888;">
              어빌리티: ${abilities}
            </div>
          </div>
        `;
      });
      
      itemsList.innerHTML = itemsHtml;
      itemsCount.textContent = items.length;
    } else {
      itemsList.innerHTML = '<div style="text-align: center; color: #666;">스캔된 아이템이 없습니다.<br>먼저 "레어 아이템 데이터 수집"을 실행해주세요.</div>';
      itemsCount.textContent = '0';
    }
  });
}

// 모달 닫기
function closeItemsModal() {
  const modal = document.getElementById('itemsModal');
  modal.style.display = 'none';
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
      
      // lanis.me 도메인이 아닌 경우 경고
      if (!tabs[0].url.includes('laniswiki.lovestoblog.com')) {
        status.textContent = '아이템 수집은 https://laniswiki.lovestoblog.com/ 에서 실행해주세요.';
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