// Lanis Helper 메인 확장 프로그램
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

  // 모든 모듈이 준비될 때까지 기다리는 함수 (병렬 처리)
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
      showItemStats: true
    }, function(items) {
      const settings = items;
      // 프로필 링크 처리
      if (settings.profileLink && window.userProfileManager) {
        window.userProfileManager.processUserNames();
        window.userProfileManager.processDynamicContent();
      } else if (window.userProfileManager) {
        window.userProfileManager.removeUserNames();
      }
      // 아이템 감정 범위 표기 처리
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
      // 모든 모듈이 로드될 때까지 대기
      await waitForAllModules();
      // 각 모듈 초기화
      await window.menuManager.init();
      await window.searchEngine.init();
      await window.itemStatsManager.init();
      window.userProfileManager.init();
      window.settingsModalManager.init();
      // 설정 로드 및 기능 실행
      loadSettingsAndExecute();
      // 대기 중인 퀵검색 확인
      window.searchEngine.checkPendingQuickSearch();
    } catch (error) {
      console.error('Lanis Helper 초기화 실패:', error);
      console.error('에러 상세 정보:', {
        message: error.message,
        stack: error.stack,
        menuManager: !!window.menuManager,
        searchEngine: !!window.searchEngine,
        itemStatsManager: !!window.itemStatsManager,
        userProfileManager: !!window.userProfileManager,
        settingsModalManager: !!window.settingsModalManager
      });
      // 재시도 로직
      setTimeout(() => {
        initializeExtension();
      }, 5000);
    }
  }

  // 전역 객체에 메서드 노출
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
    loadSettingsAndExecute: loadSettingsAndExecute,
    collectRareItems: async () => {
      if (window.searchEngine) {
        return await window.searchEngine.collectRareItems();
      } else {
        throw new Error('SearchEngine이 초기화되지 않았습니다.');
      }
    }
  };

  // DOM 로드 완료 후 초기화(개선된 버전)
  function startInitialization() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeExtension, 100);
      });
    } else {
      setTimeout(initializeExtension, 100);
    }
  }

  // 초기화 시작
  startInitialization();

  // 메시지 리스너(구버전 방식)
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
      if (request.action === 'ping') {
        sendResponse({success: true, message: 'Content script loaded'});
      } else if (request.action === 'settingsChanged') {
        loadSettingsAndExecute();
        sendResponse({success: true});
      } else if (request.action === 'startCrawling') {
        if (!window.searchEngine) {
          sendResponse({success: false, message: 'SearchEngine이 초기화되지 않았습니다. 페이지를 새로고침하고 다시 시도해주세요.'});
          return false;
        }
        window.lanisHelper.collectRareItems()
          .then(result => {
            try {
              sendResponse(result);
            } catch (error) {}
          })
          .catch(error => {
            try {
              sendResponse({
                success: false,
                message: `수집 실패: ${error.message}`,
                error: error.message
              });
            } catch (responseError) {}
          });
        return true; // 비동기 응답을 위해 true 반환
      }
    } catch (error) {
      try {
        sendResponse({success: false, error: error.message});
      } catch (responseError) {}
    }
  });

  // SPA(싱글페이지앱) 대응: URL 변경 감지
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(() => {
        if (window.userProfileManager) {
          window.userProfileManager.processUserNames();
          window.userProfileManager.processDynamicContent();
        }
        if (window.itemStatsManager) {
          window.itemStatsManager.processItemStats();
        }
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