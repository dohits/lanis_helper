import { UIComponents } from '../ui/ui-components.js';
import { ITEM_CATEGORIES } from '../data/data.js';

// 아이템 선택기 베이스 클래스
export class BaseItemSelector {
  constructor(categoryId) {
    this.categoryId = categoryId;
    this.category = ITEM_CATEGORIES[categoryId];
    this.selectedItem = null;
    this.data = null;
    this.onItemSelect = null;
    this.isLoading = false;
  }

  // 아이템 아이콘 가져오기
  getItemIcon(item) {
    if (!item || !item.type) return this.category.icon;
    
    const type = item.type;
    const categories = type.split('/');
    if (categories.length < 2) return this.category.icon;
    
    const mainCategory = categories[0];
    const subCategory = categories[1];
    
    if (mainCategory === '무기' && this.categoryId === 'weapon') {
      const subCategories = this.category.subCategories;
      for (const key in subCategories) {
        if (subCategories[key].name === subCategory) {
          return subCategories[key].icon;
        }
      }
    }
    
    return this.category.icon;
  }

  // 아이템 색상 가져오기
  getItemColor() {
    return this.category.color;
  }

  // 아이템 카드 생성 (속성과 어빌리티 정보 포함)
  createItemCard(item, modal, isSelected = false) {
    const card = document.createElement('div');
    card.style.cssText = `
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      position: relative;
      overflow: hidden;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 12px;
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${this.getItemColor()}20;
      border-radius: 8px;
      flex-shrink: 0;
    `;
    icon.textContent = this.getItemIcon(item);

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    // 아이템 이름과 타입 표시
    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    `;
    
    // 무기인 경우 타입 정보 추가
    let displayName = item.name || '알 수 없는 아이템';
    if (this.categoryId === 'weapon' && item.type === '무기') {
      // 무기인 경우 weapon_type 표시
      const weaponType = item.weapon_type || '미확인';
      displayName = `${item.name} (${weaponType})`;
    } else if (this.categoryId !== 'weapon' && item.type) {
      // 방어구/장신구인 경우 type 표시
      displayName = `${item.name} (${item.type})`;
    }
    
    name.textContent = displayName;

    const stats = document.createElement('div');
    stats.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    `;
    stats.textContent = `${item.type || ''} | 위력: ${this.getPowerRange(item)} | 무게: ${this.getWeightRange(item)}`;

    info.appendChild(name);
    info.appendChild(stats);

    // 속성 정보 추가
    if (item.attributes && Array.isArray(item.attributes) && item.attributes.length > 0) {
      const attributesText = item.attributes.join(', ');
      const attributes = document.createElement('div');
      attributes.style.cssText = `
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      `;
      attributes.textContent = `속성: ${attributesText}`;
      info.appendChild(attributes);
    }

    // 어빌리티 정보 추가
    if (item.abilities && Array.isArray(item.abilities) && item.abilities.length > 0) {
      const abilitiesText = item.abilities.join(', ');
      const abilities = document.createElement('div');
      abilities.style.cssText = `
        font-size: 12px;
        color: #667eea;
        font-weight: 500;
        line-height: 1.3;
      `;
      abilities.textContent = abilitiesText;
      info.appendChild(abilities);
    }

    content.appendChild(icon);
    content.appendChild(info);

    // 선택 표시
    const checkmark = document.createElement('div');
    checkmark.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${this.getItemColor()};
      display: ${isSelected ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    `;
    checkmark.textContent = '✓';

    card.appendChild(content);
    card.appendChild(checkmark);

    // 호버 효과
    card.addEventListener('mouseenter', () => {
      if (!isSelected) {
        card.style.borderColor = this.getItemColor();
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }
    });

    card.addEventListener('mouseleave', () => {
      if (!isSelected) {
        card.style.borderColor = '#e5e7eb';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      }
    });

    // 아이템 데이터 저장
    card.setAttribute('data-item-name', item.name);
    card.itemData = item;
    card.checkmark = checkmark;

    return { card, checkmark };
  }

  // 위력 범위 가져오기
  getPowerRange(item) {
    return (item.power_min !== null && item.power_min !== undefined && item.power_max !== null && item.power_max !== undefined) 
      ? `${item.power_min}-${item.power_max}` : 'N/A';
  }

  // 무게 범위 가져오기
  getWeightRange(item) {
    return (item.weight_min !== null && item.weight_min !== undefined && item.weight_max !== null && item.weight_max !== undefined) 
      ? `${item.weight_min}-${item.weight_max}` : 'N/A';
  }

  // 아이템 선택
  selectItem(item, card, checkmark, modal) {
    // 이전 선택 해제
    if (this.selectedItem) {
      const prevCards = modal.querySelectorAll('[data-item-name]');
      prevCards.forEach(prevCard => {
        if (prevCard.getAttribute('data-item-name') === this.selectedItem.name) {
          const prevCheckmark = prevCard.querySelector('.checkmark');
          if (prevCheckmark) {
            prevCheckmark.style.opacity = '0';
            prevCheckmark.style.background = 'transparent';
          }
          prevCard.style.borderColor = '#e5e7eb';
          prevCard.style.transform = 'translateY(0)';
          prevCard.style.boxShadow = 'none';
        }
      });
    }

    // 새 선택 적용
    this.selectedItem = item;
    card.setAttribute('data-item-name', item.name);
    checkmark.style.opacity = '1';
    checkmark.style.background = this.getItemColor();
    card.style.borderColor = this.getItemColor();
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';

    // 콜백 호출
    if (this.onItemSelect) {
      this.onItemSelect([item]);
    }

    // 모달 닫기
    setTimeout(() => {
      this.closeModal(modal);
    }, 300);
  }

  // 모달 닫기
  closeModal(modal) {
    if (modal && modal.parentNode) {
      const content = modal.querySelector('div');
      modal.style.opacity = '0';
      content.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
  }

  // 선택된 아이템 가져오기
  getSelectedItems() {
    return this.selectedItem ? [this.selectedItem] : [];
  }

  // 콜백 설정
  setOnItemSelect(callback) {
    this.onItemSelect = callback;
  }

  // 데이터 설정
  setData(data) {
    this.data = data;
  }

  // 선택 초기화
  clearSelection() {
    this.selectedItem = null;
  }

  // 스켈레톤 모달 생성
  createSkeletonModal(title, description) {
    const { modal, content } = UIComponents.createModal();
    
    // 헤더
    const header = UIComponents.createModalHeader(title, '⏳', () => {
      this.closeModal(modal);
    });
    content.appendChild(header);

    // 설명
    const descriptionElement = document.createElement('p');
    descriptionElement.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    descriptionElement.textContent = description;
    content.appendChild(descriptionElement);
    
    const skeletonContainer = document.createElement('div');
    skeletonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // 스켈레톤 카드들 생성
    for (let i = 0; i < 6; i++) {
      const skeletonCard = document.createElement('div');
      skeletonCard.style.cssText = `
        height: 80px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 8px;
      `;
      skeletonContainer.appendChild(skeletonCard);
    }

    content.appendChild(skeletonContainer);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  // 에러 메시지 표시
  showErrorMessage(modal, title, message) {
    if (modal) {
      modal.innerHTML = '';
      
      const errorContainer = document.createElement('div');
      errorContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 40px 20px;
        text-align: center;
      `;

      const errorIcon = document.createElement('div');
      errorIcon.style.cssText = `
        font-size: 48px;
        color: #ef4444;
      `;
      errorIcon.textContent = '❌';

      const errorTitle = document.createElement('h3');
      errorTitle.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      `;
      errorTitle.textContent = title;

      const errorMessage = document.createElement('p');
      errorMessage.style.cssText = `
        margin: 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      `;
      errorMessage.textContent = message;

      const retryButton = UIComponents.createButton('다시 시도', 'primary');
      retryButton.addEventListener('click', () => {
        this.retryAction();
      });

      errorContainer.appendChild(errorIcon);
      errorContainer.appendChild(errorTitle);
      errorContainer.appendChild(errorMessage);
      errorContainer.appendChild(retryButton);
      modal.appendChild(errorContainer);
    }
  }

  // 재시도 액션 (하위 클래스에서 오버라이드)
  retryAction() {
    // 기본 구현은 비어있음
  }

  // 아이템 데이터 로드
  async loadItemData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (result.rareItems && result.rareItems.length > 0) {
        this.data = result.rareItems;
      } else {
        this.data = [];
      }
    } catch (error) {
      console.error('아이템 데이터 로드 중 오류:', error);
      this.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  // 데이터 로딩 완료 대기
  waitForDataLoad(skeletonModal) {
    const checkData = () => {
      if (this.data && !this.isLoading) {
        // 스켈레톤 모달 닫기
        if (skeletonModal && skeletonModal.parentNode) {
          skeletonModal.parentNode.removeChild(skeletonModal);
        }
        // 실제 모달 열기
        this.openSelectionModal();
      } else {
        setTimeout(checkData, 100);
      }
    };
    checkData();
  }

  // 선택 모달 열기 (하위 클래스에서 오버라이드)
  openSelectionModal() {
    // 기본 구현은 비어있음
  }
}
