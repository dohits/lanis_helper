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
  }

  /**
   * 현재 페이지가 전쟁 로그 페이지인지 확인
   */
  isHistoryPage() {
    return window.location.href.includes('lanis.me/history');
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
   * 전쟁 로그 수집
   */
  collectWarLogs() {
    try {
      // 로그 컨테이너 찾기
      const logContainer = document.querySelector('.MuiStack-root.css-ca9cid');
      if (!logContainer) {
        return [];
      }

      // 실제 로그 항목들 찾기
      const logItems = logContainer.querySelectorAll('.MuiBox-root.css-0');

      const logs = [];
      let validLogCount = 0;
      
      logItems.forEach((item, index) => {
        const log = this.parseLogItem(item, index);
        if (log) {
          logs.push(log);
          validLogCount++;
        }
      });

      return logs;
    } catch (error) {
      console.error('[WarLogCollector] 전쟁 로그 수집 실패:', error);
      return [];
    }
  }

  /**
   * 개별 로그 항목 파싱
   */
  parseLogItem(item, index) {
    try {
      // 로그 타입 (칩) - 더 정확한 선택자
      const typeElement = item.querySelector('.MuiChip-label, .MuiChip-root .MuiChip-label');
      const type = typeElement ? typeElement.textContent.trim() : '';

      // 로그 시간 - 더 정확한 선택자
      const timeElement = item.querySelector('p.MuiTypography-body2, .MuiTypography-body2');
      const timestamp = timeElement ? timeElement.textContent.trim() : '';

      // 로그 내용 - 더 정확한 선택자
      const contentElement = item.querySelector('p.MuiTypography-body1, .MuiTypography-body1');
      const description = contentElement ? contentElement.textContent.trim() : '';

      if (!type || !timestamp || !description) {
        return null;
      }

      // 성공/실패 판단
      const chipElement = item.querySelector('.MuiChip-root');
      const isSuccess = chipElement ? chipElement.classList.contains('MuiChip-colorSuccess') : false;
      const result = isSuccess ? 'success' : 'defeat';

      // 내용에서 세부 정보 파싱
      const parsed = this.parseWarLogDescription(description, type);
      if (!parsed) {
        return null;
      }

      const warLog = {
        id: `war_log_${Date.now()}_${index}`,
        timestamp: timestamp,
        type: type,
        result: result,
        player: parsed.player,
        village: parsed.village,
        target: parsed.target,
        action: parsed.action,
        description: description,
        collectedAt: new Date().toISOString()
      };

      return warLog;
    } catch (error) {
      console.error(`[WarLogCollector] 로그 항목 ${index} 파싱 실패:`, error);
      return null;
    }
  }

  /**
   * 전쟁로그 설명 텍스트를 파싱하는 함수 (war-log-example.js 기반)
   */
  parseWarLogDescription(description, type) {
    // 공격 (승리/패배) 패턴 - 조사 고려
    if (type.includes('공격')) {
      // 패턴 1: "길드명 길드 플레이어명은/는 마을명 마을의 대상플레이어을/를 공격하여 결과했다!"
      const attackMatch1 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을의 (.+?)(?:을|를) 공격하여 (.+?)했다!?\.?$/);
      if (attackMatch1) {
        const [, guild, player, villageName, targetPlayer, result] = attackMatch1;
        return {
          player,
          village: villageName,
          target: targetPlayer,
          action: `공격 (${result})`
        };
      }
      
      // 패턴 2: "길드명 길드 플레이어명은/는 마을명 요새을/를 공격하여 결과했다."
      const attackMatch2 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새(?:을|를) 공격하여 (.+?)했다\.$/);
      if (attackMatch2) {
        const [, guild, player, villageName, result] = attackMatch2;
        return {
          player,
          village: villageName,
          target: '요새',
          action: `공격 (${result})`
        };
      }
      
      // 패턴 3: "길드명 길드 플레이어명은/는 마을명 마을의 대상플레이어을/를 공격하여 결과했다."
      const attackMatch3 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을의 (.+?)(?:을|를) 공격하여 (.+?)했다\.$/);
      if (attackMatch3) {
        const [, guild, player, villageName, targetPlayer, result] = attackMatch3;
        return {
          player,
          village: villageName,
          target: targetPlayer,
          action: `공격 (${result})`
        };
      }
    }
    
    // 요새 개발 패턴 - 조사 고려
    if (type.includes('요새 개발')) {
      const developmentMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새 (.+?)(?:을|를) (\d+) (.+?)시켰다\.$/);
      if (developmentMatch) {
        const [, guild, player, villageName, stat, amount, action] = developmentMatch;
        return {
          player,
          village: villageName,
          target: '요새',
          action: `${stat} ${amount} ${action}`
        };
      }
    }
    
    // 요새 파괴 패턴 - 조사 고려
    if (type.includes('요새 파괴')) {
      const destructionMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새 (.+?)(?:을|를) (\d+) (.+?)시켰다\.$/);
      if (destructionMatch) {
        const [, guild, player, villageName, stat, amount, action] = destructionMatch;
        return {
          player,
          village: villageName,
          target: '요새',
          action: `${stat} ${amount} ${action}`
        };
      }
    }
    
    // 마을 점령 패턴 - 조사 고려
    if (type.includes('마을 점령')) {
      const occupationMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을(?:을|를) 점령했다!$/);
      if (occupationMatch) {
        const [, guild, player, villageName] = occupationMatch;
        return {
          player,
          village: villageName,
          target: '마을',
          action: '점령'
        };
      }
    }
    
    return null;
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
    // 수동 수집 모드에서는 특별히 할 일이 없음
  }
}

export default WarLogCollector;
