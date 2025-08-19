import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { TabManager } from './guild-war-info-modal/ui/tab-manager.js';
import { TabContent } from './guild-war-info-modal/ui/tab-content.js';

class GuildWarInfoModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.guildWarInfo);
    
    this.contentArea = null;
    this.currentTab = 'tab1';
    this.tabManager = new TabManager();
    this.tabContent = new TabContent();
  }

  // 모달 열기 (오버라이드)
  open() {
    super.open();
    
    // modal-body 패딩 제거
    if (this.body) {
      this.body.style.padding = '0';
    }
    
    // max-width를 800px로 설정
    if (this.content) {
      this.content.style.maxWidth = '800px';
    }
    
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 0px;
      padding: 16px;
      overflow-y: auto;
      min-height: 400px;
      max-height: calc(95vh - 120px);
    `;

    // 탭 버튼 섹션
    const tabSection = this.tabManager.createTabSection((tabId) => this.showTabContent(tabId));
    container.appendChild(tabSection);

    // 콘텐츠 영역
    this.contentArea = document.createElement('div');
    this.contentArea.id = 'guild-war-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    container.appendChild(this.contentArea);

    // 탭 매니저에 콘텐츠 영역 설정 및 초기 등록
    this.tabManager.setContentArea(this.contentArea);
    this.tabManager.registerTabHandler('tab1', () => this.showGuildInfoTab());
    this.tabManager.registerTabHandler('tab2', () => this.showWarLogTab());
    this.tabManager.registerTabHandler('tab3', () => this.showActivityTab());

    // 초기 탭 설정
    this.currentTab = 'tab1';
    this.tabManager.switchTab('tab1');

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 탭 전환은 TabManager가 처리

  // 탭 콘텐츠 표시
  showTabContent(tabId) {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = '';

    switch (tabId) {
      case 'tab1':
        this.showGuildInfoTab();
        break;
      case 'tab2':
        this.showWarLogTab();
        break;
      case 'tab3':
        this.showActivityTab();
        break;
      default:
        this.showUnknownTab();
    }
  }

  // 길드 정보 탭 표시
  showGuildInfoTab() {
    // TabContent로 위임
    this.tabContent.showGuildInfoTab(this.contentArea);
  }

  // 길드 아코디언 생성 메서드는 TabContent/GuildInfoTab로 이전됨

  // 아코디언 생성은 GuildAccordion으로 분리됨

  // 전쟁 로그 탭 표시
  showWarLogTab() {
    this.tabContent.showWarLogTab(this.contentArea);
  }

  // 활동 내역 탭 표시
  showActivityTab() {
    // TabContent로 위임
    this.tabContent.showActivityTab(this.contentArea);
  }

  // 알 수 없는 탭 표시
  showUnknownTab() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
      font-size: 16px;
    `;
    content.textContent = '알 수 없는 탭';
    this.contentArea.appendChild(content);
  }



  // 길드 목록 조회 로직은 GuildInfoTab 내에서 처리
}

export { GuildWarInfoModal };
