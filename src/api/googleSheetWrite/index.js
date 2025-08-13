// 구글 시트 쓰기 API 공통 모듈 (Apps Script 전용)
class GoogleSheetWriteAPI {
  constructor() {
    this.defaultTimeout = 8000; // 8초로 단축
    this.retryAttempts = 2;     // 재시도 횟수 줄임
    this.retryDelay = 1000;     // 재시도 지연 시간 단축
  }

  /**
   * 구글 시트에 데이터를 추가하는 함수
   * @param {string} sheetId - 구글 시트 ID
   * @param {string} sheetName - 시트 이름
   * @param {Array} data - 추가할 데이터 배열
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 결과 객체
   */
  async appendData(sheetId, sheetName, data, options = {}) {
    const { timeout = this.defaultTimeout, retries = this.retryAttempts } = options;
    
    if (!Array.isArray(data) || data.length === 0) {
      return this.createErrorResponse('데이터가 비어있거나 유효하지 않습니다.');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.writeBatch(sheetId, sheetName, data, timeout);
        
        if (result.success) {
          return this.createSuccessResponse({
            message: `${data.length}개 행이 성공적으로 추가되었습니다.`,
            addedRows: data.length
          });
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        if (attempt === retries) {
          return this.createErrorResponse(`구글 시트 쓰기 실패: ${error.message}`);
        }
        
        // 재시도 전 대기
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * 배치 데이터를 구글 시트에 쓰는 함수
   * @param {string} sheetId - 구글 시트 ID
   * @param {string} sheetName - 시트 이름
   * @param {Array} batchData - 배치 데이터
   * @param {number} timeout - 타임아웃 시간
   * @returns {Promise<Object>} 결과 객체
   */
  async writeBatch(sheetId, sheetName, batchData, timeout) {
    try {
      // Google Apps Script 웹 앱을 통한 쓰기
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbx_blLMp2K_iFufSZxybfHkLGMuZT6TsRaIsJyF9ACkkY8cd7YC18FYqBbpRmTqbZMvjA/exec';
      
      // 새로운 데이터를 2D 배열로 변환
      const values = batchData.map(row => {
        return row.map(cell => {
          if (cell === null || cell === undefined) {
            return '';
          }
          return cell.toString();
        });
      });

      // Chrome 확장 프로그램의 background script를 통한 CORS 우회
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'WRITE_TO_SHEET',
          url: webAppUrl,
          data: { values: values }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(this.createSuccessResponse({
              message: response.message,
              rowsWritten: response.rowsAdded || batchData.length
            }));
          } else {
            reject(new Error(response?.error || '알 수 없는 오류'));
          }
        });
        
        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('타임아웃: 응답 대기 시간 초과'));
        }, timeout);
      });

    } catch (error) {
      return this.createErrorResponse(`배치 쓰기 실패: ${error.message}`);
    }
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
   * 에러 응답 생성
   * @param {string} message - 에러 메시지
   * @returns {Object} 에러 응답 객체
   */
  createErrorResponse(message) {
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
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
      data,
      timestamp: new Date().toISOString()
    };
  }
}

// ES6 모듈로 export
export default GoogleSheetWriteAPI;
