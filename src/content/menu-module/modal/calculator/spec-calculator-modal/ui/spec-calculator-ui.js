import { SpecCalculator } from '../data/spec-calculator.js';
import { ELEMENT_NAMES } from '../data/attribute-calculator.js';
import { StorageManager } from '../data/storage-manager.js';

/**
 * 스펙 계산기 UI 컴포넌트
 * artifact-enchant-sim-modal 스타일을 참고하여 제작
 */
export class SpecCalculatorUI {
  constructor() {
    this.calculator = new SpecCalculator();
    this.inputData = {};
    this.result = null;
  }

  show(contentArea) {
    contentArea.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = `
      min-height: 100%;
      background: linear-gradient(to bottom right, #0f172a, #581c87, #0f172a);
      padding: 8px;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      padding: 16px;
      border: 1px solid rgba(168, 85, 247, 0.2);
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    `;

    // 저장/불러오기 버튼
    card.appendChild(this.createStorageButtons());
    
    // 입력 섹션들
    card.appendChild(this.createEquipmentSection());
    card.appendChild(this.createCharacterSection());
    card.appendChild(this.createStatSection());
    card.appendChild(this.createEnemyStatSection());
    card.appendChild(this.createReleaseOptionSection());
    
    // 계산 버튼
    card.appendChild(this.createCalculateButton());
    
    // 결과 표시 영역
    card.appendChild(this.createResultArea());

    container.appendChild(card);
    contentArea.appendChild(container);
  }

  // 장비 입력 섹션
  createEquipmentSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '📦 장비 정보';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    `;

    // 무기
    grid.appendChild(this.createInputGroup('무기 위력', 'weaponPower', 'number'));
    grid.appendChild(this.createInputGroup('무기 무게', 'weaponWeight', 'number'));
    grid.appendChild(this.createElementSelector('무기 속성', 'weaponElement'));

    // 방어구
    grid.appendChild(this.createInputGroup('방어구 위력', 'armorPower', 'number'));
    grid.appendChild(this.createInputGroup('방어구 무게', 'armorWeight', 'number'));
    grid.appendChild(this.createElementSelector('방어구 속성', 'armorElement'));

    // 장신구
    grid.appendChild(this.createInputGroup('장신구 위력', 'accessoryPower', 'number'));
    grid.appendChild(this.createInputGroup('장신구 무게', 'accessoryWeight', 'number'));
    grid.appendChild(this.createElementSelector('장신구 속성', 'accessoryElement'));

    section.appendChild(grid);
    return section;
  }

  // 캐릭터 및 환경 섹션
  createCharacterSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '👤 캐릭터 및 환경';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    `;

    grid.appendChild(this.createElementSelector('캐릭터 속성', 'characterElement'));
    grid.appendChild(this.createElementSelector('마을 속성', 'townElement'));

