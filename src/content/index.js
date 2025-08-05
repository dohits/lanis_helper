// Lanis Helper 메인 확장 프로그램
import utils from './utils.js';
import ItemStatsManager from './item-stats.js';
import SearchEngine from './search-engine.js';
import UserProfileManager from './user-profile.js';
import ITEM_COLORS from '../styles/item-colors.js';
import MenuManager from './menu-module/menu-manager.js';


// 전역 인스턴스들을 저장할 객체
const managers = {
  itemStatsManager: null,
  searchEngine: null,
  userProfileManager: null,
  menuManager: null
};

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
          if (managers.userProfileManager) {
            if (settings.profileLink) {
              managers.userProfileManager.processUserNames();
              managers.userProfileManager.processDynamicContent();
            } else {
              managers.userProfileManager.removeUserNames();
            }
          }
        }, '프로필 링크 처리 중 오류');

        // 아이템 등급 표기 처리 (아이템 스카우터)
        utils.safeExecuteAsync(async () => {
          if (managers.itemStatsManager) {
            managers.itemStatsManager.settings = settings;
            if (settings.showItemStats) {
              await managers.itemStatsManager.processItemStats();
            } else {
              managers.itemStatsManager.removeItemStats();
            }
          }
        }, '아이템 등급 표기 처리 중 오류');
      }, '설정 실행 중 오류');
    }).catch(function(error) {
      console.warn('설정 로드 실패:', error);
    });
  } catch (error) {
    console.warn('설정 로드 및 실행 중 오류:', error);
  }
}

// 확장 프로그램 초기화 (개선된 버전)
async function initializeExtension() {
  try {
    // 확장 프로그램 컨텍스트 유효성 검사
    if (!utils.isValidExtensionContext()) {
      console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. 초기화를 건너뜁니다.');
      return;
    }



    // CSS 스타일 로드
    loadStyles();

    // 아이템 통계 매니저 초기화 (우선순위 높음)
    utils.safeExecuteAsync(async () => {
      if (managers.itemStatsManager && typeof managers.itemStatsManager.init === 'function') {
        await managers.itemStatsManager.init();
      }
    }, '아이템 통계 매니저 초기화 중 오류');

    // 검색 엔진 초기화
    utils.safeExecuteAsync(async () => {
      if (managers.searchEngine && typeof managers.searchEngine.init === 'function') {
        await managers.searchEngine.init();
      }
    }, '검색 엔진 초기화 중 오류');

    // 메뉴 매니저 초기화
    utils.safeExecuteAsync(async () => {
      if (managers.menuManager && typeof managers.menuManager.init === 'function') {
        await managers.menuManager.init();
      }
    }, '메뉴 매니저 초기화 중 오류');

    // 사용자 프로필 매니저 초기화
    utils.safeExecute(() => {
      if (managers.userProfileManager && typeof managers.userProfileManager.init === 'function') {
        managers.userProfileManager.init();
      }
    }, '사용자 프로필 매니저 초기화 중 오류');

    // 설정 모달 매니저 초기화
    utils.safeExecute(() => {
      if (managers.settingsModalManager && typeof managers.settingsModalManager.init === 'function') {
        managers.settingsModalManager.init();
      }
    }, '설정 모달 매니저 초기화 중 오류');

    // 설정 로드 및 실행 (약간의 지연 후)
    setTimeout(() => {
      loadSettingsAndExecute();
    }, 500);



  } catch (error) {
    console.error('확장 프로그램 초기화 중 오류:', error);
  }
}

// utils를 전역으로 노출 (기존 코드와의 호환성을 위해)
window.utils = utils;

