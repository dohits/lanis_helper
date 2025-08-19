import { GuildInfoTab } from './guild-info-tab.js';
import { WarLogTab } from './war-log-tab.js';
import { GuildStatsTab } from './activity-tab.js';

// 길드 모달 전용 탭 콘텐츠
class TabContent {
  constructor() {
    this.guildInfoTab = new GuildInfoTab();
    this.warLogTab = new WarLogTab();
    this.activityTab = new GuildStatsTab();
  }

  showGuildInfoTab(contentArea) {
    this.guildInfoTab.show(contentArea);
  }

  showWarLogTab(contentArea) {
    this.warLogTab.show(contentArea);
  }

  showActivityTab(contentArea) {
    this.activityTab.show(contentArea);
  }

  showUnknownTab(contentArea) {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 4px;
    `;

    const placeholderDiv = document.createElement('div');
    placeholderDiv.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    placeholderDiv.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 48px; margin-bottom: 16px;">❓</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">알 수 없는 탭</div>
        <div style="font-size: 14px; color: #6b7280;">이 탭은 존재하지 않습니다</div>
      </div>
    `;

    content.appendChild(placeholderDiv);
    contentArea.appendChild(content);
  }
}

export { TabContent };


