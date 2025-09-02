/**
 * 장비 뽑기 API
 * 구글 시트에서 장비 데이터를 가져와서 랜덤 뽑기 기능을 제공
 */

import { SHEET_IDS, EQUIPMENT_DRAW_GID } from '../../shared/constants.js';

class EquipmentDrawAPI {
  constructor() {
    this.sheetId = SHEET_IDS.EQUIPMENT_DRAW;
    this.gid = EQUIPMENT_DRAW_GID; // 장비 뽑기 시트 GID
    this.cacheKey = 'lanis_equipment_draw_data';
    this.cacheExpiry = 30 * 60 * 1000; // 30분 캐시
  }

  /**
   * 장비 데이터 로드
   */
  async loadEquipmentData() {
    try {
      // 캐시 확인
      const cached = this.getCachedData();
      if (cached) {
        return cached;
      }

      // 구글 시트에서 데이터 가져오기
      const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?gid=${this.gid}&tqx=out:csv`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      const equipmentList = this.parseCSV(csvText);
      
      // 데이터 정규화
      const normalizedData = this.normalizeProbabilities(equipmentList);
      
      // 캐시 저장
      this.cacheData(normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('장비 데이터 로드 실패:', error);
      throw error;
    }
  }

  /**
   * CSV 파싱
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const equipmentList = [];

    // 헤더 제외하고 데이터 파싱
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns = this.parseCSVLine(line);
      
      if (columns.length >= 3) {
        const itemName = columns[0]?.trim();
        const equipmentType = columns[1]?.trim();
        const probabilityStr = columns[2]?.trim();
        
        if (itemName && equipmentType && probabilityStr) {
          // 확률 문자열에서 숫자 추출 (예: "0.18%" -> 0.18)
          const probabilityMatch = probabilityStr.match(/(\d+\.?\d*)/);
          const probability = probabilityMatch ? parseFloat(probabilityMatch[1]) : 0;
          
          if (probability > 0) {
            equipmentList.push({
              name: itemName,
              type: equipmentType,
              probability: probability
            });
          }
        }
      }
    }

    return equipmentList;
  }

  /**
   * CSV 라인 파싱 (쉼표와 따옴표 처리)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * 확률 정규화
   */
  normalizeProbabilities(equipmentList) {
    if (equipmentList.length === 0) {
      return [];
    }

    // 총 확률 계산
    const totalProbability = equipmentList.reduce((sum, item) => sum + item.probability, 0);
    
    if (totalProbability <= 0) {
      // 확률이 모두 0이거나 음수인 경우 균등 분배
      const equalProbability = 100 / equipmentList.length;
      return equipmentList.map(item => ({
        ...item,
        normalizedProbability: equalProbability
      }));
    }

    // 정규화된 확률 계산 (총합이 100%가 되도록)
    const normalizedList = equipmentList.map(item => ({
      ...item,
      normalizedProbability: (item.probability / totalProbability) * 100
    }));

    return normalizedList;
  }

  /**
   * 랜덤 장비 뽑기
   */
  drawRandomEquipment(equipmentList) {
    if (!equipmentList || equipmentList.length === 0) {
      throw new Error('장비 데이터가 없습니다.');
    }

    // 랜덤 숫자 생성 (0-100)
    const random = Math.random() * 100;
    
    // 누적 확률로 장비 선택
    let cumulativeProbability = 0;
    
    for (const equipment of equipmentList) {
      cumulativeProbability += equipment.normalizedProbability;
      
      if (random <= cumulativeProbability) {
        return equipment;
      }
    }
    
    // 부동소수점 오차로 인해 마지막 아이템이 선택되지 않을 경우를 대비
    return equipmentList[equipmentList.length - 1];
  }

  /**
   * 캐시된 데이터 가져오기
   */
  getCachedData() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < this.cacheExpiry) {
        return data;
      }

      // 캐시 만료
      localStorage.removeItem(this.cacheKey);
      return null;
    } catch (error) {
      console.error('캐시 데이터 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 데이터 캐시 저장
   */
  cacheData(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('캐시 데이터 저장 실패:', error);
    }
  }

  /**
   * 캐시 삭제
   */
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('캐시 삭제 실패:', error);
    }
  }
}

export default EquipmentDrawAPI;
