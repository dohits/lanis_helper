import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { GuildDataManager } from './guild-war-info-modal/data/guild-data-manager.js';
import { GuildCard } from './guild-war-info-modal/ui/guild-card.js';
import { WarLogUI } from './guild-war-info-modal/ui/war-log-ui.js';
import { ActivityUI } from './guild-war-info-modal/ui/activity-ui.js';

class GuildWarInfoModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.guildWarInfo);

    // 데이터 관리자 초기화
    this.dataManager = new GuildDataManager();
    
    // UI 컴포넌트들 초기화
    this.guildCard = new GuildCard(this.dataManager);
    this.warLogUI = new WarLogUI(this.dataManager);
    this.activityUI = new ActivityUI(this.dataManager);

    this.contentArea = null;
    this.currentTab = 'tab1';
    this.isEditMode = false;
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
    
    // 모달이 열릴 때마다 최신 정보 로드
    this.refreshGuildData();
  }

  // 길드 데이터 새로고침
  refreshGuildData() {
    // 현재 활성 탭에 따라 콘텐츠 새로고침
    if (this.currentTab === 'tab1') {
      this.showTabContent('tab1');
    } else if (this.currentTab === 'tab2') {
      this.showTabContent('tab2');
    } else if (this.currentTab === 'tab3') {
      this.showTabContent('tab3');
    }
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

    // 토글 버튼 섹션
    const toggleSection = this.createToggleSection();
    container.appendChild(toggleSection);

    // 콘텐츠 영역
    this.contentArea = document.createElement('div');
    this.contentArea.id = 'guild-war-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    container.appendChild(this.contentArea);

    // 초기 탭 설정
    this.currentTab = 'tab1';
    this.showTabContent('tab1');

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 토글 버튼 섹션 생성
  createToggleSection() {
    const toggleSection = document.createElement('div');
    toggleSection.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    // 토글 버튼들 생성
    const buttons = [
      { id: 'tab1', text: '길드원 정보', active: true },
      { id: 'tab2', text: '전쟁 로그', active: false },
      { id: 'tab3', text: '활동량', active: false }
    ];

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #007bff;
        background: ${button.active ? '#007bff' : 'white'};
        color: ${button.active ? 'white' : '#007bff'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;
      
      btn.addEventListener('click', () => {
        this.switchTab(button.id);
      });
      
      toggleSection.appendChild(btn);
    });

    return toggleSection;
  }

  // 탭 전환
  switchTab(tabId) {
    // 모든 버튼 비활성화
    const buttons = document.querySelectorAll('#tab1, #tab2, #tab3');
    buttons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#007bff';
    });

    // 선택된 버튼 활성화
    const selectedBtn = document.getElementById(tabId);
    if (selectedBtn) {
      selectedBtn.style.background = '#007bff';
      selectedBtn.style.color = 'white';
    }

    // 콘텐츠 전환
    this.currentTab = tabId;
    this.showTabContent(tabId);
  }

  // 탭 콘텐츠 표시
  showTabContent(tabId) {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = '';

    let content = null;
    switch (tabId) {
      case 'tab1':
        content = this.showTab1Content();
        break;
      case 'tab2':
        content = this.showTab2Content();
        break;
      case 'tab3':
        content = this.showTab3Content();
        break;
    }

    if (content) {
      this.contentArea.appendChild(content);
    }
  }

  // 길드원 정보 탭 콘텐츠
  showTab1Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 헤더 섹션
    const headerSection = this.createGuildInfoHeader();
    content.appendChild(headerSection);

    // 길드 목록 표시
    this.displaySavedGuilds(content);

    return content;
  }

  // 길드 정보 헤더 생성
  createGuildInfoHeader() {
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 16px;
    `;

    const editButton = document.createElement('button');
    editButton.textContent = '📝 순서 편집';
    editButton.id = 'edit-guild-order-btn';
    editButton.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    `;
    editButton.addEventListener('mouseenter', () => {
      editButton.style.transform = 'translateY(-1px)';
      editButton.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
    });
    editButton.addEventListener('mouseleave', () => {
      editButton.style.transform = 'translateY(0)';
      editButton.style.boxShadow = 'none';
    });
    editButton.addEventListener('click', () => this.toggleEditMode());

    headerSection.appendChild(editButton);
    return headerSection;
  }

  // 저장된 길드 목록 표시
  displaySavedGuilds(container) {
    const savedGuilds = this.dataManager.getSavedGuildList();
    
    if (savedGuilds.length === 0) {
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
        <div style="font-size: 48px; margin-bottom: 16px;">🏰</div>
        <h4 style="margin: 0 0 8px 0; color: #333;">저장된 길드 정보가 없습니다</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          길드 페이지를 방문하면 자동으로 정보가 수집됩니다.
        </p>
      `;
      container.appendChild(emptyState);
      return;
    }

    const savedOrder = this.dataManager.loadGuildOrder();
    const orderedGuilds = this.dataManager.sortGuildsByOrder(savedGuilds, savedOrder);

    // 길드 카드 컨테이너 생성
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'guild-cards-container';
    cardsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // 길드 목록 생성
    orderedGuilds.forEach((guild, index) => {
      const guildCard = this.guildCard.createGuildCard(
        guild, 
        index, 
        (guildName) => this.deleteGuild(guildName),
        () => this.toggleEditMode()
      );
      cardsContainer.appendChild(guildCard);
    });

    container.appendChild(cardsContainer);
  }

  // 전쟁 로그 탭 콘텐츠
  showTab2Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 헤더 섹션
    const headerSection = this.warLogUI.createWarLogHeader(
      () => this.collectWarLogs(),
      () => this.deleteAllWarLogs()
    );
    content.appendChild(headerSection);

    // 전쟁 로그 목록
    const warLogs = this.dataManager.getSavedWarLogs();
    const logList = this.warLogUI.createWarLogList(
      warLogs,
      (logId) => this.deleteWarLog(logId)
    );
    content.appendChild(logList);

    return content;
  }

  // 활동량 탭 콘텐츠
  showTab3Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 헤더 섹션
    const headerSection = this.activityUI.createActivityHeader();
    content.appendChild(headerSection);

    // 활동량 콘텐츠
    const activityContent = this.activityUI.createActivityContent();
    content.appendChild(activityContent);

    return content;
  }

  // 편집 모드 토글
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const editButton = document.getElementById('edit-guild-order-btn');
    
    if (this.isEditMode) {
      editButton.textContent = '💾 순서 저장';
      editButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      this.enableDragAndDrop();
    } else {
      editButton.textContent = '📝 순서 편집';
      editButton.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
      this.disableDragAndDrop();
      this.saveGuildOrder();
    }
  }
      
      // 드래그 앤 드롭 활성화
  enableDragAndDrop() {
    const cards = document.querySelectorAll('.guild-card');
    cards.forEach(card => {
      card.draggable = true;
      card.addEventListener('dragstart', this.handleDragStart.bind(this));
      card.addEventListener('dragover', this.handleDragOver.bind(this));
      card.addEventListener('drop', this.handleDrop.bind(this));
    });
  }
      
      // 드래그 앤 드롭 비활성화
  disableDragAndDrop() {
    const cards = document.querySelectorAll('.guild-card');
    cards.forEach(card => {
      card.draggable = false;
      card.removeEventListener('dragstart', this.handleDragStart.bind(this));
      card.removeEventListener('dragover', this.handleDragOver.bind(this));
      card.removeEventListener('drop', this.handleDrop.bind(this));
    });
  }

  // 드래그 시작
  handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-index'));
  }

  // 드래그 오버
  handleDragOver(e) {
      e.preventDefault();
  }

  // 드롭
  handleDrop(e) {
      e.preventDefault();
    const draggedIndex = e.dataTransfer.getData('text/plain');
    const targetIndex = e.target.closest('.guild-card')?.getAttribute('data-index');
    
    if (draggedIndex && targetIndex && draggedIndex !== targetIndex) {
      this.reorderGuilds(parseInt(draggedIndex), parseInt(targetIndex));
    }
  }

  // 길드 순서 변경
  reorderGuilds(fromIndex, toIndex) {
    const cardsContainer = document.querySelector('.guild-cards-container');
    const cards = Array.from(cardsContainer.children);
    
    const draggedCard = cards[fromIndex];
    const targetCard = cards[toIndex];
    
    if (fromIndex < toIndex) {
      cardsContainer.insertBefore(draggedCard, targetCard.nextSibling);
    } else {
      cardsContainer.insertBefore(draggedCard, targetCard);
    }
    
    // 인덱스 업데이트
    cards.forEach((card, index) => {
      card.setAttribute('data-index', index);
    });
  }

  // 길드 순서 저장
  saveGuildOrder() {
    const cards = document.querySelectorAll('.guild-card');
    const order = Array.from(cards).map(card => {
      const guildName = card.querySelector('.guild-name').textContent;
      return guildName;
    });
    
    this.dataManager.saveGuildOrder(order);
  }

  // 길드 삭제
  deleteGuild(guildName) {
    try {
      this.dataManager.deleteGuild(guildName);
      this.showTabContent('tab1'); // 탭 새로고침
    } catch (error) {
      console.error('길드 삭제 실패:', error);
      alert('길드 삭제 중 오류가 발생했습니다.');
    }
  }

  // 전쟁 로그 수집
  async collectWarLogs() {
    const contentArea = document.getElementById('guild-war-content-area');
    const loadingState = this.warLogUI.createLoadingState();
    
    // 기존 콘텐츠를 로딩 상태로 교체
    contentArea.innerHTML = '';
    contentArea.appendChild(loadingState);

    try {
      const result = await this.dataManager.collectWarLogs();
      
      // 결과에 따른 메시지 표시
      if (result.success) {
        const successMessage = this.warLogUI.createSuccessMessage(result.message);
        contentArea.innerHTML = '';
        contentArea.appendChild(successMessage);
      } else {
        const infoMessage = this.warLogUI.createInfoMessage(result.message);
        contentArea.innerHTML = '';
        contentArea.appendChild(infoMessage);
      }
      
      // 2초 후 탭 새로고침
    setTimeout(() => {
        this.showTabContent('tab2');
      }, 2000);
      
    } catch (error) {
      console.error('전쟁 로그 수집 실패:', error);
      
      // 에러 메시지 표시
      const errorMessage = this.warLogUI.createErrorMessage('전쟁 로그 수집 중 오류가 발생했습니다.');
      contentArea.innerHTML = '';
      contentArea.appendChild(errorMessage);
      
      // 3초 후 탭 새로고침
      setTimeout(() => {
        this.showTabContent('tab2');
      }, 3000);
    }
  }

  // 모든 전쟁 로그 삭제
  deleteAllWarLogs() {
    if (confirm('모든 전쟁 로그를 삭제하시겠습니까?')) {
      try {
        this.dataManager.deleteAllWarLogs();
        this.showTabContent('tab2'); // 탭 새로고침
      } catch (error) {
        console.error('전쟁 로그 삭제 실패:', error);
        alert('전쟁 로그 삭제 중 오류가 발생했습니다.');
      }
    }
  }

  // 특정 전쟁 로그 삭제
  deleteWarLog(logId) {
    try {
      this.dataManager.deleteWarLog(logId);
      this.showTabContent('tab2'); // 탭 새로고침
    } catch (error) {
      console.error('전쟁 로그 삭제 실패:', error);
      alert('전쟁 로그 삭제 중 오류가 발생했습니다.');
    }
  }

  // 모달 닫기 (오버라이드)
  close() {
    super.close();
  }
}

export default GuildWarInfoModal;
