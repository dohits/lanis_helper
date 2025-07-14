// 설정 모달 관리자
class SettingsModalManager {
  constructor() {
    this.currentModalIndex = null;
  }

  init() {
  }

  openQuickSettingsModal(index) {
    
    // 기존 모달 제거
    this.closeQuickSettingsModal();
    
    // 모달 컨테이너 생성
    const modal = document.createElement('div');
    modal.className = 'quick-settings-modal';
    
    // 모달 내용 생성
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // 헤더
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = `퀵버튼 ${index + 1} 설정`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.closeQuickSettingsModal());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 폼 생성
    const form = document.createElement('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveQuickButton();
    });
    
    // 키워드 입력
    const keywordGroup = this.createFormGroup('검색 키워드', 'text', '검색할 아이템명을 입력하세요', 'keyword');
    
    // 카테고리 선택
    const categoryGroup = this.createSelectGroup('카테고리', 'category', [
      { value: 'weapon', text: '무기' },
      { value: 'armor', text: '방어구' },
      { value: 'accessory', text: '장신구' },
      { value: 'material', text: '재료' },
      { value: 'potion', text: '포션' },
      { value: 'consumable', text: '소모품' }
    ]);
    
    // 입찰가 입력
    const bidGroup = this.createFormGroup('입찰가 (골드)', 'number', '최소 입찰가', 'bidPrice');
    
    // 즉시구매가 입력
    const buyGroup = this.createFormGroup('즉시구매가 (골드)', 'number', '최대 즉시구매가', 'buyPrice');
    
    // 위력 입력
    const powerGroup = this.createFormGroup('위력', 'number', '최소 위력', 'power');
    
    // 무게 입력
    const weightGroup = this.createFormGroup('무게', 'number', '최대 무게', 'weight');
    
    // 속성 선택
    const attributeGroup = this.createSelectGroup('속성', 'attribute', [
      { value: '', text: '선택 안함' },
      { value: '물', text: '물' },
      { value: '불', text: '불' },
      { value: '번개', text: '번개' },
      { value: '바람', text: '바람' },
      { value: '별', text: '별' },
      { value: '빛', text: '빛' },
      { value: '어둠', text: '어둠' }
    ]);
    
    // 버튼 그룹
    const actions = this.createActionButtons(index);
    
    // 폼에 모든 요소 추가
    form.appendChild(keywordGroup);
    form.appendChild(categoryGroup);
    form.appendChild(bidGroup);
    form.appendChild(buyGroup);
    form.appendChild(powerGroup);
    form.appendChild(weightGroup);
    form.appendChild(attributeGroup);
    form.appendChild(actions);
    
    // 모달에 내용 추가
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // body에 모달 추가
    document.body.appendChild(modal);
    
    // 모달 표시 애니메이션
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // 현재 모달 인덱스 저장
    this.currentModalIndex = index;
    
    // 기존 데이터 로드
    this.loadExistingData(index);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeQuickSettingsModal();
      }
    });
    
    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeQuickSettingsModal();
      }
    });
  }

  createFormGroup(labelText, inputType, placeholder, fieldName) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.className = 'form-input';
    input.type = inputType;
    input.placeholder = placeholder;
    input.setAttribute('data-field', fieldName);
    
    group.appendChild(label);
    group.appendChild(input);
    
    return group;
  }

  createSelectGroup(labelText, fieldName, options) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = labelText;
    
    const select = document.createElement('select');
    select.className = 'form-select';
    select.setAttribute('data-field', fieldName);
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      select.appendChild(optionElement);
    });
    
    group.appendChild(label);
    group.appendChild(select);
    
    return group;
  }

  createActionButtons(index) {
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.type = 'submit';
    saveBtn.textContent = '저장';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '삭제';
    deleteBtn.addEventListener('click', () => this.deleteQuickButton());
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = '취소';
    cancelBtn.addEventListener('click', () => this.closeQuickSettingsModal());
    
    actions.appendChild(saveBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(cancelBtn);
    
    return actions;
  }

  loadExistingData(index) {
    const quickButtons = window.menuManager.getQuickButtons();
    const buttonData = quickButtons[index];
    
    if (buttonData) {
      // 각 필드에 기존 데이터 설정
      const fields = ['keyword', 'category', 'bidPrice', 'buyPrice', 'power', 'weight', 'attribute'];
      fields.forEach(field => {
        const element = document.querySelector(`[data-field="${field}"]`);
        if (element && buttonData[field]) {
          element.value = buttonData[field];
        }
      });
    }
  }

  closeQuickSettingsModal() {
    const modal = document.querySelector('.quick-settings-modal');
    if (modal) {
      modal.remove();
    }
    this.currentModalIndex = null;
  }

  saveQuickButton() {
    if (this.currentModalIndex === null) return;
    
    // 폼 데이터 수집
    const formData = {};
    const fields = ['keyword', 'category', 'bidPrice', 'buyPrice', 'power', 'weight', 'attribute'];
    
    fields.forEach(field => {
      const element = document.querySelector(`[data-field="${field}"]`);
      if (element) {
        formData[field] = element.value;
      }
    });
    
    // 필수 필드 검증
    if (!formData.keyword) {
      alert('검색 키워드를 입력해주세요.');
      return;
    }
    
    // 퀵버튼 이름 설정
    formData.name = formData.keyword;
    
    // 기존 퀵버튼 데이터 가져오기
    const quickButtons = window.menuManager.getQuickButtons();
    
    // 해당 인덱스에 데이터 저장
    quickButtons[this.currentModalIndex] = formData;
    
    // 메뉴 매니저에 업데이트
    window.menuManager.updateQuickButtons(quickButtons);
    
    // 모달 닫기
    this.closeQuickSettingsModal();
    
    // 성공 메시지
    alert('퀵버튼이 저장되었습니다.');
  }

  deleteQuickButton() {
    if (this.currentModalIndex === null) return;
    
    if (!confirm('정말로 이 퀵버튼을 삭제하시겠습니까?')) {
      return;
    }
    
    // 기존 퀵버튼 데이터 가져오기
    const quickButtons = window.menuManager.getQuickButtons();
    
    // 해당 인덱스 데이터 삭제
    quickButtons[this.currentModalIndex] = null;
    
    // 메뉴 매니저에 업데이트
    window.menuManager.updateQuickButtons(quickButtons);
    
    // 모달 닫기
    this.closeQuickSettingsModal();
    
    // 성공 메시지
    alert('퀵버튼이 삭제되었습니다.');
  }

  // 공개 메서드들
  getCurrentModalIndex() {
    return this.currentModalIndex;
  }

  isModalOpen() {
    return document.querySelector('.quick-settings-modal') !== null;
  }
}

// 전역 인스턴스 생성 (개선된 버전)

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.settingsModalManager = new SettingsModalManager();
  });
} else {
  window.settingsModalManager = new SettingsModalManager();
} 