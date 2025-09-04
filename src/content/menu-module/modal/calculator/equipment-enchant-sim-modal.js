import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { TabManager } from './equipment-enchant-sim-modal/ui/tab-manager.js';
import { TabContent } from './equipment-enchant-sim-modal/ui/tab-content.js';

// 장비 감정 시뮬 모달 클래스
export class EquipmentEnchantSimModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.equipmentEnchantSim);
    
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
    this.contentArea.id = 'equipment-enchant-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
      align-content: center;
    `;
    container.appendChild(this.contentArea);

    // 탭 매니저에 콘텐츠 영역 설정 및 초기 등록
    this.tabManager.setContentArea(this.contentArea);
    this.tabManager.registerTabHandler('tab1', () => this.showEquipmentDrawTab());
    this.tabManager.registerTabHandler('tab2', () => this.showEnchantRankingTab());
    this.tabManager.registerTabHandler('tab3', () => this.showScoreTableTab());

    // 초기 탭 설정
    this.currentTab = 'tab1';
    this.tabManager.switchTab('tab1');

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 탭 콘텐츠 표시
  showTabContent(tabId) {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = '';

    switch (tabId) {
      case 'tab1':
        this.showEquipmentDrawTab();
        break;
      case 'tab2':
        this.showEnchantRankingTab();
        break;
      case 'tab3':
        this.showScoreTableTab();
        break;
      default:
        this.showUnknownTab();
    }
  }

  // 장비뽑기 탭 표시
  showEquipmentDrawTab() {
    this.tabContent.showEnchantSimulationTab(this.contentArea);
  }

  // 감정순위 탭 표시
  showEnchantRankingTab() {
    this.tabContent.showEnchantRankingTab(this.contentArea);
  }

  // 점수표 탭 표시
  showScoreTableTab() {
    this.tabContent.showScoreTableTab(this.contentArea);
  }

  // 알 수 없는 탭 표시
  showUnknownTab() {
    this.tabContent.showUnknownTab(this.contentArea);
  }



  // 모달 닫기
  close() {
    super.close();
  }
}
