// 백그라운드 스크립트 - API 요청 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchWikiData') {
    fetchWikiData(request.url)
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true 반환
  }
});

async function fetchWikiData(url) {
  try {
    // 실제 요청 URL 사용 (전달받은 URL)
    const requestUrl = url || 'https://laniswiki.lovestoblog.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=5';
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // HTML이 반환되는지 확인
    if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('서버가 HTML을 반환했습니다. 위키 API 접근 권한이 없을 수 있습니다.');
    }
    
    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      throw new Error(`JSON 파싱 실패: ${parseError.message}. 응답: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    // 대안 방법: 다른 API 엔드포인트 시도
    try {
      const alternativeUrl = 'https://laniswiki.lovestoblog.com/api.php?action=query&format=json&list=allcategories&aclimit=5';
      
      const altResponse = await fetch(alternativeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const altText = await altResponse.text();
      
      if (!altText.trim().startsWith('<html')) {
        const altData = JSON.parse(altText);
        return altData;
      }
    } catch (altError) {
      // 대안 API도 실패
    }
    
    throw error;
  }
} 