/**
 * 전쟁 로그 수집기
 * 
 * Lanis 전쟁 로그 페이지에서 전쟁 관련 로그를 수집합니다.
 * 수집된 데이터는 브라우저 저장소에 저장되어 브라우저를 재시작해도 유지됩니다.
 * 동적 페이지 로딩과 중복 로그 방지를 고려하여 설계되었습니다.
 */

class WarLogCollector {
  constructor() {
    this.storageKey = 'lanis_war_logs';
    this.currentHistoryUrl = null;
    this.observer = null;
    this.isCollecting = false;
    this.lastCollectedCount = 0;
    this.collectionInterval = null;
  }

  /**
   * 초기화 메서드
   */
  init() {
    console.log('전쟁 로그 수집기 초기화 완료');
    this.setupObserver();
    this.setupEventListeners();
    this.startPeriodicCollection();
  }

  /**
   * 현재 페이지가 전쟁 로그 페이지인지 확인
   */
  isHistoryPage() {
    return window.location.href.includes('lanis.me/history');
  }

  /**
   * DOM 변경 감지를 위한 Observer 설정
   */
  setupObserver() {
    if (!this.isHistoryPage()) return;

    // 기존 observer 제거
    if (this.observer) {
      this.observer.disconnect();
    }

    // MutationObserver 설정
    this.observer = new MutationObserver((mutations) => {
      let shouldCollect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 새로운 로그 항목이 추가되었는지 확인
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList && node.classList.contains('css-0')) {
                shouldCollect = true;
              }
              // 자식 요소들도 확인
              const logItems = node.querySelectorAll && node.querySelectorAll('.css-0');
              if (logItems && logItems.length > 0) {
                shouldCollect = true;
              }
            }
          });
        }
      });

      if (shouldCollect) {
        this.collectNewLogs();
      }
    });

    // 전체 문서 감시 (동적 로딩을 위해)
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 이벤트 리스너 설정 (더보기 버튼, 카테고리 변경 등)
   */
  setupEventListeners() {
    if (!this.isHistoryPage()) return;

    // 더보기 버튼 클릭 감지
    document.addEventListener('click', (e) => {
      if (e.target && e.target.textContent && e.target.textContent.includes('더보기')) {
        setTimeout(() => {
          this.collectNewLogs();
        }, 1000); // 1초 후 수집 (새 로그 로딩 대기)
      }
    });

    // 카테고리 변경 감지 (Select 요소 변경)
    document.addEventListener('change', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('MuiSelect-nativeInput')) {
        setTimeout(() => {
          this.collectNewLogs();
        }, 1500); // 1.5초 후 수집 (새 로그 로딩 대기)
      }
    });

    // 필터 버튼 클릭 감지
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('MuiButton-contained')) {
        const buttonText = e.target.textContent;
        if (buttonText.includes('로그만 보기') || buttonText.includes('전체')) {
          setTimeout(() => {
            this.collectNewLogs();
          }, 1000);
        }
      }
    });
  }

  /**
   * 주기적 수집 시작 (동적 로딩 대응)
   */
  startPeriodicCollection() {
    if (!this.isHistoryPage()) return;

    // 기존 인터벌 제거
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    // 5초마다 새로운 로그 확인
    this.collectionInterval = setInterval(() => {
      const currentLogCount = document.querySelectorAll('.css-0').length;
      if (currentLogCount > this.lastCollectedCount) {
        this.collectNewLogs();
        this.lastCollectedCount = currentLogCount;
      }
    }, 5000);
  }

  /**
   * 새로운 로그만 수집
   */
  collectNewLogs() {
    if (this.isCollecting) return;
    this.isCollecting = true;

    try {
      const existingLogs = this.loadAllWarLogs();
      const existingContentSet = new Set(existingLogs.map(log => `${log.timestamp}_${log.content}`));
      
      const newLogs = this.collectWarLogs().filter(log => {
        const contentKey = `${log.timestamp}_${log.content}`;
        return !existingContentSet.has(contentKey);
      });

      if (newLogs.length > 0) {
        this.saveWarLogs(newLogs);
        this.lastCollectedCount = document.querySelectorAll('.css-0').length;
      }
    } catch (error) {
      console.error('새로운 로그 수집 중 오류:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 전쟁 로그 수집
   */
  collectWarLogs() {
    try {
      const logItems = document.querySelectorAll('.MuiBox-root.css-0');
      const logs = [];

      logItems.forEach((item, index) => {
        const log = this.parseLogItem(item, index);
        if (log) {
          logs.push(log);
        }
      });

      return logs;
    } catch (error) {
      console.error('전쟁 로그 수집 실패:', error);
      return [];
    }
  }

  /**
   * 개별 로그 항목 파싱
   */
  parseLogItem(item, index) {
    try {
      // 로그 타입 (칩)
      const typeElement = item.querySelector('.MuiChip-root .MuiChip-label');
      const type = typeElement ? typeElement.textContent.trim() : '';

      // 로그 시간
      const timeElement = item.querySelector('.MuiTypography-body2.css-1epl3oa');
      const timestamp = timeElement ? timeElement.textContent.trim() : '';

      // 로그 내용
      const contentElement = item.querySelector('.MuiTypography-body1.css-14lcix');
      const content = contentElement ? contentElement.textContent.trim() : '';

      if (!type || !timestamp || !content) {
        return null;
      }

      // 로그 내용 파싱
      const parsed = this.parseLogContent(content, type);
      if (!parsed) {
        return null;
      }

      return {
        id: `war_log_${Date.now()}_${index}`,
        type: type,
        timestamp: timestamp,
        content: content,
        attacker: parsed.attacker,
        defender: parsed.defender,
        result: parsed.result,
        collectedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('로그 항목 파싱 실패:', error);
      return null;
    }
  }

  /**
   * 로그 내용 파싱
   * 
   * 지원하는 전쟁 로그 텍스트 패턴들:
   * 
   * 1. 공격 로그 패턴:
   *    - "길드명 길드원명은 마을명의 플레이어명을 공격하여 승리했다"
   *    - "길드명 길드원명은 마을명의 플레이어명을 공격하여 패배했다"
   *    - "길드명 길드원명은 마을명의 플레이어명을 공격하여 무승부했다"
   *    - "길드명 길드원명은 마을명의 플레이어명을 공격하여 철수했다"
   * 
   * 2. 마을 점령 로그 패턴:
   *    - "길드명 길드원명은 마을명을 점령했다"
   *    - "길드명 길드원명은 마을명를 점령했다" (조사 변형)
   *    - "길드명 길드원명가 마을명을 점령했다" (주어 변형)
   *    - "길드명 길드원명가 마을명를 점령했다" (조사 + 주어 변형)
   * 
   * 3. 요새 공격 로그 패턴:
   *    - "길드명 길드원명은 요새명을 공격하여 점령했다"
   *    - "길드명 길드원명은 요새명을 공격하여 실패했다"
   *    - "길드명 길드원명은 요새명을 공격하여 파괴했다"
   * 
   * 4. 기타 가능한 패턴들 (향후 추가 예정):
   *    - 길드전 시작/종료 알림
   *    - 길드원 입장/퇴장
   *    - 길드전 결과 통계
   *    - 특별 이벤트 관련 로그
   */
  parseLogContent(content, type) {
    try {
      // 공격 로그 파싱
      if (type.includes('공격')) {
        const attackMatch = content.match(/(.+?) 길드 (.+?)는 (.+?)의 (.+?)를 공격하여 (.+?)했다/);
        if (attackMatch) {
          return {
            attacker: {
              guild: attackMatch[1],
              player: attackMatch[2]
            },
            defender: {
              village: attackMatch[3],
              player: attackMatch[4]
            },
            result: attackMatch[5]
          };
        }
      }

      // 마을 점령 로그 파싱
      if (type.includes('마을 점령')) {
        // 여러 패턴 시도 (조사와 주어 변형 고려)
        const patterns = [
          /(.+?) 길드 (.+?)는 (.+?)을 점령했다/,  // 기본 패턴: "길드명 길드원명은 마을명을 점령했다"
          /(.+?) 길드 (.+?)는 (.+?)를 점령했다/,   // 조사 변형: "길드명 길드원명은 마을명를 점령했다"
          /(.+?) 길드 (.+?)가 (.+?)을 점령했다/,   // 주어 변형: "길드명 길드원명가 마을명을 점령했다"
          /(.+?) 길드 (.+?)가 (.+?)를 점령했다/    // 조사 + 주어 변형: "길드명 길드원명가 마을명를 점령했다"
        ];
        
        for (let i = 0; i < patterns.length; i++) {
          const match = content.match(patterns[i]);
          if (match) {
            return {
              attacker: {
                guild: match[1],
                player: match[2]
              },
              defender: {
                village: match[3],
                player: null
              },
              result: '점령'
            };
          }
        }
      }

      // 요새 공격 로그 파싱
      if (type.includes('요새')) {
        const fortressMatch = content.match(/(.+?) 길드 (.+?)는 (.+?)을 공격하여 (.+?)했다/);
        if (fortressMatch) {
          return {
            attacker: {
              guild: fortressMatch[1],
              player: fortressMatch[2]
            },
            defender: {
              village: fortressMatch[3],
              player: null
            },
            result: fortressMatch[4]
          };
        }
      }

      return null;
    } catch (error) {
      console.error('로그 내용 파싱 실패:', error);
      return null;
    }
  }

  /**
   * 전쟁 로그 저장
   */
  saveWarLogs(newLogs) {
    if (!newLogs || newLogs.length === 0) return false;

    try {
      const existingLogs = this.loadAllWarLogs();
      const allLogs = [...existingLogs, ...newLogs];
      
      // 최신 로그가 위에 오도록 정렬
      allLogs.sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt));
      
      // 최대 1000개까지만 저장
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
      const logDate = new Date(log.collectedAt);
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
   * 타임스탬프에서 날짜 추출 (WarLogCollector 내부용)
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
   * 현재 페이지에서 전쟁 로그 수집 및 저장 (중복 방지)
   */
  collectAndSave() {
    if (!this.isHistoryPage()) {
      return false;
    }

    if (this.isCollecting) {
      console.log('이미 수집 중입니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    this.isCollecting = true;

    try {
      const existingLogs = this.loadAllWarLogs();
      const existingContentSet = new Set(existingLogs.map(log => `${log.timestamp}_${log.content}`));
      
      const newLogs = this.collectWarLogs().filter(log => {
        const contentKey = `${log.timestamp}_${log.content}`;
        return !existingContentSet.has(contentKey);
      });

      if (newLogs.length > 0) {
        this.saveWarLogs(newLogs);
        this.lastCollectedCount = document.querySelectorAll('.css-0').length;
        console.log(`${newLogs.length}개의 새로운 전쟁 로그가 수집되었습니다.`);
        return true;
      } else {
        console.log('새로운 전쟁 로그가 없습니다.');
        return false;
      }
    } catch (error) {
      console.error('전쟁 로그 수집 중 오류:', error);
      return false;
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 페이지 로드 시 자동 수집
   */
  autoCollect() {
    if (this.isHistoryPage()) {
      // 페이지 로드 완료 후 수집
      setTimeout(() => {
        this.collectAndSave();
        this.lastCollectedCount = document.querySelectorAll('.css-0').length;
      }, 3000); // 3초 후 수집 (DOM 로딩 대기)
    }
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
      byGuild: {},
      recentActivity: logs.slice(0, 10) // 최근 10개
    };

    logs.forEach((log, index) => {
      // 타입별 통계
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // 결과별 통계
      if (log.result) {
        stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;
      }
      
      // 길드별 통계
      if (log.attacker && log.attacker.guild) {
        stats.byGuild[log.attacker.guild] = (stats.byGuild[log.attacker.guild] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * 정리 메서드
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }
}

export default WarLogCollector;
