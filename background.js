// 백그라운드 스크립트 - 기본 구조 유지
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 현재는 특별한 처리가 필요하지 않음
  // 향후 다른 기능이 필요할 때를 위해 기본 구조 유지
  console.log('백그라운드 메시지 수신:', request.action);
  
  // ping 메시지에 대한 응답
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Background script loaded' });
  }
  
  // 다른 메시지들은 content script에서 직접 처리됨
  return false; // 동기 응답
}); 