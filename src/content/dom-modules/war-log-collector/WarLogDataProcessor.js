/**
 * 전쟁로그 데이터 처리기
 * 
 * 전쟁로그 데이터를 길드 정보와 매칭하여 구조화된 데이터로 변환합니다.
 * 각 사용자(player, target)에게 길드명을 할당하여 분석에 활용할 수 있도록 합니다.
 */

class WarLogDataProcessor {
  constructor() {
    this.storageKey = 'lanis_guild_info';
  }

  /**
   * 길드 정보 로드
   */
  loadGuildInfo() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('길드 정보 로드 실패:', error);
      return {};
    }
  }

  /**
   * 플레이어명으로 길드 찾기
   */
  findPlayerGuild(playerName, guildInfo) {
    if (!guildInfo || !playerName) return null;
    
    for (const [guildName, guildData] of Object.entries(guildInfo)) {
      if (guildData.members && Array.isArray(guildData.members)) {
        const member = guildData.members.find(member => 
          member.nickname === playerName || member.name === playerName
        );
        if (member) {
          return guildName;
        }
      }
    }
    
    return null;
  }

  /**
   * 전쟁로그 데이터에 길드 정보 추가
   */
  processWarLogData(warLogs) {
    if (!Array.isArray(warLogs)) {
      console.error('전쟁로그 데이터가 배열이 아닙니다:', warLogs);
      return [];
    }

    const guildInfo = this.loadGuildInfo();


    const processedLogs = warLogs.map(log => {
      // 플레이어 길드 찾기
      const playerGuild = this.findPlayerGuild(log.player, guildInfo);
      
      // 타겟 길드 찾기 (타겟이 플레이어명인 경우에만)
      let targetGuild = null;
      if (log.target && log.target !== '요새' && log.target !== '마을') {
        targetGuild = this.findPlayerGuild(log.target, guildInfo);
      }

      return {
        ...log,
        playerguild: playerGuild,
        targetguild: targetGuild
      };
    });


    return processedLogs;
  }

  /**
   * 길드별 전쟁로그 통계 생성
   */
  generateGuildWarStats(processedLogs) {
    const stats = {};

    processedLogs.forEach(log => {
      // 플레이어 길드 통계
      if (log.playerguild) {
        if (!stats[log.playerguild]) {
          stats[log.playerguild] = {
            total: 0,
            success: 0,
            defeat: 0,
            attacks: 0,
            fortressActions: 0,
            occupations: 0,
            members: new Set()
          };
        }

        stats[log.playerguild].total++;
        stats[log.playerguild].members.add(log.player);

        if (log.type.includes('공격')) {
          stats[log.playerguild].attacks++;
          if (log.result === 'success') {
            stats[log.playerguild].success++;
          } else {
            stats[log.playerguild].defeat++;
          }
        } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
          stats[log.playerguild].fortressActions++;
          // 요새 개발/파괴는 승패가 아닌 활동량으로만 계산
        } else if (log.type.includes('마을 점령')) {
          stats[log.playerguild].occupations++;
          // 마을 점령은 승패가 아닌 활동량으로만 계산
        }
      }

      // 타겟 길드 통계 (방어 측면)
      if (log.targetguild) {
        if (!stats[log.targetguild]) {
          stats[log.targetguild] = {
            total: 0,
            success: 0,
            defeat: 0,
            attacks: 0,
            fortressActions: 0,
            occupations: 0,
            members: new Set()
          };
        }

        stats[log.targetguild].total++;
        stats[log.targetguild].members.add(log.target);

        // 타겟 입장에서는 공격 로그만 처리 (요새 개발/파괴, 마을 점령은 공격이 아님)
        if (log.type.includes('공격')) {
          stats[log.targetguild].attacks++;
          if (log.result === 'defeat') { // 공격자가 패배 = 방어자가 승리
            stats[log.targetguild].success++;
          } else {
            stats[log.targetguild].defeat++;
          }
        }
      }
    });

    // Set을 배열로 변환
    Object.keys(stats).forEach(guildName => {
      stats[guildName].members = Array.from(stats[guildName].members);
    });

    return stats;
  }

  /**
   * 플레이어별 전쟁로그 통계 생성
   */
  generatePlayerWarStats(processedLogs) {
    const stats = {};

    processedLogs.forEach(log => {
      // 플레이어 통계
      if (!stats[log.player]) {
        stats[log.player] = {
          total: 0,
          success: 0,
          defeat: 0,
          attacks: 0,
          fortressActions: 0,
          occupations: 0,
          guild: log.playerguild,
          targets: new Set()
        };
      }

      stats[log.player].total++;
      stats[log.player].targets.add(log.target);

      if (log.type.includes('공격')) {
        stats[log.player].attacks++;
        if (log.result === 'success') {
          stats[log.player].success++;
        } else {
          stats[log.player].defeat++;
        }
      } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
        stats[log.player].fortressActions++;
        // 요새 개발/파괴는 승패가 아닌 활동량으로만 계산
      } else if (log.type.includes('마을 점령')) {
        stats[log.player].occupations++;
        // 마을 점령은 승패가 아닌 활동량으로만 계산
      }
    });

    // Set을 배열로 변환
    Object.keys(stats).forEach(playerName => {
      stats[playerName].targets = Array.from(stats[playerName].targets);
    });

    return stats;
  }

  /**
   * 마을별 전쟁로그 통계 생성
   */
  generateVillageWarStats(processedLogs) {
    const stats = {};

    processedLogs.forEach(log => {
      if (!stats[log.village]) {
        stats[log.village] = {
          total: 0,
          attacks: 0,
          defenses: 0,
          fortressActions: 0,
          occupations: 0,
          attackingGuilds: new Set(),
          defendingGuilds: new Set()
        };
      }

      stats[log.village].total++;

      if (log.type.includes('공격')) {
        stats[log.village].attacks++;
        if (log.playerguild) {
          stats[log.village].attackingGuilds.add(log.playerguild);
        }
        if (log.targetguild) {
          stats[log.village].defendingGuilds.add(log.targetguild);
        }
      } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
        stats[log.village].fortressActions++;
      } else if (log.type.includes('마을 점령')) {
        stats[log.village].occupations++;
      }
    });

    // Set을 배열로 변환
    Object.keys(stats).forEach(villageName => {
      stats[villageName].attackingGuilds = Array.from(stats[villageName].attackingGuilds);
      stats[villageName].defendingGuilds = Array.from(stats[villageName].defendingGuilds);
    });

    return stats;
  }

  /**
   * 시간대별 전쟁로그 분석
   */
  analyzeWarLogByTime(processedLogs) {
    const timeStats = {
      hourly: {},
      daily: {},
      weekly: {}
    };

    processedLogs.forEach(log => {
      const timestamp = this.parseWarLogTime(log.timestamp);
      if (!timestamp) return;

      const hour = timestamp.getHours();
      const day = timestamp.getDay(); // 0: 일요일, 1: 월요일, ...
      const week = this.getWeekNumber(timestamp);

      // 시간대별 통계
      if (!timeStats.hourly[hour]) {
        timeStats.hourly[hour] = { total: 0, attacks: 0, fortressActions: 0 };
      }
      timeStats.hourly[hour].total++;
      if (log.type.includes('공격')) {
        timeStats.hourly[hour].attacks++;
      } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
        timeStats.hourly[hour].fortressActions++;
      }

      // 요일별 통계
      if (!timeStats.daily[day]) {
        timeStats.daily[day] = { total: 0, attacks: 0, fortressActions: 0 };
      }
      timeStats.daily[day].total++;
      if (log.type.includes('공격')) {
        timeStats.daily[day].attacks++;
      } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
        timeStats.daily[day].fortressActions++;
      }

      // 주별 통계
      if (!timeStats.weekly[week]) {
        timeStats.weekly[week] = { total: 0, attacks: 0, fortressActions: 0 };
      }
      timeStats.weekly[week].total++;
      if (log.type.includes('공격')) {
        timeStats.weekly[week].attacks++;
      } else if (log.type.includes('요새 개발') || log.type.includes('요새 파괴')) {
        timeStats.weekly[week].fortressActions++;
      }
    });

    return timeStats;
  }

  /**
   * 전쟁로그 시간 파싱
   */
  parseWarLogTime(timeStr) {
    if (!timeStr) return null;
    
    const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const [, year, month, day, ampm, hour, minute, second] = timeMatch;
      let hour24 = parseInt(hour, 10);
      if (ampm === '오후' && hour24 !== 12) hour24 += 12;
      if (ampm === '오전' && hour24 === 12) hour24 = 0;
      
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        hour24,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    return null;
  }

  /**
   * 주차 계산
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 전체 분석 실행
   */
  analyzeWarLogs(warLogs) {

    
    const processedLogs = this.processWarLogData(warLogs);
    
    const analysis = {
      processedLogs,
      guildStats: this.generateGuildWarStats(processedLogs),
      playerStats: this.generatePlayerWarStats(processedLogs),
      villageStats: this.generateVillageWarStats(processedLogs),
      timeStats: this.analyzeWarLogByTime(processedLogs)
    };


    return analysis;
  }
}

export default WarLogDataProcessor;
