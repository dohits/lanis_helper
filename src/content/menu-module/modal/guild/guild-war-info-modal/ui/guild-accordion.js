// 길드 모달 전용 아코디언 컴포넌트
class GuildAccordion {
  createAccordion(title, content, isOpen = false) {
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
      max-height: ${isOpen ? 'none' : '0'};
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
      
      if (isCurrentlyOpen) {
        // 닫기
        contentWrapper.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
        header.style.background = '#f9fafb';
      } else {
        // 열기 - 실제 높이를 계산하여 설정
        contentWrapper.style.maxHeight = 'none';
        const actualHeight = contentWrapper.scrollHeight;
        contentWrapper.style.maxHeight = actualHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
        header.style.background = '#f3f4f6';
        
        // 트랜지션이 끝나면 max-height를 none으로 설정하여 내용이 잘리지 않도록 함
        setTimeout(() => {
          if (contentWrapper.style.maxHeight !== '0px') {
            contentWrapper.style.maxHeight = 'none';
          }
        }, 300);
      }
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
}

export { GuildAccordion };


