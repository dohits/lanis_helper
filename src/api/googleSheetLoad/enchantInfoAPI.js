// 해방 정보 전용 API 모듈
import GoogleSheetAPI from './index.js';
import { SHEET_IDS, ENCHANT_GID_MAP } from '../../shared/constants.js';

class EnchantInfoAPI extends GoogleSheetAPI {
  constructor() {
    super();
    // 해방 정보 시트 ID
    this.sheetId = SHEET_IDS.ENCHANT_INFO;
    
    // 타입별 GID 매핑
    this.gidMap = ENCHANT_GID_MAP;
  }

  /**
   * 해방 정보 데이터 가져오기
   * @param {string} type - 해방 타입 ('armor', 'weapon', 'accessory')
   * @returns {Promise<Object>} 해방 정보 데이터
   */
  async fetchEnchantInfo(type = 'armor') {
    try {
      const gid = this.gidMap[type];
      if (!gid) {
        return this.createSuccessResponse([]);
      }
      
      const rows = await this.fetchCSVData(this.sheetId, gid);
      
      if (!this.validateData(rows, 1)) {
        return this.createErrorResponse('데이터가 충분하지 않습니다.');
      }
      
      // CSV 파싱 - exam/enchant-info-armor-example.js 참조
      // 구글 시트 구조: A열(빈칸), B열(스텟명), C열(동등급), D열(은등급), E열(금등급), F열(칠색등급)
      const data = rows.slice(1).map((cols, index) => {
        const item = {
          type: cols[5] || '',      // F열 (스텟명) - 이전 B열
          bronze: cols[6] || '',    // G열 (동 등급) - 이전 C열
          silver: cols[7] || '',    // H열 (은 등급) - 이전 D열
          gold: cols[8] || '',      // I열 (금 등급) - 이전 E열
          rainbow: cols[9] || ''    // J열 (칠색 등급) - 이전 F열
        };
        return item;
      }).filter(item => item.type && item.type !== '');
      
      return this.createSuccessResponse(data);
    } catch (error) {
      console.error('[EnchantInfoAPI] 해방 정보 데이터 가져오기 실패:', error);
      return this.createErrorResponse('해방 정보 데이터 가져오기 실패', error);
    }
  }

  /**
   * 모든 해방 정보 데이터 가져오기
   * @returns {Promise<Object>} 모든 해방 정보 데이터
   */
  async fetchAllEnchantInfo() {
    try {
      const results = {};
      
      for (const [type, gid] of Object.entries(this.gidMap)) {
        const result = await this.fetchEnchantInfo(type);
        results[type] = result;
      }
      
      return this.createSuccessResponse(results);
    } catch (error) {
      console.error('[EnchantInfoAPI] 모든 해방 정보 데이터 가져오기 실패:', error);
      return this.createErrorResponse('모든 해방 정보 데이터 가져오기 실패', error);
    }
  }

  /**
   * 특정 해방 정보 검색
   * @param {string} type - 해방 타입
   * @param {string} searchTerm - 검색어
   * @returns {Promise<Object>} 검색된 해방 정보
   */
  async searchEnchantInfo(type, searchTerm) {
    try {
      const result = await this.fetchEnchantInfo(type);
      
      if (!result.success) {
        return result;
      }
      
      const filteredData = result.data.filter(item => 
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('[EnchantInfoAPI] 해방 정보 검색 실패:', error);
      return this.createErrorResponse('해방 정보 검색 실패', error);
    }
  }
}

// ES6 모듈로 export
export default EnchantInfoAPI; 