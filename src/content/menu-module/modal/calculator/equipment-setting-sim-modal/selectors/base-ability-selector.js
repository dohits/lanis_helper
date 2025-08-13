import { UIComponents } from '../ui/ui-components.js';
import { ABILITY_MAPPINGS } from '../data/data.js';

// 어빌리티 선택기 베이스 클래스
export class BaseAbilitySelector {
  constructor() {
    this.selectedAbility = null;
    this.data = null;
    this.onAbilitySelect = null;
    this.isLoading = false;
  }

  // 직업별 어빌리티 아이콘 매핑
  getAbilityIcon(job) {
    return ABILITY_MAPPINGS.iconMap[job] || '💫';
  }

  // 직업별 어빌리티 색상 매핑
  getAbilityColor(job) {
    return ABILITY_MAPPINGS.colorMap[job] || '#6b7280';
  }

  // 어빌리티 카드 생성 (공통)
  createAbilityCard(ability, modal, isSelected = false) {
    const card = document.createElement('div');
    card.style.cssText = `
      border: 2px solid ${isSelected ? this.getAbilityColor(ability['직업']) : '#e5e7eb'};
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      position: relative;
      overflow: hidden;
      ${isSelected ? 'transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);' : ''}
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
      background: ${this.getAbilityColor(ability['직업'])}20;
      border-radius: 8px;
      flex-shrink: 0;
    `;
    icon.textContent = this.getAbilityIcon(ability['직업']);

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    `;
    name.textContent = ability['어빌리티명'];

    const job = document.createElement('div');
    job.style.cssText = `
      font-size: 12px;
      color: ${this.getAbilityColor(ability['직업'])};
      font-weight: 500;
      margin-bottom: 8px;
    `;
    job.textContent = `${ability['직업']}${ability['전직'] ? ` (${ability['전직']})` : ''}`;

    const effect = document.createElement('div');
    effect.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 4px;
    `;
    effect.textContent = ability['효과'];

    const weaponEffect = document.createElement('div');
    weaponEffect.style.cssText = `
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
    `;
    weaponEffect.textContent = ability['무기 타입 효과'] || '';

    info.appendChild(name);
    info.appendChild(job);
    info.appendChild(effect);
    if (ability['무기 타입 효과']) {
      info.appendChild(weaponEffect);
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
      background: ${this.getAbilityColor(ability['직업'])};
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
        card.style.borderColor = this.getAbilityColor(ability['직업']);
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

    // 카드 참조 저장
    card.setAttribute('data-ability-id', ability['어빌리티명']);
    card.abilityId = ability['어빌리티명'];
    card.checkmark = checkmark;

    return card;
  }

  // 어빌리티 검색 필터링 (공통)
  filterAbilities(searchTerm, container, abilities, modal) {
    if (!abilities) return;

    let filteredData = abilities;

    // 검색어 필터 적용
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(ability => {
        return ability['어빌리티명'].toLowerCase().includes(searchLower) ||
               ability['효과'].toLowerCase().includes(searchLower) ||
               (ability['무기 타입 효과'] && ability['무기 타입 효과'].toLowerCase().includes(searchLower));
      });
    }

    container.innerHTML = '';
    
    if (filteredData.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #666;
      `;
      noDataDiv.textContent = '검색 결과가 없습니다.';
      container.appendChild(noDataDiv);
      return;
    }

    filteredData.forEach(ability => {
      const isSelected = this.selectedAbility === ability['어빌리티명'];
      const card = this.createAbilityCard(ability, modal, isSelected);
      
      // 클릭 이벤트
      card.addEventListener('click', () => {
        this.selectAbility(ability['어빌리티명'], card, card.checkmark, modal);
      });
      
      container.appendChild(card);
    });
  }

  // 어빌리티 선택 (공통)
  selectAbility(abilityId, card, checkmark, modal) {
    // 이전 선택 해제
    if (this.selectedAbility) {
      const prevCard = document.querySelector(`[data-ability-id="${this.selectedAbility}"]`);
      if (prevCard) {
        prevCard.style.borderColor = '#e5e7eb';
        prevCard.style.transform = 'translateY(0)';
        prevCard.style.boxShadow = 'none';
        prevCard.checkmark.style.display = 'none';
      }
    }

    // 새 선택 적용
    this.selectedAbility = abilityId;
    const ability = this.data.find(a => a['어빌리티명'] === abilityId);
    card.style.borderColor = this.getAbilityColor(ability['직업']);
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    checkmark.style.display = 'flex';

    // 콜백 호출 (ability 객체 전달)
    if (this.onAbilitySelect) {
      this.onAbilitySelect([ability]);
    }

    console.log(`선택된 어빌리티: ${ability['어빌리티명']}`);

    // 모달 닫기
    this.closeModal(modal);
  }

  // 모달 닫기 (공통)
  closeModal(modal) {
    const content = modal.querySelector('div');
    modal.style.opacity = '0';
    content.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // 선택된 어빌리티 정보 반환 (공통)
  getSelectedAbilities() {
    if (!this.selectedAbility) return [];
    const ability = this.data.find(ability => ability['어빌리티명'] === this.selectedAbility);
    return ability ? [ability] : [];
  }

  // 어빌리티 선택 콜백 설정 (공통)
  setOnAbilitySelect(callback) {
    this.onAbilitySelect = callback;
  }

  // 데이터 설정 (공통)
  setData(data) {
    this.data = data;
  }

  // 선택된 어빌리티 초기화 (공통)
  clearSelection() {
    this.selectedAbility = null;
  }

  // 스켈레톤 모달 생성 (공통)
  createSkeletonModal(title, description) {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '900px'
    });

    // 헤더
    const header = UIComponents.createModalHeader(title, '💫', () => {
      this.closeModal(modal);
    });

    // 설명
    const descElement = document.createElement('p');
    descElement.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    descElement.textContent = description;

    // 스켈레톤 검색 바
    const searchSkeleton = document.createElement('div');
    searchSkeleton.style.cssText = `
      width: 100%;
      height: 48px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 8px;
      margin-bottom: 20px;
      animation: shimmer 1.5s infinite;
    `;

    // 스켈레톤 카드들
    const cardSkeleton = document.createElement('div');
    cardSkeleton.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    `;

    for (let i = 0; i < 6; i++) {
      const card = document.createElement('div');
      card.style.cssText = `
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        background: white;
      `;

      const cardContent = document.createElement('div');
      cardContent.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
      `;

      // 스켈레톤 아이콘
      const iconSkeleton = document.createElement('div');
      iconSkeleton.style.cssText = `
        width: 40px;
        height: 40px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: shimmer 1.5s infinite;
        animation-delay: ${i * 0.1}s;
        flex-shrink: 0;
      `;

      // 스켈레톤 텍스트들
      const textSkeleton = document.createElement('div');
      textSkeleton.style.cssText = 'flex: 1;';

      const titleSkeleton = document.createElement('div');
      titleSkeleton.style.cssText = `
        width: 80%;
        height: 20px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 8px;
        animation: shimmer 1.5s infinite;
        animation-delay: ${i * 0.1}s;
      `;

      const subtitleSkeleton = document.createElement('div');
      subtitleSkeleton.style.cssText = `
        width: 60%;
        height: 16px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 8px;
        animation: shimmer 1.5s infinite;
        animation-delay: ${i * 0.1 + 0.1}s;
      `;

      const contentSkeleton = document.createElement('div');
      contentSkeleton.style.cssText = `
        width: 100%;
        height: 32px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: shimmer 1.5s infinite;
        animation-delay: ${i * 0.1 + 0.2}s;
      `;

      textSkeleton.appendChild(titleSkeleton);
      textSkeleton.appendChild(subtitleSkeleton);
      textSkeleton.appendChild(contentSkeleton);
      cardContent.appendChild(iconSkeleton);
      cardContent.appendChild(textSkeleton);
      card.appendChild(cardContent);
      cardSkeleton.appendChild(card);
    }

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);

    content.appendChild(header);
    content.appendChild(descElement);
    content.appendChild(searchSkeleton);
    content.appendChild(cardSkeleton);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  // 에러 메시지 표시 (공통)
  showErrorMessage(modal, title, message) {
    const content = modal.querySelector('div');
    content.innerHTML = '';

    const header = UIComponents.createModalHeader(title, '💫', () => {
      this.closeModal(modal);
    });

    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    `;

    const errorIcon = document.createElement('div');
    errorIcon.style.cssText = `
      font-size: 48px;
      margin-bottom: 20px;
    `;
    errorIcon.textContent = '❌';

    const errorTitle = document.createElement('h3');
    errorTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #dc2626;
    `;
    errorTitle.textContent = '데이터 로드 실패';

    const errorDescription = document.createElement('p');
    errorDescription.style.cssText = `
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    errorDescription.textContent = message;

    const retryButton = document.createElement('button');
    retryButton.style.cssText = `
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s ease;
    `;
    retryButton.textContent = '다시 시도';
    retryButton.onclick = () => {
      this.closeModal(modal);
      this.retryAction();
    };

    errorMessage.appendChild(errorIcon);
    errorMessage.appendChild(errorTitle);
    errorMessage.appendChild(errorDescription);
    errorMessage.appendChild(retryButton);

    content.appendChild(header);
    content.appendChild(errorMessage);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
  }

  // 재시도 액션 (하위 클래스에서 오버라이드)
  retryAction() {
    // 기본 구현은 아무것도 하지 않음
  }
}
