// 공식 API 기반 시세 데이터 모듈
/**
 * Lanis.me 공식 API를 사용한 시세 데이터 API 클래스
 * 기존 GoogleSheetAPI와 호환되는 인터페이스 제공
 */
class MarketPriceAPI {
  constructor() {
    this.baseURL = 'https://lanis.me/api/exchange/market-price';
    
    // 전역 캐시 사용 (모든 인스턴스가 공유)
    if (!MarketPriceAPI.globalCache) {
      MarketPriceAPI.globalCache = new Map();
    }
    this.cache = MarketPriceAPI.globalCache;
    
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24시간 캐시 (하루)
    this.fallbackAPI = null; // fallback용 기존 API
    this.useFallback = false; // fallback 사용 여부
    
    // 중복 요청 방지를 위한 요청 중인 아이템 추적
    if (!MarketPriceAPI.pendingRequests) {
      MarketPriceAPI.pendingRequests = new Map();
    }
    this.pendingRequests = MarketPriceAPI.pendingRequests;
  }

  /**
   * Bearer 토큰 가져오기
   * @returns {string|null} 토큰 또는 null
   */
  getBearerToken() {
    try {
      const token = localStorage.getItem('token');
      console.log('토큰 확인:', token ? '토큰 존재' : '토큰 없음');
      return token;
    } catch (error) {
      console.warn('토큰을 가져올 수 없습니다:', error);
      return null;
    }
  }

