// 공식 API 기반 가격 데이터 페처 (기존 PriceFetcher와 호환)
import MarketPriceAPI from '../../api/officialAPI/marketPriceAPI.js';

/**
 * 공식 API를 사용한 가격 데이터 페처
 * 기존 PriceFetcher와 동일한 인터페이스 제공
 */
class OfficialPriceFetcher {
  constructor() {
    this.api = new MarketPriceAPI();
  }


  /**
   * 특정 아이템의 가격 가져오기
   * @param {string} itemName - 아이템명
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<number>} 가격
   */
  async getItemPrice(itemName, priceType = 'recent') {
    return await this.api.getItemPrice(itemName, priceType);
  }

  /**
   * 여러 아이템의 가격을 한 번에 가져오기
   * @param {Array} items - 아이템명 배열
   * @param {string} priceType - 가격 타입
   * @returns {Promise<Object>} 아이템별 가격 객체
   */
  async getMultipleItemPrices(items, priceType = 'recent') {
    return await this.api.getMultipleItemPrices(items, priceType);
  }


  /**
   * 현재 시세 가져오기 (기존 API와 호환)
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 현재 시세 정보
   */
  async getCurrentPrices(itemName) {
    try {
      const data = await this.api.fetchItemPriceData(itemName);
      const marketPrice = data.marketPrice;
      
      if (!marketPrice) {
        return null;
      }

      // 최근가: priceHistory의 가장 마지막 날짜의 average
      let recentPrice = 0;
      if (marketPrice.priceHistory && marketPrice.priceHistory.length > 0) {
        const latestEntry = marketPrice.priceHistory[marketPrice.priceHistory.length - 1];
        recentPrice = latestEntry.average || 0;
      }

      return {
        average: marketPrice.thirtyDays?.average || 0, // 평균가: thirtyDays.average
        recent: recentPrice, // 최근가: priceHistory 마지막 날짜의 average
        min: marketPrice.thirtyDays?.min || 0,
        max: marketPrice.thirtyDays?.max || 0,
        count: marketPrice.thirtyDays?.count || 0
      };

    } catch (error) {
      console.error(`${itemName} 현재 시세 가져오기 실패:`, error);
      return null;
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.api.clearCache();
  }
}

export default OfficialPriceFetcher;