// 전역 API 객체 생성 (기존 코드와의 호환성을 위해)
window.lanisHelper = {
  // 프로필 링크 처리
  processUserNames: () => {
    utils.safeExecute(() => {
      if (managers.userProfileManager && typeof managers.userProfileManager.processUserNames === 'function') {
        managers.userProfileManager.processUserNames();
      }
    }, '사용자명 처리 중 오류');
  },

  removeUserNames: () => {
    utils.safeExecute(() => {
      if (managers.userProfileManager && typeof managers.userProfileManager.removeUserNames === 'function') {
        managers.userProfileManager.removeUserNames();
      }
    }, '사용자명 제거 중 오류');
  },

  // 퀵 검색 실행
  executeQuickSearch: (searchConfig, buttonIndex) => {
    utils.safeExecuteAsync(async () => {
      if (managers.searchEngine && typeof managers.searchEngine.executeQuickSearch === 'function') {
        await managers.searchEngine.executeQuickSearch(searchConfig, buttonIndex);
      }
    }, '퀵 검색 실행 중 오류');
  },

  // 아이템 통계 처리
  processItemStats: () => {
    utils.safeExecute(() => {
      if (managers.itemStatsManager && typeof managers.itemStatsManager.processItemStats === 'function') {
        managers.itemStatsManager.processItemStats();
      }
    }, '아이템 통계 처리 중 오류');
  },

  removeItemStats: () => {
    utils.safeExecute(() => {
      if (managers.itemStatsManager && typeof managers.itemStatsManager.removeItemStats === 'function') {
        managers.itemStatsManager.removeItemStats();
      }
    }, '아이템 통계 제거 중 오류');
  },

  // 레어 아이템 수집
  collectRareItems: async () => {
    try {
      if (!managers.searchEngine) {
        console.warn('검색 엔진이 초기화되지 않았습니다.');
        return { success: false, message: '검색 엔진이 초기화되지 않았습니다.' };
      }
      
      // SearchEngine의 collectRareItems 메서드 직접 호출
      const result = await managers.searchEngine.collectRareItems();
      
      return result;
    } catch (error) {
      console.error('레어 아이템 수집 중 오류:', error);
      return { success: false, message: `수집 오류: ${error.message}` };
    }
  }
};

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'settingsChanged') {
      loadSettingsAndExecute();
      sendResponse({ success: true });
    } else if (request.action === 'getStatus') {
      sendResponse({
        menuManager: !!managers.menuManager,
        searchEngine: !!managers.searchEngine,
        itemStatsManager: !!managers.itemStatsManager,
        userProfileManager: !!managers.userProfileManager,
        settingsModalManager: !!managers.settingsModalManager
      });
    } else if (request.action === 'ping') {
      sendResponse({ success: true });
    } else if (request.action === 'showAlert') {
      // alert 메시지 표시
      alert(request.message || '알림');
      sendResponse({ success: true });
    } else if (request.action === 'startCrawling') {
      // 레어 아이템 수집 시작
      window.lanisHelper.collectRareItems().then(result => {
        
        if (result && result.success) {
          sendResponse({
            success: true,
            message: result.message || '레어 아이템 수집 완료',
            count: result.count || 0,
            data: result.data || []
          });
        } else {
          sendResponse({
            success: false,
            message: result?.message || '수집된 아이템이 없습니다.'
          });
        }
      }).catch(error => {
        console.error('레어 아이템 수집 오류:', error);
        sendResponse({
          success: false,
          message: `수집 오류: ${error.message}`
        });
      });
      return true; // 비동기 응답을 위해 true 반환
    }
  } catch (error) {
    console.error('메시지 처리 중 오류:', error);
    sendResponse({ error: error.message });
  }
});

// URL 변경 감지 및 동적 콘텐츠 처리
let currentUrl = window.location.href;

// URL 변경 감지 (개선된 버전)
setInterval(() => {
  try {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      
      // URL 변경 시 설정에 따라 동적 콘텐츠 재처리
      utils.safeExecuteAsync(async () => {
        try {
          // 확장 프로그램 컨텍스트 유효성 검사
          if (!utils.isValidExtensionContext()) {
            // URL 변경 시 정상적인 현상이므로 조용히 처리
            return;
          }
          
          // 페이지 로딩 상태 확인
          if (document.readyState !== 'complete') {
            console.warn('페이지가 아직 로딩 중입니다. URL 변경 처리를 건너뜁니다.');
            return;
          }
          
          // 설정 로드 및 기능 실행
          const settings = await utils.SettingsManager.getSettings({
            profileLink: true,
            showItemStats: true
          });
          
          // 프로필 링크 처리 (설정에 따라)
          if (settings.profileLink && managers.userProfileManager) {
            await managers.userProfileManager.processUserNames();
            managers.userProfileManager.processDynamicContent();
          }
          
          // 아이템 스카우터 처리 (설정에 따라)
          if (settings.showItemStats && managers.itemStatsManager) {
            await managers.itemStatsManager.processItemStats();
          }
        } catch (error) {
          console.warn('URL 변경 시 동적 콘텐츠 처리 중 오류:', error);
        }
      }, 'URL 변경 시 동적 콘텐츠 처리 중 오류');
    }
  } catch (error) {
    console.warn('URL 변경 감지 중 오류:', error);
  }
}, 2000); // 간격을 2초로 늘려서 부하 감소

// 초기화 시작 함수
function startInitialization() {
  try {
    // 확장 프로그램 컨텍스트 유효성 검사
    if (!utils.isValidExtensionContext()) {
      console.warn('Chrome 확장 프로그램 컨텍스트가 유효하지 않습니다. 초기화를 건너뜁니다.');
      return;
    }

    // 매니저 인스턴스들 생성
    managers.itemStatsManager = new ItemStatsManager();
    managers.searchEngine = new SearchEngine();
    managers.userProfileManager = new UserProfileManager();
    managers.menuManager = new MenuManager();

    // === 전역 window에 직접 할당 (토글 등 menu-manager.js 호환) ===
    window.userProfileManager = managers.userProfileManager;
    window.itemStatsManager = managers.itemStatsManager;
    window.menuManager = managers.menuManager;
    // ==========================================================

    // DOM이 준비되면 초기화 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
      initializeExtension();
    }

  } catch (error) {
    console.error('초기화 시작 중 오류:', error);
  }
}

// 초기화 시작
startInitialization();