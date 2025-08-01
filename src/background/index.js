// Lanis Helper 백그라운드 서비스 워커

// 기본 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 향후 확장을 위한 기본 메시지 처리 구조
  console.log('[Background] 메시지 수신:', message.type);
  
  // 기본 응답
  sendResponse({ success: false, error: '지원하지 않는 메시지 타입입니다.' });
  return false;
}); 
