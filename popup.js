// 설정 창 제어 로직
document.addEventListener('DOMContentLoaded', function() {
  // 설정 로드 (async 함수이므로 .then() 사용)
  loadSettings().catch(error => {
    console.warn('설정 로드 실패:', error);
  });
  
  // 이벤트 리스너 추가
  document.getElementById('profileLink').addEventListener('change', saveSettings);
  document.getElementById('showItemStats').addEventListener('change', saveSettings);
  
  // 크롤링 버튼 이벤트
  document.getElementById('crawlButton').addEventListener('click', startCrawling);
  
  // 아이템 목록 보기 버튼 이벤트
  document.getElementById('viewItemsButton').addEventListener('click', showItemsList);
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

// HTML 이스케이프 함수 추가
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 아이템 목록 보기
function showItemsList() {
  // 새 창에서 아이템 목록 표시
  const itemsWindow = window.open('', 'itemsList', 'width=400,height=600,scrollbars=yes,resizable=yes');
  
  // 새 창에 HTML 내용 작성 (안전한 방식)
  const safeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>스캔된 아이템 목록</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }
        .items-container {
          max-height: 500px;
          overflow-y: auto;
          background-color: white;
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .item {
          padding: 10px;
          border-bottom: 1px solid #eee;
          background-color: white;
          margin-bottom: 8px;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .item-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .item-stats {
          font-size: 12px;
          color: #666;
          margin-bottom: 3px;
        }
        .item-abilities {
          font-size: 11px;
          color: #888;
        }
        .loading {
          text-align: center;
          color: #666;
          padding: 20px;
        }
        .no-items {
          text-align: center;
          color: #666;
          padding: 20px;
        }
        .count {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>스캔된 아이템 목록</h2>
      </div>
      <div id="itemsContainer" class="items-container">
        <div class="loading">아이템을 로드하는 중...</div>
      </div>
      <div id="count" class="count">총 0개 아이템</div>
    </body>
    </html>
  `;
  
  // document.write 대신 안전한 방식 사용
  itemsWindow.document.open();
  itemsWindow.document.write(safeHtml);
  itemsWindow.document.close();
  
  // chrome.storage.local에서 아이템 데이터 로드
  chrome.storage.local.get(['rareItems'], function(result) {
    const itemsContainer = itemsWindow.document.getElementById('itemsContainer');
    const countElement = itemsWindow.document.getElementById('count');
    
    if (result.rareItems && result.rareItems.length > 0) {
      const items = result.rareItems;
      
      // 아이템을 가나다순으로 정렬
      items.sort((a, b) => {
        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, 'ko');
      });
      
      // 아이템 목록 생성 (안전한 방식)
      items.forEach((item, index) => {
        const itemName = escapeHtml(item.name || '알 수 없는 아이템');
        const type = escapeHtml(item.type || ''); // 반드시 type 필드만 사용
        const typeDisplay = type ? ` (${type})` : '';
        const powerRange = (item.power_min !== null && item.power_min !== undefined && item.power_max !== null && item.power_max !== undefined) ? `${item.power_min}-${item.power_max}` : 'N/A';
        const weightRange = (item.weight_min !== null && item.weight_min !== undefined && item.weight_max !== null && item.weight_max !== undefined) ? `${item.weight_min}-${item.weight_max}` : 'N/A';
        const abilities = item.abilities && item.abilities.length > 0 ? 
          item.abilities.map(ability => escapeHtml(ability)).join(', ') : 'N/A';
        // 타입이 있을 때만 괄호로 표시
        const itemDiv = itemsWindow.document.createElement('div');
        itemDiv.className = 'item';
        const nameDiv = itemsWindow.document.createElement('div');
        nameDiv.className = 'item-name';
        nameDiv.textContent = itemName + typeDisplay;
        const statsDiv = itemsWindow.document.createElement('div');
        statsDiv.className = 'item-stats';
        statsDiv.textContent = `위력: ${powerRange} | 무게: ${weightRange}`;
        const abilitiesDiv = itemsWindow.document.createElement('div');
        abilitiesDiv.className = 'item-abilities';
        abilitiesDiv.textContent = `어빌리티: ${abilities}`;
        itemDiv.appendChild(nameDiv);
        itemDiv.appendChild(statsDiv);
        itemDiv.appendChild(abilitiesDiv);
        itemsContainer.appendChild(itemDiv);
      });
      
      countElement.textContent = `총 ${items.length}개 아이템`;
    } else {
      const noItemsDiv = itemsWindow.document.createElement('div');
      noItemsDiv.className = 'no-items';
      noItemsDiv.textContent = '스캔된 아이템이 없습니다. 먼저 "레어 아이템 데이터 수집"을 실행해주세요.';
      itemsContainer.appendChild(noItemsDiv);
      countElement.textContent = '총 0개 아이템';
    }
  });
}

// 모달 닫기 (더 이상 사용하지 않음)
function closeItemsModal() {
  // 이 함수는 더 이상 사용하지 않지만, 기존 코드와의 호환성을 위해 남겨둠
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
      
      // 메시지 통신 타임아웃 설정 (10분)
      const messageTimeout = 600000; // 10분
      let timeoutId;
      
      // 타임아웃 함수
      const handleTimeout = () => {
        status.textContent = '수집 시간이 초과되었습니다. 팝업을 닫지 말고 다시 시도해주세요.';
        button.disabled = false;
        button.textContent = '레어 아이템 데이터 수집';
      };
      
      // 타임아웃 설정
      timeoutId = setTimeout(handleTimeout, messageTimeout);
      
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
          // 주입 후 잠시 대기
          return new Promise(resolve => setTimeout(resolve, 1000));
        }).then(function() {
          // 주입 후 API 수집 실행
          return chrome.tabs.sendMessage(tabs[0].id, {
            action: 'startCrawling'
          });
        });
      }).then(function(response) {
        // 타임아웃 해제
        clearTimeout(timeoutId);
        
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
        // 타임아웃 해제
        clearTimeout(timeoutId);
        
        // 메시지 통신 오류인 경우 사용자에게 안내
        if (error.message && error.message.includes('message channel closed')) {
          status.textContent = '팝업이 닫혀서 수집이 중단되었습니다. 팝업을 열고 다시 시도해주세요.';
        } else {
          status.textContent = `오류 발생: ${error.message || '알 수 없는 오류'}`;
        }
      }).finally(function() {
        // 타임아웃 해제
        clearTimeout(timeoutId);
        
        // 버튼 다시 활성화
        button.disabled = false;
        button.textContent = '레어 아이템 데이터 수집';
      });
    }
  });
} 