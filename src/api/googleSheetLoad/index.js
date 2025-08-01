// 구글 시트 API 공통 모듈
class GoogleSheetAPI {
  constructor() {
    // 기본 설정
    this.defaultTimeout = 10000; // 10초
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1초
  }

  /**
   * 구글 시트에서 CSV 데이터를 가져오는 기본 함수
   * @param {string} sheetId - 구글 시트 ID
   * @param {string} gid - 시트 GID (선택사항)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Array>} 파싱된 CSV 데이터
   */
  async fetchCSVData(sheetId, gid = null, options = {}) {
    const { timeout = this.defaultTimeout, retries = this.retryAttempts } = options;
    
    let url;
    if (gid) {
      // 특정 시트(GID)에서 데이터 가져오기
      url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    } else {
      // 전체 시트에서 데이터 가져오기
      url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csv = await response.text();
        return this.parseCSV(csv);
      } catch (error) {
        console.error(`구글 시트 데이터 가져오기 시도 ${attempt}/${retries} 실패:`, error);
        
        if (attempt === retries) {
          throw new Error(`구글 시트 데이터 가져오기 실패: ${error.message}`);
        }
        
        // 재시도 전 대기
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * CSV 데이터를 파싱하는 함수
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
    
    if (val !== '' || row.length > 0) {
      row.push(val);
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * 간단한 CSV 파싱 (기본 쉼표 구분)
   * @param {string} csv - CSV 문자열
   * @returns {Array} 파싱된 행 데이터
   */
  parseSimpleCSV(csv) {
    const lines = csv.split('\n');
    return lines.map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);
      return values;
    });
  }

  /**
   * 지연 함수
   * @param {number} ms - 지연 시간 (밀리초)
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 헤더 정보를 추출하는 함수
   * @param {Array} rows - CSV 행 데이터
   * @returns {Object} 헤더 인덱스 정보
   */
  extractHeaderIndices(rows) {
    if (!rows || rows.length === 0) {
      return {};
    }

    const header = rows[0].map(h => h.trim());
    const indices = {};

    // 일반적인 컬럼명 매핑
    const columnMappings = {
      '순번': 'sequence',
      '아이템': 'item',
      '가격': 'price',
      '직업': 'job',
      '어빌리티명': 'ability',
      '효과': 'effect',
      '스텟명': 'stat',
      '동등급': 'bronze',
      '은등급': 'silver',
      '금등급': 'gold',
      '칠색등급': 'rainbow'
    };

    header.forEach((col, index) => {
      // 정확한 매칭
      if (columnMappings[col]) {
        indices[columnMappings[col]] = index;
      } else {
        // 부분 매칭
        for (const [key, value] of Object.entries(columnMappings)) {
          if (col.includes(key)) {
            indices[value] = index;
            break;
          }
        }
      }
    });

    return indices;
  }

  /**
   * 데이터 유효성 검사
   * @param {Array} rows - CSV 행 데이터
   * @param {number} minRows - 최소 행 수
   * @returns {boolean} 유효성 여부
   */
  validateData(rows, minRows = 2) {
    return rows && rows.length >= minRows;
  }

  /**
   * 에러 응답 생성
   * @param {string} message - 에러 메시지
   * @param {Error} error - 원본 에러 객체
   * @returns {Object} 에러 응답 객체
   */
  createErrorResponse(message, error = null) {
    return {
      success: false,
      error: message,
      details: error ? error.message : null
    };
  }

  /**
   * 성공 응답 생성
   * @param {any} data - 응답 데이터
   * @returns {Object} 성공 응답 객체
   */
  createSuccessResponse(data) {
    return {
      success: true,
      data
    };
  }
}

// ES6 모듈로 export
export default GoogleSheetAPI; 