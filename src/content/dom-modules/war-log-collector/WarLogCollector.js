/**
 * 전쟁 로그 수집기
 * 
 * Lanis 전쟁 로그 페이지에서 전쟁 관련 로그를 수집합니다.
 * 수집된 데이터는 브라우저 저장소에 저장되어 브라우저를 재시작해도 유지됩니다.
 * 수동 수집 방식으로 변경되었습니다.
 * 
 * [데이터 구조]
 * {
 *   timestamp: "2025. 8. 19. 오전 5:11:38",
 *   type: "요새 개발",
 *   result: "success",
 *   player: "히츠기",
 *   village: "세레나",
 *   target: "요새",
 *   action: "방어력 600 증가",
 *   description: "유령협동조합 길드 히츠기는 세레나 요새 방어력을 600 증가시켰다.",
 *   playerguild: "유령협동조합",
 *   targetguild: null
 * }
 */

import WarLogDataProcessor from './WarLogDataProcessor.js';

class WarLogCollector {
  constructor() {
    this.storageKey = 'lanis_war_logs';
    this.isCollecting = false;
    this.dataProcessor = new WarLogDataProcessor();
  }

  /**
   * 초기화 메서드
   */
  init() {
    if (this.isHistoryPage()) {
      this.setupAutoCollection();
    }
  }

  /**
   * 자동 수집 설정
   */
  setupAutoCollection() {
    // API 요청 완료 감지
    this.waitForAPICompletion();
    
    // DOM 변경 감지 설정
    this.setupDOMObserver();
  }

  /**
   * API 요청 완료 대기 및 자동 수집
   */
  waitForAPICompletion() {
    const checkAPICompletion = () => {
      // API 요청이 완료되었는지 확인 (테이블에 데이터가 로드되었는지)
      const tableRows = document.querySelectorAll('tbody tr.MuiTableRow-root');
      if (tableRows.length > 0) {
        console.log('[WarLogCollector] API 요청 완료 감지, 자동 수집 시작');
        this.performAutoCollection();
      } else {
        // 1초 후 다시 확인
        setTimeout(checkAPICompletion, 1000);
      }
    };

    // 초기 확인
    setTimeout(checkAPICompletion, 500);
  }

  /**
   * DOM 변경 감지 설정
   */
  setupDOMObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldCollect = false;
      
