// 백그라운드 스크립트 - 기본 구조 유지
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('백그라운드 메시지 수신:', request.action);
  
  // ping 메시지에 대한 응답
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Background script loaded' });
  }
  
  // 팝업 열기 메시지 처리
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  
  // 다른 메시지들은 content script에서 직접 처리됨
  return false; // 동기 응답
}); 