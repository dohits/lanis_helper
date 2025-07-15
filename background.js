// Lanis Helper 백그라운드 서비스 워커
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 필요시 메시지 relay 등 처리
  // 현재는 별도 로직 없음
  return false;
}); 
