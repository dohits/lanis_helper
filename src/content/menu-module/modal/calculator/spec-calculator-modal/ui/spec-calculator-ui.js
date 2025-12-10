import { SpecCalculator } from '../data/spec-calculator.js';
import { ELEMENT_NAMES } from '../data/attribute-calculator.js';
import { StorageManager } from '../data/storage-manager.js';

/**
 * 각 결과 항목의 공식 설명
 */
const FORMULA_DESCRIPTIONS = {
  '공격력': `표기값 = {
  [ (무기 위력 × (1 + 무기 위력 해방옵션%)) × 장비 속성 보정 ]
  +
  [ (힘 × (1 + 힘 해방옵션%)) ]
} × 마을 속성 보정
최종값 = 표기값 × (1 + 공격력 어빌리티%)`,
  '마법공격력': `표기값 = {
  [ (무기 위력 × (1 + 무기 위력 해방옵션%)) × 장비 속성 보정 ]
  +
  [ (지능 × (1 + 지능 해방옵션%)) ]
} × 마을 속성 보정
최종값 = 표기값 × (1 + 마법공격력 어빌리티%)`,
  '방어력 관통 보너스': `방어력 관통 보너스 =
상대 방어력 × (방어력 관통 해방 옵션% / 100)
※ 공격력에 합산되지 않고 별도 표시`,
  '마법방어력 관통 보너스': `마법방어력 관통 보너스 =
상대 마법방어력 × (마법방어력 관통 해방 옵션% / 100)
※ 마법공격력에 합산되지 않고 별도 표시`,
  '방어력': `방어력 = {
  [ (방어구 위력 × (1 + 방어구 위력 해방옵션%)) × 장비 속성 보정 ]
  +
  [ (장신구 위력 × (1 + 장신구 위력 해방옵션%)) × 장비 속성 보정 ]
  +
  [ (생명 × (1 + 생명 해방옵션%)) ]
} × 마을 속성 보정
최종값 = 방어력 × (1 + 어빌리티%)`,
  '마법방어력': `마법방어력 = {
  [ (장신구 위력 × 4.5 × (1 + 장신구 위력 해방옵션%)) × 장비 속성 보정 ]
  +
  [ (정신 × (1 + 정신 해방옵션%)) ]
} × 마을 속성 보정
최종값 = 마법방어력 × (1 + 어빌리티%)`,
  '공격속도': `공격속도 = 
  (속도 × (1 + 속도 해방옵션%))
  - 무기 무게
  - 방어구 무게
  - 장신구 무게`,
  '회피치': `회피치 = 
  [ 지능 × (1 + 지능 해방옵션%) × 3.5 ]
  +
  [ 행운 × (1 + 행운 해방옵션%) × 2 ]
  +
  [ 공격속도 × 2 ]
최종값 = 표기값 × (1 + 회피치 어빌리티%)`,
  '적중치': `적중치 = 
  [ 정신 × (1 + 정신 해방옵션%) × 2.8 ]
  +
  [ 행운 × (1 + 행운 해방옵션%) × 1.6 ]
  +
  [ 공격속도 × 1.6 ]
최종값 = 표기값 × (1 + 적중치 어빌리티%)`,
  '치명타 확률': `치명타 확률 = 
  [ 행운 × (1 + 행운 해방옵션%) × 0.0535 ]
  + 0.45
최종값 = 표기값 × (1 + 치명타 확률 어빌리티%)`,
  '치명타 데미지': `치명타 데미지(%) = 
  103
  + CEIL(
    ( 2.0 × [힘 × (1 + 힘 해방옵션%)]
    + 0.9 × [행운 × (1 + 행운 해방옵션%)] )
    / 34
  )
최종값 = 표기값 × (1 + 치명타 데미지 어빌리티%)`,
  '회복력': '현재 알 수 없음.'
};

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
    
    // 마지막 입력값 불러오기
    const lastInput = StorageManager.loadLastInput();
    this.inputData = { ...lastInput };
    
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
    card.appendChild(this.createAbilityOptionSection());
    
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

  // 어빌리티 옵션 섹션
  createAbilityOptionSection() {
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom: 20px;`;

    const title = document.createElement('div');
    title.textContent = '💠 어빌리티 옵션 (%)';
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

    grid.appendChild(this.createInputGroup('공격력 어빌리티 %', 'attackAbility', 'number', '0'));
    grid.appendChild(this.createInputGroup('마법공격력 어빌리티 %', 'magicAttackAbility', 'number', '0'));
    grid.appendChild(this.createInputGroup('회피치 어빌리티 %', 'evasionAbility', 'number', '0'));
    grid.appendChild(this.createInputGroup('적중치 어빌리티 %', 'accuracyAbility', 'number', '0'));
    grid.appendChild(this.createInputGroup('치명타 확률 어빌리티 %', 'criticalRateAbility', 'number', '0'));
    grid.appendChild(this.createInputGroup('치명타 데미지 어빌리티 %', 'criticalDamageAbility', 'number', '0'));

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

    // 마지막 입력값이 있으면 사용, 없으면 기본값 사용
    const savedValue = this.inputData[id] !== undefined ? this.inputData[id] : defaultValue;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.value = savedValue;
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
      // 변경 시 자동 저장
      StorageManager.saveLastInput(this.inputData);
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

    // 마지막 입력값이 있으면 사용
    const savedValue = this.inputData[id] !== undefined ? this.inputData[id] : '';

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

    // 저장된 값으로 초기화
    if (savedValue) {
      select.value = savedValue;
    }

    select.addEventListener('change', () => {
      this.inputData[id] = select.value;
      // 변경 시 자동 저장
      StorageManager.saveLastInput(this.inputData);
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
          // 기존 모달 제거 후 새 모달 표시
          if (modal && modal.parentNode) {
            document.body.removeChild(modal);
          }
          this.showLoadModal();
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
    // 마지막 입력값으로 저장
    StorageManager.saveLastInput(this.inputData);
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

    // 공격력 (관통 보너스 제외)
    const attackItem = this.createResultItemWithPenetration(
      '공격력',
      result.attackBase,
      result.attackReleaseBonus,
      result.attackEquipmentAttributeBonus,
      result.attackTownAttributeBonus,
      result.attackAbilityBonus,
      result.attack
    );
    resultGrid.appendChild(attackItem);

    // 마법공격력 (관통 보너스 제외)
    const magicAttackItem = this.createResultItemWithPenetration(
      '마법공격력',
      result.magicAttackBase,
      result.magicAttackReleaseBonus,
      result.magicAttackEquipmentAttributeBonus,
      result.magicAttackTownAttributeBonus,
      result.magicAttackAbilityBonus,
      result.magicAttack
    );
    resultGrid.appendChild(magicAttackItem);

    // 방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함)
    const defenseItem = this.createResultItemWithPenetration(
      '방어력',
      result.defenseBase,
      result.defenseReleaseBonus,
      result.defenseEquipmentAttributeBonus,
      result.defenseTownAttributeBonus,
      null,
      result.defense
    );
    resultGrid.appendChild(defenseItem);

    // 마법방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함)
    const magicDefenseItem = this.createResultItemWithPenetration(
      '마법방어력',
      result.magicDefenseBase,
      result.magicDefenseReleaseBonus,
      result.magicDefenseEquipmentAttributeBonus,
      result.magicDefenseTownAttributeBonus,
      null,
      result.magicDefense
    );
    resultGrid.appendChild(magicDefenseItem);

    // 관통 보너스 (별도 표시)
    if (result.attackPenetrationBonus && result.attackPenetrationBonus > 0) {
      const attackPenetrationItem = this.createPenetrationBonusItem(
        '방어력 관통 보너스',
        result.attackPenetrationBonus
      );
      resultGrid.appendChild(attackPenetrationItem);
    }

    if (result.magicAttackPenetrationBonus && result.magicAttackPenetrationBonus > 0) {
      const magicAttackPenetrationItem = this.createPenetrationBonusItem(
        '마법방어력 관통 보너스',
        result.magicAttackPenetrationBonus
      );
      resultGrid.appendChild(magicAttackPenetrationItem);
    }

    // 공격속도 (어빌리티 적용 없음)
    const attackSpeedItem = document.createElement('div');
    attackSpeedItem.style.cssText = `
      background: rgba(51, 65, 85, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      padding: 10px;
    `;
    const asLabel = document.createElement('div');
    asLabel.textContent = '공격속도';
    asLabel.style.cssText = `color: #94a3b8;font-size:11px;margin-bottom:4px;`;
    const asValue = document.createElement('div');
    asValue.textContent = result.attackSpeed !== null ? Math.round(result.attackSpeed).toLocaleString() : '-';
    asValue.style.cssText = `color:#cbd5e1;font-size:16px;font-weight:600;`;
    attackSpeedItem.appendChild(asLabel);
    attackSpeedItem.appendChild(asValue);
    resultGrid.appendChild(attackSpeedItem);

    const evasionItem = this.createResultItemWithAbility(
      '회피치',
      result.evasionBase,
      result.evasionAbilityBonus,
      result.evasion
    );
    resultGrid.appendChild(evasionItem);

    const accuracyItem = this.createResultItemWithAbility(
      '적중치',
      result.accuracyBase,
      result.accuracyAbilityBonus,
      result.accuracy
    );
    resultGrid.appendChild(accuracyItem);

    const critRateItem = this.createResultItemWithAbility(
      '치명타 확률',
      result.criticalRateBase,
      result.criticalRateAbilityBonus,
      result.criticalRate
    );
    resultGrid.appendChild(critRateItem);

    const critDmgItem = this.createResultItemWithAbility(
      '치명타 데미지',
      result.criticalDamageBase,
      result.criticalDamageAbilityBonus,
      result.criticalDamage
    );
    resultGrid.appendChild(critDmgItem);

    // 회복력(공식 없음)
    const recoveryItem = document.createElement('div');
    recoveryItem.style.cssText = `
      background: rgba(51, 65, 85, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      padding: 10px;
    `;
    const recoveryLabel = document.createElement('div');
    recoveryLabel.textContent = '회복력';
    recoveryLabel.style.cssText = `color:#94a3b8;font-size:11px;margin-bottom:4px;`;
    const recoveryValue = document.createElement('div');
    recoveryValue.textContent = result.recovery !== null ? result.recovery : '공식 알 수 없음';
    recoveryValue.style.cssText = `color:#cbd5e1;font-size:16px;font-weight:600;`;
    recoveryItem.appendChild(recoveryLabel);
    recoveryItem.appendChild(recoveryValue);
    resultGrid.appendChild(recoveryItem);

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

    // 마지막 입력값 저장
    StorageManager.saveLastInput(this.inputData);

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

    // 공격력 (관통 보너스 제외)
    const attackItem = this.createResultItemWithPenetration(
      '공격력',
      this.result.attackBase,
      this.result.attackReleaseBonus,
      this.result.attackEquipmentAttributeBonus,
      this.result.attackTownAttributeBonus,
      this.result.attackAbilityBonus,
      this.result.attack
    );
    grid.appendChild(attackItem);

    // 마법공격력 (관통 보너스 제외)
    const magicAttackItem = this.createResultItemWithPenetration(
      '마법공격력',
      this.result.magicAttackBase,
      this.result.magicAttackReleaseBonus,
      this.result.magicAttackEquipmentAttributeBonus,
      this.result.magicAttackTownAttributeBonus,
      this.result.magicAttackAbilityBonus,
      this.result.magicAttack
    );
    grid.appendChild(magicAttackItem);

    // 방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함)
    const defenseItem = this.createResultItemWithPenetration(
      '방어력',
      this.result.defenseBase,
      this.result.defenseReleaseBonus,
      this.result.defenseEquipmentAttributeBonus,
      this.result.defenseTownAttributeBonus,
      null,
      this.result.defense
    );
    grid.appendChild(defenseItem);

    // 마법방어력 (해방 위력 보너스, 장비 속성 보너스, 마을 속성 보너스 포함)
    const magicDefenseItem = this.createResultItemWithPenetration(
      '마법방어력',
      this.result.magicDefenseBase,
      this.result.magicDefenseReleaseBonus,
      this.result.magicDefenseEquipmentAttributeBonus,
      this.result.magicDefenseTownAttributeBonus,
      null,
      this.result.magicDefense
    );
    grid.appendChild(magicDefenseItem);

    // 관통 보너스 (별도 표시)
    if (this.result.attackPenetrationBonus && this.result.attackPenetrationBonus > 0) {
      const attackPenetrationItem = this.createPenetrationBonusItem(
        '방어력 관통 보너스',
        this.result.attackPenetrationBonus
      );
      grid.appendChild(attackPenetrationItem);
    }

    if (this.result.magicAttackPenetrationBonus && this.result.magicAttackPenetrationBonus > 0) {
      const magicAttackPenetrationItem = this.createPenetrationBonusItem(
        '마법방어력 관통 보너스',
        this.result.magicAttackPenetrationBonus
      );
      grid.appendChild(magicAttackPenetrationItem);
    }

    // 공격속도 (어빌리티 적용 없음)
    const attackSpeedItem = document.createElement('div');
    attackSpeedItem.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;
    const asLabel = document.createElement('div');
    asLabel.textContent = '공격속도';
    asLabel.style.cssText = `color: #94a3b8;font-size:11px;margin-bottom:4px;`;
    const asValue = document.createElement('div');
    asValue.textContent = this.result.attackSpeed !== null ? Math.round(this.result.attackSpeed).toLocaleString() : '-';
    asValue.style.cssText = `color:#cbd5e1;font-size:16px;font-weight:600;`;
    attackSpeedItem.appendChild(asLabel);
    attackSpeedItem.appendChild(asValue);
    grid.appendChild(attackSpeedItem);

    const evasionItem = this.createResultItemWithAbility(
      '회피치',
      this.result.evasionBase,
      this.result.evasionAbilityBonus,
      this.result.evasion
    );
    grid.appendChild(evasionItem);

    const accuracyItem = this.createResultItemWithAbility(
      '적중치',
      this.result.accuracyBase,
      this.result.accuracyAbilityBonus,
      this.result.accuracy
    );
    grid.appendChild(accuracyItem);

    const critRateItem = this.createResultItemWithAbility(
      '치명타 확률',
      this.result.criticalRateBase,
      this.result.criticalRateAbilityBonus,
      this.result.criticalRate
    );
    grid.appendChild(critRateItem);

    const critDmgItem = this.createResultItemWithAbility(
      '치명타 데미지',
      this.result.criticalDamageBase,
      this.result.criticalDamageAbilityBonus,
      this.result.criticalDamage
    );
    grid.appendChild(critDmgItem);

    // 회복력(공식 없음)
    const recoveryItem = document.createElement('div');
    recoveryItem.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;
    const recoveryLabel = document.createElement('div');
    recoveryLabel.textContent = '회복력';
    recoveryLabel.style.cssText = `color:#94a3b8;font-size:11px;margin-bottom:4px;`;
    const recoveryValue = document.createElement('div');
    recoveryValue.textContent = this.result.recovery !== null ? this.result.recovery : '공식 알 수 없음';
    recoveryValue.style.cssText = `color:#cbd5e1;font-size:16px;font-weight:600;`;
    recoveryItem.appendChild(recoveryLabel);
    recoveryItem.appendChild(recoveryValue);
    grid.appendChild(recoveryItem);

    resultArea.appendChild(grid);
  }

  // 툴팁 생성 및 표시
  createTooltip(triggerElement, text) {
    let tooltip = null;
    let isTooltipVisible = false;

    const showTooltip = (event) => {
      if (isTooltipVisible) {
        hideTooltip();
        return;
      }
      
      event.stopPropagation();
      
      tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(168, 85, 247, 0.5);
        border-radius: 8px;
        padding: 12px;
        color: #cbd5e1;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-line;
        z-index: 10050;
        max-width: 400px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        font-family: 'Courier New', monospace;
        display: block;
        visibility: hidden;
      `;
      tooltip.textContent = text;
      
      document.body.appendChild(tooltip);
      
      // 초기 위치 설정 (위쪽)
      const rect = triggerElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      let top = rect.top - tooltipRect.height - 10;
      
      // 화면 밖으로 나가지 않도록 조정
      if (left < 10) {
        left = 10;
      }
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (top < 10) {
        // 위쪽 공간이 부족하면 아래쪽에 표시
        top = rect.bottom + 10;
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.visibility = 'visible';
      
      isTooltipVisible = true;
      
      // 문서 클릭 이벤트로 툴팁 닫기
      const handleDocumentClick = (e) => {
        if (isTooltipVisible && tooltip && !tooltip.contains(e.target) && !triggerElement.contains(e.target)) {
          hideTooltip();
          document.removeEventListener('click', handleDocumentClick);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
      }, 0);
    };

    const hideTooltip = () => {
      if (tooltip && tooltip.parentNode) {
        document.body.removeChild(tooltip);
      }
      tooltip = null;
      isTooltipVisible = false;
    };

    triggerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isTooltipVisible) {
        hideTooltip();
      } else {
        showTooltip(e);
      }
    });
  }

  // 물음표 아이콘 생성
  createHelpIcon(label) {
    const icon = document.createElement('span');
    icon.textContent = '❓';
    icon.style.cssText = `
      display: inline-block;
      margin-left: 4px;
      cursor: help;
      font-size: 11px;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      vertical-align: middle;
    `;
    
    icon.addEventListener('mouseenter', () => {
      icon.style.opacity = '1';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.opacity = '0.7';
    });

    const formula = FORMULA_DESCRIPTIONS[label];
    if (formula) {
      this.createTooltip(icon, formula);
    }

    return icon;
  }

  // 표기값/최종값/어빌리티 보너스 표시 (관통 보너스는 별도 표시)
  createResultItemWithPenetration(label, baseValue, releaseBonus, equipmentAttributeBonus, townAttributeBonus, abilityBonus, totalValue) {
    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;

    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #94a3b8;
      font-size: 11px;
    `;

    const helpIcon = this.createHelpIcon(label);
    labelContainer.appendChild(labelEl);
    labelContainer.appendChild(helpIcon);

    const totalValueEl = document.createElement('div');
    totalValueEl.textContent = totalValue !== null ? Math.round(totalValue).toLocaleString() : '-';
    totalValueEl.style.cssText = `
      color: #cbd5e1;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    `;

    item.appendChild(labelContainer);
    item.appendChild(totalValueEl);

    const detailInfo = document.createElement('div');
    detailInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    `;

    // 표기값
    if (baseValue !== null && baseValue !== undefined) {
      const baseInfo = document.createElement('div');
      baseInfo.textContent = `표기값: ${Math.round(baseValue).toLocaleString()}`;
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

    // 어빌리티 보너스
    if (abilityBonus && abilityBonus > 0) {
      const abilityInfo = document.createElement('div');
      abilityInfo.textContent = `어빌리티 보너스: +${Math.round(abilityBonus).toLocaleString()}`;
      abilityInfo.style.cssText = `
        color: #38bdf8;
        font-size: 10px;
      `;
      detailInfo.appendChild(abilityInfo);
    }

    if (detailInfo.children.length > 0) {
      item.appendChild(detailInfo);
    }

    return item;
  }

  // 관통 보너스 결과 아이템 생성
  createPenetrationBonusItem(label, value) {
    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;

    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #94a3b8;
      font-size: 11px;
    `;

    const helpIcon = this.createHelpIcon(label);
    labelContainer.appendChild(labelEl);
    labelContainer.appendChild(helpIcon);

    const valueEl = document.createElement('div');
    valueEl.textContent = value !== null && value > 0 ? `+${Math.round(value).toLocaleString()}` : '-';
    valueEl.style.cssText = `
      color: #60a5fa;
      font-size: 16px;
      font-weight: 600;
    `;

    item.appendChild(labelContainer);
    item.appendChild(valueEl);

    return item;
  }

  // 표기값/어빌리티/최종값 표시용
  createResultItemWithAbility(label, baseValue, abilityBonus, totalValue) {
    const item = document.createElement('div');
    item.style.cssText = `
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 10px;
      border: 1px solid rgba(168, 85, 247, 0.2);
    `;

    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: #94a3b8;
      font-size: 11px;
    `;

    const helpIcon = this.createHelpIcon(label);
    labelContainer.appendChild(labelEl);
    labelContainer.appendChild(helpIcon);

    const totalValueEl = document.createElement('div');
    totalValueEl.textContent = totalValue !== null ? Math.round(totalValue).toLocaleString() : '-';
    totalValueEl.style.cssText = `
      color: #cbd5e1;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    `;

    item.appendChild(labelContainer);
    item.appendChild(totalValueEl);

    const detailInfo = document.createElement('div');
    detailInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    `;

    if (baseValue !== null && baseValue !== undefined) {
      const baseInfo = document.createElement('div');
      baseInfo.textContent = `표기값: ${Math.round(baseValue).toLocaleString()}`;
      baseInfo.style.cssText = `
        color: #94a3b8;
        font-size: 10px;
      `;
      detailInfo.appendChild(baseInfo);
    }

    if (abilityBonus && abilityBonus > 0) {
      const abilityInfo = document.createElement('div');
      abilityInfo.textContent = `어빌리티 보너스: +${Math.round(abilityBonus).toLocaleString()}`;
      abilityInfo.style.cssText = `
        color: #38bdf8;
        font-size: 10px;
      `;
      detailInfo.appendChild(abilityInfo);
    }

    if (detailInfo.children.length > 0) {
      item.appendChild(detailInfo);
    }

    return item;
  }
}

