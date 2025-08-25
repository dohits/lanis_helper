import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../shared/constants.js';

// 사용자명 클릭 핸들러 모듈
class UsernameClickHandler {
  constructor() {
    // 상태 관리 제거 - 단순하게 DOM 직접 처리
    this.usernameColorMap = new Map(); // 사용자명별 색상 캐시
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

  // 사용자명 + 채널을 키로 사용하는 함수
  getUsernameKey(username) {
    const channel = this.getCurrentChannel();
    return `${username}@${channel}`;
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  // 사용자명에서 색상을 추출하는 함수
  extractColorFromUsername(usernameSpan, username) {
    try {
      // 사용자명 + 채널을 키로 사용
      const usernameKey = this.getUsernameKey(username);
      
      // 1. 캐시된 색상이 있으면 사용
      if (this.usernameColorMap.has(usernameKey)) {
        return this.usernameColorMap.get(usernameKey);
      }
      
      let extractedColor = 'currentColor';
      
      // 2. 그라데이션 색상 추출 (우선순위 1)
      if (usernameSpan.style.backgroundImage && usernameSpan.style.backgroundImage.includes('linear-gradient')) {
        // 그라데이션에서 첫 번째 색상 추출
        const gradientMatch = usernameSpan.style.backgroundImage.match(/rgb\([^)]+\)/g);
        if (gradientMatch && gradientMatch.length > 0) {
          extractedColor = gradientMatch[0]; // 첫 번째 색상 사용
        } else {
          // hex 색상이 있는 경우
          const hexMatch = usernameSpan.style.backgroundImage.match(/#[0-9a-fA-F]{6}/);
          if (hexMatch) {
            extractedColor = hexMatch[0];
          }
        }
      } else if (usernameSpan.style.color) {
        // 3. 일반 색상 추출 (우선순위 2)
        extractedColor = usernameSpan.style.color;
      }
      
      // 4. 추출된 색상을 캐시에 저장 (사용자명 + 채널 키 사용)
      this.usernameColorMap.set(usernameKey, extractedColor);
      
      return extractedColor;
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
      
      // 채널 변경 감지
      const newChannel = this.getCurrentChannel();
      if (this.currentChannel !== newChannel) {
        // 채널이 변경되면 색상 캐시 초기화
        this.usernameColorMap.clear();
        this.currentChannel = newChannel;
        console.log(`채널 변경 감지: ${this.currentChannel} → ${newChannel}`);
      }
      
      // 기존 클릭 가능한 요소들 모두 제거 (깨끗한 상태로 시작)
      this.removeExistingClickableElements();
      
      // 모든 사용자명 span 요소들을 찾아서 처리
      const usernameSpans = document.querySelectorAll('span[style*="font-weight: 600"]');
      
      usernameSpans.forEach(usernameSpan => {
        // 이미 클릭 가능한 상태인지 확인
        if (usernameSpan.classList.contains('username-clickable')) return;
        
        // 사용자명 추출 (텍스트 그대로 사용)
        const username = usernameSpan.textContent.trim();
        
        // 사용자명이 있고 아직 클릭 이벤트가 없는 경우
        if (username && !usernameSpan.classList.contains('username-clickable')) {
          usernameSpan.classList.add('username-clickable');
          
          // 클릭 스타일 추가 (!important 사용하여 강제 적용)
          usernameSpan.style.setProperty('cursor', 'pointer', 'important');
          
          // 모든 사용자명에 대해 색상을 추출하여 text-decoration-color 적용
          const extractedColor = this.extractColorFromUsername(usernameSpan, username);
          
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

    } catch (error) {
      console.error('사용자명 처리 중 오류:', error);
    }
  }

  // 기존 클릭 가능한 요소들 제거
  removeExistingClickableElements() {
    try {
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        // 클릭 이벤트 리스너 제거 (이벤트 리스너는 자동으로 정리됨)
        element.classList.remove('username-clickable');
        
        // 스타일만 제거 (DOM 구조는 유지)
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
        // 클릭 이벤트 리스너 제거 (이벤트 리스너는 자동으로 정리됨)
        element.classList.remove('username-clickable');
        
        // 스타일만 제거 (DOM 구조는 유지)
        element.style.removeProperty('cursor');
        element.style.removeProperty('text-decoration');
        element.style.removeProperty('text-decoration-color');
        element.style.removeProperty('text-decoration-thickness');
        element.style.removeProperty('text-underline-offset');
        element.style.removeProperty('pointer-events');
      });
      
      // 색상 캐시 초기화
      this.usernameColorMap.clear();
      
    } catch (error) {
      console.error('사용자명 링크 제거 중 오류:', error);
    }
  }

  getProcessedCount() {
    return document.querySelectorAll('.username-clickable').length;
  }
}

export default UsernameClickHandler; 