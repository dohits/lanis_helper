// 시세 데이터 전용 API 모듈
import GoogleSheetAPI from './index.js';
import { TradeDataParser, ItemSearch, PriceCalculator } from './priceData/index.js';

/**
 * 가격 데이터 API 클래스
 * 구글 시트에서 시세 데이터를 가져와 처리
 */
class PriceDataAPI extends GoogleSheetAPI {
  constructor() {
    super();
    this.priceSheetId = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
    this.priceSheetName = '시세';
    this.tradeSheetName = '거래';
  }

  /**
   * 가격 데이터 가져오기
   * @returns {Promise<Object>} 구형/신형 데이터
   */
  async fetchPriceData() {
    try {
      // 기존 데이터 (A,B,C열 형식) - gid=439005150
      const oldRows = await this.fetchCSVData(this.priceSheetId, '439005150');
      
      // 새로운 데이터 (A열 세로형 형식) - gid=1489625214
      const newRows = await this.fetchCSVData(this.priceSheetId, '1489625214');

      return { oldRows, newRows };
    } catch (error) {
      console.error('가격 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 아이템의 시세 데이터 가져오기
   * @param {string} itemName - 아이템명
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<number>} 가격
   */
  async getItemPrice(itemName, priceType = 'recent') {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        throw new Error('데이터가 충분하지 않습니다.');
      }
      
      // 신형 로직만 사용 (구형 로직 제거)
      const tradeData = TradeDataParser.parseTradeData(newRows, itemName);
      
      if (tradeData.prices.length === 0) {
        throw new Error(`${itemName}의 유효한 가격 데이터를 찾을 수 없습니다.`);
      }
      
      return PriceCalculator.calculatePrice(tradeData.prices, priceType);
      
    } catch (error) {
      console.error(`${itemName} 시세 가져오기 실패:`, error);
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
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        throw new Error('데이터가 충분하지 않습니다.');
      }
      
      const priceData = {};
      
      for (const itemName of items) {
        try {
          const tradeData = TradeDataParser.parseTradeData(newRows, itemName);
          priceData[itemName] = tradeData.prices;
        } catch (error) {
          console.error(`${itemName} 시세 가져오기 실패:`, error);
          priceData[itemName] = [];
        }
      }
      
      return PriceCalculator.calculateMultiplePrices(priceData, priceType);
      
    } catch (error) {
      console.error('다중 아이템 시세 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 트레이드 차트용 데이터 가져오기 (차트와 정보 표시용)
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 차트 데이터
   */
  async getChartData(itemName) {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        // 데이터가 충분하지 않을 때 빈 차트 데이터 반환
        return {
          prices: [],
          labels: [],
          averagePrice: 0,
          recentPrice: 0,
          totalTrades: 0
        };
      }
      
      // 신형 로직만 사용 (구형 로직 제거)
      const tradeData = TradeDataParser.parseTradeData(newRows, itemName);
      
      if (tradeData.prices.length === 0) {
        // 해당 아이템의 데이터가 없을 때 빈 차트 데이터 반환
        return {
          prices: [],
          labels: [],
          averagePrice: 0,
          recentPrice: 0,
          totalTrades: 0
        };
      }
      
      return PriceCalculator.calculateLimitedPrices(tradeData);
      
    } catch (error) {
      console.error(`${itemName} 차트 데이터 가져오기 실패:`, error);
      // 에러 발생 시에도 빈 차트 데이터 반환
      return {
        prices: [],
        labels: [],
        averagePrice: 0,
        recentPrice: 0,
        totalTrades: 0
      };
    }
  }

  /**
   * 아이템 검색 기능
   * @param {string} query - 검색어
   * @returns {Promise<Array>} 검색 결과
   */
  async searchItems(query) {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        return [];
      }
      
      return ItemSearch.searchItems(newRows, query);
      
    } catch (error) {
      console.error('아이템 검색 실패:', error);
      return [];
    }
  }
}

export default PriceDataAPI; 