  /**
   * API 요청 헤더 생성
   * @returns {Object} 헤더 객체
   */
  getHeaders() {
    const token = this.getBearerToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * 캐시에서 데이터 확인
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터 또는 null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`캐시에서 ${key} 데이터 사용 (${Math.round((Date.now() - cached.timestamp) / 1000 / 60)}분 전 캐시)`);
      return cached.data;
    }
    
    // 캐시가 만료된 경우 제거
    if (cached) {
      this.cache.delete(key);
      console.log(`${key} 캐시 만료로 제거됨`);
    }
    
    return null;
  }

  /**
   * 데이터를 캐시에 저장
   * @param {string} key - 캐시 키
   * @param {Object} data - 저장할 데이터
   */
  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    console.log(`${key} 데이터 캐시에 저장됨 (24시간 유효)`);
  }

  /**
   * 아이템 시세 데이터 가져오기
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 시세 데이터
   */
  async fetchItemPriceData(itemName) {
    const cacheKey = `price_${itemName}`;
    
    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`캐시에서 ${itemName} 데이터 반환`);
      return cached;
    }

    // 중복 요청 방지: 이미 요청 중인 아이템이면 대기
    if (this.pendingRequests.has(itemName)) {
      console.log(`${itemName} 요청이 이미 진행 중입니다. 대기 중...`);
      return await this.pendingRequests.get(itemName);
    }

    // 요청 시작 표시
    const requestPromise = this.makeAPIRequest(itemName);
    this.pendingRequests.set(itemName, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // 요청 완료 후 대기 목록에서 제거
      this.pendingRequests.delete(itemName);
    }
  }

  async makeAPIRequest(itemName) {
    try {
      const url = `${this.baseURL}?itemName=${encodeURIComponent(itemName)}`;
      const headers = this.getHeaders();
      
      console.log(`API 요청: ${url}`);
      console.log('요청 헤더:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // CORS 모드 명시
        credentials: 'omit' // 쿠키 포함하지 않음
      });

      console.log(`응답 상태: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API 오류 응답:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`${itemName} API 응답:`, data);
      
      if (!data.success) {
        throw new Error('API 응답이 실패했습니다.');
      }

      // 캐시에 저장
      const cacheKey = `price_${itemName}`;
      this.setCache(cacheKey, data);
      
      return data;

    } catch (error) {
      console.error(`${itemName} 시세 데이터 가져오기 실패:`, error);
      
      // 네트워크 오류나 404 오류의 경우 더 자세한 정보 제공
      if (error.message.includes('404')) {
        console.error(`아이템 "${itemName}"을 찾을 수 없습니다. 정확한 아이템명을 확인해주세요.`);
      } else if (error.message.includes('Failed to fetch')) {
        console.error('네트워크 연결을 확인해주세요.');
      }
      
      // fallback API 사용 시도
      if (!this.useFallback && this.fallbackAPI) {
        console.log('Fallback API 사용 시도...');
        this.useFallback = true;
        try {
          const fallbackData = await this.fallbackAPI.getItemPrice(itemName, 'recent');
          return {
            success: true,
            marketPrice: {
              itemName: itemName,
              sevenDays: { average: fallbackData },
              thirtyDays: { average: fallbackData },
              priceHistory: []
            }
          };
        } catch (fallbackError) {
          console.error('Fallback API도 실패:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * 기존 API와 호환되는 가격 데이터 가져오기
   * @param {string} itemName - 아이템명
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<number>} 가격
   */
  async getItemPrice(itemName, priceType = 'recent') {
    try {
      const data = await this.fetchItemPriceData(itemName);
      const marketPrice = data.marketPrice;
      
      if (!marketPrice) {
        throw new Error(`${itemName}의 시세 데이터를 찾을 수 없습니다.`);
      }

      // priceType에 따라 적절한 가격 반환
      if (priceType === 'recent') {
        // 최근가: priceHistory의 가장 마지막 날짜의 average 사용
        if (marketPrice.priceHistory && marketPrice.priceHistory.length > 0) {
          const latestEntry = marketPrice.priceHistory[marketPrice.priceHistory.length - 1];
          return latestEntry.average || 0;
        }
        // priceHistory가 없으면 thirtyDays.average 사용
        return marketPrice.thirtyDays?.average || 0;
      } else if (priceType === 'average') {
        // 평균가: thirtyDays.average 사용
        return marketPrice.thirtyDays?.average || 0;
      }

      // 기본값: thirtyDays.average
      return marketPrice.thirtyDays?.average || 0;

    } catch (error) {
      console.error(`${itemName} 가격 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * 여러 아이템의 시세를 한 번에 가져오기
   * @param {Array} items - 아이템명 배열
   * @param {string} priceType - 가격 타입
   * @returns {Promise<Object>} 아이템별 가격 객체
   */
  async getMultipleItemPrices(items, priceType = 'recent') {
    const results = {};
    
    // 병렬로 모든 아이템의 시세를 가져오기
    const promises = items.map(async (itemName) => {
      try {
        const price = await this.getItemPrice(itemName, priceType);
        return { itemName, price };
      } catch (error) {
        console.warn(`${itemName} 가격 가져오기 실패:`, error);
        return { itemName, price: 0 };
      }
    });

    const results_array = await Promise.all(promises);
    
    results_array.forEach(({ itemName, price }) => {
      results[itemName] = price;
    });

    return results;
  }

  /**
   * 차트 데이터 가져오기 (기존 API와 호환)
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 차트 데이터
   */
  async getChartData(itemName) {
    try {
      const data = await this.fetchItemPriceData(itemName);
      const marketPrice = data.marketPrice;
      
      if (!marketPrice || !marketPrice.priceHistory) {
        return {
          prices: [],
          averagePrice: 0,
          recentPrice: 0,
          totalTrades: 0
        };
      }

      // priceHistory를 prices 배열로 변환
      const prices = marketPrice.priceHistory.map(entry => entry.average);
      
      // 최근가: priceHistory의 가장 마지막 날짜의 average
      let recentPrice = 0;
      if (marketPrice.priceHistory.length > 0) {
        const latestEntry = marketPrice.priceHistory[marketPrice.priceHistory.length - 1];
        recentPrice = latestEntry.average || 0;
      }
      
      return {
        prices: prices,
        averagePrice: marketPrice.thirtyDays?.average || 0, // 평균가: thirtyDays.average
        recentPrice: recentPrice, // 최근가: priceHistory 마지막 날짜의 average
        totalTrades: marketPrice.thirtyDays?.count || 0
      };

    } catch (error) {
      console.error(`${itemName} 차트 데이터 가져오기 실패:`, error);
      return {
        prices: [],
        averagePrice: 0,
        recentPrice: 0,
        totalTrades: 0
      };
    }
  }

  /**
   * 아이템 검색 기능 (기존 API와 호환)
   * @param {string} query - 검색어
   * @returns {Promise<Array>} 검색 결과 (현재는 빈 배열 반환)
   */
  async searchItems(query) {
    // 공식 API에서는 별도의 검색 엔드포인트가 필요할 수 있음
    // 현재는 빈 배열 반환
    console.warn('아이템 검색 기능은 아직 구현되지 않았습니다.');
    return [];
  }

  /**
   * 최신 거래 데이터 가져오기 (기존 API와 호환)
   * @returns {Promise<Object|null>} 최신 거래 정보 또는 null
   */
  async getLatestTradeData() {
    // 공식 API에서는 별도의 최신 거래 엔드포인트가 필요할 수 있음
    // 현재는 null 반환
    console.warn('최신 거래 데이터 기능은 아직 구현되지 않았습니다.');
    return null;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('전역 캐시가 초기화되었습니다.');
  }

  /**
   * 데이터 유효성 검사 (기존 API와 호환)
   * @param {Array} data - 데이터 배열
   * @returns {boolean} 유효성 여부
   */
  validateData(data) {
    return data && Array.isArray(data) && data.length > 0;
  }

  /**
   * Fallback API 설정
   * @param {Object} fallbackAPI - 기존 API 인스턴스
   */
  setFallbackAPI(fallbackAPI) {
    this.fallbackAPI = fallbackAPI;
  }

  /**
   * 캐시 통계 정보 가져오기
   * @returns {Object} 캐시 통계
   */
  getCacheStats() {
    const now = Date.now();
    const stats = {
      totalItems: this.cache.size,
      validItems: 0,
      expiredItems: 0,
      items: []
    };

    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;
      const isValid = age < this.cacheTimeout;
      
      if (isValid) {
        stats.validItems++;
      } else {
        stats.expiredItems++;
      }
      
      stats.items.push({
        key: key,
        age: Math.round(age / 1000 / 60), // 분 단위
        isValid: isValid
      });
    }

    return stats;
  }
}

export default MarketPriceAPI;
