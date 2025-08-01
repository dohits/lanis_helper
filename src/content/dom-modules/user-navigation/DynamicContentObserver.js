// 사용자 네비게이션용 동적 콘텐츠 관찰자 모듈
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
    
    // MutationObserver로 DOM 변경 감지 (사용자명 클릭 기능)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로 추가된 메시지 요소인지 확인
              if (node.matches && node.matches('li[id^="message-"]')) {
                this.manager.processUserNames(); // 사용자명 클릭 기능만 처리
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 메시지들 확인
                const messageElements = node.querySelectorAll('li[id^="message-"]');
                if (messageElements.length > 0) {
                  this.manager.processUserNames(); // 사용자명 클릭 기능만 처리
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