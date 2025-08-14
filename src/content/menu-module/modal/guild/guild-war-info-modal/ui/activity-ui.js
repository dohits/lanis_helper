// 길드 활동량 UI 컴포넌트
export class ActivityUI {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  // 활동량 헤더 생성
  createActivityHeader() {
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 16px;
    `;

    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 새로고침';
    refreshButton.id = 'refresh-activity-btn';
    refreshButton.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    `;
    refreshButton.addEventListener('mouseenter', () => {
      refreshButton.style.transform = 'translateY(-1px)';
      refreshButton.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.3)';
    });
    refreshButton.addEventListener('mouseleave', () => {
      refreshButton.style.transform = 'translateY(0)';
      refreshButton.style.boxShadow = 'none';
    });
    refreshButton.addEventListener('click', () => {
      this.refreshActivityData();
    });

    headerSection.appendChild(refreshButton);

    return headerSection;
  }

  // 활동량 콘텐츠 생성
  createActivityContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 길드 목록 가져오기
    const guilds = this.dataManager.getSavedGuildList();
    
    if (guilds.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #666;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      `;
      emptyState.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
        <h4 style="margin: 0 0 8px 0; color: #333;">길드 정보가 없습니다</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          길드 정보를 먼저 수집해주세요.
        </p>
      `;
      content.appendChild(emptyState);
      return content;
    }

    // 각 길드별 활동량 카드 생성
    guilds.forEach(guild => {
      const activityCard = this.createActivityCard(guild);
      content.appendChild(activityCard);
    });

    return content;
  }

  // 활동량 카드 생성
  createActivityCard(guild) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    });

    const info = guild.info;
    const activity = this.dataManager.calculateGuildActivity(info.guildName);

    // 길드 헤더
    const guildHeader = document.createElement('div');
    guildHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    `;

    const guildIcon = document.createElement('div');
    guildIcon.textContent = '🏰';
    guildIcon.style.cssText = `
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border-radius: 8px;
    `;

    const guildInfo = document.createElement('div');
    guildInfo.innerHTML = `
      <div style="font-weight: 600; color: #333; font-size: 16px; margin-bottom: 2px;">
        ${info.guildName}
      </div>
      <div style="color: #666; font-size: 12px;">
        👑 ${info.guildMaster} • ⭐ ${info.guildLevel} • 👥 ${info.memberCount}
      </div>
    `;

    guildHeader.appendChild(guildIcon);
    guildHeader.appendChild(guildInfo);

    // 통계 섹션
    const statsSection = this.createStatsSection(activity);
    
    // 최근 활동 섹션
    const recentActivitySection = this.createRecentActivitySection(activity);

    card.appendChild(guildHeader);
    card.appendChild(statsSection);
    card.appendChild(recentActivitySection);

    return card;
  }

  // 통계 섹션 생성
  createStatsSection(activity) {
    const statsSection = document.createElement('div');
    statsSection.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    `;

    // 총 전쟁 수
    const totalWarsCard = this.createStatCard(
      '총 전쟁',
      activity.totalWars.toString(),
      '⚔️',
      '#007bff'
    );

    // 승리 수
    const winsCard = this.createStatCard(
      '승리',
      activity.wins.toString(),
      '🏆',
      '#28a745'
    );

    // 패배 수
    const lossesCard = this.createStatCard(
      '패배',
      activity.losses.toString(),
      '💀',
      '#dc3545'
    );

    // 무승부 수
    const drawsCard = this.createStatCard(
      '무승부',
      activity.draws.toString(),
      '🤝',
      '#ffc107'
    );

    // 승률
    const winRateCard = this.createStatCard(
      '승률',
      `${activity.winRate}%`,
      '📈',
      '#17a2b8'
    );

    statsSection.appendChild(totalWarsCard);
    statsSection.appendChild(winsCard);
    statsSection.appendChild(lossesCard);
    statsSection.appendChild(drawsCard);
    statsSection.appendChild(winRateCard);

    return statsSection;
  }

  // 통계 카드 생성
  createStatCard(title, value, icon, color) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${color}15;
      border: 1px solid ${color}30;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      transition: all 0.2s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.background = `${color}25`;
      card.style.transform = 'scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = `${color}15`;
      card.style.transform = 'scale(1)';
    });

    const iconDiv = document.createElement('div');
    iconDiv.textContent = icon;
    iconDiv.style.cssText = `
      font-size: 20px;
      margin-bottom: 4px;
    `;

    const valueDiv = document.createElement('div');
    valueDiv.textContent = value;
    valueDiv.style.cssText = `
      font-size: 18px;
      font-weight: 700;
      color: ${color};
      margin-bottom: 2px;
    `;

    const titleDiv = document.createElement('div');
    titleDiv.textContent = title;
    titleDiv.style.cssText = `
      font-size: 11px;
      color: #666;
      font-weight: 500;
    `;

    card.appendChild(iconDiv);
    card.appendChild(valueDiv);
    card.appendChild(titleDiv);

    return card;
  }

  // 최근 활동 섹션 생성
  createRecentActivitySection(activity) {
    const section = document.createElement('div');
    section.style.cssText = `
      border-top: 1px solid #e9ecef;
      padding-top: 16px;
    `;

    const title = document.createElement('h4');
    title.textContent = '📅 최근 활동';
    title.style.cssText = `
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    `;

    const activityList = document.createElement('div');
    activityList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    `;

    if (activity.recentActivity.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 20px;
        color: #666;
        font-size: 12px;
        background: #f8f9fa;
        border-radius: 6px;
      `;
      emptyState.textContent = '최근 전쟁 기록이 없습니다.';
      activityList.appendChild(emptyState);
    } else {
      activity.recentActivity.forEach(log => {
        const activityItem = this.createActivityItem(log);
        activityList.appendChild(activityItem);
      });
    }

    section.appendChild(title);
    section.appendChild(activityList);

    return section;
  }

  // 활동 아이템 생성
  createActivityItem(log) {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    `;

    const logInfo = document.createElement('div');
    logInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;

    const guildNames = document.createElement('div');
    guildNames.textContent = `${log.guildName} vs ${log.opponentGuild}`;
    guildNames.style.cssText = `
      font-weight: 600;
      color: #333;
    `;

    const dateInfo = document.createElement('div');
    dateInfo.textContent = new Date(log.date).toLocaleDateString('ko-KR');
    dateInfo.style.cssText = `
      color: #666;
      font-size: 11px;
    `;

    logInfo.appendChild(guildNames);
    logInfo.appendChild(dateInfo);

    const resultBadge = document.createElement('span');
    resultBadge.style.cssText = `
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
    `;

    if (log.result === '승리') {
      resultBadge.style.background = '#28a745';
      resultBadge.textContent = '승리';
    } else if (log.result === '패배') {
      resultBadge.style.background = '#dc3545';
      resultBadge.textContent = '패배';
    } else {
      resultBadge.style.background = '#ffc107';
      resultBadge.style.color = '#212529';
      resultBadge.textContent = '무승부';
    }

    item.appendChild(logInfo);
    item.appendChild(resultBadge);

    return item;
  }

  // 활동 데이터 새로고침
  refreshActivityData() {
    // 현재 탭이 활동량 탭인 경우에만 새로고침
    const contentArea = document.getElementById('guild-war-content-area');
    if (contentArea) {
      const activityContent = this.createActivityContent();
      contentArea.innerHTML = '';
      contentArea.appendChild(activityContent);
    }
  }
}
