import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../shared/constants.js';

// 사용자명 클릭 핸들러 모듈
class UsernameClickHandler {
  constructor() {
    this.processedElements = new Set();
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  // 사용자명에서 색상을 추출하는 함수
  extractColorFromUsername(usernameSpan) {
    try {
      // 1. 그라데이션 색상 추출 (우선순위 1)
      if (usernameSpan.style.backgroundImage && usernameSpan.style.backgroundImage.includes('linear-gradient')) {
        const match = usernameSpan.style.backgroundImage.match(/rgb\([^)]+\)/);
        if (match) {
          return match[0];
        }
        const hexMatch = usernameSpan.style.backgroundImage.match(/#[0-9a-fA-F]{6}/);
        if (hexMatch) {
          return hexMatch[0];
        }
      }
      
      // 2. 일반 색상 추출 (우선순위 2)
      if (usernameSpan.style.color) {
        return usernameSpan.style.color;
      }
      
      // 3. 기본값
      return 'currentColor';
    } catch (error) {
      return 'currentColor';
    }
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
      
      // 새로운 DOM 구조에 맞춰 사용자명 처리
      // .MuiTypography-body2 요소 내의 span[style*="font-weight: 600"] 요소들을 찾음
      const messageContainers = document.querySelectorAll('.MuiTypography-body2');
      
      messageContainers.forEach(container => {
        // 이미 처리된 컨테이너는 건너뛰기
        if (this.processedElements.has(container)) return;
        
        // font-weight: 600 스타일을 가진 span 요소들 찾기 (사용자명)
        const usernameSpans = container.querySelectorAll('span[style*="font-weight: 600"]');
        
        usernameSpans.forEach(usernameSpan => {
          // 이미 클릭 가능한 상태인지 확인
          if (usernameSpan.classList.contains('username-clickable')) return;
          
          let username = usernameSpan.textContent.trim();
          
          // 사용자 이름에서 콜론(:) 부분 제거
          if (username.includes(':')) {
            username = username.split(':')[0].trim();
          }
          
          // 사용자 이름이 있고 아직 클릭 이벤트가 없는 경우
          if (username && !usernameSpan.classList.contains('username-clickable')) {
            usernameSpan.classList.add('username-clickable');
            
            // data-username 속성 추가
            usernameSpan.setAttribute('data-username', username);
            
            // 클릭 스타일 추가 (!important 사용하여 강제 적용)
            usernameSpan.style.setProperty('cursor', 'pointer', 'important');
            
            // 모든 사용자명에 대해 색상을 추출하여 text-decoration-color 적용
            const extractedColor = this.extractColorFromUsername(usernameSpan);
            
            usernameSpan.style.setProperty('text-decoration', 'underline', 'important');
            usernameSpan.style.setProperty('text-decoration-color', extractedColor, 'important');
            usernameSpan.style.setProperty('text-decoration-thickness', '1px', 'important');
            usernameSpan.style.setProperty('text-underline-offset', '2px', 'important');
            
            // 클릭 이벤트 추가 (현재 창에서 이동)
            usernameSpan.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const profileUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(username)}`;
              window.location.href = profileUrl; // 현재 창에서 이동
            });
          }
        });
        
        // 처리 완료 표시
        this.processedElements.add(container);
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
        
        // data-username 속성 제거
        element.removeAttribute('data-username');
        
        // 모든 클릭 이벤트 리스너 제거
        const newElement = element.cloneNode(true);
        if (element.parentNode) {
          element.parentNode.replaceChild(newElement, element);
        }
        
        // 추가적으로 스타일도 제거 (pointer-events 등)
        newElement.style.pointerEvents = '';
        newElement.style.cursor = '';
        newElement.style.textDecoration = '';
        newElement.style.textDecorationColor = '';
        newElement.style.textDecorationThickness = '';
        newElement.style.textUnderlineOffset = '';
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