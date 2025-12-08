import BaseModal from '../base/base-modal.js';
import { SpecCalculatorUI } from './spec-calculator-modal/ui/spec-calculator-ui.js';

/**
 * 스펙 계산기 모달
 * BaseModal을 상속받아 일관된 모달 구조를 제공
 */
export class SpecCalculatorModal extends BaseModal {
  constructor() {
    super({
      id: 'spec-calculator-modal',
      title: '스펙 계산기',
      className: 'spec-calculator-modal',
      contentClassName: 'spec-calculator-modal-content',
      maxWidth: '800px',
      maxHeight: '90vh',
      width: '90vw',
      height: 'auto',
      closeOnOutsideClick: true,
      closeOnEsc: true
    });
    
    this.contentArea = null;
    this.specCalculatorUI = new SpecCalculatorUI();
  }

  // 모달 열기 (오버라이드)
  open() {
    super.open();
    
    // modal-body 패딩 제거
    if (this.body) {
      this.body.style.padding = '0';
    }
    
    // max-width를 800px로 설정
    if (this.content) {
      this.content.style.maxWidth = '800px';
    }
    
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 0px;
      padding: 0;
      overflow-y: auto;
      min-height: 400px;
      max-height: calc(95vh - 120px);
    `;

    // 콘텐츠 영역
    this.contentArea = document.createElement('div');
    this.contentArea.id = 'spec-calculator-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    container.appendChild(this.contentArea);

    // 스펙 계산기 UI 표시
    this.specCalculatorUI.show(this.contentArea);

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 모달 닫기
  close() {
    super.close();
  }
}

