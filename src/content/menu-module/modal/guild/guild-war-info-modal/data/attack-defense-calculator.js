/**
 * 공격권/수비권 계산기
 * 길드전에서 일일 공격권/수비권 사용량을 계산하는 모듈
 *
 * 중요: 아래 규칙 주석은 계산의 기준이므로 코드 수정 시 "절대 삭제하지 말 것".
 */

class AttackDefenseCalculator {
  constructor() {
    // 기본 일일 제한
    this.DAILY_ATTACK_LIMIT = 8;  // 하루 공격권 8장
    this.DAILY_DEFENSE_LIMIT = 4; // 하루 수비권 4장
  }

  /**
   * 공격권 차감 규칙:
   * 1. 모든 로그는 공격자 기준으로 승패가 기록됨
   * 2. 해당 일자에 공격자(개인)는 승패여부에 관계없이 1회당 공격권 1이 차감됨
   * 3. 마을을 점령했을 때는 공격권 차감이 되지 않음 (요새 상대로 승리한 것은 정상 차감)
   * 4. 공격권/수비권은 길드 단위가 아닌 개인 단위로 차감됨
   *
   * 예시:
   * - 길드A 인원a vs 길드B 인원b 승리 → 인원a의 공격권 1 차감
   * - 길드A 인원a vs 길드B 인원b 패배 → 인원a의 공격권 1 차감
   * - 길드A 인원a vs 마을 점령 → 인원a의 공격권 차감 없음
   * - 길드A 인원a vs 요새 승리 → 인원a의 공격권 1 차감
   *
   * 주의: 본 주석은 규칙의 출처이며 코드 수정 시 절대 삭제하지 말 것.
   */

  /**
   * 수비권 차감 규칙:
   * 1. 수비자는 유저(개인) 또는 요새가 될 수 있음
   * 2. 공격자가 승리한 로그(수비자가 패배한 경우)에만 수비권 1회 차감
   * 3. 공격자가 패배한 경우(수비자가 승리한 경우)에는 수비권 차감 없음
   * 4. 요새 수비 시에는 수비권 차감 규칙 별도 적용
   * 5. 수비권도 개인 단위로 차감됨
   *
   * 예시:
   * - 길드A 인원a가 길드B 인원b를 공격하여 승리 → 인원b의 수비권 1 차감
   * - 길드A 인원a가 길드B 인원b를 공격하여 패배 → 인원b의 수비권 차감 없음
   * - 길드A 인원a가 요새를 공격 → 요새는 수비권 차감 규칙 별도
   *
   * 주의: 본 주석은 규칙의 출처이며 코드 수정 시 절대 삭제하지 말 것.
   */

