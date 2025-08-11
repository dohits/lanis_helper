// Lanis Helper 백그라운드 서비스 워커

// 도메인 설정 (Service Worker 호환성을 위해 직접 정의)
const DOMAINS = {
  LANIS_ME: 'lanis.me',
  LANIS_WIKI: 'laniswiki.lovestoblog.com'
};

// 기본 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  
  if (message.action === 'startItemCollection') {
    handleItemCollection(sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 기본 응답
  sendResponse({ success: false, error: '지원하지 않는 메시지 타입입니다.' });
  return false;
});

// 아이템 수집 처리
async function handleItemCollection(sendResponse) {
  try {
    // 현재 활성 탭 가져오기
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      sendResponse({ success: false, error: '활성 탭을 찾을 수 없습니다.' });
      return;
    }
    
    const activeTab = tabs[0];
    
    // chrome:// URL인지 확인
    if (activeTab.url.startsWith('chrome://')) {
      sendResponse({ success: false, error: 'Chrome 내부 페이지에서는 사용할 수 없습니다.' });
      return;
    }
    
    // laniswiki 도메인이 아닌 경우 경고
    if (!activeTab.url.includes(DOMAINS.LANIS_WIKI)) {
      // alert으로 경고 표시
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'showAlert',
        message: `⚠️ 아이템 수집은 https://${DOMAINS.LANIS_WIKI}/ 에서 실행해주세요.\n\n현재 페이지에서는 아이템 수집이 불가능합니다.`
      }).catch(() => {
        // content script가 없는 경우 무시
      });
      
      sendResponse({ success: false, error: `아이템 수집은 https://${DOMAINS.LANIS_WIKI}/ 에서 실행해주세요.` });
      return;
    }
    
    // content script에 크롤링 요청
    const response = await chrome.tabs.sendMessage(activeTab.id, {
      action: 'startCrawling'
    });
    
    if (response && response.success) {
      const count = response.count || response.data?.length || 0;
      sendResponse({ 
        success: true, 
        message: response.message || '수집 완료',
        count: count
      });
    } else {
      sendResponse({ 
        success: false, 
        error: response?.message || response?.error || '수집 실패'
      });
    }
    
  } catch (error) {
    console.error('[Background] 아이템 수집 오류:', error);
    sendResponse({ 
      success: false, 
      error: `수집 중 오류가 발생했습니다: ${error.message}` 
    });
  }
} 
