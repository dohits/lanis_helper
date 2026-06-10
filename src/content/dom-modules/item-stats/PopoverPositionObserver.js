// 팝오버 위치 관찰자 모듈
import { adjustPaperPosition } from './popover-position.js';

class PopoverPositionObserver {
  constructor() {
    this.observer = null;
  }

  init() {
    this.startPopoverPositionObserver();
  }

  // 팝오버 위치 관찰자 시작
  startPopoverPositionObserver() {
    // 기존 observer가 있으면 중지
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // MUI 팝오버가 추가되었는지 확인
              if (node.classList && node.classList.contains('MuiPopover-root')) {
                this.adjustPopoverPosition(node);
              } else if (node.querySelectorAll) {
                const popovers = node.querySelectorAll('.MuiPopover-root');
                popovers.forEach(popover => this.adjustPopoverPosition(popover));
              }
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 팝오버 위치 조정 (공유 유틸 사용)
  adjustPopoverPosition(popover) {
    const paper = popover.querySelector('.MuiPaper-root');
    adjustPaperPosition(paper);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export default PopoverPositionObserver; 