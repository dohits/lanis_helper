// 유물 감정 시뮬 모달 전용 탭 콘텐츠 (라우터)
import { ExpectedValueTab } from './expected-value-tab.js';

class TabContent {
  constructor() {
    this.expectedValueTab = new ExpectedValueTab();
  }

  // 시뮬레이터 탭 표시
  showSimulatorTab(contentArea) {
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
        <div style="font-size: 48px; margin-bottom: 16px;">💎</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">시뮬레이터</div>
        <div style="font-size: 14px; color: #6b7280;">기능 구현 예정</div>
      </div>
    `;

    content.appendChild(placeholderDiv);
    contentArea.appendChild(content);
  }

  // 기댓값 탭 표시
  showExpectedValueTab(contentArea) {
    this.expectedValueTab.show(contentArea);
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