    section.appendChild(grid);
    return section;
  }

  // 스탯 입력 섹션
  createStatSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '📊 캐릭터 스탯';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    `;

    grid.appendChild(this.createInputGroup('힘', 'strength', 'number'));
    grid.appendChild(this.createInputGroup('생명', 'vitality', 'number'));
    grid.appendChild(this.createInputGroup('정신', 'spirit', 'number'));
    grid.appendChild(this.createInputGroup('지능', 'intelligence', 'number'));
    grid.appendChild(this.createInputGroup('행운', 'luck', 'number'));
    grid.appendChild(this.createInputGroup('속도', 'speed', 'number'));

    section.appendChild(grid);
    return section;
  }

  // 상대 스펙 입력 섹션
  createEnemyStatSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '🎯 상대 스펙';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    `;

    grid.appendChild(this.createInputGroup('상대 방어력', 'enemyDefense', 'number', '0'));
    grid.appendChild(this.createInputGroup('상대 마법방어력', 'enemyMagicDefense', 'number', '0'));

    section.appendChild(grid);
    return section;
  }

  // 해방 옵션 섹션
  createReleaseOptionSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '✨ 해방 옵션';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    `;

    // 스탯 해방 옵션
    grid.appendChild(this.createInputGroup('힘 + %', 'strengthRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('생명 + %', 'vitalityRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('정신 + %', 'spiritRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('지능 + %', 'intelligenceRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('행운 + %', 'luckRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('속도 + %', 'speedRelease', 'number', '0'));

    // 장비 위력 해방 옵션
    grid.appendChild(this.createInputGroup('무기 위력 + %', 'weaponPowerRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('방어구 위력 + %', 'armorPowerRelease', 'number', '0'));
    grid.appendChild(this.createInputGroup('장신구 위력 + %', 'accessoryPowerRelease', 'number', '0'));

    // 관통 해방 옵션
    grid.appendChild(this.createInputGroup('방어력 관통 + %', 'defensePenetration', 'number', '0'));
    grid.appendChild(this.createInputGroup('마법방어력 관통 + %', 'magicDefensePenetration', 'number', '0'));

    section.appendChild(grid);
    return section;
  }

  // 입력 그룹 생성
  createInputGroup(label, id, type = 'text', defaultValue = '') {
    const group = document.createElement('div');
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      display: block;
      color: #cbd5e1;
      font-size: 12px;
      margin-bottom: 6px;
      font-weight: 500;
    `;
    labelEl.setAttribute('for', id);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.value = defaultValue;
    input.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      background: rgba(51, 65, 85, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      color: #cbd5e1;
      font-size: 13px;
      box-sizing: border-box;
      transition: all 0.2s ease;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = '#a855f7';
      input.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.2)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(168, 85, 247, 0.3)';
      input.style.boxShadow = 'none';
    });

    input.addEventListener('input', () => {
      this.inputData[id] = input.value;
    });

    group.appendChild(labelEl);
    group.appendChild(input);
    return group;
  }

  // 속성 선택기 생성
  createElementSelector(label, id) {
    const group = document.createElement('div');
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      display: block;
      color: #cbd5e1;
      font-size: 12px;
      margin-bottom: 6px;
      font-weight: 500;
    `;

    const select = document.createElement('select');
    select.id = id;
    select.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      background: rgba(51, 65, 85, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      color: #cbd5e1;
      font-size: 13px;
      box-sizing: border-box;
      transition: all 0.2s ease;
      cursor: pointer;
    `;

    const optionNone = document.createElement('option');
    optionNone.value = '';
    optionNone.textContent = '선택 안함';
    select.appendChild(optionNone);

    Object.entries(ELEMENT_NAMES).forEach(([value, name]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      this.inputData[id] = select.value;
    });

    group.appendChild(labelEl);
    group.appendChild(select);
    return group;
  }

  // 저장/불러오기 버튼 생성
  createStorageButtons() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 저장';
    saveButton.style.cssText = `
      padding: 8px 12px;
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-width: fit-content;
      flex: 1 1 auto;
    `;

    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.background = 'rgba(71, 85, 105, 0.8)';
      saveButton.style.borderColor = '#a855f7';
    });

    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.background = 'rgba(51, 65, 85, 0.8)';
      saveButton.style.borderColor = 'rgba(168, 85, 247, 0.3)';
    });

    saveButton.addEventListener('click', () => {
      this.showSaveModal();
    });

    const loadButton = document.createElement('button');
    loadButton.textContent = '📂 불러오기';
    loadButton.style.cssText = `
      padding: 8px 12px;
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-width: fit-content;
      flex: 1 1 auto;
    `;

    loadButton.addEventListener('mouseenter', () => {
      loadButton.style.background = 'rgba(71, 85, 105, 0.8)';
      loadButton.style.borderColor = '#a855f7';
    });

    loadButton.addEventListener('mouseleave', () => {
      loadButton.style.background = 'rgba(51, 65, 85, 0.8)';
      loadButton.style.borderColor = 'rgba(168, 85, 247, 0.3)';
    });

    loadButton.addEventListener('click', () => {
      this.showLoadModal();
    });

    section.appendChild(saveButton);
    section.appendChild(loadButton);
    return section;
  }

  // 저장 모달 표시
  showSaveModal() {
    // 모든 입력 필드에서 값 수집
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.id) {
        this.inputData[input.id] = input.value;
      }
    });

    const presets = StorageManager.getAllPresets();
    const remainingSlots = StorageManager.getRemainingSlots();

    if (remainingSlots === 0) {
      alert('최대 5개까지 저장할 수 있습니다. 기존 설정을 삭제한 후 다시 시도해주세요.');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10030;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    `;

    const title = document.createElement('div');
    title.textContent = '💾 설정 저장';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 16px;
    `;

    const info = document.createElement('div');
    info.textContent = `저장 가능: ${remainingSlots}개 남음`;
    info.style.cssText = `
      color: #94a3b8;
      font-size: 12px;
      margin-bottom: 16px;
    `;

    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = `margin-bottom: 16px;`;

    const label = document.createElement('label');
    label.textContent = '설정 이름';
    label.style.cssText = `
      display: block;
      color: #cbd5e1;
      font-size: 13px;
      margin-bottom: 8px;
    `;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '예: 검술 바람 세트';
    nameInput.style.cssText = `
      width: 100%;
      padding: 10px;
      background: rgba(51, 65, 85, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      color: #cbd5e1;
      font-size: 14px;
      box-sizing: border-box;
    `;

    inputGroup.appendChild(label);
    inputGroup.appendChild(nameInput);

    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '취소';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    `;

    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    const saveButton = document.createElement('button');
    saveButton.textContent = '저장';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    `;

    saveButton.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
        alert('이름을 입력해주세요.');
        return;
      }

      const result = StorageManager.savePreset(name, this.inputData);
      if (result.success) {
        alert(result.message);
        document.body.removeChild(modal);
      } else {
        alert(result.message);
      }
    });

    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(saveButton);

    content.appendChild(title);
    content.appendChild(info);
    content.appendChild(inputGroup);
    content.appendChild(buttonGroup);
    modal.appendChild(content);
    document.body.appendChild(modal);

    nameInput.focus();
  }

  // 불러오기 모달 표시
  showLoadModal() {
    const presets = StorageManager.getAllPresets();

    if (presets.length === 0) {
      alert('저장된 설정이 없습니다.');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10030;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      width: 100%;
      max-width: 500px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-sizing: border-box;
    `;

    const title = document.createElement('div');
    title.textContent = '📂 설정 불러오기';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 16px;
    `;

    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    `;

    presets.forEach(preset => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(51, 65, 85, 0.8);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 6px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 8px;
        flex-wrap: wrap;
      `;

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(71, 85, 105, 0.8)';
        item.style.borderColor = '#a855f7';
      });

      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(51, 65, 85, 0.8)';
        item.style.borderColor = 'rgba(168, 85, 247, 0.3)';
      });

      const nameDiv = document.createElement('div');
      nameDiv.textContent = preset.name;
      nameDiv.style.cssText = `
        color: #cbd5e1;
        font-size: 14px;
        font-weight: 500;
        flex: 1;
        min-width: 0;
        word-break: break-word;
      `;

      const buttonGroup = document.createElement('div');
      buttonGroup.style.cssText = `
        display: flex;
        gap: 6px;
        flex-shrink: 0;
        flex-wrap: wrap;
      `;

      const previewButton = document.createElement('button');
      previewButton.textContent = '결과 보기';
      previewButton.style.cssText = `
        padding: 6px 10px;
        background: rgba(59, 130, 246, 0.8);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
      `;

      previewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPreviewResult(preset.id, preset.name, modal);
      });

      const loadButton = document.createElement('button');
      loadButton.textContent = '불러오기';
      loadButton.style.cssText = `
        padding: 6px 10px;
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
      `;

      loadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadPreset(preset.id);
        document.body.removeChild(modal);
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = '삭제';
      deleteButton.style.cssText = `
        padding: 6px 10px;
        background: rgba(239, 68, 68, 0.8);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
      `;

      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`"${preset.name}" 설정을 삭제하시겠습니까?`)) {
          StorageManager.deletePreset(preset.id);
          this.showLoadModal(); // 모달 새로고침
        }
      });

      buttonGroup.appendChild(previewButton);
      buttonGroup.appendChild(loadButton);
      buttonGroup.appendChild(deleteButton);

      item.appendChild(nameDiv);
      item.appendChild(buttonGroup);
      list.appendChild(item);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '닫기';
    closeButton.style.cssText = `
      width: 100%;
      padding: 10px;
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    `;

    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    content.appendChild(title);
    content.appendChild(list);
    content.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  // 프리셋 불러오기
  loadPreset(id) {
    const data = StorageManager.loadPreset(id);
    if (!data) {
      alert('설정을 불러오는데 실패했습니다.');
      return;
    }

    // 모든 입력 필드에 값 설정
    Object.keys(data).forEach(key => {
      const input = document.getElementById(key);
      if (input) {
        input.value = data[key] || '';
        // 이벤트 트리거하여 inputData 업데이트
        if (input.tagName === 'INPUT') {
          input.dispatchEvent(new Event('input'));
        } else if (input.tagName === 'SELECT') {
          input.dispatchEvent(new Event('change'));
        }
      }
    });

    // inputData 업데이트
    this.inputData = { ...data };
  }

  // 결과 미리보기 표시
  showPreviewResult(presetId, presetName, parentModal) {
    const data = StorageManager.loadPreset(presetId);
    if (!data) {
      alert('설정을 불러오는데 실패했습니다.');
      return;
    }

    // 계산 실행
    const result = this.calculator.calculateAll(data);

    // 결과 모달 생성
    const resultModal = document.createElement('div');
    resultModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10040;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    `;

    const resultContent = document.createElement('div');
    resultContent.style.cssText = `
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      width: 100%;
      max-width: 600px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-sizing: border-box;
    `;

    const resultTitle = document.createElement('div');
    resultTitle.textContent = `📊 ${presetName} - 계산 결과`;
    resultTitle.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 16px;
    `;

    const resultGrid = document.createElement('div');
    resultGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    `;

    // 실 공격력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스, 해방 관통 보너스 포함)
    const attackItem = this.createResultItemWithPenetration(
      '실 공격력',
      result.attackBase,
      result.attackReleaseBonus,
      result.attackEquipmentAttributeBonus,
      result.attackTownAttributeBonus,
      result.attackPenetrationBonus,
      result.attack
    );
    resultGrid.appendChild(attackItem);

    // 실 마법공격력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스, 해방 관통 보너스 포함)
    const magicAttackItem = this.createResultItemWithPenetration(
      '실 마법공격력',
      result.magicAttackBase,
      result.magicAttackReleaseBonus,
      result.magicAttackEquipmentAttributeBonus,
      result.magicAttackTownAttributeBonus,
      result.magicAttackPenetrationBonus,
      result.magicAttack
    );
    resultGrid.appendChild(magicAttackItem);

    // 방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함, 표기공 없음)
    const defenseItem = this.createResultItemWithPenetration(
      '방어력',
      null, // 표기공 없음
      result.defenseReleaseBonus,
      result.defenseEquipmentAttributeBonus,
      result.defenseTownAttributeBonus,
      null,
      result.defense
    );
    resultGrid.appendChild(defenseItem);

    // 마법방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함, 표기공 없음)
    const magicDefenseItem = this.createResultItemWithPenetration(
      '마법방어력',
      null, // 표기공 없음
      result.magicDefenseReleaseBonus,
      result.magicDefenseEquipmentAttributeBonus,
      result.magicDefenseTownAttributeBonus,
      null,
      result.magicDefense
    );
    resultGrid.appendChild(magicDefenseItem);

    const results = [
      { label: '공격속도', value: result.attackSpeed, format: 'number' },
      { label: '회피치', value: result.evasion, format: 'number' },
      { label: '적중치', value: result.accuracy, format: 'number' },
      { label: '치명타 확률', value: result.criticalRate, format: 'percent' },
      { label: '치명타 데미지', value: result.criticalDamage, format: 'percent' },
      { label: '회복력', value: result.recovery, format: 'text' }
    ];

    results.forEach(({ label, value, format }) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(51, 65, 85, 0.8);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 6px;
        padding: 10px;
      `;

      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = `
        color: #94a3b8;
        font-size: 11px;
        margin-bottom: 4px;
      `;

      const valueEl = document.createElement('div');
      if (format === 'percent') {
        valueEl.textContent = value !== null ? `${value.toFixed(2)}%` : '-';
      } else if (format === 'number') {
        valueEl.textContent = value !== null ? Math.round(value).toLocaleString() : '-';
      } else {
        valueEl.textContent = value !== null ? value : '공식 알 수 없음';
      }
      valueEl.style.cssText = `
        color: #cbd5e1;
        font-size: 16px;
        font-weight: 600;
      `;

      item.appendChild(labelEl);
      item.appendChild(valueEl);
      resultGrid.appendChild(item);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '닫기';
    closeButton.style.cssText = `
      width: 100%;
      padding: 10px;
      background: rgba(51, 65, 85, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    `;

    closeButton.addEventListener('click', () => {
      document.body.removeChild(resultModal);
    });

    resultContent.appendChild(resultTitle);
    resultContent.appendChild(resultGrid);
    resultContent.appendChild(closeButton);
    resultModal.appendChild(resultContent);
    document.body.appendChild(resultModal);
  }

  // 계산 버튼 생성
  createCalculateButton() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
    `;

    const button = document.createElement('button');
    button.textContent = '📊 스펙 계산하기';
    button.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 12px rgba(147, 51, 234, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 6px rgba(147, 51, 234, 0.3)';
    });

    button.addEventListener('click', () => {
      this.calculate();
    });

    section.appendChild(button);
    return section;
  }

  // 결과 영역 생성
  createResultArea() {
    const section = document.createElement('div');
    section.id = 'spec-result-area';
    section.style.cssText = `
      background: rgba(51, 65, 85, 0.5);
      border-radius: 8px;
      padding: 16px;
      min-height: 100px;
    `;

    const placeholder = document.createElement('div');
    placeholder.textContent = '계산 결과가 여기에 표시됩니다.';
    placeholder.style.cssText = `
      color: #94a3b8;
      text-align: center;
      font-size: 13px;
    `;
    section.appendChild(placeholder);

    return section;
  }

  // 계산 실행
  calculate() {
    // 모든 입력 필드에서 값 수집
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.id) {
        this.inputData[input.id] = input.value;
      }
    });

    // 계산 실행
    this.result = this.calculator.calculateAll(this.inputData);
    
    // 결과 표시
    this.displayResult();
  }

  // 결과 표시
  displayResult() {
    const resultArea = document.getElementById('spec-result-area');
    if (!resultArea) return;

    resultArea.innerHTML = '';

    const title = document.createElement('div');
    title.textContent = '📈 계산 결과';
    title.style.cssText = `
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 16px;
      font-size: 14px;
    `;
    resultArea.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    `;

    // 실 공격력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스, 해방 관통 보너스 포함)
    const attackItem = this.createResultItemWithPenetration(
      '실 공격력',
      this.result.attackBase,
      this.result.attackReleaseBonus,
      this.result.attackEquipmentAttributeBonus,
      this.result.attackTownAttributeBonus,
      this.result.attackPenetrationBonus,
      this.result.attack
    );
    grid.appendChild(attackItem);

    // 실 마법공격력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스, 해방 관통 보너스 포함)
    const magicAttackItem = this.createResultItemWithPenetration(
      '실 마법공격력',
      this.result.magicAttackBase,
      this.result.magicAttackReleaseBonus,
      this.result.magicAttackEquipmentAttributeBonus,
      this.result.magicAttackTownAttributeBonus,
      this.result.magicAttackPenetrationBonus,
      this.result.magicAttack
    );
    grid.appendChild(magicAttackItem);

    // 방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함, 표기공 없음)
    const defenseItem = this.createResultItemWithPenetration(
      '방어력',
      null, // 표기공 없음
      this.result.defenseReleaseBonus,
      this.result.defenseEquipmentAttributeBonus,
      this.result.defenseTownAttributeBonus,
      null,
      this.result.defense
    );
    grid.appendChild(defenseItem);

    // 마법방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함, 표기공 없음)
    const magicDefenseItem = this.createResultItemWithPenetration(
      '마법방어력',
      null, // 표기공 없음
      this.result.magicDefenseReleaseBonus,
      this.result.magicDefenseEquipmentAttributeBonus,
      this.result.magicDefenseTownAttributeBonus,
      null,
      this.result.magicDefense
    );
    grid.appendChild(magicDefenseItem);

    const results = [
      { label: '공격속도', value: this.result.attackSpeed, format: 'number' },
      { label: '회피치', value: this.result.evasion, format: 'number' },
      { label: '적중치', value: this.result.accuracy, format: 'number' },
      { label: '치명타 확률', value: this.result.criticalRate, format: 'percent' },
      { label: '치명타 데미지', value: this.result.criticalDamage, format: 'percent' },
      { label: '회복력', value: this.result.recovery, format: 'text' }
    ];

    results.forEach(({ label, value, format }) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(30, 41, 59, 0.6);
        border-radius: 6px;
        padding: 10px;
        border: 1px solid rgba(168, 85, 247, 0.2);
      `;

      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = `
        color: #94a3b8;
        font-size: 11px;
        margin-bottom: 4px;
      `;

      const valueEl = document.createElement('div');
      if (format === 'percent') {
        valueEl.textContent = value !== null ? `${value.toFixed(2)}%` : '-';
      } else if (format === 'number') {
        valueEl.textContent = value !== null ? Math.round(value).toLocaleString() : '-';
      } else {
        valueEl.textContent = value !== null ? value : '공식 알 수 없음';
      }
      valueEl.style.cssText = `
        color: #cbd5e1;
        font-size: 16px;
        font-weight: 600;
      `;

      item.appendChild(labelEl);
      item.appendChild(valueEl);
      grid.appendChild(item);
    });

    resultArea.appendChild(grid);
  }

  // 관통 정보가 포함된 결과 아이템 생성
  createResultItemWithPenetration(label, baseValue, releaseBonus, equipmentAttributeBonus, townAttributeBonus, penetrationBonus, totalValue) {
    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #94a3b8;
      font-size: 11px;
      margin-bottom: 4px;
    `;

    const totalValueEl = document.createElement('div');
    totalValueEl.textContent = totalValue !== null ? Math.round(totalValue).toLocaleString() : '-';
    totalValueEl.style.cssText = `
      color: #cbd5e1;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    `;

    item.appendChild(labelEl);
    item.appendChild(totalValueEl);

    const detailInfo = document.createElement('div');
    detailInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    `;

    // 표기공 표시 (baseValue가 있는 경우만)
    if (baseValue !== null && baseValue !== undefined) {
      const baseInfo = document.createElement('div');
      baseInfo.textContent = `표기공: ${Math.round(baseValue).toLocaleString()}`;
      baseInfo.style.cssText = `
        color: #94a3b8;
        font-size: 10px;
      `;
      detailInfo.appendChild(baseInfo);
    }

    // 해방 위력 보너스가 있는 경우 표시
    if (releaseBonus && releaseBonus > 0) {
      const releaseBonusInfo = document.createElement('div');
      releaseBonusInfo.textContent = `해방 위력 보너스: +${Math.round(releaseBonus).toLocaleString()}`;
      releaseBonusInfo.style.cssText = `
        color: #34d399;
        font-size: 10px;
      `;
      detailInfo.appendChild(releaseBonusInfo);
    }

    // 장비 속성 보너스가 있는 경우 표시
    if (equipmentAttributeBonus && equipmentAttributeBonus > 0) {
      const equipmentBonusInfo = document.createElement('div');
      equipmentBonusInfo.textContent = `장비 속성 보너스: +${Math.round(equipmentAttributeBonus).toLocaleString()}`;
      equipmentBonusInfo.style.cssText = `
        color: #fbbf24;
        font-size: 10px;
      `;
      detailInfo.appendChild(equipmentBonusInfo);
    }

    // 마을 속성 보너스가 있는 경우 표시
    if (townAttributeBonus && townAttributeBonus > 0) {
      const townBonusInfo = document.createElement('div');
      townBonusInfo.textContent = `마을 속성 보너스: +${Math.round(townAttributeBonus).toLocaleString()}`;
      townBonusInfo.style.cssText = `
        color: #f59e0b;
        font-size: 10px;
      `;
      detailInfo.appendChild(townBonusInfo);
    }

    // 해방 관통 보너스가 있는 경우 표시
    if (penetrationBonus && penetrationBonus > 0) {
      const penetrationInfo = document.createElement('div');
      penetrationInfo.textContent = `해방 관통 보너스: +${Math.round(penetrationBonus).toLocaleString()}`;
      penetrationInfo.style.cssText = `
        color: #60a5fa;
        font-size: 10px;
      `;
      detailInfo.appendChild(penetrationInfo);
    }

    if (detailInfo.children.length > 0) {
      item.appendChild(detailInfo);
    }

    return item;
  }
}

