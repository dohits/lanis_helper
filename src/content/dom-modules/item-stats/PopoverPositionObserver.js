// 팝오버 위치 관찰자 모듈
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

  // 팝오버 위치 조정
  adjustPopoverPosition(popover) {
    const paper = popover.querySelector('.MuiPaper-root');
    if (!paper) return;

    // 팝오버가 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      this.calculateAndAdjustPosition(popover, paper);
    }, 100);
  }

  // 위치 계산 및 조정
  calculateAndAdjustPosition(popover, paper) {
    const rect = paper.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = rect.left;
    let newTop = rect.top;
    let needsAdjustment = false;

    // 우측 경계 체크
    if (rect.right > viewportWidth - 20) {
      newLeft = viewportWidth - rect.width - 20;
      needsAdjustment = true;
    }

    // 좌측 경계 체크
    if (rect.left < 20) {
      newLeft = 20;
      needsAdjustment = true;
    }

    // 하단 경계 체크
    if (rect.bottom > viewportHeight - 20) {
      newTop = viewportHeight - rect.height - 20;
      needsAdjustment = true;
    }

    // 상단 경계 체크
    if (rect.top < 20) {
      newTop = 20;
      needsAdjustment = true;
    }

    // 위치 조정이 필요한 경우 (세로만)
    if (needsAdjustment) {
      // 세로 위치만 조정, 가로는 MUI가 자동으로 처리하도록 함
      if (rect.bottom > viewportHeight - 20) {
        paper.style.top = `${newTop}px`;
      }
      if (rect.top < 20) {
        paper.style.top = `${newTop}px`;
      }
    }

    // 내용이 너무 길 경우 스크롤 처리
    if (rect.height > viewportHeight - 40) {
      paper.style.maxHeight = `${viewportHeight - 40}px`;
      paper.style.overflowY = 'auto';
    }

    // 가로는 제한하지 않음 (사용자 요청에 따라)
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export default PopoverPositionObserver; 