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
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로운 DOM 구조에 맞춰 감지 조건 수정
              if (node.matches && (
                // 새로 추가된 메시지 아이템인지 확인
                node.matches('li.MuiListItem-root') ||
                // 새로 추가된 메시지 목록인지 확인
                node.matches('ul.MuiList-root') ||
                // 새로 추가된 채팅 컨테이너인지 확인
                node.matches('.MuiPaper-root[class*="css-"]')
              )) {
                shouldProcess = true;
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 메시지 관련 요소들 확인
                const messageElements = node.querySelectorAll('li.MuiListItem-root, ul.MuiList-root, .MuiTypography-body2');
                if (messageElements.length > 0) {
                  shouldProcess = true;
                }
              }
            }
          });
        }
      });
      
      // 변경사항이 감지되면 사용자명 클릭 기능 처리
      if (shouldProcess) {
        setTimeout(() => {
          this.manager.processUserNames();
        }, 100); // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 처리
      }
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