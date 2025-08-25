// 장비 감정 시뮬 모달 전용 탭 콘텐츠
class TabContent {
  constructor() {
    // 탭 콘텐츠 클래스들 초기화 (향후 구현)
  }

  showEnchantSimulationTab(contentArea) {
    // 감정시뮬 탭 내용 (준비 중)
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
        <div style="font-size: 48px; margin-bottom: 16px;">🔮</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">감정시뮬 탭</div>
        <div style="font-size: 14px; color: #6b7280;">준비 중입니다</div>
      </div>
    `;

    content.appendChild(placeholderDiv);
    contentArea.appendChild(content);
  }

  // 랜덤 장비 뽑기 기능 (준비 중 - 주석처리)
  /*
  async drawRandomEquipment() {
    const resultArea = document.getElementById('equipment-draw-result');
    if (!resultArea) return;

    // 로딩 표시
    resultArea.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 32px; margin-bottom: 12px;">🎲</div>
        <div>장비를 뽑는 중...</div>
      </div>
    `;

    try {
      // 레어 아이템 데이터 로드
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (!result.rareItems || result.rareItems.length === 0) {
        // 데이터가 없는 경우 수집 필요 모달 표시
        this.showCollectionNeededModal();
        resultArea.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
            <div style="color: #ef4444;">아이템 데이터를 먼저 수집해주세요!</div>
          </div>
        `;
        return;
      }

      // 랜덤 장비 선택 (모든 확률 동일)
      const randomIndex = Math.floor(Math.random() * result.rareItems.length);
      const selectedItem = result.rareItems[randomIndex];

      // 결과 표시
      this.displaySelectedEquipment(selectedItem, resultArea);

    } catch (error) {
      console.error('장비 뽑기 오류:', error);
      resultArea.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 32px; margin-bottom: 12px;">❌</div>
          <div style="color: #ef4444;">장비 뽑기 중 오류가 발생했습니다.</div>
        </div>
      `;
    }
  }

  // 선택된 장비 표시 (준비 중 - 주석처리)
  displaySelectedEquipment(item, resultArea) {
    const gradeColors = {
      '흰색': '#9ca3af',
      '파랑': '#3b82f6', 
      '노랑': '#f59e0b',
      '보라': '#8b5cf6',
      '빨강': '#ef4444'
    };

    const gradeColor = gradeColors[item.grade] || '#6b7280';

    resultArea.innerHTML = `
      <div style="text-align: center; width: 100%;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <div style="font-size: 20px; font-weight: 700; color: ${gradeColor}; margin-bottom: 8px;">
          ${item.name}
        </div>
        <div style="display: inline-block; padding: 4px 12px; background: ${gradeColor}; color: white; border-radius: 16px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
          ${item.grade} 등급
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 16px; text-align: left;">
          ${item.type ? `<div><strong>종류:</strong> ${item.type}</div>` : ''}
          ${item.power ? `<div><strong>위력:</strong> ${item.power}</div>` : ''}
          ${item.weight ? `<div><strong>무게:</strong> ${item.weight}</div>` : ''}
          ${item.ability ? `<div><strong>어빌리티:</strong> ${item.ability}</div>` : ''}
        </div>
        ${item.description ? `<div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #4b5563;">${item.description}</div>` : ''}
      </div>
    `;
  }

  // 수집 필요 모달 표시 (준비 중 - 주석처리)
  showCollectionNeededModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.collection-needed-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'collection-needed-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      z-index: 10030;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">📦</div>
      <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #374151;">아이템 데이터 수집 필요</h3>
      <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.6;">
        장비 뽑기를 사용하려면 먼저 라니스 위키에서<br>
        레어 아이템 데이터를 수집해야 합니다.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="close-collection-modal" style="
          padding: 12px 24px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s ease;
        ">닫기</button>
        <button id="go-to-collection" style="
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s ease;
        ">아이템 수집하기</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.getElementById('close-collection-modal').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('go-to-collection').addEventListener('click', () => {
      modal.remove();
      // 설정 메뉴의 아이템 수집 모달 열기
      if (window.menuManager && window.menuManager.itemCollectionModal) {
        window.menuManager.itemCollectionModal.open();
      }
    });
  }
  */

  showEnchantRankingTab(contentArea) {
    // 감정순위 탭 내용 (향후 구현)
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
        <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">감정순위 탭</div>
        <div style="font-size: 14px; color: #6b7280;">준비 중입니다</div>
      </div>
    `;

    content.appendChild(placeholderDiv);
    contentArea.appendChild(content);
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
