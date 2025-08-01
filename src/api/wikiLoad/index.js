// 위키 API 공통 모듈
class WikiAPI {
  constructor() {
    this.baseUrl = 'https://laniswiki.lovestoblog.com/api.php';
    this.headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  // 기본 API 요청 메서드
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      // HTML 응답 체크
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        console.error('서버가 HTML을 반환했습니다:', text.substring(0, 1000));
        throw new Error('서버가 HTML을 반환했습니다. 위키 API 접근 권한이 없을 수 있습니다.');
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('위키 API 요청 실패:', error);
      throw error;
    }
  }

  // 카테고리 멤버 조회
  async getCategoryMembers(categoryTitle, limit = 500) {
    const url = `${this.baseUrl}?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=${limit}`;
    return await this.makeRequest(url);
  }

  // 페이지 내용 조회
  async getPageContent(titles, props = 'revisions', rvprops = 'content') {
    const titlesParam = Array.isArray(titles) ? titles.join('|') : titles;
    const url = `${this.baseUrl}?action=query&format=json&titles=${encodeURIComponent(titlesParam)}&prop=${props}&rvprop=${rvprops}`;
    return await this.makeRequest(url);
  }

  // 배치 처리용 헬퍼 메서드
  async processBatch(items, batchSize, processor) {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResult = await processor(batch);
      
      results.push(...batchResult.items);
      successCount += batchResult.successCount;
      failCount += batchResult.failCount;

      // 배치 간 지연 (서버 부하 방지)
      if (i + batchSize < items.length) {
        await this.sleep(300);
      }
    }

    return {
      items: results,
      successCount,
      failCount
    };
  }

  // 유틸리티 메서드
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default WikiAPI; 