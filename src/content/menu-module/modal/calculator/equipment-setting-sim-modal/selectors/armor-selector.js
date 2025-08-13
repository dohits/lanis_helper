import { BaseItemSelector } from './base-item-selector.js';
import { UIComponents } from '../ui/ui-components.js';

// 방어구 선택기
export class ArmorSelector extends BaseItemSelector {
  constructor() {
    super('armor');
  }

  // 방어구 선택 버튼 생성
  createArmorButton() {
    const button = UIComponents.createButton(
      `${this.category.icon} 방어구 선택`,
      'secondary'
    );
    button.addEventListener('click', () => {
      this.openArmorSelectionModal();
    });
    return button;
  }

  // 방어구 선택 모달 열기
  async openArmorSelectionModal() {
    // 데이터가 이미 로드되어 있으면 바로 모달 열기
    if (this.data) {
      const modal = this.createArmorSelectionModal();
      document.body.appendChild(modal);
      return;
    }

    // 스켈레톤 모달 열기
    const skeletonModal = this.createSkeletonModal('방어구 선택', '방어구 데이터를 불러오는 중입니다...');
    document.body.appendChild(skeletonModal);

    // 로딩 중이면 데이터 로딩 완료를 기다림
    if (this.isLoading) {
      this.waitForDataLoad(skeletonModal);
      return;
    }

    // 데이터가 로드되지 않았다면 데이터 로드
    try {
      await this.loadItemData();
      
      // 스켈레톤 모달 닫기
      if (skeletonModal && skeletonModal.parentNode) {
        skeletonModal.parentNode.removeChild(skeletonModal);
      }
      
      // 실제 모달 열기
      const modal = this.createArmorSelectionModal();
      document.body.appendChild(modal);
    } catch (error) {
      console.error('방어구 데이터 로드 중 오류:', error);
      this.showErrorMessage(skeletonModal, '데이터 로드 실패', '방어구 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 선택 모달 열기 (BaseItemSelector에서 호출)
  openSelectionModal() {
    const modal = this.createArmorSelectionModal();
    document.body.appendChild(modal);
  }

  // 방어구 선택 모달 생성
  createArmorSelectionModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '900px'
    });

    // 헤더
    const header = UIComponents.createModalHeader('방어구 선택', '🛡️', () => {
      this.closeModal(modal);
    });

    // 설명
    const description = document.createElement('p');
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    description.textContent = '장비 셋팅 시뮬레이션을 위한 방어구를 선택해주세요.';

    // 검색 기능 (상단에 별도 배치)
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '방어구 이름으로 검색...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    `;

    searchInput.addEventListener('input', (e) => {
      this.filterArmors(e.target.value, armorGrid, modal);
    });

    searchContainer.appendChild(searchInput);

    // 방어구 그리드 (검색창과 분리)
    const armorGrid = document.createElement('div');
    armorGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      max-height: 60vh;
      overflow-y: auto;
    `;

    // 방어구 카드들 생성
    this.createArmorCards(armorGrid, modal);

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(searchContainer);
    content.appendChild(armorGrid);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  // 방어구 카드들 생성
  createArmorCards(container, modal) {
    const armors = this.filterArmorsByCategory();
    
    if (armors.length === 0) {
      const noArmorsDiv = document.createElement('div');
      noArmorsDiv.style.cssText = `
        text-align: center;
        color: #6b7280;
        padding: 40px 20px;
        font-size: 14px;
      `;
      noArmorsDiv.textContent = '방어구 데이터가 없습니다.';
      container.appendChild(noArmorsDiv);
      return;
    }

    armors.forEach(armor => {
      const isSelected = this.selectedItem && this.selectedItem.name === armor.name;
      const { card, checkmark } = this.createItemCard(armor, modal, isSelected);
      
      card.addEventListener('click', () => {
        this.selectItem(armor, card, checkmark, modal);
      });
      
      container.appendChild(card);
    });
  }

  // 방어구 필터링 (카테고리별)
  filterArmorsByCategory() {
    if (!this.data) return [];
    
    return this.data.filter(item => {
      if (!item.type) return false;
      
      const categories = item.type.split('/');
      let mainCategory = '';
      
      if (categories.length >= 2) {
        mainCategory = categories[0];
      } else if (categories.length === 1) {
        mainCategory = categories[0];
      } else {
        return false;
      }
      
      return mainCategory === '방어구';
    });
  }

  // 방어구 필터링 (검색어별)
  filterArmors(searchTerm, container, modal) {
    const armors = this.filterArmorsByCategory();
    const filteredArmors = armors.filter(armor => {
      if (!searchTerm) return true;
      return armor.name && armor.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // 기존 카드들 제거
    container.innerHTML = '';

    // 필터링된 방어구들로 카드 재생성
    if (filteredArmors.length === 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.style.cssText = `
        text-align: center;
        color: #6b7280;
        padding: 40px 20px;
        font-size: 14px;
        grid-column: 1 / -1;
      `;
      noResultsDiv.textContent = '검색 결과가 없습니다.';
      container.appendChild(noResultsDiv);
    } else {
      filteredArmors.forEach(armor => {
        const isSelected = this.selectedItem && this.selectedItem.name === armor.name;
        const { card, checkmark } = this.createItemCard(armor, modal, isSelected);
        
        card.addEventListener('click', () => {
          this.selectItem(armor, card, checkmark, modal);
        });
        
        container.appendChild(card);
      });
    }
  }

  // 재시도 액션
  retryAction() {
    this.openArmorSelectionModal();
  }
}
