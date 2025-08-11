// 어빌리티 정보 전용 API 모듈
import GoogleSheetAPI from './index.js';
import { SHEET_IDS } from '../../shared/constants.js';

class AbilityInfoAPI extends GoogleSheetAPI {
  constructor() {
    super();
    // 어빌리티 정보 시트 ID
    this.sheetId = SHEET_IDS.ABILITY_INFO;
  }

  /**
   * 어빌리티 정보 데이터 가져오기
   * @returns {Promise<Object>} 어빌리티 정보 데이터
   */
  async fetchAbilityInfo() {
    try {
      const rows = await this.fetchCSVData(this.sheetId);
      
      if (!this.validateData(rows, 1)) {
        return this.createErrorResponse('데이터가 충분하지 않습니다.');
      }
      
      // 헤더 정보 추출
      const header = rows[0].map(h => h.trim());
      
      // 데이터 파싱
      const data = rows.slice(1).map(cols => {
        const obj = {};
        header.forEach((h, i) => obj[h] = (cols[i]||'').trim());
        return obj;
      }).filter(row => row['직업'] && row['어빌리티명'] && row['효과']);
      
      return this.createSuccessResponse(data);
    } catch (error) {
      console.error('[AbilityInfoAPI] 어빌리티 정보 데이터 가져오기 실패:', error);
      return this.createErrorResponse('어빌리티 정보 데이터 가져오기 실패', error);
    }
  }

  /**
   * 직업별 어빌리티 정보 가져오기
   * @param {string} job - 직업명
   * @returns {Promise<Object>} 직업별 어빌리티 정보
   */
  async fetchAbilityInfoByJob(job) {
    try {
      const result = await this.fetchAbilityInfo();
      
      if (!result.success) {
        return result;
      }
      
      const filteredData = result.data.filter(item => 
        item['직업'] && item['직업'].toLowerCase().includes(job.toLowerCase())
      );
      
      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('[AbilityInfoAPI] 직업별 어빌리티 정보 가져오기 실패:', error);
      return this.createErrorResponse('직업별 어빌리티 정보 가져오기 실패', error);
    }
  }

  /**
   * 어빌리티명으로 검색
   * @param {string} abilityName - 어빌리티명
   * @returns {Promise<Object>} 검색된 어빌리티 정보
   */
  async searchAbilityByName(abilityName) {
    try {
      const result = await this.fetchAbilityInfo();
      
      if (!result.success) {
        return result;
      }
      
      const filteredData = result.data.filter(item => 
        item['어빌리티명'] && item['어빌리티명'].toLowerCase().includes(abilityName.toLowerCase())
      );
      
      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('[AbilityInfoAPI] 어빌리티명 검색 실패:', error);
      return this.createErrorResponse('어빌리티명 검색 실패', error);
    }
  }

  /**
   * 효과로 어빌리티 검색
   * @param {string} effect - 검색할 효과
   * @returns {Promise<Object>} 검색된 어빌리티 정보
   */
  async searchAbilityByEffect(effect) {
    try {
      const result = await this.fetchAbilityInfo();
      
      if (!result.success) {
        return result;
      }
      
      const filteredData = result.data.filter(item => 
        item['효과'] && item['효과'].toLowerCase().includes(effect.toLowerCase())
      );
      
      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('[AbilityInfoAPI] 효과로 어빌리티 검색 실패:', error);
      return this.createErrorResponse('효과로 어빌리티 검색 실패', error);
    }
  }

  /**
   * 모든 직업 목록 가져오기
   * @returns {Promise<Object>} 직업 목록
   */
  async getAllJobs() {
    try {
      const result = await this.fetchAbilityInfo();
      
      if (!result.success) {
        return result;
      }
      
      const jobs = [...new Set(result.data.map(item => item['직업']))].filter(job => job);
      
      return this.createSuccessResponse(jobs);
    } catch (error) {
      console.error('[AbilityInfoAPI] 직업 목록 가져오기 실패:', error);
      return this.createErrorResponse('직업 목록 가져오기 실패', error);
    }
  }

  /**
   * 모든 어빌리티명 목록 가져오기
   * @returns {Promise<Object>} 어빌리티명 목록
   */
  async getAllAbilityNames() {
    try {
      const result = await this.fetchAbilityInfo();
      
      if (!result.success) {
        return result;
      }
      
      const abilityNames = [...new Set(result.data.map(item => item['어빌리티명']))].filter(name => name);
      
      return this.createSuccessResponse(abilityNames);
    } catch (error) {
      console.error('[AbilityInfoAPI] 어빌리티명 목록 가져오기 실패:', error);
      return this.createErrorResponse('어빌리티명 목록 가져오기 실패', error);
    }
  }
}

// ES6 모듈로 export
export default AbilityInfoAPI; 