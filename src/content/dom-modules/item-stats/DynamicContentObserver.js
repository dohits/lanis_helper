// 동적 콘텐츠 관찰자 모듈
class DynamicContentObserver {
  constructor() {
    this.observer = null;
    this.manager = null;
  }

  init(manager) {
    this.manager = manager;
    this.startDynamicContentDetection();
  }

  // 동적 감지(아이템 목록 변화 감지)
  startDynamicContentDetection() {
    // 기존 observer가 있으면 중지
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      let shouldProcessItems = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로운 DOM 구조에 맞춰 더 유연한 선택자 사용
              if (node.querySelector && (
                node.querySelector('p.MuiTypography-body2') ||
                node.querySelector('.MuiPopover-paper') ||
                node.querySelector('.MuiBox-root.css-38zrbw')
              )) {
                shouldProcessItems = true;
              }
            }
          });
        }
      });
      
      if (shouldProcessItems && this.manager.settings.showItemStats) {
        setTimeout(() => {
          this.manager.processItemStats();
        }, 100);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.manager = null;
  }
}

export default DynamicContentObserver; 