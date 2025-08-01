// 공통 모달 컴포넌트
class BaseModal {
  constructor(options = {}) {
    this.options = {
      id: options.id || 'baseModal',
      title: options.title || '모달',
      className: options.className || 'base-modal',
      contentClassName: options.contentClassName || 'base-modal-content',
      width: options.width || 'auto',
      height: options.height || 'auto',
      maxWidth: options.maxWidth || '600px',
      maxHeight: options.maxHeight || '80vh',
      closeOnOutsideClick: options.closeOnOutsideClick !== false,
      closeOnEsc: options.closeOnEsc !== false,
      ...options
    };
    
    this.modal = null;
    this.content = null;
    this.isOpen = false;
  }

  // 모달 생성
  create() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector(`.${this.options.className}`);
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 컨테이너 생성
    this.modal = document.createElement('div');
    this.modal.id = this.options.id;
    this.modal.className = this.options.className;
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10020;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    // 모달 콘텐츠 생성
    this.content = document.createElement('div');
    this.content.className = this.options.contentClassName;
    this.content.style.cssText = `
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: ${this.options.width};
      height: ${this.options.height};
      max-width: ${this.options.maxWidth};
      max-height: ${this.options.maxHeight};
      min-width: 300px;
      min-height: 200px;
      transform: scale(0.9);
      transition: transform 0.3s ease;
      font-family: inherit;
    `;

    // 헤더 생성
    this.createHeader();
    
    // 본문 컨테이너 생성
    this.createBody();

    // 모달 조립
    this.content.appendChild(this.header);
    this.content.appendChild(this.body);
    this.modal.appendChild(this.content);
    document.body.appendChild(this.modal);

    // 이벤트 리스너 등록
    this.bindEvents();

    return this;
  }

  // 헤더 생성
  createHeader() {
    this.header = document.createElement('div');
    this.header.className = 'modal-header';
    this.header.style.cssText = `
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px 8px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    `;

    // 제목
    this.title = document.createElement('h3');
    this.title.textContent = this.options.title;
    this.title.style.cssText = `
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
      font-family: inherit;
    `;

    // 닫기 버튼
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'modal-close';
    this.closeButton.textContent = '×';
    this.closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      font-family: inherit;
    `;
    
    // 닫기 버튼 호버 효과
    this.closeButton.addEventListener('mouseenter', () => {
      this.closeButton.style.background = '#f3f4f6';
      this.closeButton.style.color = '#374151';
    });
    this.closeButton.addEventListener('mouseleave', () => {
      this.closeButton.style.background = 'none';
      this.closeButton.style.color = '#6b7280';
    });
    this.closeButton.addEventListener('click', () => this.close());

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
  }

  // 본문 컨테이너 생성
  createBody() {
    this.body = document.createElement('div');
    this.body.className = 'modal-body';
    this.body.style.cssText = `
      flex: 1;
      padding: 24px;
      overflow: auto;
      min-height: 0;
      background: #fff;
      font-family: inherit;
    `;
  }

  // 이벤트 바인딩
  bindEvents() {
    // ESC 키로 닫기
    if (this.options.closeOnEsc) {
      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
          document.removeEventListener('keydown', this.escHandler);
        }
      };
      document.addEventListener('keydown', this.escHandler);
    }

    // 외부 클릭으로 닫기
    if (this.options.closeOnOutsideClick) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }
  }

  // 모달 열기
  open() {
    if (!this.modal) {
      this.create();
    }
    
    this.isOpen = true;
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
      this.modal.style.opacity = '1';
      this.content.style.transform = 'scale(1)';
    });
  }

  // 모달 닫기
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    // 애니메이션
    this.modal.style.opacity = '0';
    this.content.style.transform = 'scale(0.9)';
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.content = null;
      this.isOpen = false;
    }, 300);
  }

  // 콘텐츠 설정
  setContent(content) {
    if (this.body) {
      this.body.innerHTML = '';
      if (typeof content === 'string') {
        this.body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.body.appendChild(content);
      }
    }
  }

  // 제목 설정
  setTitle(title) {
    if (this.title) {
      this.title.textContent = title;
    }
  }

  // 모달 크기 조정
  setSize(width, height) {
    if (this.content) {
      if (width) this.content.style.width = width;
      if (height) this.content.style.height = height;
    }
  }

  // 공통 버튼 스타일 생성
  createButton(text, type = 'primary', onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.type = 'button';
    
    const baseStyles = `
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-family: inherit;
      outline: none;
    `;
    
    if (type === 'primary') {
      button.style.cssText = baseStyles + `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      `;
      
      // 호버 효과
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    } else if (type === 'secondary') {
      button.style.cssText = baseStyles + `
        background: white;
        color: #6b7280;
        border: 1px solid #d1d5db;
      `;
      
      // 호버 효과
      button.addEventListener('mouseenter', () => {
        button.style.background = '#f9fafb';
        button.style.borderColor = '#9ca3af';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = 'white';
        button.style.borderColor = '#d1d5db';
      });
    }
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  // 공통 입력 필드 스타일 생성
  createInput(placeholder = '', type = 'text', required = false) {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.required = required;
    input.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
      font-family: inherit;
    `;
    
    // 포커스 효과
    input.addEventListener('focus', () => {
      input.style.borderColor = '#667eea';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#d1d5db';
    });
    
    return input;
  }

  // 공통 라벨 스타일 생성
  createLabel(text) {
    const label = document.createElement('label');
    label.textContent = text;
    label.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      font-family: inherit;
    `;
    return label;
  }

  // 스켈레톤 애니메이션 CSS 추가
  addSkeletonAnimation() {
    if (!document.querySelector('#skeleton-animation-style')) {
      const style = document.createElement('style');
      style.id = 'skeleton-animation-style';
      style.textContent = `
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export default BaseModal; 