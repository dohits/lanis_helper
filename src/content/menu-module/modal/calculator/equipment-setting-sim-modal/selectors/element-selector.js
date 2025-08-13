import { ELEMENTS } from '../data/data.js';
import { UIComponents } from '../ui/ui-components.js';

// 속성 선택 관리 클래스
export class ElementSelector {
  constructor() {
    this.selectedElement = null;
    this.onElementSelect = null;
  }

  // 속성 선택 버튼 생성
  createElementButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const button = UIComponents.createButton('속성 선택하기', '⚡', 'secondary', () => {
      this.openElementSelectionModal();
    });

    buttonContainer.appendChild(button);
    return buttonContainer;
  }

  // 속성 선택 모달 열기
  openElementSelectionModal() {
    const elementModal = this.createElementSelectionModal();
    document.body.appendChild(elementModal);
  }

  // 속성 선택 모달 생성
  createElementSelectionModal() {
    const { modal, content } = UIComponents.createModal();

    // 헤더
    const header = UIComponents.createModalHeader('속성 선택', '⚡', () => {
      this.closeElementSelectionModal(modal);
    });

    // 설명
    const description = document.createElement('p');
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    description.textContent = '장비 셋팅 시뮬레이션을 위한 속성을 선택해주세요.';

    // 속성 그리드
    const elementGrid = document.createElement('div');
    elementGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    `;

    ELEMENTS.forEach(element => {
      const { card, checkmark } = UIComponents.createCard(element, {
        description: `${element.name} 속성`
      });

      // 카드 참조 저장
      card.setAttribute('data-element-id', element.id);
      card.elementId = element.id;
      card.checkmark = checkmark;

      // 클릭 이벤트
      card.addEventListener('click', () => {
        this.selectElement(element.id);
        this.closeElementSelectionModal(modal);
      });

      elementGrid.appendChild(card);
    });

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(elementGrid);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeElementSelectionModal(modal);
      }
    });

    return modal;
  }

  // 속성 선택 모달 닫기
  closeElementSelectionModal(modal) {
    const content = modal.querySelector('div');
    modal.style.opacity = '0';
    content.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // 속성 선택
  selectElement(elementId) {
    // 이전 선택 해제
    if (this.selectedElement) {
      const prevCard = document.querySelector(`[data-element-id="${this.selectedElement}"]`);
      if (prevCard) {
        prevCard.style.borderColor = '#e5e7eb';
        prevCard.style.transform = 'translateY(0)';
        prevCard.style.boxShadow = 'none';
        prevCard.checkmark.style.display = 'none';
      }
    }

    // 새 선택 적용
    this.selectedElement = elementId;
    const newCard = document.querySelector(`[data-element-id="${elementId}"]`);
    if (newCard) {
      const selectedElement = ELEMENTS.find(e => e.id === elementId);
      newCard.style.borderColor = selectedElement.color;
      newCard.style.transform = 'translateY(-2px)';
      newCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      newCard.checkmark.style.display = 'flex';
    }

    // 선택된 속성 객체 가져오기
    const selectedElement = ELEMENTS.find(e => e.id === elementId);

    // 콜백 호출 (element 객체 전달)
    if (this.onElementSelect) {
      this.onElementSelect(selectedElement);
    }

    console.log(`선택된 속성: ${selectedElement.name}`);
  }

  // 정보 박스 업데이트
  updateInfoBox(elementId) {
    const elementDisplay = document.getElementById('selected-element-display');
    const elementIcon = document.querySelector('.element-info-icon');
    
    if (elementDisplay && elementIcon) {
      const selectedElement = ELEMENTS.find(e => e.id === elementId);
      if (selectedElement) {
        elementDisplay.textContent = selectedElement.name;
        elementIcon.textContent = selectedElement.icon;
        elementIcon.style.background = `${selectedElement.color}20`;
      }
    }
  }

  // 선택된 속성 정보 반환
  getSelectedElement() {
    return this.selectedElement ? ELEMENTS.find(e => e.id === this.selectedElement) : null;
  }

  // 속성 선택 콜백 설정
  setOnElementSelect(callback) {
    this.onElementSelect = callback;
  }
}
