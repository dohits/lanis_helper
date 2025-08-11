// 시세 데이터 전용 API 모듈
import GoogleSheetAPI from './index.js';
import { TradeDataParser, ItemSearch, PriceCalculator } from './priceData/index.js';
import { SHEET_IDS, PRICE_DATA_GID, SHEET_NAMES } from '../../shared/constants.js';

/**
 * 가격 데이터 API 클래스
 * 구글 시트에서 시세 데이터를 가져와 처리
 */
class PriceDataAPI extends GoogleSheetAPI {
  constructor() {
    super();
    this.priceSheetId = SHEET_IDS.PRICE_DATA;
    this.priceSheetName = SHEET_NAMES.PRICE_SHEET;
    this.tradeSheetName = SHEET_NAMES.TRADE_SHEET;
  }

  /**
   * 가격 데이터 가져오기
   * @returns {Promise<Array>} 새로운 형식 데이터
   */
  async fetchPriceData() {
    try {
      // 새로운 데이터 (A열 세로형 형식)
      const newRows = await this.fetchCSVData(this.priceSheetId, PRICE_DATA_GID);

      return newRows;
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
      const newRows = await this.fetchPriceData();
      
      if (!this.validateData(newRows)) {
        throw new Error('데이터가 충분하지 않습니다.');
      }
      
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
      const newRows = await this.fetchPriceData();
      
      if (!this.validateData(newRows)) {
        // 데이터가 충분하지 않으면 빈 객체 반환
        const emptyResult = {};
        items.forEach(itemName => {
          emptyResult[itemName] = 0;
        });
        return emptyResult;
      }
      
      const priceData = {};
      
      for (const itemName of items) {
        try {
          const tradeData = TradeDataParser.parseTradeData(newRows, itemName);
          priceData[itemName] = tradeData.prices;
        } catch (error) {
          // 개별 아이템 실패 시 빈 배열로 처리
          priceData[itemName] = [];
        }
      }
      
      return PriceCalculator.calculateMultiplePrices(priceData, priceType);
      
    } catch (error) {
      // 전체 실패 시 빈 객체 반환
      const emptyResult = {};
      items.forEach(itemName => {
        emptyResult[itemName] = 0;
      });
      return emptyResult;
    }
  }

  /**
   * 트레이드 차트용 데이터 가져오기 (차트와 정보 표시용)
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 차트 데이터
   */
  async getChartData(itemName) {
    try {
      const newRows = await this.fetchPriceData();
      
      if (!this.validateData(newRows)) {
        // 데이터가 충분하지 않을 때 빈 차트 데이터 반환
        return {
          prices: [],
          labels: [],
          averagePrice: 0,
          recentPrice: 0,
          totalTrades: 0,
          noData: true,
          actualDates: []
        };
      }
      
      const tradeData = TradeDataParser.parseTradeData(newRows, itemName);
      
      if (tradeData.prices.length === 0) {
        // 해당 아이템의 데이터가 없을 때 빈 차트 데이터 반환
        return {
          prices: [],
          labels: [],
          averagePrice: 0,
          recentPrice: 0,
          totalTrades: 0,
          noData: true,
          actualDates: []
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
        totalTrades: 0,
        noData: true,
        actualDates: []
      };
    }
  }

  /**
   * 최신 거래 데이터 가져오기
   * @returns {Promise<Object|null>} 최신 거래 정보 또는 null
   */
  async getLatestTradeData() {
    try {
      const newRows = await this.fetchPriceData();
      
      if (!this.validateData(newRows)) {
        return null;
      }
      
      return TradeDataParser.getLatestTradeData(newRows);
      
    } catch (error) {
      console.error('최신 거래 데이터 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 아이템 검색 기능
   * @param {string} query - 검색어
   * @returns {Promise<Array>} 검색 결과
   */
  async searchItems(query) {
    try {
      const newRows = await this.fetchPriceData();
      
      if (!this.validateData(newRows)) {
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