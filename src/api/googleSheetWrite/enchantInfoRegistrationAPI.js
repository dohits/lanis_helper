import GoogleSheetWriteAPI from './index.js';
import { SHEET_IDS, EQUIPMENT_DRAW_GID } from '../../shared/constants.js';

/**
 * 감정정보 등록 API
 */
class EnchantInfoRegistrationAPI extends GoogleSheetWriteAPI {
  constructor() {
    super();
    this.sheetId = '1JdoCZQviWFNJKrSyn-ZUiy6d-rf4bt6ah5CAX15sOeU'; // 감정정보 등록 시트 ID
    this.sheetGid = '0'; // 감정정보 등록 시트 (첫 번째 시트)
  }

  /**
   * 감정정보를 구글 시트에 등록
   * @param {Object} enchantInfo - 감정 정보 객체
   * @param {string} enchantInfo.equipmentType - 장비 종류 (무기, 방어구, 장신구)
   * @param {string} enchantInfo.equipmentName - 장비명
   * @param {number} enchantInfo.power - 위력
   * @param {number} enchantInfo.weight - 무게
   * @param {string} enchantInfo.nickname - 닉네임
   * @returns {Promise<Object>} 결과 객체
   */
  async registerEnchantInfo(enchantInfo) {
    try {
      // 점수 계산: 장비 타입별 계산
      let score;
      if (enchantInfo.equipmentType === '장신구') {
        // 장신구: 위력 * 5.5 - 무게 * 2
        score = enchantInfo.power * 5.5 - enchantInfo.weight * 2;
      } else {
        // 무기/방어구: 위력 - 무게 * 2
        score = enchantInfo.power - enchantInfo.weight * 2;
      }
      
      // 기존 데이터와 점수 비교
      const existingData = await this.getExistingEnchantInfo(enchantInfo.equipmentName);
      if (existingData) {
        const existingScore = parseInt(existingData.score) || 0;
        if (score < existingScore) {
          return this.createErrorResponse(`기존 점수(${existingScore})보다 낮은 점수(${score})는 등록할 수 없습니다.`);
        }
      }
      
      // 업데이트할 데이터
      const updateData = {
        equipmentName: enchantInfo.equipmentName,
        values: [
          enchantInfo.equipmentType,
          enchantInfo.equipmentName,
          enchantInfo.power.toString(),
          enchantInfo.weight.toString(),
          score.toString(),
          enchantInfo.nickname
        ]
      };

      // Google Apps Script를 통해 행 업데이트
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbwqT87cAm-M3FpJsGxpUXdG-hc6YmuVvl54uzCbdWS9ArtBd7w1qAhPU2sY94EFRv3d/exec';
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_SHEET_ROW',
          url: webAppUrl,
          data: {
            sheetId: this.sheetId,
            sheetGid: this.sheetGid,
            updateData: updateData
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(this.createSuccessResponse({
              message: '감정정보가 성공적으로 등록되었습니다.',
              updatedRow: response.updatedRow
            }));
          } else {
            reject(new Error(response?.error || '알 수 없는 오류'));
          }
        });
        
        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('타임아웃: 응답 대기 시간 초과'));
        }, 10000);
      });

    } catch (error) {
      console.error('[EnchantInfoRegistrationAPI] 감정정보 등록 실패:', error);
      return this.createErrorResponse(`감정정보 등록 실패: ${error.message}`);
    }
  }

  /**
   * 기존 감정정보 가져오기 (기존 load API 방식과 유사)
   * @param {string} equipmentName - 장비명
   * @returns {Promise<Object|null>} 기존 감정정보 또는 null
   */
  async getExistingEnchantInfo(equipmentName) {
    try {
      // CSV 형식으로 데이터 가져오기 (기존 load API 방식)
      const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&gid=${this.sheetGid}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csv = await response.text();
      const rows = this.parseCSV(csv);
      
      // 헤더 제거 (첫 번째 행)
      const dataRows = rows.slice(1);
      
      // 장비명으로 기존 데이터 찾기 (B열: 장비명)
      for (const row of dataRows) {
        if (row.length >= 6 && row[1] === equipmentName) {
          // 컬럼 순서: 장비종류, 장비명, 위력, 무게, 점수, 닉네임
          return {
            equipmentType: row[0],
            equipmentName: row[1],
            power: row[2],
            weight: row[3],
            score: row[4],
            nickname: row[5]
          };
        }
      }
      
      return null; // 기존 데이터가 없는 경우
      
    } catch (error) {
      console.error('[EnchantInfoRegistrationAPI] 기존 감정정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * CSV 데이터를 파싱하는 함수 (기존 load API와 동일)
   * @param {string} csv - CSV 문자열
   * @returns {Array} 파싱된 행 데이터
   */
  parseCSV(csv) {
    const rows = [];
    let row = [];
    let val = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < csv.length) {
      const c = csv[i];
      
      if (inQuotes) {
        if (c === '"') {
          if (csv[i + 1] === '"') { 
            val += '"'; 
            i++; 
          } else {
            inQuotes = false;
          }
        } else {
          val += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(val);
          val = '';
        } else if (c === '\n' || c === '\r') {
          if (val !== '' || row.length > 0) {
            row.push(val);
            rows.push(row);
            row = [];
            val = '';
          }
          if (c === '\r' && csv[i + 1] === '\n') i++;
        } else {
          val += c;
        }
      }
      i++;
    }
    
    // 마지막 행 처리
    if (val !== '' || row.length > 0) {
      row.push(val);
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * 장비명으로 기존 행을 찾아서 업데이트
   * @param {Object} enchantInfo - 감정 정보 객체
   * @returns {Promise<Object>} 결과 객체
   */
  async updateEnchantInfo(enchantInfo) {
    try {
      // 점수 계산: 장비 타입별 계산
      let score;
      if (enchantInfo.equipmentType === '장신구') {
        // 장신구: 위력 * 5.5 - 무게 * 2
        score = enchantInfo.power * 5.5 - enchantInfo.weight * 2;
      } else {
        // 무기/방어구: 위력 - 무게 * 2
        score = enchantInfo.power - enchantInfo.weight * 2;
      }
      
      // 업데이트할 데이터
      const updateData = {
        equipmentName: enchantInfo.equipmentName,
        values: [
          enchantInfo.equipmentType,
          enchantInfo.equipmentName,
          enchantInfo.power.toString(),
          enchantInfo.weight.toString(),
          score.toString(),
          enchantInfo.nickname
        ]
      };

      // Google Apps Script를 통해 행 업데이트
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbwqT87cAm-M3FpJsGxpUXdG-hc6YmuVvl54uzCbdWS9ArtBd7w1qAhPU2sY94EFRv3d/exec';
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_SHEET_ROW',
          url: webAppUrl,
          data: {
            sheetId: this.sheetId,
            sheetGid: this.sheetGid,
            updateData: updateData
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(this.createSuccessResponse({
              message: '감정정보가 성공적으로 업데이트되었습니다.',
              updatedRow: response.updatedRow
            }));
          } else {
            reject(new Error(response?.error || '알 수 없는 오류'));
          }
        });
        
        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('타임아웃: 응답 대기 시간 초과'));
        }, 10000);
      });

    } catch (error) {
      console.error('[EnchantInfoRegistrationAPI] 감정정보 업데이트 실패:', error);
      return this.createErrorResponse(`감정정보 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 장인랭킹 데이터 가져오기
   * @returns {Promise<Array>} 닉네임별 등록 횟수와 순위
   */
  async getCraftsmanRanking() {
    try {
      // CSV 형식으로 데이터 가져오기
      const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&gid=${this.sheetGid}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csv = await response.text();
      const data = this.parseCSV(csv);
      
      // 헤더 제거 (첫 번째 행)
      const rows = data.slice(1);
      
      // 닉네임별 등록 횟수 카운팅 (F열: 닉네임)
      const nicknameCounts = {};
      
      rows.forEach(row => {
        if (row.length > 5 && row[5] && row[5].trim()) {
          const nickname = row[5].trim();
          nicknameCounts[nickname] = (nicknameCounts[nickname] || 0) + 1;
        }
      });
      
      // 등록 횟수별로 정렬하고 상위 50위까지 반환
      const ranking = Object.entries(nicknameCounts)
        .map(([nickname, count]) => ({ nickname, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
        .map((item, index) => ({
          rank: index + 1,
          nickname: item.nickname,
          count: item.count
        }));
      
      return ranking;
      
    } catch (error) {
      console.error('[EnchantInfoRegistrationAPI] 장인랭킹 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 장비별 랭킹 데이터 가져오기
   * @returns {Promise<Array>} 모든 장비 정보 (감정 정보 포함)
   */
  async getEquipmentRanking() {
    try {
      // CSV 형식으로 데이터 가져오기
      const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&gid=${this.sheetGid}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csv = await response.text();
      const data = this.parseCSV(csv);
      
      // 헤더 제거 (첫 번째 행)
      const rows = data.slice(1);
      
      // 모든 장비 정보 처리
      const equipmentList = rows.map(row => {
        if (row.length < 2) return null; // 최소 장비종류, 장비명은 있어야 함
        
        const equipmentType = row[0]?.trim() || '';
        const equipmentName = row[1]?.trim() || '';
        const power = row[2]?.trim() || '';
        const weight = row[3]?.trim() || '';
        const score = row[4]?.trim() || '';
        const nickname = row[5]?.trim() || '';
        
        // 장비명이 있는 경우만 반환
        if (equipmentName) {
          return {
            equipmentType,
            equipmentName,
            power,
            weight,
            score,
            nickname,
            hasEnchantInfo: !!(power && weight && score && nickname) // 감정 정보가 있는지 여부
          };
        }
        
        return null;
      }).filter(item => item !== null); // null 항목 제거
      
      return equipmentList;
      
    } catch (error) {
      console.error('[EnchantInfoRegistrationAPI] 장비별 랭킹 데이터 가져오기 실패:', error);
      throw error;
    }
  }
}

export default EnchantInfoRegistrationAPI;
