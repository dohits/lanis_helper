// Lanis Helper 메인 확장프로그램
(function() {
  'use strict';

  // CSS 스타일 로드
  function loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('styles.css');
    document.head.appendChild(link);
  }

  // 모듈이 로드되었는지 확인하는 함수 (개선된 버전)
  function waitForModule(moduleName, maxWait = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkModule = () => {
        const elapsed = Date.now() - startTime;
        
        if (window[moduleName]) {
          resolve();
        } else if (elapsed > maxWait) {
          const relevantKeys = Object.keys(window).filter(key => 
            key.includes('Manager') || key.includes('Engine') || key.includes('menu') || key.includes('search')
          );
          console.error(`${moduleName} 모듈 로드 실패. 현재 window 객체:`, relevantKeys);
          reject(new Error(`${moduleName} 모듈이 ${maxWait}ms 내에 로드되지 않았습니다.`));
        } else {
          setTimeout(checkModule, 50); // 더 빠른 체크 간격
        }
      };
      
      checkModule();
    });
  }

  // 모든 모듈을 기다리는 함수 (새로 추가)
  async function waitForAllModules() {
    const modules = ['menuManager', 'searchEngine', 'itemStatsManager', 'settingsModalManager', 'userProfileManager'];
    const modulePromises = modules.map(module => waitForModule(module));
    
    try {
      await Promise.all(modulePromises);
    } catch (error) {
      console.error('모듈 로드 실패:', error);
      throw error;
    }
  }

  // 설정 로드 및 기능 실행 (구버전 방식)
  function loadSettingsAndExecute() {
    chrome.storage.sync.get({
      profileLink: true,
      feature2: false,
      feature3: false,
      showItemStats: true  // 구버전 방식으로 변경
    }, function(items) {
      const settings = items;
      
      // 설정이 변경되면 페이지 다시 처리
      if (settings.profileLink && window.userProfileManager) {
        window.userProfileManager.processUserNames();
        // 동적 콘텐츠 처리 시작
        window.userProfileManager.processDynamicContent();
      } else if (window.userProfileManager) {
        window.userProfileManager.removeUserNames();
      }
      
      // 아이템 스탯 표시 설정 변경 시 (itemStatsManager에서 직접 처리)
      if (window.itemStatsManager) {
        window.itemStatsManager.settings = settings;
        if (settings.showItemStats) {
          window.itemStatsManager.processItemStats();
        } else {
          window.itemStatsManager.removeItemStats();
        }
      }
    });
  }

  // 메인 초기화 함수
  async function initializeExtension() {
    
    try {
      // CSS 스타일 로드
      loadStyles();
      
      // 모든 모듈들이 로드될 때까지 대기 (개선된 방식)
      await waitForAllModules();
      
      // 각 모듈 초기화
      
      await window.menuManager.init();
      
      await window.searchEngine.init();
      
      await window.itemStatsManager.init();
      
      window.userProfileManager.init();
      
      window.settingsModalManager.init();
      
      // 구버전 방식으로 설정 로드 및 기능 실행
      loadSettingsAndExecute();
      
      // 대기 중인 퀵검색 확인
      window.searchEngine.checkPendingQuickSearch();
      
    } catch (error) {
      console.error('Lanis Helper 초기화 실패:', error);
      console.error('오류 상세 정보:', {
        message: error.message,
        stack: error.stack,
        menuManager: !!window.menuManager,
        searchEngine: !!window.searchEngine,
        itemStatsManager: !!window.itemStatsManager,
        userProfileManager: !!window.userProfileManager,
        settingsModalManager: !!window.settingsModalManager
      });
      
      // 재시도 로직 추가
      setTimeout(() => {
        initializeExtension();
      }, 5000);
    }
  }

  // 전역 객체에 메서드들 노출
  window.lanisHelper = {
    processUserNames: () => {
      window.userProfileManager.processUserNames();
    },
    removeUserNames: () => {
      window.userProfileManager.removeUserNames();
    },
    executeQuickSearch: (searchConfig, buttonIndex) => {
      window.searchEngine.executeQuickSearch(searchConfig, buttonIndex);
    },
    openQuickSettingsModal: (index) => {
      window.settingsModalManager.openQuickSettingsModal(index);
    },
    processItemStats: () => {
      window.itemStatsManager.processItemStats();
    },
    removeItemStats: () => {
      window.itemStatsManager.removeItemStats();
    },
    // 구버전 방식의 설정 로드 함수 추가
    loadSettingsAndExecute: loadSettingsAndExecute,
    // 아이템 수집 기능 추가
    collectRareItems: async () => {
      if (window.searchEngine) {
        return await window.searchEngine.collectRareItems();
      } else {
        throw new Error('SearchEngine이 초기화되지 않았습니다.');
      }
    }
  };

  // DOM 로드 완료 후 초기화 (개선된 버전)
  function startInitialization() {
    
    // DOM이 완전히 로드된 후에 초기화 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeExtension, 100); // 약간의 지연으로 안정성 확보
      });
    } else {
      setTimeout(initializeExtension, 100); // 약간의 지연으로 안정성 확보
    }
  }

  // 초기화 시작
  startInitialization();

  // 메시지 리스너 추가 (구버전 방식)
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
      if (request.action === 'ping') {
        // content script가 로드되었는지 확인하는 ping
        sendResponse({success: true, message: 'Content script loaded'});
      } else if (request.action === 'settingsChanged') {
        // 설정 변경 시 처리
        loadSettingsAndExecute();
        sendResponse({success: true});
      } else if (request.action === 'startCrawling') {
        // API 수집 시작
        window.lanisHelper.collectRareItems().then(result => {
          sendResponse(result);
        });
        return true; // 비동기 응답을 위해 true 반환
      }
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
  });

  // 페이지 변경 감지 (SPA 대응)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      
      // 새로운 페이지에서 기능 재실행 (구버전 방식)
      setTimeout(() => {
        // 사용자 프로필 처리
        if (window.userProfileManager) {
          window.userProfileManager.processUserNames();
          window.userProfileManager.processDynamicContent();
        }
        
        // 아이템 스탯 처리 (itemStatsManager에서 직접 처리)
        if (window.itemStatsManager) {
          window.itemStatsManager.processItemStats();
        }
        
        // 대기 중인 퀵검색 확인
        if (window.searchEngine) {
          window.searchEngine.checkPendingQuickSearch();
        }
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
