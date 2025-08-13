import { UI_CONSTANTS, COLOR_THEMES } from '../data/data.js';

// 스켈레톤 애니메이션 CSS 추가
const skeletonStyle = document.createElement('style');
skeletonStyle.textContent = `
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
if (!document.head.querySelector('#skeleton-animation')) {
  skeletonStyle.id = 'skeleton-animation';
  document.head.appendChild(skeletonStyle);
}

// 공통 UI 컴포넌트 클래스
export class UIComponents {
  // 모달 생성
  static createModal(options = {}) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: ${UI_CONSTANTS.MODAL_Z_INDEX};
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0, 0, 0, 0.18);
      padding: 24px;
      max-width: ${options.maxWidth || '600px'};
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    modal.appendChild(content);

    // 애니메이션 시작
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      content.style.transform = 'scale(1)';
    });

    return { modal, content };
  }

  // 모달 헤더 생성
  static createModalHeader(title, icon, onClose) {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    `;

    const titleElement = document.createElement('h2');
    titleElement.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    titleElement.innerHTML = `${icon} <span>${title}</span>`;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s ease;
    `;
    closeButton.textContent = '×';

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#f3f4f6';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'none';
    });

    if (onClose) {
      closeButton.addEventListener('click', onClose);
    }

    header.appendChild(titleElement);
    header.appendChild(closeButton);

    return header;
  }

  // 버튼 생성
  static createButton(text, icon, theme = 'primary', onClick = null) {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 24px;
      background: ${COLOR_THEMES[theme].gradient};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px ${COLOR_THEMES[theme].shadow};
    `;

    if (icon) {
      const iconElement = document.createElement('span');
      iconElement.style.cssText = 'font-size: 20px;';
      iconElement.textContent = icon;
      button.appendChild(iconElement);
    }

    const textElement = document.createElement('span');
    textElement.textContent = text;
    button.appendChild(textElement);

    // 호버 효과
    button.addEventListener('mouseenter', () => {
      button.style.transform = UI_CONSTANTS.BUTTON_HOVER_TRANSFORM;
      button.style.boxShadow = `0 6px 16px ${COLOR_THEMES[theme].hoverShadow}`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = `0 4px 12px ${COLOR_THEMES[theme].shadow}`;
    });

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  // 카드 생성
  static createCard(item, options = {}) {
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
      align-items: center;
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
      background: ${item.color}20;
      border-radius: 8px;
    `;
    icon.textContent = item.icon;

    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';

    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    `;
    name.textContent = item.name;

    const description = document.createElement('div');
    description.style.cssText = `
      font-size: 12px;
      color: #6b7280;
    `;
    description.textContent = options.description || `${item.name} 선택`;

    info.appendChild(name);
    info.appendChild(description);
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
      background: ${item.color};
      display: none;
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
      card.style.borderColor = item.color;
      card.style.transform = UI_CONSTANTS.CARD_HOVER_TRANSFORM;
      card.style.boxShadow = UI_CONSTANTS.CARD_HOVER_SHADOW;
    });

    card.addEventListener('mouseleave', () => {
      if (!options.isSelected) {
        card.style.borderColor = '#e5e7eb';
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      }
    });

    return { card, checkmark };
  }

  // 정보 박스 아이템 생성
  static createInfoItem(label, value, icon, color = '#f3f4f6') {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    `;

    const iconElement = document.createElement('div');
    iconElement.style.cssText = `
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${color};
      border-radius: 8px;
    `;
    iconElement.textContent = icon;

    const text = document.createElement('div');
    text.style.cssText = 'flex: 1;';

    const labelElement = document.createElement('div');
    labelElement.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    `;
    labelElement.textContent = label;

    const valueElement = document.createElement('div');
    valueElement.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    `;
    valueElement.textContent = value;

    text.appendChild(labelElement);
    text.appendChild(valueElement);
    item.appendChild(iconElement);
    item.appendChild(text);

    return { item, iconElement, valueElement };
  }

  // 아코디언 컴포넌트 생성
  static createAccordion(title, content, isOpen = false) {
    const accordion = document.createElement('div');
    accordion.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 12px;
      background: white;
      overflow: hidden;
    `;

    // 헤더
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;
    `;

    const titleElement = document.createElement('div');
    titleElement.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    `;
    titleElement.textContent = title;

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      font-size: 16px;
      color: #6b7280;
      transition: transform 0.2s ease;
      transform: ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
    `;
    arrow.textContent = '▼';

    header.appendChild(titleElement);
    header.appendChild(arrow);

    // 콘텐츠
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      max-height: ${isOpen ? '1000px' : '0'};
      overflow: hidden;
      transition: max-height 0.3s ease;
    `;

    const contentElement = document.createElement('div');
    contentElement.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
    `;
    contentElement.appendChild(content);

    contentWrapper.appendChild(contentElement);

    // 클릭 이벤트
    header.addEventListener('click', () => {
      const isCurrentlyOpen = contentWrapper.style.maxHeight !== '0px';
      const newHeight = isCurrentlyOpen ? '0' : '1000px';
      const newRotation = isCurrentlyOpen ? '0deg' : '180deg';
      
      contentWrapper.style.maxHeight = newHeight;
      arrow.style.transform = `rotate(${newRotation})`;
      
      // 헤더 배경색 변경
      header.style.background = isCurrentlyOpen ? '#f9fafb' : '#f3f4f6';
    });

    // 호버 효과
    header.addEventListener('mouseenter', () => {
      if (contentWrapper.style.maxHeight === '0px') {
        header.style.background = '#f3f4f6';
      }
    });

    header.addEventListener('mouseleave', () => {
      if (contentWrapper.style.maxHeight === '0px') {
        header.style.background = '#f9fafb';
      }
    });

    accordion.appendChild(header);
    accordion.appendChild(contentWrapper);

    return accordion;
  }

  // 텍스트 입력 필드 생성
  static createTextInput(label, placeholder = '', isTextarea = false, rows = 3) {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 16px;
    `;

    const labelElement = document.createElement('label');
    labelElement.style.cssText = `
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    `;
    labelElement.textContent = label;

    let inputElement;
    if (isTextarea) {
      inputElement = document.createElement('textarea');
      inputElement.rows = rows;
      inputElement.style.cssText = `
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: ${rows * 20}px;
        max-height: 200px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
      `;
    } else {
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.style.cssText = `
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
      `;
    }

    inputElement.placeholder = placeholder;

    // 포커스 효과
    inputElement.addEventListener('focus', () => {
      inputElement.style.borderColor = '#3b82f6';
      inputElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });

    inputElement.addEventListener('blur', () => {
      inputElement.style.borderColor = '#d1d5db';
      inputElement.style.boxShadow = 'none';
    });

    container.appendChild(labelElement);
    container.appendChild(inputElement);

    return { container, input: inputElement };
  }
}
