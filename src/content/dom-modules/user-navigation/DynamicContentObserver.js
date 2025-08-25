// 사용자 네비게이션용 동적 콘텐츠 관찰자 모듈
class DynamicContentObserver {
  constructor() {
    this.observer = null;
    this.manager = null;
    this.lastProcessTime = 0;
    this.processingTimeout = null;
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
          // 추가된 노드들 확인
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로운 메시지 아이템인지 확인
              if (node.matches && node.matches('li.MuiListItem-root')) {
                shouldProcess = true;
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 메시지 아이템들 확인
                const messageItems = node.querySelectorAll('li.MuiListItem-root');
                if (messageItems.length > 0) {
                  shouldProcess = true;
                }
              }
            }
          });
          
          // 제거된 노드들도 확인 (탭 전환 시)
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches('li.MuiListItem-root')) {
                shouldProcess = true;
              } else if (node.querySelectorAll) {
                const messageItems = node.querySelectorAll('li.MuiListItem-root');
                if (messageItems.length > 0) {
                  shouldProcess = true;
                }
              }
            }
          });
        }
        
        // 속성 변경도 감지 (탭 전환 시 aria-selected 등)
        if (mutation.type === 'attributes') {
          if (mutation.target.matches && (
            mutation.target.matches('button[role="tab"]') ||
            mutation.target.matches('.MuiTabs-root') ||
            mutation.target.matches('ul.MuiList-root')
          )) {
            shouldProcess = true;
          }
        }
      });
      
      // 변경사항이 감지되면 처리
      if (shouldProcess) {
        this.debounceProcessing();
      }
    });

    // 더 넓은 범위에서 관찰
    const chatContainer = document.querySelector('ul.MuiList-root');
    const tabContainer = document.querySelector('.MuiTabs-root');
    const mainContainer = document.querySelector('.MuiPaper-root[class*="css-9secm0"]');
    
    // 채팅 컨테이너 관찰
    if (chatContainer) {
      this.observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    }
    
    // 탭 컨테이너 관찰
    if (tabContainer) {
      this.observer.observe(tabContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-selected', 'class']
      });
    }
    
    // 메인 컨테이너 관찰 (전체 채팅 영역)
    if (mainContainer) {
      this.observer.observe(mainContainer, {
        childList: true,
        subtree: true
      });
    }
    
    // body도 관찰 (최후의 수단)
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 디바운싱을 통한 성능 최적화
  debounceProcessing() {
    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    
    // 이전 처리로부터 100ms 이상 지났으면 즉시 처리 (더 빠르게)
    if (timeSinceLastProcess > 100) {
      this.processWithDelay();
    } else {
      // 100ms 이내면 디바운싱 (더 빠르게)
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
      }
      this.processingTimeout = setTimeout(() => {
        this.processWithDelay();
      }, 100);
    }
  }

  // 지연 처리를 통한 DOM 완전 렌더링 보장
  processWithDelay() {
    this.lastProcessTime = Date.now();
    setTimeout(() => {
      if (this.manager && this.manager.processUserNames) {
        this.manager.processUserNames();
      }
    }, 50); // DOM이 완전히 렌더링될 시간 확보 (더 빠르게)
  }

  destroy() {
    // MutationObserver 중지
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 타임아웃 정리
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
  }
}

export default DynamicContentObserver; 