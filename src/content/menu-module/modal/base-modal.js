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
      min-width: 320px;
      min-height: 200px;
      transform: scale(0.9);
      transition: transform 0.3s ease;
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
    `;

    // 제목
    this.title = document.createElement('h3');
    this.title.textContent = this.options.title;
    this.title.style.cssText = `
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
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
    `;
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
      flex: 1 1 0;
      padding: 24px;
      overflow: auto;
      min-height: 0;
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
}

export default BaseModal; 