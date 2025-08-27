import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { API_ENDPOINTS, LANIS_ME_PATHS } from '../../../../shared/constants.js';

// 사용자/길드 검색 모달
class UserSearchModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.userSearch);
    this.currentTab = 'user'; // 'user' 또는 'guild'
  }

  // 모달 열기
  open() {
    super.open();
    this.createSearchForm();
  }

  // 검색 폼 생성
  createSearchForm() {
    const container = document.createElement('div');
    container.className = 'search-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 탭 생성
    const tabContainer = this.createTabs();
    container.appendChild(tabContainer);

    // 검색 폼 생성
    const searchForm = this.createSearchFormContent();
    container.appendChild(searchForm);

    // 콘텐츠 설정
    this.setContent(container);

    // 첫 번째 탭 활성화
    this.switchTab('user');
  }

  // 탭 생성
  createTabs() {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'search-tabs';
    tabContainer.style.cssText = `
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    `;

    // 유저 검색 탭
    const userTab = document.createElement('button');
    userTab.className = 'search-tab user-tab';
    userTab.textContent = '유저 검색';
    userTab.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    `;
    userTab.onclick = () => this.switchTab('user');

    // 길드 검색 탭
    const guildTab = document.createElement('button');
    guildTab.className = 'search-tab guild-tab';
    guildTab.textContent = '길드 검색';
    guildTab.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    `;
    guildTab.onclick = () => this.switchTab('guild');

    tabContainer.appendChild(userTab);
    tabContainer.appendChild(guildTab);

    return tabContainer;
  }

  // 탭 전환
  switchTab(tabType) {
    this.currentTab = tabType;
    
    // 탭 버튼 스타일 업데이트
    const userTab = this.body.querySelector('.user-tab');
    const guildTab = this.body.querySelector('.guild-tab');
    
    if (tabType === 'user') {
      userTab.style.color = '#667eea';
      userTab.style.borderBottomColor = '#667eea';
      guildTab.style.color = '#6b7280';
      guildTab.style.borderBottomColor = 'transparent';
    } else {
      guildTab.style.color = '#667eea';
      guildTab.style.borderBottomColor = '#667eea';
      userTab.style.color = '#6b7280';
      userTab.style.borderBottomColor = 'transparent';
    }

    // 검색 폼 업데이트
    this.updateSearchForm();
  }

  // 검색 폼 콘텐츠 생성
  createSearchFormContent() {
    const form = document.createElement('form');
    form.className = 'search-form';
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSearch();
    };

    // 입력 그룹
    const inputGroup = document.createElement('div');
    inputGroup.className = 'search-input-group';
    inputGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // 라벨 (동적으로 변경됨)
    const label = document.createElement('label');
    label.className = 'search-label';
    label.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      font-family: inherit;
    `;

    // 입력 필드
    const input = document.createElement('input');
    input.className = 'search-input';
    input.type = 'text';
    input.required = true;
    input.style.cssText = `
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s ease;
      outline: none;
    `;
    input.addEventListener('input', () => {
      this.validateInput(input, errorDiv);
    });

    // 에러 메시지
    const errorDiv = document.createElement('div');
    errorDiv.className = 'search-error';
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
    buttonGroup.className = 'search-buttons';
    buttonGroup.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    // 취소 버튼
    const cancelButton = this.createButton('취소', 'secondary', () => this.close());

    // 검색 버튼
    const submitButton = this.createButton('검색', 'primary');
    submitButton.type = 'submit';

    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(submitButton);

    // 폼 조립
    form.appendChild(inputGroup);
    form.appendChild(buttonGroup);

    return form;
  }

  // 검색 폼 업데이트
  updateSearchForm() {
    const label = this.body.querySelector('.search-label');
    const input = this.body.querySelector('.search-input');
    const errorDiv = this.body.querySelector('.search-error');

    if (this.currentTab === 'user') {
      label.textContent = '사용자명';
      input.placeholder = '검색할 사용자명을 입력하세요';
      input.maxLength = 6;
      errorDiv.textContent = '닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.';
    } else {
      label.textContent = '길드명';
      input.placeholder = '검색할 길드명을 입력하세요';
      input.maxLength = 10;
      errorDiv.textContent = '길드명은 영문, 숫자, 한글만 10글자까지 입력 가능합니다.';
    }

    // 입력값 초기화
    input.value = '';
    input.classList.remove('error');
    input.style.borderColor = '#d1d5db';
    errorDiv.style.display = 'none';

    // 포커스
    input.focus();
  }

  // 입력 검증
  validateInput(input, errorDiv) {
    const value = input.value.trim();
    let isValid = false;
    let maxLength = 6;

    if (this.currentTab === 'user') {
      isValid = /^[a-zA-Z0-9가-힣]{0,6}$/.test(value);
    } else {
      maxLength = 10;
      isValid = /^[a-zA-Z0-9가-힣]{0,10}$/.test(value);
    }
    
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

  // 검색 처리
  handleSearch() {
    const input = this.body.querySelector('.search-input');
    const searchTerm = input.value.trim();
    
    if (this.currentTab === 'user') {
      this.handleUserSearch(searchTerm);
    } else {
      this.handleGuildSearch(searchTerm);
    }
  }

  // 사용자 검색 처리
  handleUserSearch(username) {
    // 입력 검증
    if (!username) {
      this.showSearchError('닉네임을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]{1,6}$/.test(username)) {
      this.showSearchError('닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.');
      return;
    }
    
    if (username.length > 6) {
      this.showSearchError('닉네임은 6글자를 초과할 수 없습니다.');
      return;
    }
    
    // XSS 방지를 위한 추가 검증
    const sanitizedUsername = this.sanitizeInput(username);
    if (sanitizedUsername !== username) {
      this.showSearchError('잘못된 닉네임입니다.');
      return;
    }
    
    // URL 생성 및 이동
    const userUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(sanitizedUsername)}`;
    window.location.href = userUrl;
    
    // 모달 닫기
    this.close();
  }

  // 길드 검색 처리
  handleGuildSearch(guildName) {
    // 입력 검증
    if (!guildName) {
      this.showSearchError('길드명을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]{1,10}$/.test(guildName)) {
      this.showSearchError('길드명은 영문, 숫자, 한글만 10글자까지 입력 가능합니다.');
      return;
    }
    
    if (guildName.length > 10) {
      this.showSearchError('길드명은 10글자를 초과할 수 없습니다.');
      return;
    }
    
    // XSS 방지를 위한 추가 검증
    const sanitizedGuildName = this.sanitizeInput(guildName);
    if (sanitizedGuildName !== guildName) {
      this.showSearchError('잘못된 길드명입니다.');
      return;
    }
    
    // URL 생성 및 이동
    const guildUrl = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.GUILDS}/${encodeURIComponent(sanitizedGuildName)}`;
    window.location.href = guildUrl;
    
    // 모달 닫기
    this.close();
  }

  // 입력값 sanitize (XSS 방지)
  sanitizeInput(input) {
    // 위험한 문자 제거 (HTML 엔티티 디코딩 없이 직접 처리)
    const sanitized = input
      .replace(/[<>\"'&]/g, '') // HTML 태그 및 위험 문자 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/data:/gi, '') // data: 프로토콜 제거
      .replace(/vbscript:/gi, '') // vbscript: 프로토콜 제거
      .trim();
    
    return sanitized;
  }

  // 검색 에러 표시
  showSearchError(message) {
    const errorDiv = this.body.querySelector('.search-error');
    const input = this.body.querySelector('.search-input');
    
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
