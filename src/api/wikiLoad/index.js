// 위키 API 공통 모듈
class WikiAPI {
  constructor() {
    this.baseUrl = 'https://laniswiki.lovestoblog.com/api.php';
    this.headers = {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Referer': 'https://laniswiki.lovestoblog.com/',
      'Origin': 'https://laniswiki.lovestoblog.com',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    };
    this.maxRetries = 3;
    this.retryDelay = 3000;
  }

  // 기본 API 요청 메서드
  async makeRequest(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
  
        
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: this.headers,
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        // HTML 응답 체크 (Cloudflare 챌린지 - 정상적인 응답)
        if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
  
          
          if (attempt < this.maxRetries) {

            await this.sleep(this.retryDelay);
            continue;
          } else {
            throw new Error('새로고침 후 다시 시도해 주세요.');
          }
        }

        return JSON.parse(text);
        
      } catch (error) {
        lastError = error;
        console.error(`시도 ${attempt} 실패:`, error.message);
        
        if (attempt < this.maxRetries) {
  
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    console.error('모든 재시도 실패:', lastError);
    throw lastError;
  }

  // 카테고리 멤버 조회
  async getCategoryMembers(categoryTitle, limit = 500) {
    const url = `${this.baseUrl}?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=${limit}`;
    return await this.makeRequest(url);
  }

  // 페이지 내용 조회
  async getPageContent(titles, props = 'revisions', rvprops = 'content') {
    const titlesParam = Array.isArray(titles) ? titles.join('|') : titles;
    
    // URL이 너무 길면 POST 요청 사용
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: titlesParam,
      prop: props,
      rvprop: rvprops
    });
    
    const url = this.baseUrl;
    const options = {
      method: 'POST',
      body: params,
      headers: {
        ...this.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Forwarded-For': '127.0.0.1',
        'X-Real-IP': '127.0.0.1'
      }
    };
    
    return await this.makeRequest(url, options);
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