// 시세 데이터 가져오기 모듈
import PriceDataAPI from '../../api/googleSheetLoad/priceDataAPI.js';

class PriceFetcher {
  constructor() {
    this.priceAPI = new PriceDataAPI();
  }

  // 구글 시트에서 데이터 가져오기 (2개 시트 조합)
  async fetchData() {
    try {
      return await this.priceAPI.fetchPriceData();
    } catch (error) {
      console.error('구글 시트에서 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  // 정확한 아이템명 매칭 함수
  isExactItemMatch(itemText, searchItemName) {
    return this.priceAPI.isExactItemMatch(itemText, searchItemName);
  }

  // CSV 파싱
  parseCSV(csv) {
    return this.priceAPI.parseSimpleCSV(csv);
  }

  // 특정 아이템의 시세 데이터 가져오기 (트레이드 차트와 완전 동일한 알고리즘)
  async getItemPrice(itemName, priceType = 'recent') {
    try {
      return await this.priceAPI.getItemPrice(itemName, priceType);
    } catch (error) {
      console.error(`${itemName} 시세 가져오기 실패:`, error);
      throw error;
    }
  }

  // 여러 아이템의 시세를 한 번에 가져오기
  async getMultipleItemPrices(items, priceType = 'recent') {
    return await this.priceAPI.getMultipleItemPrices(items, priceType);
  }

  // 트레이드 차트용 데이터 가져오기 (차트와 정보 표시용)
  async getChartData(itemName) {
    try {
      return await this.priceAPI.getChartData(itemName);
    } catch (error) {
      console.error(`${itemName} 차트 데이터 가져오기 실패:`, error);
      // 오류가 발생해도 빈 데이터 객체 반환
      return {
        timeOrderedPrices: [],
        timeOrderedLabels: [],
        recentPrice: null,
        avgPrice: null,
        finalPrices: [],
        finalLabels: [],
        noData: true
      };
    }
  }

  // 아이템 검색 (자동완성용) - 2개 시트 조합
  async searchItems(query) {
    return await this.priceAPI.searchItems(query);
  }

  // 구글 시트에서 아이템 시세 가져오기 (UI 매니저용)
  async fetchItemPriceFromGoogleSheet(itemName, selectedSource) {
    try {
      let priceType = 'recent';
      
      if (selectedSource.id === 'avgPriceToggle') {
        priceType = 'average';
      } else if (selectedSource.id === 'recentPriceToggle') {
        priceType = 'recent';
      } else {
        throw new Error('알 수 없는 데이터 소스입니다.');
      }
      
      return await this.getItemPrice(itemName, priceType);
    } catch (error) {
      console.error(`${itemName} 시세 가져오기 실패:`, error);
      throw error;
    }
  }

  // 현재 시세 가져오기 (UI 매니저용)
  async getCurrentPrices(itemName) {
    try {
      const recentPrice = await this.getItemPrice(itemName, 'recent');
      const averagePrice = await this.getItemPrice(itemName, 'average');
      return {
        recent: recentPrice,
        average: averagePrice
      };
    } catch (error) {
      console.error('현재 시세 가져오기 실패:', error);
      return {
        recent: null,
        average: null
      };
    }
  }
}

// ES6 모듈로 export
export default PriceFetcher; 