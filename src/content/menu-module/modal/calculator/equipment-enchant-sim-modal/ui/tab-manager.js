// 장비 감정 시뮬 모달 전용 탭 매니저
class TabManager {
  constructor() {
    this.contentArea = null;
    this.handlers = {};
  }

  setContentArea(element) {
    this.contentArea = element;
  }

  createTabSection(onSwitch) {
    const tabSection = document.createElement('div');
    tabSection.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    const tabs = [
      { id: 'tab1', text: '장비뽑기', active: true },
      { id: 'tab2', text: '감정순위', active: false },
      { id: 'tab3', text: '점수표', active: false }
    ];

    tabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.id = tab.id;
      tabButton.textContent = tab.text;
      tabButton.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #007bff;
        background: ${tab.active ? '#007bff' : 'white'};
        color: ${tab.active ? 'white' : '#007bff'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;

      tabButton.addEventListener('click', () => {
        this.switchTab(tab.id);
        if (onSwitch) onSwitch(tab.id);
      });

      tabSection.appendChild(tabButton);
    });

    return tabSection;
  }

  registerTabHandler(tabId, handler) {
    this.handlers[tabId] = handler;
  }

  switchTab(tabId) {
    const buttons = document.querySelectorAll('#tab1, #tab2, #tab3');
    buttons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#007bff';
    });

    const selectedBtn = document.getElementById(tabId);
    if (selectedBtn) {
      selectedBtn.style.background = '#007bff';
      selectedBtn.style.color = 'white';
    }

    // 콘텐츠 영역 초기화하여 중복 렌더링 방지
    if (this.contentArea) {
      this.contentArea.innerHTML = '';
    }

    if (this.handlers[tabId]) {
      this.handlers[tabId]();
    }
  }
}

export { TabManager };
