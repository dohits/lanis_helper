// Lanis Helper 메인 확장 프로그램
import utils from './utils.js';
import ItemStatsManager from './item-stats.js';
import SearchEngine from './search-engine.js';
import UserProfileManager from './user-profile.js';
import ITEM_COLORS from '../styles/item-colors.js';
import MenuManager from './menu-module/menu-manager.js';
import TimeGaugeManager from './dom-modules/time-gauge/TimeGaugeManager.js';
import { LANIS_ME_PATHS } from '../shared/constants.js';


// 전역 인스턴스들을 저장할 객체
const managers = {
  itemStatsManager: null,
  searchEngine: null,
  userProfileManager: null,
  menuManager: null,
  timeGaugeManager: null
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
      feature2: false,
      feature3: false,
      showItemStats: true,
      showTimeGauge: true,
      useComfortPack: 'off'
    }).then(function(items) {
      utils.safeExecute(() => {
        const settings = items;
        
        // useComfortPack 값 정규화 (기존 boolean 값 호환성 처리)
        if (settings.useComfortPack === true) {
          settings.useComfortPack = 'on';
        } else if (settings.useComfortPack === false) {
          settings.useComfortPack = 'off';
        } else if (!['on', 'off', 'hidden'].includes(settings.useComfortPack)) {
          settings.useComfortPack = 'off';
        }

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

        // 시간 게이지바 처리
        utils.safeExecuteAsync(async () => {
          if (managers.timeGaugeManager) {
            // showTimeGauge가 false이거나 useComfortPack이 hidden이면 게이지바 제거
            if (settings.showTimeGauge && settings.useComfortPack !== 'hidden') {
              await managers.timeGaugeManager.init();
            } else {
              managers.timeGaugeManager.destroy();
            }
          }
        }, '시간 게이지바 처리 중 오류');
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

    // 시간 게이지바 매니저 초기화 (설정에 따라 처리됨)
    // 실제 초기화는 설정 로드 후에 수행됨

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
            showItemStats: true,
            showTimeGauge: true
          });
          
          // 아이템 스카우터 처리 (설정에 따라)
          if (settings.showItemStats && managers.itemStatsManager) {
            await managers.itemStatsManager.processItemStats();
          }

          // 시간 게이지바 처리 (설정에 따라)
          if (settings.showTimeGauge && managers.timeGaugeManager) {
            await managers.timeGaugeManager.init();
                      // URL 변경 시 통발 설치 시간 재감지
          if (window.location.href.includes(LANIS_ME_PATHS.FISHING)) {
              managers.timeGaugeManager.checkFishingInstallationTime();
            }
          } else if (managers.timeGaugeManager) {
            managers.timeGaugeManager.destroy();
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
    managers.timeGaugeManager = new TimeGaugeManager();

    // === 전역 window에 직접 할당 (토글 등 menu-manager.js 호환) ===
    window.userProfileManager = managers.userProfileManager;
    window.itemStatsManager = managers.itemStatsManager;
    window.menuManager = managers.menuManager;
    window.timeGaugeManager = managers.timeGaugeManager;
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