  // 날짜 추출: "2025. 8. 6. 오후 9:59:59" → "2025-08-06" 형태로 변환
  extractDateFromTimestamp(timestamp, collectedAt) {
    try {
      if (typeof timestamp === 'string') {
        const match = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
        if (match) {
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
      // fallback: 일반 Date 파싱 시도
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      // 최종 fallback: 수집 시각으로 대체
      if (collectedAt) {
        const c = new Date(collectedAt);
        if (!isNaN(c.getTime())) return c.toISOString().split('T')[0];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // 로그 표준화: 가공된 데이터 구조와 기존 구조 모두 지원
  normalizeLog(log) {
    // 가공된 데이터 구조 (playerguild, targetguild 필드 포함)
    if (log && log.player && log.type && (log.playerguild !== undefined || log.targetguild !== undefined)) {
      const attackerName = log.player;
      const type = log.type;
      const result = log.result || '';
      const target = log.target;
      const action = log.action || '';

      // 가공된 데이터에서 길드 정보 직접 가져오기
      const attackerGuild = log.playerguild;
      
      // 대상 정보
      let defenderName = null;
      if (target && target !== '요새' && target !== '마을') {
        defenderName = target;
      }

      // 공격 여부와 점령 여부를 구분
      const isAttack = type.includes('공격');
      const isFortress = isAttack && target === '요새';
      const isConquest = type.includes('마을 점령');
      const isVictory = result === 'success';

      return {
        attackerGuild,
        attackerName,
        defenderName,
        isVictory,
        isAttack,
        isFortress,
        isConquest,
        timestamp: log.timestamp,
        collectedAt: log.collectedAt
      };
    }

    // 새로운 데이터 구조 (war-log-example.js 기반)
    if (log && log.player && log.type) {
      const attackerName = log.player;
      const type = log.type;
      const result = log.result || '';
      const target = log.target;
      const action = log.action || '';

      // 길드 정보는 별도로 찾아야 함 (플레이어명으로 매칭)
      const attackerGuild = null; // 길드 정보에서 찾아야 함
      
      // 대상 정보
      let defenderName = null;
      if (target && target !== '요새' && target !== '마을') {
        defenderName = target;
      }

      // 공격 여부와 점령 여부를 구분
      const isAttack = type.includes('공격');
      const isFortress = isAttack && target === '요새';
      const isConquest = type.includes('마을 점령');
      const isVictory = result === 'success';

      return {
        attackerGuild,
        attackerName,
        defenderName,
        isVictory,
        isFortress,
        isConquest,
        timestamp: log.timestamp,
        collectedAt: log.collectedAt
      };
    }

    // 기존 구조화된 필드가 존재하는 경우
    if (log && log.attacker && (log.attacker.guild || log.attacker.player)) {
      const attackerGuild = log.attacker.guild || null;
      const attackerName = log.attacker.player || null;
      const defenderName = log.defender ? (log.defender.player || null) : null; // 요새/마을은 null
      const type = (log.type || '').toString();
      const result = (log.result || '').toString();

      // 공격 여부와 점령 여부를 구분
      const isAttack = type.includes('공격');
      const isFortress = isAttack && result.includes('요새');
      const isConquest = type.includes('마을 점령');
      const isVictory = result.includes('승리') || result.includes('이겼') || result.includes('파괴');

      return {
        attackerGuild,
        attackerName,
        defenderName,
        isVictory,
        isFortress,
        isConquest,
        timestamp: log.timestamp,
        collectedAt: log.collectedAt
      };
    }

    // fallback: content 기반 간단 파싱
    const parsed = this.parseWarLog(log);
    if (!parsed) return null;
    return parsed;
  }

  /**
   * 전쟁 로그 파싱 (content 기반 fallback)
   */
  parseWarLog(log) {
    try {
      if (!log || !log.content) return null;
      const content = log.content;

      const attackerMatch = content.match(/([가-힣a-zA-Z0-9]+)\s*길드\s*([가-힣a-zA-Z0-9]+)/);
      if (!attackerMatch) return null;
      const attackerGuild = attackerMatch[1];
      const attackerName = attackerMatch[2];

      let defenderName = null;
      const defenderMatch = content.match(/vs\s*([가-힣a-zA-Z0-9]+)/);
      if (defenderMatch) defenderName = defenderMatch[1];

      const isVictory = content.includes('승리') || content.includes('이겼') || content.includes('파괴');
      const isFortress = content.includes('요새');
      const isConquest = content.includes('점령');

      return {
        attackerGuild,
        attackerName,
        defenderName,
        isVictory,
        isFortress,
        isConquest,
        timestamp: log.timestamp,
        collectedAt: log.collectedAt
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * 특정 날짜의 사용량 계산
   */
  calculateDailyUsage(date, warLogs, guildMembers) {
    try {
      if (!Array.isArray(warLogs) || !Array.isArray(guildMembers)) return { attackUsage: {}, defenseUsage: {} };

      const attackUsage = {};
      const defenseUsage = {};

      const dailyLogs = warLogs.filter(log => this.extractDateFromTimestamp(log.timestamp, log.collectedAt) === date);

      dailyLogs.forEach(raw => {
        const log = this.normalizeLog(raw);
        if (!log) return;

        // 공격자: 길드원 검증 (개인 단위) - 실제 공격 로그만 처리
        if (log.attackerName && this.validateGuildMember(log.attackerName, guildMembers)) {
          if (log.isAttack) {
            if (!attackUsage[log.attackerName]) attackUsage[log.attackerName] = 0;
            // 공격권 차감 예외는 "마을 점령"에 한정
            if (!log.isConquest) attackUsage[log.attackerName]++;
          }
        }

        // 수비자: 실제 수비자가 있는 경우만 처리 (요새는 수비권 차감 대상 아님)
        if (log.defenderName && this.validateGuildMember(log.defenderName, guildMembers)) {
          if (!defenseUsage[log.defenderName]) defenseUsage[log.defenderName] = 0;
          // 공격자가 승리했을 때(수비자가 패배했을 때) 수비권 차감
          if (log.isVictory) defenseUsage[log.defenderName]++;
        }
      });

      return { attackUsage, defenseUsage };
    } catch (_) {
      return { attackUsage: {}, defenseUsage: {} };
    }
  }

  getRemainingAttacks(date, warLogs, guildMembers) {
    try {
      const { attackUsage } = this.calculateDailyUsage(date, warLogs, guildMembers);
      const remaining = {};
      guildMembers.forEach(m => {
        const used = attackUsage[m.nickname] || 0;
        remaining[m.nickname] = Math.max(0, this.DAILY_ATTACK_LIMIT - used);
      });
      return remaining;
    } catch (_) {
      return {};
    }
  }

  getRemainingDefenses(date, warLogs, guildMembers) {
    try {
      const { defenseUsage } = this.calculateDailyUsage(date, warLogs, guildMembers);
      const remaining = {};
      guildMembers.forEach(m => {
        const used = defenseUsage[m.nickname] || 0;
        remaining[m.nickname] = Math.max(0, this.DAILY_DEFENSE_LIMIT - used);
      });
      return remaining;
    } catch (_) {
      return {};
    }
  }

  safeCalculate(logs, members, date) {
    try {
      const remainingAttacks = this.getRemainingAttacks(date, logs, members);
      const remainingDefenses = this.getRemainingDefenses(date, logs, members);
      return { remainingAttacks, remainingDefenses, success: true };
    } catch (_) {
      return { remainingAttacks: {}, remainingDefenses: {}, success: false };
    }
  }

  /**
   * 길드원 검증
   */
  validateGuildMember(nickname, guildMembers) {
    if (!Array.isArray(guildMembers)) return false;
    return guildMembers.some(member => member.nickname === nickname);
  }
}

export default AttackDefenseCalculator;
