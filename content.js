// Lanis Helper 메인 확장 프로그램
(function() {
  'use strict';

  // CSS 스타일 로드 (안전한 방식)
  function loadStyles() {
    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. CSS 로드를 건너뜁니다.');
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = chrome.runtime.getURL('styles.css');
      document.head.appendChild(link);
    } catch (error) {
      console.warn('CSS 스타일 로드 실패:', error);
    }
  }

  // 모듈이 로드되었는지 확인하는 함수 (개선된 버전)
  function waitForModule(moduleName, maxWait = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkModule = () => {
        try {
          // 확장 프로그램 컨텍스트 유효성 검사
          if (!utils.isValidExtensionContext()) {
            console.warn(`Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. ${moduleName} 모듈 로드를 건너뜁니다.`);
            resolve(); // 컨텍스트가 무효하면 그냥 성공으로 처리
            return;
          }

          const elapsed = Date.now() - startTime;
          if (window[moduleName]) {
            resolve();
          } else if (elapsed > maxWait) {
            const relevantKeys = Object.keys(window).filter(key =>
              key.includes('Manager') || key.includes('Engine') || key.includes('menu') || key.includes('search')
            );
            console.warn(`${moduleName} 모듈 로드 실패. 현재 window 객체:`, relevantKeys);
            resolve(); // 타임아웃이어도 성공으로 처리하여 계속 진행
          } else {
            setTimeout(checkModule, 50); // 더 빠른 체크 간격
          }
        } catch (error) {
          console.warn(`${moduleName} 모듈 체크 중 오류:`, error);
          resolve(); // 오류가 발생해도 성공으로 처리
        }
      };
      checkModule();
    });
  }

  // 모든 모듈이 준비될 때까지 기다리는 함수 (안전한 방식)
  async function waitForAllModules() {
    const modules = ['menuManager', 'searchEngine', 'itemStatsManager', 'settingsModalManager', 'userProfileManager'];
    
    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!utils.isValidExtensionContext()) {
        console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. 모듈 로드를 건너뜁니다.');
        return;
      }

      const modulePromises = modules.map(module => waitForModule(module));
      await Promise.all(modulePromises);
    } catch (error) {
      console.warn('모듈 로드 실패:', error);
      // 모듈 로드 실패해도 계속 진행
    }
  }

  // 설정 로드 및 기능 실행 (안전한 방식)
  function loadSettingsAndExecute() {
    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!utils.isValidExtensionContext()) {
        console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. 설정 로드를 건너뜁니다.');
        return;
      }

      utils.SettingsManager.getSettings({
        profileLink: true,
        feature2: false,
        feature3: false,
        showItemStats: true
      }).then(function(items) {
        utils.safeExecute(() => {
          const settings = items;
          
          // 프로필 링크 처리
          utils.safeExecute(() => {
            if (settings.profileLink && window.userProfileManager) {
              window.userProfileManager.processUserNames();
              window.userProfileManager.processDynamicContent();
            } else if (window.userProfileManager) {
              window.userProfileManager.removeUserNames();
            }
          }, '프로필 링크 처리 실패');
          
          // 아이템 감정 범위 표기 처리
          utils.safeExecute(() => {
            if (window.itemStatsManager) {
              window.itemStatsManager.settings = settings;
              if (settings.showItemStats) {
                window.itemStatsManager.processItemStats();
              } else {
                window.itemStatsManager.removeItemStats();
              }
            }
          }, '아이템 스탯 처리 실패');
        }, '설정 적용 실패');
      });
    } catch (error) {
      console.warn('설정 로드 실패:', error);
    }
  }

  // 메인 초기화 함수
  async function initializeExtension() {
    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!utils.isValidExtensionContext()) {
        console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. 초기화를 건너뜁니다.');
        return;
      }

      // CSS 스타일 로드
      utils.safeExecute(() => {
        loadStyles();
      }, 'CSS 스타일 로드 실패');
      
      // 모든 모듈이 로드될 때까지 대기 (실패해도 계속 진행)
      await utils.safeExecuteAsync(async () => {
        await waitForAllModules();
      }, '모듈 로드 실패, 계속 진행');
      
      // 각 모듈 초기화 (안전한 방식)
      await utils.safeExecuteAsync(async () => {
        if (window.menuManager && typeof window.menuManager.init === 'function') {
          await window.menuManager.init();
        }
      }, '메뉴 매니저 초기화 실패');

      await utils.safeExecuteAsync(async () => {
        if (window.searchEngine && typeof window.searchEngine.init === 'function') {
          await window.searchEngine.init();
        }
      }, '검색 엔진 초기화 실패');

      await utils.safeExecuteAsync(async () => {
        if (window.itemStatsManager && typeof window.itemStatsManager.init === 'function') {
          await window.itemStatsManager.init();
        }
      }, '아이템 스탯 매니저 초기화 실패');

      utils.safeExecute(() => {
        if (window.userProfileManager && typeof window.userProfileManager.init === 'function') {
          window.userProfileManager.init();
        }
      }, '사용자 프로필 매니저 초기화 실패');

      utils.safeExecute(() => {
        if (window.settingsModalManager && typeof window.settingsModalManager.init === 'function') {
          window.settingsModalManager.init();
        }
      }, '설정 모달 매니저 초기화 실패');

      // 설정 로드 및 기능 실행
      utils.safeExecute(() => {
        loadSettingsAndExecute();
      }, '설정 로드 실패');
      
      // 퀵검색 관련 기능은 삭제됨 (checkPendingQuickSearch 함수가 존재하지 않음)

      console.log('Lanis Helper 초기화 완료');
    } catch (error) {
      console.warn('Lanis Helper 초기화 중 오류 발생:', error);
      console.warn('에러 상세 정보:', {
        message: error.message,
        stack: error.stack,
        menuManager: !!window.menuManager,
        searchEngine: !!window.searchEngine,
        itemStatsManager: !!window.itemStatsManager,
        userProfileManager: !!window.userProfileManager,
        settingsModalManager: !!window.settingsModalManager,
        chromeRuntime: utils.isValidExtensionContext()
      });
      
      // 확장 프로그램 컨텍스트가 유효한 경우에만 재시도
      if (utils.isValidExtensionContext()) {
        setTimeout(() => {
          initializeExtension();
        }, 5000);
      } else {
        console.warn('확장 프로그램 컨텍스트가 무효화되어 재시도를 중단합니다.');
      }
    }
  }

  // 전역 객체에 메서드 노출 (안전한 방식)
  window.lanisHelper = {
    processUserNames: () => {
      utils.safeExecute(() => {
        if (window.userProfileManager && typeof window.userProfileManager.processUserNames === 'function') {
          window.userProfileManager.processUserNames();
        }
      }, '프로필 링크 처리 실패');
    },
    removeUserNames: () => {
      utils.safeExecute(() => {
        if (window.userProfileManager && typeof window.userProfileManager.removeUserNames === 'function') {
          window.userProfileManager.removeUserNames();
        }
      }, '프로필 링크 제거 실패');
    },
    executeQuickSearch: (searchConfig, buttonIndex) => {
      utils.safeExecute(() => {
        if (window.searchEngine && typeof window.searchEngine.executeQuickSearch === 'function') {
          window.searchEngine.executeQuickSearch(searchConfig, buttonIndex);
        } else {
          console.warn('executeQuickSearch 함수가 존재하지 않습니다.');
        }
      }, '퀵검색 실행 실패');
    },
    openQuickSettingsModal: (index) => {
      // 퀵설정 모달 기능 삭제됨
      console.log('퀵설정 모달 기능이 삭제되었습니다.');
    },
    processItemStats: () => {
      utils.safeExecute(() => {
        if (window.itemStatsManager && typeof window.itemStatsManager.processItemStats === 'function') {
          window.itemStatsManager.processItemStats();
        }
      }, '아이템 스탯 처리 실패');
    },
    removeItemStats: () => {
      utils.safeExecute(() => {
        if (window.itemStatsManager && typeof window.itemStatsManager.removeItemStats === 'function') {
          window.itemStatsManager.removeItemStats();
        }
      }, '아이템 스탯 제거 실패');
    },
    loadSettingsAndExecute: loadSettingsAndExecute,
    collectRareItems: async () => {
      return await utils.safeExecuteAsync(async () => {
        if (window.searchEngine && typeof window.searchEngine.collectRareItems === 'function') {
          return await window.searchEngine.collectRareItems();
        } else {
          throw new Error('SearchEngine이 초기화되지 않았습니다.');
        }
      }, '레어아이템 수집 실패');
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

  // 메시지 리스너(안전한 방식)
  try {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        try {
          // 확장 프로그램 컨텍스트 유효성 검사
          if (!chrome || !chrome.runtime || !chrome.runtime.id) {
            sendResponse({success: false, error: 'Extension context invalidated'});
            return;
          }

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
                } catch (error) {
                  console.warn('응답 전송 실패:', error);
                }
              })
              .catch(error => {
                try {
                  sendResponse({
                    success: false,
                    message: `수집 실패: ${error.message}`,
                    error: error.message
                  });
                } catch (responseError) {
                  console.warn('에러 응답 전송 실패:', responseError);
                }
              });
            return true; // 비동기 응답을 위해 true 반환
          }
        } catch (error) {
          try {
            sendResponse({success: false, error: error.message});
          } catch (responseError) {
            console.warn('에러 응답 전송 실패:', responseError);
          }
        }
      });
    }
  } catch (error) {
    console.warn('메시지 리스너 등록 실패:', error);
  }

  // SPA(싱글페이지앱) 대응: URL 변경 감지
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(() => {
        try {
          if (window.userProfileManager && typeof window.userProfileManager.processUserNames === 'function') {
            window.userProfileManager.processUserNames();
          }
          if (window.userProfileManager && typeof window.userProfileManager.processDynamicContent === 'function') {
            window.userProfileManager.processDynamicContent();
          }
          if (window.itemStatsManager && typeof window.itemStatsManager.processItemStats === 'function') {
            window.itemStatsManager.processItemStats();
          }
          // 퀵검색 관련 기능은 삭제됨 (checkPendingQuickSearch 함수가 존재하지 않음)
        } catch (error) {
          console.warn('URL 변경 시 기능 실행 실패:', error);
        }
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();