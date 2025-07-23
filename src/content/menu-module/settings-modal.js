// 설정 모달 관리자
class SettingsModalManager {
  constructor() {
    this.currentModalIndex = null;
  }

  init() {
  }

  // openQuickSettingsModal, saveQuickButton, deleteQuickButton 등 퀵설정 관련 함수와 코드 전체 삭제

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

  createRangeGroup(labelText, minFieldName, maxFieldName, minPlaceholder, maxPlaceholder) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = labelText;
    
    const rangeContainer = document.createElement('div');
    rangeContainer.className = 'range-container';
    rangeContainer.style.display = 'flex';
    rangeContainer.style.gap = '10px';
    rangeContainer.style.alignItems = 'center';
    
    const minInput = document.createElement('input');
    minInput.className = 'form-input';
    minInput.type = 'number';
    minInput.placeholder = minPlaceholder;
    minInput.setAttribute('data-field', minFieldName);
    minInput.style.flex = '1';
    
    const rangeLabel = document.createElement('span');
    rangeLabel.textContent = '~';
    rangeLabel.style.color = '#666';
    rangeLabel.style.fontWeight = 'bold';
    
    const maxInput = document.createElement('input');
    maxInput.className = 'form-input';
    maxInput.type = 'number';
    maxInput.placeholder = maxPlaceholder;
    maxInput.setAttribute('data-field', maxFieldName);
    maxInput.style.flex = '1';
    
    rangeContainer.appendChild(minInput);
    rangeContainer.appendChild(rangeLabel);
    rangeContainer.appendChild(maxInput);
    
    group.appendChild(label);
    group.appendChild(rangeContainer);
    
    return group;
  }

  createConditionalRangeGroup(labelText, minFieldName, maxFieldName, minPlaceholder, maxPlaceholder, excludedCategory) {
    const group = document.createElement('div');
    group.className = 'form-group conditional-group';
    group.setAttribute('data-excluded-category', excludedCategory);
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = labelText;
    
    const rangeContainer = document.createElement('div');
    rangeContainer.className = 'range-container';
    rangeContainer.style.display = 'flex';
    rangeContainer.style.gap = '10px';
    rangeContainer.style.alignItems = 'center';
    
    const minInput = document.createElement('input');
    minInput.className = 'form-input';
    minInput.type = 'number';
    minInput.placeholder = minPlaceholder;
    minInput.setAttribute('data-field', minFieldName);
    minInput.style.flex = '1';
    
    const rangeLabel = document.createElement('span');
    rangeLabel.textContent = '~';
    rangeLabel.style.color = '#666';
    rangeLabel.style.fontWeight = 'bold';
    
    const maxInput = document.createElement('input');
    maxInput.className = 'form-input';
    maxInput.type = 'number';
    maxInput.placeholder = maxPlaceholder;
    maxInput.setAttribute('data-field', maxFieldName);
    maxInput.style.flex = '1';
    
    rangeContainer.appendChild(minInput);
    rangeContainer.appendChild(rangeLabel);
    rangeContainer.appendChild(maxInput);
    
    group.appendChild(label);
    group.appendChild(rangeContainer);
    
    return group;
  }

  updateConditionalFields(selectedCategory) {
    const conditionalGroups = document.querySelectorAll('.conditional-group');
    
    conditionalGroups.forEach(group => {
      const excludedCategory = group.getAttribute('data-excluded-category');
      
      if (selectedCategory === excludedCategory) {
        // 제외된 카테고리인 경우 숨김
        group.style.display = 'none';
        // 입력값도 클리어
        const inputs = group.querySelectorAll('input');
        inputs.forEach(input => {
          input.value = '';
        });
      } else {
        // 표시
        group.style.display = 'block';
      }
    });
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
      const fields = ['keyword', 'category', 'attribute'];
      fields.forEach(field => {
        const element = document.querySelector(`[data-field="${field}"]`);
        if (element && buttonData[field]) {
          element.value = buttonData[field];
        }
      });
      
      // 범위 필드 처리 (기존 단일 값 필드와 호환성 유지)
      const rangeFields = [
        { min: 'bidMin', max: 'bidMax', old: 'bidPrice' },
        { min: 'buyMin', max: 'buyMax', old: 'buyPrice' },
        { min: 'powerMin', max: 'powerMax', old: 'power' },
        { min: 'weightMin', max: 'weightMax', old: 'weight' }
      ];
      
      rangeFields.forEach(({ min, max, old }) => {
        const minElement = document.querySelector(`[data-field="${min}"]`);
        const maxElement = document.querySelector(`[data-field="${max}"]`);
        
        if (minElement && buttonData[min]) {
          minElement.value = buttonData[min];
        }
        if (maxElement && buttonData[max]) {
          maxElement.value = buttonData[max];
        }
        
        // 기존 단일 값 필드가 있다면 최소값으로 설정
        if (minElement && buttonData[old] && !buttonData[min]) {
          minElement.value = buttonData[old];
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
    const fields = ['keyword', 'category', 'attribute'];
    
    fields.forEach(field => {
      const element = document.querySelector(`[data-field="${field}"]`);
      if (element) {
        formData[field] = element.value;
      }
    });
    
    // 범위 필드 수집
    const rangeFields = [
      { min: 'bidMin', max: 'bidMax' },
      { min: 'buyMin', max: 'buyMax' },
      { min: 'powerMin', max: 'powerMax' },
      { min: 'weightMin', max: 'weightMax' }
    ];
    
    rangeFields.forEach(({ min, max }) => {
      const minElement = document.querySelector(`[data-field="${min}"]`);
      const maxElement = document.querySelector(`[data-field="${max}"]`);
      
      if (minElement && minElement.value) {
        formData[min] = minElement.value;
      }
      if (maxElement && maxElement.value) {
        formData[max] = maxElement.value;
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

// ES6 모듈로 export
export default SettingsModalManager; 