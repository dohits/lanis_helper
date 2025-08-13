// 닉네임 체커 DOM 모듈
export class NicknameChecker {
  constructor() {
    this.nickname = null;
    this.isInitialized = false;
    this.observer = null;
  }

  /**
   * 닉네임 체커 초기화
   */
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    this.startObserving();
    
    // 초기 검사
    this.checkNickname();
  }

  /**
   * DOM 변경 감지 시작
   */
  startObserving() {
    // 이미 저장된 닉네임이 있으면 감지 중단
    if (this.getStoredNickname()) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.checkNickname();
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 닉네임 감지 및 저장
   */
  checkNickname() {
    // 이미 저장된 닉네임이 있으면 중단
    if (this.getStoredNickname()) {
      return;
    }

    try {
      // 헤더에서 닉네임 요소 찾기
      const nicknameElement = this.findNicknameElement();
      
      if (nicknameElement) {
        const nickname = nicknameElement.textContent.trim();
        
        if (nickname && nickname.length > 0) {
          this.saveNickname(nickname);
          this.stopObserving();
          console.log('[NicknameChecker] 닉네임 감지 및 저장 완료:', nickname);
        }
      }
    } catch (error) {
      console.error('[NicknameChecker] 닉네임 감지 중 오류:', error);
    }
  }

  /**
   * 닉네임 요소 찾기
   * @returns {HTMLElement|null} 닉네임 요소
   */
  findNicknameElement() {
    // 헤더(header) 태그 내에서만 닉네임 찾기
    const header = document.querySelector('header');
    if (!header) {
      console.log('[NicknameChecker] 헤더를 찾을 수 없습니다.');
      return null;
    }

    // 더 구체적인 선택자로 헤더 내의 닉네임 요소 찾기
    const selectors = [
      '.MuiBox-root .MuiTypography-root', // 헤더 내 박스의 Typography
      'header .MuiTypography-root',       // 헤더 내 Typography
      '.css-1mujnce .MuiTypography-root'  // 로고 옆의 Typography (구체적인 클래스)
    ];

    for (const selector of selectors) {
      const elements = header.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.textContent.trim();
        
        // 닉네임 패턴 확인 (한글 + 님, 영문 등)
        if (this.isValidNickname(text)) {
          console.log('[NicknameChecker] 헤더에서 닉네임 발견:', text);
          return element;
        }
      }
    }

    console.log('[NicknameChecker] 헤더에서 유효한 닉네임을 찾을 수 없습니다.');
    return null;
  }

  /**
   * 유효한 닉네임인지 확인
   * @param {string} text - 확인할 텍스트
   * @returns {boolean} 유효한 닉네임 여부
   */
  isValidNickname(text) {
    if (!text || text.length === 0) return false;
    
    // 로고나 버튼 텍스트 제외
    const excludePatterns = [
      '전투', '마을', '캐릭', '설정', '로그아웃',
      'battle', 'village', 'character', 'settings', 'logout'
    ];
    
    for (const pattern of excludePatterns) {
      if (text.includes(pattern)) return false;
    }
    
    // 닉네임 패턴 확인 (더 엄격하게)
    const nicknamePatterns = [
      /^[가-힣]{2,10}님$/, // 한글 + 님 (예: 도히님)
      /^[가-힣]{2,10}$/,   // 한글만 (2-10자)
      /^[a-zA-Z0-9가-힣]{2,15}$/ // 영문+숫자+한글 (2-15자)
    ];
    
    const isValid = nicknamePatterns.some(pattern => pattern.test(text));
    
    // 추가 검증: 너무 짧거나 긴 경우 제외
    if (text.length < 2 || text.length > 15) return false;
    
    return isValid;
  }

  /**
   * 닉네임을 세션 스토리지에 저장
   * @param {string} nickname - 저장할 닉네임
   */
  saveNickname(nickname) {
    try {
      sessionStorage.setItem('lanis_user_nickname', nickname);
      this.nickname = nickname;
      
      // 저장 완료 이벤트 발생
      const event = new CustomEvent('nicknameSaved', {
        detail: { nickname: nickname }
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('[NicknameChecker] 닉네임 저장 중 오류:', error);
    }
  }

  /**
   * 저장된 닉네임 가져오기
   * @returns {string|null} 저장된 닉네임
   */
  getStoredNickname() {
    try {
      return sessionStorage.getItem('lanis_user_nickname');
    } catch (error) {
      console.error('[NicknameChecker] 저장된 닉네임 가져오기 중 오류:', error);
      return null;
    }
  }

  /**
   * 현재 감지된 닉네임 가져오기
   * @returns {string|null} 현재 닉네임
   */
  getCurrentNickname() {
    return this.nickname || this.getStoredNickname();
  }

  /**
   * DOM 감지 중단
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 닉네임 체커 정리
   */
  destroy() {
    this.stopObserving();
    this.isInitialized = false;
  }
}
