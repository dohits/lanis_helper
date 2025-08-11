import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../shared/constants.js';

// 사용자명 클릭 핸들러 모듈
class UsernameClickHandler {
  constructor() {
    this.processedElements = new Set();
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  async process() {
    try {
      // 설정 상태 확인 - 프로필 링크가 OFF면 처리하지 않음
      if (window.utils && window.utils.SettingsManager) {
        try {
          const settings = await window.utils.SettingsManager.getSettings({
            profileLink: true
          });
          
          if (!settings.profileLink) {
            // 프로필 링크가 OFF면 처리하지 않음
            return;
          }
        } catch (error) {
          // Extension context invalidated 오류를 포함한 모든 오류 처리
          if (error.message && error.message.includes('Extension context invalidated')) {
            console.warn('확장 프로그램 컨텍스트가 무효화되었습니다. 기본 설정을 사용합니다.');
            // 기본 설정으로 계속 진행
          } else {
            console.warn('프로필 링크 설정 확인 실패:', error);
            return;
          }
        }
      }
      
      // 구버전 방식: li 태그들을 찾아서 사용자 이름 처리
      const messageItems = document.querySelectorAll('li[id^="message-"]');
      
      messageItems.forEach(li => {
        // 이미 처리된 항목은 건너뛰기
        if (this.processedElements.has(li)) return;
        
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
              const profileUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(username)}`;
              window.location.href = profileUrl; // 현재 창에서 이동
            });
          }
        }
        
        // 처리 완료 표시
        this.processedElements.add(li);
      });

    } catch (error) {
      console.error('사용자명 처리 중 오류:', error);
    }
  }

  destroy() {
    try {
      // 클릭 가능한 요소들 제거
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        // 클릭 이벤트 리스너 제거
        element.classList.remove('username-clickable');
        
        // 모든 클릭 이벤트 리스너 제거
        const newElement = element.cloneNode(true);
        if (element.parentNode) {
          element.parentNode.replaceChild(newElement, element);
        }
        
        // 추가적으로 스타일도 제거 (pointer-events 등)
        newElement.style.pointerEvents = '';
        newElement.style.cursor = '';
        newElement.style.textDecoration = '';
        newElement.style.color = '';
      });
      
      // 처리된 요소 목록 초기화
      this.processedElements.clear();
      
      
      
    } catch (error) {
      console.error('사용자명 링크 제거 중 오류:', error);
    }
  }

  getProcessedCount() {
    return this.processedElements.size;
  }
}

export default UsernameClickHandler; 