import AttackDefenseCalculator from '../data/attack-defense-calculator.js';
import WarLogCollector from '../../../../../dom-modules/war-log-collector/WarLogCollector.js';

class GuildStatsTab {
  constructor() {
    this.calculator = new AttackDefenseCalculator();
    this.warLogCollector = new WarLogCollector();
  }

  show(contentArea) {
    if (contentArea) contentArea.innerHTML = '';

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    `;

    // 로딩 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    loadingDiv.textContent = '길드 전적을 계산하는 중...';
    content.appendChild(loadingDiv);

    contentArea.appendChild(content);

    try {
      this.calculateAndDisplayGuildStats(content, loadingDiv);
    } catch (error) {
      console.error('[GuildStatsTab] 길드 전적 계산 중 오류:', error);
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc2626;">길드 전적을 불러오는 중 오류가 발생했습니다</div>
          <div style="font-size: 14px; color: #6b7280;">잠시 후 다시 시도해주세요</div>
        </div>
      `;
    }
  }

  calculateAndDisplayGuildStats(content, loadingDiv) {
    // 새로운 데이터 처리기를 사용하여 길드 정보가 포함된 전쟁로그 데이터 가져오기
    const processedWarLogs = this.warLogCollector.processWarLogsWithGuildInfo();
    
    if (!Array.isArray(processedWarLogs) || processedWarLogs.length === 0) {
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">전쟁 로그가 없습니다</div>
          <div style="font-size: 14px; color: #6b7280;">전쟁 로그를 수집하면 길드 전적을 확인할 수 있습니다</div>
        </div>
      `;
      return;
    }

    // 길드 정보 가져오기
    const guildInfoData = localStorage.getItem('lanis_guild_info');
    if (!guildInfoData) {
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">길드 정보가 없습니다</div>
          <div style="font-size: 14px; color: #6b7280;">길드 정보를 수집하면 길드 전적을 확인할 수 있습니다</div>
        </div>
      `;
      return;
    }

    const guildInfo = JSON.parse(guildInfoData);
    const guildNames = Object.keys(guildInfo);

    // 일자별 길드별 통계 계산 (가공된 데이터 구조 사용)
    const stats = this.calculateGuildStats(processedWarLogs, guildNames);
    
    if (Object.keys(stats).length === 0) {
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">분석 가능한 전쟁 로그가 없습니다</div>
          <div style="font-size: 14px; color: #6b7280;">길드원이 참여한 전쟁 로그를 수집해주세요</div>
        </div>
      `;
      return;
    }

    // 로딩 제거하고 통계 표시
    content.removeChild(loadingDiv);
    this.displayGuildStats(content, stats);
  }

  calculateGuildStats(processedWarLogs, guildNames) {
    const stats = {};
    const mainTargets = {}; // 메인 타겟 정보 저장
    const attackedGuilds = {}; // 공격받은 길드 통계
    const attackedVillages = {}; // 공격받은 마을 통계

    processedWarLogs.forEach(log => {
      // 가공된 데이터 구조에 맞게 처리
      const logDate = this.extractDateFromTimestamp(log.timestamp);
      if (!logDate) return;

      // 플레이어의 길드 (가공된 데이터에서 직접 가져오기)
      const playerGuild = log.playerguild;
      if (!playerGuild || !guildNames.includes(playerGuild)) return;

      // 공격자 길드 통계 (공격 로그만 승패 계산)
      if (log.type.includes('공격')) {
        if (!stats[logDate]) stats[logDate] = {};
        if (!stats[logDate][playerGuild]) {
          stats[logDate][playerGuild] = { 
            attackWins: 0, attackLosses: 0, attackTotal: 0,
            defenseWins: 0, defenseLosses: 0, defenseTotal: 0,
            total: 0 
          };
        }
        
        stats[logDate][playerGuild].attackTotal++;
        stats[logDate][playerGuild].total++;
        if (log.result === 'success') {
          stats[logDate][playerGuild].attackWins++;
        } else {
          stats[logDate][playerGuild].attackLosses++;
        }
      }

      // 공격 로그에서 메인 타겟 계산 (요새 제외)
      if (log.type.includes('공격') && log.target && log.target !== '요새') {
        // 대상 플레이어의 길드 (가공된 데이터에서 직접 가져오기)
        const targetGuild = log.targetguild;
        if (targetGuild && guildNames.includes(targetGuild)) {
          if (!mainTargets[logDate]) mainTargets[logDate] = {};
          if (!mainTargets[logDate][playerGuild]) {
            mainTargets[logDate][playerGuild] = {};
          }
          if (!mainTargets[logDate][playerGuild][targetGuild]) {
            mainTargets[logDate][playerGuild][targetGuild] = 0;
          }
          mainTargets[logDate][playerGuild][targetGuild]++;
        }
      }

      // 수비자 길드 통계 (요새가 아닌 경우)
      if (log.type.includes('공격') && log.target && log.target !== '요새') {
        const targetGuild = log.targetguild;
        if (targetGuild && guildNames.includes(targetGuild)) {
          if (!stats[logDate]) stats[logDate] = {};
          if (!stats[logDate][targetGuild]) {
            stats[logDate][targetGuild] = { 
              attackWins: 0, attackLosses: 0, attackTotal: 0,
              defenseWins: 0, defenseLosses: 0, defenseTotal: 0,
              total: 0 
            };
          }
          
          stats[logDate][targetGuild].defenseTotal++;
          stats[logDate][targetGuild].total++;
          if (log.result === 'success') {
            // 공격자가 승리했으므로 수비자는 패배
            stats[logDate][targetGuild].defenseLosses++;
          } else {
            // 공격자가 패배했으므로 수비자는 승리
            stats[logDate][targetGuild].defenseWins++;
          }
        }
      }

      // 공격받은 길드와 마을 통계 계산
      if (log.type.includes('공격')) {
        const normalizedLog = this.calculator.normalizeLog(log);
        if (normalizedLog && normalizedLog.isAttack) {
          // 공격받은 길드 통계
          const targetGuild = log.targetguild;
          if (targetGuild) {
            if (!attackedGuilds[logDate]) attackedGuilds[logDate] = {};
            if (!attackedGuilds[logDate][targetGuild]) {
              attackedGuilds[logDate][targetGuild] = 0;
            }
            attackedGuilds[logDate][targetGuild]++;
          }
          
          // 공격받은 마을 통계
          if (log.village) {
            if (!attackedVillages[logDate]) attackedVillages[logDate] = {};
            if (!attackedVillages[logDate][log.village]) {
              attackedVillages[logDate][log.village] = 0;
            }
            attackedVillages[logDate][log.village]++;
          }
        }
      }
    });

    // 메인 타겟 계산 (50% 이상)
    Object.keys(mainTargets).forEach(date => {
      Object.keys(mainTargets[date]).forEach(attackerGuild => {
        const targets = mainTargets[date][attackerGuild];
        const totalAttacks = Object.values(targets).reduce((sum, count) => sum + count, 0);
        
        Object.entries(targets).forEach(([targetGuild, count]) => {
          const percentage = (count / totalAttacks) * 100;
          if (percentage >= 50) {
            if (!stats[date][attackerGuild].mainTarget) {
              stats[date][attackerGuild].mainTarget = targetGuild;
            }
          }
        });
      });
    });

    // 가장 많이 공격받은 길드와 마을 계산
    Object.keys(attackedGuilds).forEach(date => {
      if (!stats[date]) stats[date] = {};
      
      // 가장 많이 공격받은 길드
      const guildEntries = Object.entries(attackedGuilds[date]);
      if (guildEntries.length > 0) {
        const mostAttackedGuild = guildEntries.reduce((max, current) => 
          current[1] > max[1] ? current : max
        );
        stats[date].mostAttackedGuild = {
          name: mostAttackedGuild[0],
          count: mostAttackedGuild[1]
        };
      }
    });

    Object.keys(attackedVillages).forEach(date => {
      if (!stats[date]) stats[date] = {};
      
      // 가장 많이 공격받은 마을
      const villageEntries = Object.entries(attackedVillages[date]);
      if (villageEntries.length > 0) {
        const mostAttackedVillage = villageEntries.reduce((max, current) => 
          current[1] > max[1] ? current : max
        );
        stats[date].mostAttackedVillage = {
          name: mostAttackedVillage[0],
          count: mostAttackedVillage[1]
        };
      }
    });

    return stats;
  }

  // 가공된 데이터를 사용하므로 더 이상 필요하지 않은 메서드들
  // findGuildByMember와 buildNicknameToGuildMap은 제거됨
  // 길드 정보는 이제 log.playerguild와 log.targetguild에서 직접 가져옴

  // 새로운 데이터 구조에 맞는 날짜 추출
  extractDateFromTimestamp(timestamp) {
    try {
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

  displayGuildStats(content, stats) {
    // 날짜별로 정렬 (최신순)
    const sortedDates = Object.keys(stats).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
      const dateSection = this.createDateSection(date, stats[date]);
      content.appendChild(dateSection);
    });
  }

  createDateSection(date, guildStats) {
    const dateSection = document.createElement('div');
    dateSection.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 16px;
      background: white;
      overflow: hidden;
    `;

    // 날짜 헤더
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;
    `;

    const dateTitle = document.createElement('div');
    dateTitle.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    `;
    dateTitle.textContent = this.formatDate(date);

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      font-size: 16px;
      color: #6b7280;
      transition: transform 0.2s ease;
    `;
    arrow.textContent = '▼';

    header.appendChild(dateTitle);
    header.appendChild(arrow);
    dateSection.appendChild(header);

    // 길드별 통계 내용
    const content = document.createElement('div');
    content.style.cssText = `
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    `;

    const contentInner = document.createElement('div');
    contentInner.style.cssText = `
      padding: 16px;
    `;

    // 동네북 정보 추가 (가장 많이 공격받은 길드와 마을)
    if (guildStats.mostAttackedGuild || guildStats.mostAttackedVillage) {
      const dongnaebook = this.createDongnaebookSection(guildStats);
      contentInner.appendChild(dongnaebook);
    }

    // 길드별 통계 카드들
    Object.entries(guildStats).forEach(([guildName, stats]) => {
      if (guildName !== 'mostAttackedGuild' && guildName !== 'mostAttackedVillage') {
        const guildCard = this.createGuildStatsCard(guildName, stats, date);
        contentInner.appendChild(guildCard);
      }
    });

    content.appendChild(contentInner);
    dateSection.appendChild(content);

    // 클릭 이벤트
    header.addEventListener('click', () => {
      const isOpen = content.style.maxHeight !== '0px';
      if (isOpen) {
        content.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
        header.style.background = '#f9fafb';
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
        header.style.background = '#f3f4f6';
      }
    });

    return dateSection;
  }

  createDongnaebookSection(guildStats) {
    const dongnaebook = document.createElement('div');
    dongnaebook.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 16px;
      background: #f8fafc;
      overflow: hidden;
    `;

    // 제목
    const title = document.createElement('div');
    title.style.cssText = `
      padding: 12px 16px;
      background: #3b82f6;
      color: white;
      font-size: 14px;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    `;
    title.textContent = '동네북';
    dongnaebook.appendChild(title);

    // 내용
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      display: flex;
      gap: 16px;
    `;

    // 가장 많이 공격받은 길드
    if (guildStats.mostAttackedGuild) {
      const guildInfo = document.createElement('div');
      guildInfo.style.cssText = `
        flex: 1;
        padding: 12px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
      `;

      const guildTitle = document.createElement('div');
      guildTitle.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      `;
      guildTitle.textContent = '길드';

      const guildName = document.createElement('div');
      guildName.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: #dc2626;
        margin-bottom: 4px;
      `;
      guildName.textContent = guildStats.mostAttackedGuild.name;

      const guildCount = document.createElement('div');
      guildCount.style.cssText = `
        font-size: 12px;
        color: #6b7280;
      `;
      guildCount.textContent = `공격 받은 횟수: ${guildStats.mostAttackedGuild.count}회`;

      guildInfo.appendChild(guildTitle);
      guildInfo.appendChild(guildName);
      guildInfo.appendChild(guildCount);
      content.appendChild(guildInfo);
    }

    // 가장 많이 공격받은 마을
    if (guildStats.mostAttackedVillage) {
      const villageInfo = document.createElement('div');
      villageInfo.style.cssText = `
        flex: 1;
        padding: 12px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
      `;

      const villageTitle = document.createElement('div');
      villageTitle.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      `;
      villageTitle.textContent = '마을';

      const villageName = document.createElement('div');
      villageName.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: #dc2626;
        margin-bottom: 4px;
      `;
      villageName.textContent = guildStats.mostAttackedVillage.name;

      const villageCount = document.createElement('div');
      villageCount.style.cssText = `
        font-size: 12px;
        color: #6b7280;
      `;
      villageCount.textContent = `공격 받은 횟수: ${guildStats.mostAttackedVillage.count}회`;

      villageInfo.appendChild(villageTitle);
      villageInfo.appendChild(villageName);
      villageInfo.appendChild(villageCount);
      content.appendChild(villageInfo);
    }

    dongnaebook.appendChild(content);
    return dongnaebook;
  }

  createGuildStatsCard(guildName, stats, date) {
    const card = document.createElement('div');
    card.style.cssText = `
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.background = '#eef2ff';
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '#f9fafb';
    });
    card.addEventListener('click', () => this.showGuildLogsPopup(date, guildName));

    // 상단: 길드명과 메인타겟
    const topSection = document.createElement('div');
    topSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    `;

    const guildInfo = document.createElement('div');
    guildInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    `;

    const guildNameElement = document.createElement('div');
    guildNameElement.style.cssText = `
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    `;
    guildNameElement.textContent = guildName;

    guildInfo.appendChild(guildNameElement);

    // 메인 타겟 정보 표시 (우상단)
    if (stats.mainTarget) {
      const mainTargetElement = document.createElement('div');
      mainTargetElement.style.cssText = `
        font-size: 11px;
        color: #dc2626;
        font-weight: 600;
        background: #fef2f2;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #fecaca;
        display: inline-block;
        width: fit-content;
        text-align: right;
        word-break: break-all;
        max-width: 120px;
      `;
      mainTargetElement.textContent = `메인타겟\n${stats.mainTarget}`;
      topSection.appendChild(guildInfo);
      topSection.appendChild(mainTargetElement);
    } else {
      topSection.appendChild(guildInfo);
    }

    // 중단: 공격 정보
    const attackSection = document.createElement('div');
    attackSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 8px;
    `;

    const attackLabel = document.createElement('span');
    attackLabel.style.cssText = `
      color: #dc2626;
      font-weight: 600;
      font-size: 12px;
    `;
    attackLabel.textContent = '공격 정보';

    const attackStats = document.createElement('div');
    attackStats.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
    `;

    const attackWins = document.createElement('span');
    attackWins.style.cssText = `
      color: #059669;
      font-weight: 600;
    `;
    attackWins.textContent = `${stats.attackWins}승`;

    const attackLosses = document.createElement('span');
    attackLosses.style.cssText = `
      color: #dc2626;
      font-weight: 600;
    `;
    attackLosses.textContent = `${stats.attackLosses}패`;

    const attackTotal = document.createElement('span');
    attackTotal.style.cssText = `
      color: #6b7280;
      font-weight: 600;
    `;
    attackTotal.textContent = `${stats.attackTotal}회`;

    attackStats.appendChild(attackWins);
    attackStats.appendChild(attackLosses);
    attackStats.appendChild(attackTotal);

    attackSection.appendChild(attackLabel);
    attackSection.appendChild(attackStats);

    // 하단: 수비 정보
    const defenseSection = document.createElement('div');
    defenseSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 8px;
    `;

    const defenseLabel = document.createElement('span');
    defenseLabel.style.cssText = `
      color: #3b82f6;
      font-weight: 600;
      font-size: 12px;
    `;
    defenseLabel.textContent = '수비 정보';

    const defenseStats = document.createElement('div');
    defenseStats.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
    `;

    const defenseWins = document.createElement('span');
    defenseWins.style.cssText = `
      color: #059669;
      font-weight: 600;
    `;
    defenseWins.textContent = `${stats.defenseWins}승`;

    const defenseLosses = document.createElement('span');
    defenseLosses.style.cssText = `
      color: #dc2626;
      font-weight: 600;
    `;
    defenseLosses.textContent = `${stats.defenseLosses}패`;

    const defenseTotal = document.createElement('span');
    defenseTotal.style.cssText = `
      color: #6b7280;
      font-weight: 600;
    `;
    defenseTotal.textContent = `${stats.defenseTotal}회`;

    defenseStats.appendChild(defenseWins);
    defenseStats.appendChild(defenseLosses);
    defenseStats.appendChild(defenseTotal);

    defenseSection.appendChild(defenseLabel);
    defenseSection.appendChild(defenseStats);

    // 최하단: 전체 승률
    const totalWins = stats.attackWins + stats.defenseWins;
    const totalBattles = stats.total;
    const winRateSection = document.createElement('div');
    winRateSection.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px 0;
    `;

    const winRate = document.createElement('div');
    winRate.style.cssText = `
      color: #3b82f6;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
    `;
    const rate = totalBattles > 0 ? ((totalWins / totalBattles) * 100).toFixed(1) : 0;
    winRate.textContent = `전체 승률: ${rate}%`;

    winRateSection.appendChild(winRate);

    // 모든 섹션을 카드에 추가
    card.appendChild(topSection);
    card.appendChild(attackSection);
    card.appendChild(defenseSection);
    card.appendChild(winRateSection);

    return card;
  }

  // 길드 전쟁 로그 팝업 (가공된 데이터 구조 적용)
  showGuildLogsPopup(date, guildName) {
    try {
      // 가공된 전쟁로그 데이터 사용
      const processedWarLogs = this.warLogCollector.processWarLogsWithGuildInfo();

      // 해당 날짜 & 길드 관련 로그 필터링 (가공된 구조)
      const guildLogs = processedWarLogs.filter(log => {
        const logDate = this.extractDateFromTimestamp(log.timestamp);
        if (logDate !== date) return false;
        
        // 플레이어의 길드 확인 (가공된 데이터에서 직접 가져오기)
        const playerGuild = log.playerguild;
        if (playerGuild === guildName) return true;
        
        // 대상이 플레이어인 경우 대상의 길드도 확인
        if (log.target && log.target !== '요새' && log.target !== '마을') {
          const targetGuild = log.targetguild;
          if (targetGuild === guildName) return true;
        }
        
        return false;
      });

      if (guildLogs.length === 0) return;

      // 팝업 생성
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10021;
        width: 90%;
        max-width: 720px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      `;
      const title = document.createElement('h3');
      title.style.cssText = `margin: 0; font-size: 16px; font-weight: 600; color: #374151;`;
      title.textContent = `${date} • ${guildName} 전쟁 로그`;
      const close = document.createElement('button');
      close.style.cssText = `background:none;border:none;cursor:pointer;font-size:24px;color:#6b7280;`;
      close.textContent = '×';
      close.addEventListener('click', () => { overlay.remove(); popup.remove(); });
      header.appendChild(title);
      header.appendChild(close);
      popup.appendChild(header);

      const container = document.createElement('div');
      container.style.cssText = `flex:1; overflow-y:auto; padding: 16px;`;

      // 최신순 정렬
      guildLogs.sort((a, b) => this.getLogDateMs(b) - this.getLogDateMs(a));

      guildLogs.forEach((log, idx) => {
        const acc = this.createGuildLogAccordion(log, guildName, date, idx);
        container.appendChild(acc);
      });

      popup.appendChild(container);

      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:10020;`;
      overlay.addEventListener('click', () => { overlay.remove(); popup.remove(); });

      document.body.appendChild(overlay);
      document.body.appendChild(popup);
    } catch (_) {}
  }

  createGuildLogAccordion(log, guildName, date, index) {
    // normalizedLog 생성
    const normalizedLog = this.calculator.normalizeLog(log);
    if (!normalizedLog) return null;
    
    const accordion = document.createElement('div');
    accordion.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 8px;
      background: white;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;
    `;

    const summary = document.createElement('div');
    summary.style.cssText = `font-size:13px;font-weight:600;color:#374151;`;

    // normalizedLog 기반으로 헤더 정보 생성
    const isAttacker = normalizedLog.attackerGuild === guildName;
    const headerDate = this.getLogDate(log);
    const time = headerDate ? headerDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

    // 로그 타입에 따라 다른 표시 방식 적용
    let displayText = '';
    let displayColor = '#374151';

    if (normalizedLog.isAttack) {
      const role = isAttacker ? '공격' : '수비';
      const victoryForGuild = isAttacker ? normalizedLog.isVictory : !normalizedLog.isVictory;
      displayText = `[${time}] ${role} - ${victoryForGuild ? '승리' : '패배'}`;
      displayColor = victoryForGuild ? '#059669' : '#dc2626';
    } else if (log.type.includes('요새 개발')) {
      displayText = `[${time}] 요새 개발 - ${log.action || '개발'}`;
      displayColor = '#7c3aed';
    } else if (log.type.includes('요새 파괴')) {
      displayText = `[${time}] 요새 파괴 - ${log.action || '파괴'}`;
      displayColor = '#ea580c';
    } else if (normalizedLog.isConquest) {
      displayText = `[${time}] 마을 점령 - ${log.village || '점령'}`;
      displayColor = '#059669';
    } else {
      displayText = `[${time}] ${log.type} - ${normalizedLog.isVictory ? '성공' : '실패'}`;
      displayColor = normalizedLog.isVictory ? '#059669' : '#dc2626';
    }

    summary.textContent = displayText;
    summary.style.color = displayColor;

    const arrow = document.createElement('div');
    arrow.style.cssText = `font-size:14px;color:#6b7280;transition:transform .2s ease;`;
    arrow.textContent = '▼';

    header.appendChild(summary);
    header.appendChild(arrow);

    const content = document.createElement('div');
    content.style.cssText = `max-height:0;overflow:hidden;transition:max-height .3s ease;background:white;`;
    const inner = document.createElement('div');
    inner.style.cssText = `padding:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#374151;`;

    const details = [];
    
    // 플레이어 정보 (길드 정보 포함)
    if (normalizedLog.attackerName) {
      const guildText = normalizedLog.attackerGuild ? ` (${normalizedLog.attackerGuild})` : '';
      details.push(`플레이어: ${normalizedLog.attackerName}${guildText}`);
    }
    
    // 마을 정보 (원본에서 가져오기 - normalizeLog에 없는 정보)
    if (log.village) {
      details.push(`마을: ${log.village}`);
    }
    
    // 대상 정보 (normalizeLog 기반)
    if (normalizedLog.defenderName) {
      const guildText = log.targetguild ? ` (${log.targetguild})` : '';
      details.push(`대상: ${normalizedLog.defenderName}${guildText}`);
    } else if (log.target) {
      details.push(`대상: ${log.target}`);
    }
    
    // 행동 정보 (원본에서 가져오기 - normalizeLog에 없는 정보)
    if (log.action) {
      details.push(`행동: ${log.action}`);
    }
    
    // 유형 정보 (원본에서 가져오기 - normalizeLog에 없는 정보)
    details.push(`유형: ${log.type}`);
    
    // 결과 정보
    details.push(`결과: ${normalizedLog.isVictory ? '성공' : '실패'}`);
    
    // 시간 정보
    const detailDate = this.getLogDate(log);
    details.push(`시간: ${detailDate ? detailDate.toLocaleString('ko-KR') : '-'}`);

    inner.innerHTML = details.map(d => `<div style="margin-bottom:4px;">• ${d}</div>`).join('');
    content.appendChild(inner);

    header.addEventListener('click', () => {
      const open = content.style.maxHeight !== '0px';
      if (open) {
        content.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
        header.style.background = '#f9fafb';
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
        header.style.background = '#f3f4f6';
      }
    });

    accordion.appendChild(header);
    accordion.appendChild(content);
    return accordion;
  }

  // ----- 날짜 파싱 유틸 -----
  getLogDate(log) {
    try {
      if (!log) return null;
      const ts = log.timestamp;
      const ca = log.collectedAt;
      let d = null;
      if (ts != null) {
        if (typeof ts === 'number') {
          d = new Date(ts);
        } else if (typeof ts === 'string') {
          const tryNative = new Date(ts);
          if (!isNaN(tryNative.getTime())) return tryNative;
          d = this.parseKoreanTimestamp(ts);
        }
      }
      if (!d && ca) {
        const d2 = new Date(ca);
        if (!isNaN(d2.getTime())) return d2;
      }
      return d;
    } catch (_) {
      return null;
    }
  }

  getLogDateMs(log) {
    const d = this.getLogDate(log);
    return d ? d.getTime() : 0;
  }

  parseKoreanTimestamp(s) {
    try {
      if (typeof s !== 'string') return null;
      // 예: 2025. 8. 6. 오후 9:59:59
      const reAmPm = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/;
      const m1 = s.match(reAmPm);
      if (m1) {
        const year = parseInt(m1[1], 10);
        const month = parseInt(m1[2], 10) - 1;
        const day = parseInt(m1[3], 10);
        const ap = m1[4];
        let hour = parseInt(m1[5], 10);
        const minute = parseInt(m1[6], 10);
        const second = m1[7] ? parseInt(m1[7], 10) : 0;
        if (ap === '오후' && hour < 12) hour += 12;
        if (ap === '오전' && hour === 12) hour = 0;
        const d = new Date(year, month, day, hour, minute, second);
        return isNaN(d.getTime()) ? null : d;
      }
      // 예: 2025. 8. 6 21:59:59 또는 2025-08-06 21:59:59
      const re24 = /(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/;
      const m2 = s.match(re24);
      if (m2) {
        const year = parseInt(m2[1], 10);
        const month = parseInt(m2[2], 10) - 1;
        const day = parseInt(m2[3], 10);
        const hour = parseInt(m2[4], 10);
        const minute = parseInt(m2[5], 10);
        const second = m2[6] ? parseInt(m2[6], 10) : 0;
        const d = new Date(year, month, day, hour, minute, second);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `오늘 (${dateString})`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `어제 (${dateString})`;
    } else {
      return `${dateString}`;
    }
  }
}

export { GuildStatsTab };