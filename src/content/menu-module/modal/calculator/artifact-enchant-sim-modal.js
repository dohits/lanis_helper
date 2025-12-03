import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { ExpectedValueTab } from './artifact-enchant-sim-modal/ui/expected-value-tab.js';

// 유물 감정 시뮬 모달 클래스
export class ArtifactEnchantSimModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.artifactEnchantSim);
    
    this.contentArea = null;
    this.expectedValueTab = new ExpectedValueTab();
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
    this.contentArea.id = 'artifact-enchant-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    container.appendChild(this.contentArea);

    // 기댓값 탭 직접 표시
    this.expectedValueTab.show(this.contentArea);

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 모달 닫기
  close() {
    super.close();
  }
}

