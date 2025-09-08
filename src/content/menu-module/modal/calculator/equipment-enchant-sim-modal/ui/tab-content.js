// 장비 감정 시뮬 모달 전용 탭 콘텐츠 (라우터)
import { EnchantSimulationTab } from './enchant-simulation-tab.js';
import { EnchantRankingTab } from './enchant-ranking-tab.js';
import { ScoreTableTab } from './score-table-tab.js';

class TabContent {
  constructor() {
    this.enchantSimulationTab = new EnchantSimulationTab();
    this.enchantRankingTab = new EnchantRankingTab();
    this.scoreTableTab = new ScoreTableTab();
  }

  // 장비 감정 시뮬레이션 탭 표시
  showEnchantSimulationTab(contentArea) {
    this.enchantSimulationTab.show(contentArea);
  }

  // 감정 순위 탭 표시
  showEnchantRankingTab(contentArea) {
    this.enchantRankingTab.show(contentArea);
  }

  // 점수표 탭 표시
  showScoreTableTab(contentArea) {
    this.scoreTableTab.show(contentArea);
  }

  // 알 수 없는 탭 표시
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