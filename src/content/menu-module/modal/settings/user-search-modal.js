import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../../shared/constants.js';

// 사용자 검색 모달
class UserSearchModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.userSearch);
  }

  // 모달 열기
  open() {
    super.open();
    this.createSearchForm();
  }

  // 검색 폼 생성
  createSearchForm() {
    const form = document.createElement('form');
    form.className = 'user-search-form';
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleUserSearch();
    };

    // 입력 그룹
    const inputGroup = document.createElement('div');
    inputGroup.className = 'user-search-input-group';
    inputGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // 라벨 생성 (BaseModal의 공통 메서드 사용)
    const label = this.createLabel('사용자명');

    // 입력 필드 생성 (BaseModal의 공통 메서드 사용)
    const input = this.createInput('검색할 사용자명을 입력하세요', 'text', true);
    input.className = 'user-search-input';
    input.maxLength = 6;

    // 에러 메시지
    const errorDiv = document.createElement('div');
    errorDiv.className = 'user-search-error';
    errorDiv.textContent = '닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.';
    errorDiv.style.cssText = `
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
      display: none;
      font-family: inherit;
    `;

    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    inputGroup.appendChild(errorDiv);

    // 버튼 그룹
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'user-search-buttons';
    buttonGroup.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    // 취소 버튼 (BaseModal의 공통 메서드 사용)
    const cancelButton = this.createButton('취소', 'secondary', () => this.close());

    // 검색 버튼 (BaseModal의 공통 메서드 사용)
    const submitButton = this.createButton('검색', 'primary');
    submitButton.type = 'submit';

    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(submitButton);

    // 폼 조립
    form.appendChild(inputGroup);
    form.appendChild(buttonGroup);

    // 콘텐츠 설정
    this.setContent(form);

    // 입력 필드에 포커스
    input.focus();

    // 입력 검증 이벤트
    input.addEventListener('input', () => {
      this.validateUserInput(input, errorDiv);
    });
  }

  // 사용자 입력 검증
  validateUserInput(input, errorDiv) {
    const value = input.value.trim();
    const isValid = /^[a-zA-Z0-9가-힣]{1,6}$/.test(value);
    
    if (value && !isValid) {
      input.classList.add('error');
      input.style.borderColor = '#f44336';
      errorDiv.style.display = 'block';
    } else {
      input.classList.remove('error');
      input.style.borderColor = value ? '#667eea' : '#d1d5db';
      errorDiv.style.display = 'none';
    }
  }

  // 사용자 검색 처리
  handleUserSearch() {
    const input = this.body.querySelector('.user-search-input');
    const username = input.value.trim();
    
    // 입력 검증
    if (!username) {
      this.showUserSearchError('닉네임을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]{1,6}$/.test(username)) {
      this.showUserSearchError('닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.');
      return;
    }
    
    if (username.length > 6) {
      this.showUserSearchError('닉네임은 6글자를 초과할 수 없습니다.');
      return;
    }
    
    // XSS 방지를 위한 추가 검증
    const sanitizedUsername = this.sanitizeUsername(username);
    if (sanitizedUsername !== username) {
      this.showUserSearchError('잘못된 닉네임입니다.');
      return;
    }
    
    // URL 생성 및 이동
            const userUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(sanitizedUsername)}`;
    
    // 현재 페이지에서 이동
    window.location.href = userUrl;
    
    // 모달 닫기
    this.close();
  }

  // 사용자명 sanitize (XSS 방지)
  sanitizeUsername(username) {
    // 위험한 문자 제거 (HTML 엔티티 디코딩 없이 직접 처리)
    const sanitized = username
      .replace(/[<>\"'&]/g, '') // HTML 태그 및 위험 문자 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/data:/gi, '') // data: 프로토콜 제거
      .replace(/vbscript:/gi, '') // vbscript: 프로토콜 제거
      .trim();
    
    return sanitized;
  }

  // 사용자 검색 에러 표시
  showUserSearchError(message) {
    const errorDiv = this.body.querySelector('.user-search-error');
    const input = this.body.querySelector('.user-search-input');
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    input.classList.add('error');
    input.style.borderColor = '#f44336';
    input.focus();
    
    // 3초 후 에러 메시지 숨기기
    setTimeout(() => {
      errorDiv.style.display = 'none';
      input.classList.remove('error');
      input.style.borderColor = input.value ? '#667eea' : '#d1d5db';
    }, 3000);
  }
}

export default UserSearchModal; 