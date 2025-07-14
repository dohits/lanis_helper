// 사용자 프로필 관리자 (구버전 방식 완전 적용)
class UserProfileManager {
  constructor() {
    this.isProcessing = false;
  }

  init() {
    this.processUserNames();
    this.startDynamicContentObserver();
  }

  processUserNames() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 구버전 방식: li 태그들을 찾아서 사용자 이름 처리
      const messageItems = document.querySelectorAll('li[id^="message-"]');
      
      messageItems.forEach(li => {
        // 이미 처리된 항목은 건너뛰기
        if (li.classList.contains('username-processed')) return;
        
        // li > div > div > p > span 구조에서 첫 번째 span이 사용자 이름
        const spans = li.querySelectorAll('p > span');
        if (spans.length >= 2) {
          const usernameSpan = spans[0];
          let username = usernameSpan.textContent.trim();
          
          // 사용자 이름에서 콜론(:) 부분 제거
          if (username.includes(':')) {
            username = username.split(':')[0].trim();
          }
          
          // 사용자 이름이 있고 아직 클릭 이벤트가 없는 경우
          if (username && !usernameSpan.classList.contains('username-clickable')) {
            usernameSpan.classList.add('username-clickable');
            
            // 구버전 방식: 클릭 이벤트 추가 (현재 창에서 이동)
            usernameSpan.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const profileUrl = `https://lanis.me/users/${encodeURIComponent(username)}`;
              window.location.href = profileUrl; // 현재 창에서 이동
            });
          }
        }
        
        // 처리 완료 표시
        li.classList.add('username-processed');
      });

    } catch (error) {
      console.error('사용자명 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  startDynamicContentObserver() {
    // 구버전 방식: MutationObserver로 새 메시지 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로 추가된 메시지 요소인지 확인
              if (node.matches && node.matches('li[id^="message-"]')) {
                this.processUserNames(); // 전체 재처리
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 메시지들 확인
                const messageElements = node.querySelectorAll('li[id^="message-"]');
                if (messageElements.length > 0) {
                  this.processUserNames(); // 전체 재처리
                }
              }
            }
          });
        }
      });
    });

    // body 전체를 관찰
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  }

  removeUserNames() {
    
    try {
      // 구버전 방식: 클릭 가능한 요소들 제거
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        element.classList.remove('username-clickable');
        // 이벤트 리스너 제거 (새로운 요소로 교체)
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
      });
      
      // 처리 완료 표시 제거
      const processedElements = document.querySelectorAll('.username-processed');
      processedElements.forEach(element => {
        element.classList.remove('username-processed');
      });
      
    } catch (error) {
      console.error('사용자명 링크 제거 중 오류:', error);
    }
  }

  processDynamicContent() {
    // 구버전과 동일: 동적 콘텐츠 처리
    this.processUserNames();
  }

  isProcessingProfiles() {
    return this.isProcessing;
  }

  getProcessedCount() {
    const processedElements = document.querySelectorAll('.username-processed');
    return processedElements.length;
  }
}

// 전역 인스턴스 생성 (개선된 버전)
console.log('UserProfileManager 클래스 정의 완료');
console.log('UserProfileManager 인스턴스 생성 시작');
console.log('현재 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료 - UserProfileManager 인스턴스 생성');
    window.userProfileManager = new UserProfileManager();
    console.log('UserProfileManager 인스턴스 생성 완료:', window.userProfileManager);
    console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
  });
} else {
  console.log('DOM 이미 로드됨 - UserProfileManager 인스턴스 즉시 생성');
  window.userProfileManager = new UserProfileManager();
  console.log('UserProfileManager 인스턴스 생성 완료:', window.userProfileManager);
  console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
} 