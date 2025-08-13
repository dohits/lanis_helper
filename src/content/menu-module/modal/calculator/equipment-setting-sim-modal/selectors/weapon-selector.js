import { BaseItemSelector } from './base-item-selector.js';
import { UIComponents } from '../ui/ui-components.js';

// 무기 선택기
export class WeaponSelector extends BaseItemSelector {
  constructor() {
    super('weapon');
  }

  // 무기 선택 버튼 생성
  createWeaponButton() {
    const button = UIComponents.createButton(
      `${this.category.icon} 무기 선택`,
      'secondary'
    );
    button.addEventListener('click', () => {
      this.openWeaponSelectionModal();
    });
    return button;
  }

  // 무기 선택 모달 열기
  async openWeaponSelectionModal() {
    // 데이터가 이미 로드되어 있으면 바로 모달 열기
    if (this.data) {
      const modal = this.createWeaponSelectionModal();
      document.body.appendChild(modal);
      return;
    }

    // 스켈레톤 모달 열기
    const skeletonModal = this.createSkeletonModal('무기 선택', '무기 데이터를 불러오는 중입니다...');
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
      const modal = this.createWeaponSelectionModal();
      document.body.appendChild(modal);
    } catch (error) {
      console.error('무기 데이터 로드 중 오류:', error);
      this.showErrorMessage(skeletonModal, '데이터 로드 실패', '무기 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 선택 모달 열기 (BaseItemSelector에서 호출)
  openSelectionModal() {
    const modal = this.createWeaponSelectionModal();
    document.body.appendChild(modal);
  }

  // 무기 선택 모달 생성
  createWeaponSelectionModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '900px'
    });

    // 헤더
    const header = UIComponents.createModalHeader('무기 선택', '⚔️', () => {
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
    description.textContent = '장비 셋팅 시뮬레이션을 위한 무기를 선택해주세요.';

    // 검색 기능 (상단에 별도 배치)
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '무기 이름으로 검색...';
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
      this.filterWeapons(e.target.value, weaponGrid, modal);
    });

    searchContainer.appendChild(searchInput);

    // 무기 타입 필터
    const typeFilterContainer = document.createElement('div');
    typeFilterContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    `;

    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.textContent = '전체';
    allBtn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    `;
    allBtn.onclick = () => {
      this.selectedTypeFilter = '전체';
      this.updateTypeFilters(typeFilterContainer);
      this.filterWeapons(searchInput.value, weaponGrid, modal);
    };

    typeFilterContainer.appendChild(allBtn);

    // 무기 타입별 버튼들
    const weaponTypes = ['검', '도끼', '창', '활', '너클', '지팡이', '나이프', '미확인'];
    weaponTypes.forEach(type => {
      const typeBtn = document.createElement('button');
      typeBtn.textContent = type;
      typeBtn.style.cssText = `
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      `;
      typeBtn.onclick = () => {
        this.selectedTypeFilter = type;
        this.updateTypeFilters(typeFilterContainer);
        this.filterWeapons(searchInput.value, weaponGrid, modal);
      };
      typeFilterContainer.appendChild(typeBtn);
    });

    this.selectedTypeFilter = '전체';
    this.typeFilterContainer = typeFilterContainer;

    // 무기 그리드 (검색창과 분리)
    const weaponGrid = document.createElement('div');
    weaponGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      max-height: 60vh;
      overflow-y: auto;
    `;

    // 무기 카드들 생성
    this.createWeaponCards(weaponGrid, modal);

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(searchContainer);
    content.appendChild(typeFilterContainer);
    content.appendChild(weaponGrid);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  // 무기 카드들 생성
  createWeaponCards(container, modal) {
    const weapons = this.filterWeaponsByCategory();
    
    if (weapons.length === 0) {
      const noWeaponsDiv = document.createElement('div');
      noWeaponsDiv.style.cssText = `
        text-align: center;
        color: #6b7280;
        padding: 40px 20px;
        font-size: 14px;
      `;
      noWeaponsDiv.textContent = '무기 데이터가 없습니다.';
      container.appendChild(noWeaponsDiv);
      return;
    }

    weapons.forEach(weapon => {
      const isSelected = this.selectedItem && this.selectedItem.name === weapon.name;
      const { card, checkmark } = this.createItemCard(weapon, modal, isSelected);
      
      card.addEventListener('click', () => {
        this.selectItem(weapon, card, checkmark, modal);
      });
      
      container.appendChild(card);
    });
  }

  // 무기 타입 필터 버튼 상태 업데이트
  updateTypeFilters(container) {
    container.querySelectorAll('button').forEach(btn => {
      if (btn.textContent === this.selectedTypeFilter) {
        btn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        `;
      } else {
        btn.style.cssText = `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        `;
      }
    });
  }

  // 무기 필터링 (카테고리별)
  filterWeaponsByCategory() {
    if (!this.data) {
      return [];
    }
    
    const weapons = this.data.filter(item => {
      if (!item.type) {
        return false;
      }
      
      // item-guide와 동일한 파싱 로직 사용
      const categories = item.type.split('/');
      let mainCategory = '';
      let subCategory = '';
      
      if (categories.length >= 2) {
        mainCategory = categories[0];
        subCategory = categories[1];
      } else {
        mainCategory = categories[0];
        if (mainCategory === '무기') {
          subCategory = '미확인';
        }
      }
      
      return mainCategory === '무기';
    });
    
    return weapons;
  }

  // 무기 필터링 (검색어별)
  filterWeapons(searchTerm, container, modal) {
    const weapons = this.filterWeaponsByCategory();
    
    // 타입 필터 적용
    let filteredWeapons = weapons;
    if (this.selectedTypeFilter && this.selectedTypeFilter !== '전체') {
      filteredWeapons = weapons.filter(weapon => {
        if (!weapon.type) return false;
        
        const categories = weapon.type.split('/');
        let subCategory = '';
        
        if (categories.length >= 2) {
          subCategory = categories[1];
        } else if (categories.length === 1 && categories[0] === '무기') {
          subCategory = '미확인';
        }
        
        return subCategory === this.selectedTypeFilter;
      });
    }
    
    // 검색어 필터 적용
    filteredWeapons = filteredWeapons.filter(weapon => {
      if (!searchTerm) return true;
      return weapon.name && weapon.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // 기존 카드들 제거
    container.innerHTML = '';

    // 필터링된 무기들로 카드 재생성
    if (filteredWeapons.length === 0) {
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
      filteredWeapons.forEach(weapon => {
        const isSelected = this.selectedItem && this.selectedItem.name === weapon.name;
        const { card, checkmark } = this.createItemCard(weapon, modal, isSelected);
        
        card.addEventListener('click', () => {
          this.selectItem(weapon, card, checkmark, modal);
        });
        
        container.appendChild(card);
      });
    }
  }

  // 재시도 액션
  retryAction() {
    this.openWeaponSelectionModal();
  }
}