      mutations.forEach((mutation) => {
        // 테이블 행이 추가되었는지 확인
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로운 테이블 행이 추가되었는지 확인
              if (node.classList && node.classList.contains('MuiTableRow-root')) {
                shouldCollect = true;
              }
              // 자식 노드에서 테이블 행 찾기
              const tableRows = node.querySelectorAll && node.querySelectorAll('.MuiTableRow-root');
              if (tableRows && tableRows.length > 0) {
                shouldCollect = true;
              }
            }
          });
        }
      });

      if (shouldCollect) {
        console.log('[WarLogCollector] DOM 변경 감지, 추가 수집 시작');
        this.performAutoCollection();
      }
    });

    // 테이블 컨테이너 감시
    const tableContainer = document.querySelector('.MuiTableContainer-root');
    if (tableContainer) {
      this.observer.observe(tableContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * 자동 수집 수행
   */
  performAutoCollection() {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;

    try {
      const existingLogs = this.loadAllWarLogs();
      const existingContentSet = new Set(existingLogs.map(log => `${log.timestamp}_${log.player}_${log.target}`));
      
      const allLogs = this.collectWarLogs();
      const newLogs = allLogs.filter(log => {
        const contentKey = `${log.timestamp}_${log.player}_${log.target}`;
        return !existingContentSet.has(contentKey);
      });

      if (newLogs.length > 0) {
        this.saveWarLogs(newLogs);
        console.log(`[WarLogCollector] 자동 수집 완료: ${newLogs.length}개 새로운 로그`);
      }
    } catch (error) {
      console.error('[WarLogCollector] 자동 수집 중 오류:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 현재 페이지가 전쟁 로그 페이지인지 확인
   */
  isHistoryPage() {
    return window.location.href.includes('lanis.me/war');
  }

  /**
   * 수동 전쟁 로그 수집 (모달에서 호출)
   */
  manualCollectWarLogs() {
    if (!this.isHistoryPage()) {
      return {
        success: false,
        message: '전쟁 로그 페이지에서만 수집 가능합니다.',
        newLogsCount: 0
      };
    }

    if (this.isCollecting) {
      return {
        success: false,
        message: '이미 수집 중입니다. 잠시 후 다시 시도해주세요.',
        newLogsCount: 0
      };
    }

    this.isCollecting = true;

    try {
      const existingLogs = this.loadAllWarLogs();
      const existingContentSet = new Set(existingLogs.map(log => `${log.timestamp}_${log.description}`));
      
      const allLogs = this.collectWarLogs();
      const newLogs = allLogs.filter(log => {
        const contentKey = `${log.timestamp}_${log.description}`;
        return !existingContentSet.has(contentKey);
      });

      if (newLogs.length > 0) {
        this.saveWarLogs(newLogs);
        return {
          success: true,
          message: `${newLogs.length}개의 새로운 전쟁 로그를 수집했습니다.`,
          newLogsCount: newLogs.length,
          totalLogsCount: existingLogs.length + newLogs.length
        };
      } else {
        return {
          success: true,
          message: '새로운 전쟁 로그가 없습니다.',
          newLogsCount: 0,
          totalLogsCount: existingLogs.length
        };
      }
    } catch (error) {
      console.error('전쟁 로그 수집 중 오류:', error);
      return {
        success: false,
        message: '전쟁 로그 수집 중 오류가 발생했습니다.',
        newLogsCount: 0
      };
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 전쟁 로그 수집 (새로운 DOM 구조)
   */
  collectWarLogs() {
    try {
      // 테이블 컨테이너 찾기
      const tableContainer = document.querySelector('.MuiTableContainer-root');
      if (!tableContainer) {
        console.warn('[WarLogCollector] 테이블 컨테이너를 찾을 수 없습니다.');
        return [];
      }

      // 테이블 행들 찾기
      const tableRows = tableContainer.querySelectorAll('tbody tr.MuiTableRow-root');
      if (tableRows.length === 0) {
        console.warn('[WarLogCollector] 테이블 행을 찾을 수 없습니다.');
        return [];
      }

      const logs = [];
      
      tableRows.forEach((row, index) => {
        const log = this.parseTableRow(row, index);
        if (log) {
          logs.push(log);
        }
      });

      console.log(`[WarLogCollector] ${logs.length}개의 전쟁 로그를 수집했습니다.`);
      return logs;
    } catch (error) {
      console.error('[WarLogCollector] 전쟁 로그 수집 실패:', error);
      return [];
    }
  }

  /**
   * 테이블 행 파싱 (새로운 DOM 구조)
   */
  parseTableRow(row, index) {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) {
        console.warn(`[WarLogCollector] 행 ${index}: 셀 개수가 부족합니다 (${cells.length}개)`);
        return null;
      }

      // 각 셀에서 데이터 추출
      const timeCell = cells[0];
      const resultCell = cells[1];
      const villageCell = cells[2];
      const attackerCell = cells[3];
      const guildCell = cells[4];
      const targetCell = cells[5];

      // 시간 추출
      const timeElement = timeCell.querySelector('span[aria-label]');
      const timestamp = timeElement ? timeElement.getAttribute('aria-label') : timeCell.textContent.trim();

      // 결과 추출 (칩에서)
      const resultChip = resultCell.querySelector('.MuiChip-label');
      const result = resultChip ? resultChip.textContent.trim() : resultCell.textContent.trim();

      // 마을 추출 (칩에서)
      const villageChip = villageCell.querySelector('.MuiChip-label');
      const village = villageChip ? villageChip.textContent.trim() : villageCell.textContent.trim();

      // 공격자 추출
      const attacker = attackerCell.textContent.trim();

      // 길드 추출
      const guild = guildCell.textContent.trim();

      // 대상 추출
      const target = targetCell.textContent.trim();

      if (!timestamp || !result || !attacker || !guild) {
        console.warn(`[WarLogCollector] 행 ${index}: 필수 데이터가 누락되었습니다.`);
        return null;
      }

      // 결과 타입 판단
      const isSuccess = result.includes('승리');
      const resultType = isSuccess ? 'success' : 'defeat';

      // 로그 타입 판단
      let logType = '공격';
      if (result.includes('요새 강화')) {
        logType = '요새 강화';
      } else if (result.includes('요새 계략')) {
        logType = '요새 계략';
      }

      // 설명 생성
      const description = `${guild} 길드 ${attacker}은/는 ${village} 마을의 ${target}을/를 ${result}했다.`;

      const warLog = {
        id: `war_log_${Date.now()}_${index}`,
        timestamp: timestamp,
        type: logType,
        result: resultType,
        player: attacker,
        village: village,
        target: target,
        action: result,
        description: description,
        playerguild: guild,
        targetguild: null,
        collectedAt: new Date().toISOString()
      };

      return warLog;
    } catch (error) {
      console.error(`[WarLogCollector] 행 ${index} 파싱 실패:`, error);
      return null;
    }
  }



  /**
   * 시간 문자열을 Date 객체로 변환하는 헬퍼 함수
   */
  parseWarLogTime(timeStr) {
    if (!timeStr) return new Date(0);
    
    const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const [, year, month, day, ampm, hour, minute, second] = timeMatch;
      let hour24 = parseInt(hour, 10);
      if (ampm === '오후' && hour24 !== 12) hour24 += 12;
      if (ampm === '오전' && hour24 === 12) hour24 = 0;
      
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // 월은 0부터 시작
        parseInt(day, 10),
        hour24,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    return new Date(0);
  }

  /**
   * 전쟁 로그 저장
   */
  saveWarLogs(newLogs) {
    if (!newLogs || newLogs.length === 0) return false;

    try {
      const existingLogs = this.loadAllWarLogs();
      const allLogs = [...existingLogs, ...newLogs];
      
      // 실제 전투 발생 시각(timestamp) 기준으로 최신 로그가 위에 오도록 정렬
      allLogs.sort((a, b) => {
        const timeA = this.parseWarLogTime(a.timestamp);
        const timeB = this.parseWarLogTime(b.timestamp);
        return timeB.getTime() - timeA.getTime();
      });
      
      // 최대 1000개까지만 저장 (가장 오래된 전투 로그부터 삭제)
      const limitedLogs = allLogs.slice(0, 1000);
      
      localStorage.setItem(this.storageKey, JSON.stringify(limitedLogs));
      
      return true;
    } catch (error) {
      console.error('전쟁 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 모든 전쟁 로그 로드
   */
  loadAllWarLogs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('전쟁 로그 로드 실패:', error);
      return [];
    }
  }

  /**
   * 특정 기간의 전쟁 로그 로드
   */
  loadWarLogsByDateRange(startDate, endDate) {
    const allLogs = this.loadAllWarLogs();
    return allLogs.filter(log => {
      const logDate = this.parseWarLogTime(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * 전쟁 로그 삭제
   */
  deleteWarLogs() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('전쟁 로그 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 특정 날짜의 전쟁 로그 삭제
   */
  deleteLogsByDate(targetDate) {
    try {
      const allLogs = this.loadAllWarLogs();
      const filteredLogs = allLogs.filter(log => {
        const logDate = this.extractDateFromTimestamp(log.timestamp);
        return logDate !== targetDate;
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredLogs));
      return true;
    } catch (error) {
      console.error('특정 날짜 로그 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 타임스탬프에서 날짜 추출
   */
  extractDateFromTimestamp(timestamp) {
    try {
      // "2025. 8. 6. 오후 9:59:59" 형식에서 날짜 추출
      const match = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return null;
    } catch (error) {
      console.error('날짜 추출 실패:', error);
      return null;
    }
  }

  /**
   * 전쟁로그 타입별 분류 함수
   */
  categorizeWarLogs(warLogs) {
    const categories = {
      attack: { success: [], defeat: [] },
      fortress: { development: [], destruction: [] },
      occupation: []
    };
    
    warLogs.forEach(log => {
      if (log.type.includes('공격')) {
        if (log.result === 'success') {
          categories.attack.success.push(log);
        } else {
          categories.attack.defeat.push(log);
        }
      } else if (log.type.includes('요새 개발')) {
        categories.fortress.development.push(log);
      } else if (log.type.includes('요새 파괴')) {
        categories.fortress.destruction.push(log);
      } else if (log.type.includes('마을 점령')) {
        categories.occupation.push(log);
      }
    });
    
    return categories;
  }



  /**
   * 저장된 전쟁 로그 통계
   */
  getWarLogStats() {
    const logs = this.loadAllWarLogs();
    
    const stats = {
      total: logs.length,
      byType: {},
      byResult: {},
      byPlayer: {},
      byVillage: {},
      recentActivity: logs.slice(0, 10) // 최근 10개
    };

    logs.forEach((log) => {
      // 타입별 통계
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // 결과별 통계
      if (log.result) {
        stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;
      }
      
      // 플레이어별 통계
      if (log.player) {
        stats.byPlayer[log.player] = (stats.byPlayer[log.player] || 0) + 1;
      }

      // 마을별 통계
      if (log.village) {
        stats.byVillage[log.village] = (stats.byVillage[log.village] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * 길드 정보가 포함된 전쟁로그 데이터 처리
   */
  processWarLogsWithGuildInfo() {
    const warLogs = this.loadAllWarLogs();
    return this.dataProcessor.processWarLogData(warLogs);
  }

  /**
   * 전쟁로그 전체 분석 실행
   */
  analyzeWarLogs() {
    const warLogs = this.loadAllWarLogs();
    return this.dataProcessor.analyzeWarLogs(warLogs);
  }

  /**
   * 길드별 전쟁로그 통계 생성
   */
  getGuildWarStats() {
    const processedLogs = this.processWarLogsWithGuildInfo();
    return this.dataProcessor.generateGuildWarStats(processedLogs);
  }

  /**
   * 플레이어별 전쟁로그 통계 생성
   */
  getPlayerWarStats() {
    const processedLogs = this.processWarLogsWithGuildInfo();
    return this.dataProcessor.generatePlayerWarStats(processedLogs);
  }

  /**
   * 마을별 전쟁로그 통계 생성
   */
  getVillageWarStats() {
    const processedLogs = this.processWarLogsWithGuildInfo();
    return this.dataProcessor.generateVillageWarStats(processedLogs);
  }

  /**
   * 시간대별 전쟁로그 분석
   */
  getTimeBasedWarStats() {
    const processedLogs = this.processWarLogsWithGuildInfo();
    return this.dataProcessor.analyzeWarLogByTime(processedLogs);
  }

  /**
   * 정리 메서드
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isCollecting = false;
  }
}

export default WarLogCollector;
