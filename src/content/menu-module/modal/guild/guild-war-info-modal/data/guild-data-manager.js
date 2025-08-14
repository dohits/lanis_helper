// 길드 데이터 관리 클래스
export class GuildDataManager {
  constructor() {
    this.guildInfoCollector = null;
    this.warLogCollector = null;
  }

  // 수집기 설정
  setCollectors(guildInfoCollector, warLogCollector) {
    this.guildInfoCollector = guildInfoCollector;
    this.warLogCollector = warLogCollector;
  }

  // 길드 정보 수집기 가져오기
  getGuildInfoCollector() {
    return this.guildInfoCollector || window.guildInfoCollector;
  }

  // 전쟁 로그 수집기 가져오기
  getWarLogCollector() {
    return this.warLogCollector || window.warLogCollector;
  }

  // 저장된 길드 목록 가져오기
  getSavedGuildList() {
    const collector = this.getGuildInfoCollector();
    if (!collector) {
      console.warn('길드 정보 수집기가 초기화되지 않았습니다.');
      return [];
    }
    return collector.getSavedGuildList();
  }

  // 저장된 전쟁 로그 가져오기
  getSavedWarLogs() {
    const collector = this.getWarLogCollector();
    if (!collector) {
      console.warn('전쟁 로그 수집기가 초기화되지 않았습니다.');
      return [];
    }
    return collector.loadAllWarLogs();
  }

  // 길드 순서 로드
  loadGuildOrder() {
    try {
      const savedOrder = localStorage.getItem('lanis_guild_order');
      return savedOrder ? JSON.parse(savedOrder) : [];
    } catch (error) {
      console.error('길드 순서 로드 실패:', error);
      return [];
    }
  }

  // 길드 순서 저장
  saveGuildOrder(order) {
    try {
      localStorage.setItem('lanis_guild_order', JSON.stringify(order));
      return true;
    } catch (error) {
      console.error('길드 순서 저장 실패:', error);
      return false;
    }
  }

  // 길드 순서에 따라 정렬
  sortGuildsByOrder(guilds, savedOrder) {
    if (savedOrder.length === 0) return guilds;
    
    const orderedGuilds = [];
    const unorderedGuilds = [...guilds];
    
    // 저장된 순서대로 정렬
    savedOrder.forEach(guildName => {
      const guildIndex = unorderedGuilds.findIndex(g => g.info.guildName === guildName);
      if (guildIndex !== -1) {
        orderedGuilds.push(unorderedGuilds[guildIndex]);
        unorderedGuilds.splice(guildIndex, 1);
      }
    });
    
    // 순서에 없는 길드들을 끝에 추가
    orderedGuilds.push(...unorderedGuilds);
    
    return orderedGuilds;
  }

  // 길드 정보 새로고침
  refreshGuildData() {
    const guildCollector = this.getGuildInfoCollector();
    const warLogCollector = this.getWarLogCollector();
    
    if (guildCollector) {
      guildCollector.refreshData();
    }
    
    if (warLogCollector) {
      warLogCollector.refreshData();
    }
  }

  // 전쟁 로그 수집
  async collectWarLogs() {
    const collector = this.getWarLogCollector();
    if (!collector) {
      throw new Error('전쟁 로그 수집기가 초기화되지 않았습니다.');
    }
    
    const result = collector.collectAndSave();
    
    // 수집 결과에 따른 메시지 반환
    if (result === true) {
      return { success: true, message: '새로운 전쟁 로그가 수집되었습니다.' };
    } else if (result === false) {
      return { success: false, message: '새로운 전쟁 로그가 없거나 이미 수집 중입니다.' };
    } else {
      return { success: false, message: '전쟁 로그 수집에 실패했습니다.' };
    }
  }

  // 전쟁 로그 삭제
  deleteAllWarLogs() {
    const collector = this.getWarLogCollector();
    if (!collector) {
      throw new Error('전쟁 로그 수집기가 초기화되지 않았습니다.');
    }
    
    return collector.deleteWarLogs();
  }

  // 특정 전쟁 로그 삭제 (날짜별 삭제)
  deleteWarLog(logId) {
    const collector = this.getWarLogCollector();
    if (!collector) {
      throw new Error('전쟁 로그 수집기가 초기화되지 않았습니다.');
    }
    
    // logId를 날짜로 간주하여 해당 날짜의 로그 삭제
    return collector.deleteLogsByDate(logId);
  }

  // 길드 삭제
  deleteGuild(guildName) {
    const collector = this.getGuildInfoCollector();
    if (!collector) {
      throw new Error('길드 정보 수집기가 초기화되지 않았습니다.');
    }
    
    return collector.deleteGuildInfo(guildName);
  }

  // 길드 활동량 계산
  calculateGuildActivity(guildName) {
    const warLogs = this.getSavedWarLogs();
    const guildLogs = warLogs.filter(log => log.guildName === guildName);
    
    const activity = {
      totalWars: guildLogs.length,
      wins: guildLogs.filter(log => log.result === '승리').length,
      losses: guildLogs.filter(log => log.result === '패배').length,
      draws: guildLogs.filter(log => log.result === '무승부').length,
      winRate: 0,
      recentActivity: []
    };

    if (activity.totalWars > 0) {
      activity.winRate = Math.round((activity.wins / activity.totalWars) * 100);
    }

    // 최근 10개 전쟁 로그
    activity.recentActivity = guildLogs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    return activity;
  }
}
