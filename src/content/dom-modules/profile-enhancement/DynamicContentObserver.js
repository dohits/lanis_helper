// 프로필 강화용 동적 콘텐츠 관찰자 모듈
class DynamicContentObserver {
  constructor() {
    this.observer = null;
    this.manager = null;
  }

  init(manager) {
    this.manager = manager;
    this.startDynamicContentObserver();
  }

  startDynamicContentObserver() {
    // 기존 observer가 있으면 중지
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // MutationObserver로 DOM 변경 감지 (프로필 강화 기능)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 사용자 프로필 DOM 감지
              if (node.matches && node.matches('.MuiBox-root.css-zwlyuw')) {
                this.manager.processProfileEnhancement(); // 프로필 강화 기능만 처리
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 프로필 컨테이너들 확인
                const profileContainers = node.querySelectorAll('.MuiBox-root.css-zwlyuw');
                if (profileContainers.length > 0) {
                  // 프로필이 감지되면 프로필 강화 기능만 처리
                  this.manager.processProfileEnhancement();
                }
              }
            }
          });
        }
      });
    });

    // body 전체를 관찰
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  destroy() {
    // MutationObserver 중지
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export default DynamicContentObserver; 