import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../shared/constants.js';

// 사용자명 클릭 핸들러 모듈
class UsernameClickHandler {
  constructor() {
    // 상태 관리 제거 - 단순하게 DOM 직접 처리
    // 색상 캐시 사용하지 않음 - 실시간 DOM 추출
    this.currentChannel = this.getCurrentChannel(); // 현재 채널 추적
  }

  // 현재 채널을 추출하는 함수
  getCurrentChannel() {
    try {
      // 활성화된 탭에서 채널 정보 추출
      const activeTab = document.querySelector('button[role="tab"][aria-selected="true"]');
      if (activeTab) {
        const tabText = activeTab.textContent.trim();
        return tabText || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // getUsernameKey 메서드 제거 - 색상 캐시 사용하지 않으므로 불필요

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  // extractColorFromUsername 메서드 제거 - currentColor 사용으로 불필요
  // isValidColor 메서드 제거 - currentColor 사용으로 불필요

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
      
      // 채널 변경 감지
      const newChannel = this.getCurrentChannel();
      if (this.currentChannel !== newChannel) {
        // 채널 변경 감지 (색상 캐시 사용하지 않으므로 초기화 불필요)
        this.currentChannel = newChannel;
      }
      
      // DOM 변경시 모든 사용자명 span을 완전히 재렌더링 (근본적 해결)
      this.processAllUserNames();

    } catch (error) {
      console.error('사용자명 처리 중 오류:', error);
    }
  }

  // 모든 사용자명 span을 완전히 재렌더링하는 메서드 (근본적 해결)
  processAllUserNames() {
    try {
      // 1. 기존 클릭 가능한 요소들 모두 제거
      this.removeExistingClickableElements();
      
      // 2. 모든 사용자명 span 요소들을 찾아서 처리
      const usernameSpans = document.querySelectorAll('span[style*="font-weight: 600"]');
      
      usernameSpans.forEach(usernameSpan => {
        // 사용자명 추출 (textContent 기준)
        const username = usernameSpan.textContent.trim();
        
        // 사용자명이 있는 경우에만 처리
        if (username) {
          // 각 span을 개별적으로 처리 (data-username 속성 사용하지 않음)
          this.makeUsernameClickable(usernameSpan);
        }
      });
    } catch (error) {
      console.error('모든 사용자명 처리 중 오류:', error);
    }
  }

  // 사용자명을 클릭 가능하게 만드는 메서드 (currentColor 사용)
  makeUsernameClickable(usernameSpan) {
    try {
      usernameSpan.classList.add('username-clickable');
      
      // 클릭 스타일 추가 (!important 사용하여 강제 적용)
      usernameSpan.style.setProperty('cursor', 'pointer', 'important');
      
      // 그라데이션 또는 일반 색상에 따라 동적으로 밑줄 색상 적용
      let decorationColor = 'currentColor';
      
      // 그라데이션이 있는 경우 첫 번째 색상 추출
      if (usernameSpan.style.backgroundImage && 
          usernameSpan.style.backgroundImage.includes('linear-gradient')) {
        // 그라데이션에서 첫 번째 색상 추출
        const gradientMatch = usernameSpan.style.backgroundImage.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/);
        if (gradientMatch) {
          decorationColor = gradientMatch[0].replace(/\s/g, ''); // 공백 제거
        } else {
          // hex 색상이 있는 경우
          const hexMatch = usernameSpan.style.backgroundImage.match(/#[0-9a-fA-F]{6}/);
          if (hexMatch) {
            decorationColor = hexMatch[0];
          }
        }
      }
      
      usernameSpan.style.setProperty('text-decoration', 'underline', 'important');
      usernameSpan.style.setProperty('text-decoration-color', decorationColor, 'important');
      usernameSpan.style.setProperty('text-decoration-thickness', '1px', 'important');
      usernameSpan.style.setProperty('text-underline-offset', '2px', 'important');
      
      // 클릭 이벤트 핸들러 생성 (클릭 순간에 textContent 직접 파싱)
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 클릭 순간에 textContent 직접 읽기 (가장 확실한 방법)
        const targetUsername = e.target.textContent.trim();
        const profileUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(targetUsername)}`;
        window.location.href = profileUrl; // 현재 창에서 이동
      };
      
      // 이벤트 리스너 추가
      usernameSpan.addEventListener('click', clickHandler);
      
      // 이벤트 리스너 제거를 위한 참조 저장
      usernameSpan._clickHandler = clickHandler;
    } catch (error) {
      console.error('사용자명 클릭 가능 설정 중 오류:', error);
    }
  }

  // 기존 클릭 가능한 요소들 제거
  removeExistingClickableElements() {
    try {
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        // 이벤트 리스너 제거
        if (element._clickHandler) {
          element.removeEventListener('click', element._clickHandler);
          delete element._clickHandler;
        }
        
        // 클래스 제거
        element.classList.remove('username-clickable');
        
        // data-username 속성 사용하지 않으므로 제거할 필요 없음
        
        // 스타일 제거 (DOM 구조는 유지)
        element.style.removeProperty('cursor');
        element.style.removeProperty('text-decoration');
        element.style.removeProperty('text-decoration-color');
        element.style.removeProperty('text-decoration-thickness');
        element.style.removeProperty('text-underline-offset');
        element.style.removeProperty('pointer-events');
      });
    } catch (error) {
      console.warn('기존 클릭 가능한 요소 제거 중 오류:', error);
    }
  }

  destroy() {
    try {
      // 클릭 가능한 요소들 제거
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        // 이벤트 리스너 제거
        if (element._clickHandler) {
          element.removeEventListener('click', element._clickHandler);
          delete element._clickHandler;
        }
        
        // 클래스 제거
        element.classList.remove('username-clickable');
        
        // data-username 속성 사용하지 않으므로 제거할 필요 없음
        
        // 스타일 제거 (DOM 구조는 유지)
        element.style.removeProperty('cursor');
        element.style.removeProperty('text-decoration');
        element.style.removeProperty('text-decoration-color');
        element.style.removeProperty('text-decoration-thickness');
        element.style.removeProperty('text-underline-offset');
        element.style.removeProperty('pointer-events');
      });
      
      // 색상 캐시 초기화
      // 색상 캐시 사용하지 않으므로 초기화 불필요
      
    } catch (error) {
      console.error('사용자명 링크 제거 중 오류:', error);
    }
  }

  getProcessedCount() {
    return document.querySelectorAll('.username-clickable').length;
  }
}

export default UsernameClickHandler; 