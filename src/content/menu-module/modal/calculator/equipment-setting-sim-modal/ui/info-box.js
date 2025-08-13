import { UIComponents } from './ui-components.js';
import { ABILITY_MAPPINGS, ITEM_CATEGORIES } from '../data/data.js';

// 정보 박스 관리 클래스
export class InfoBox {
  constructor() {
    this.jobInfoItem = null;
    this.elementInfoItem = null;
    this.abilityInfoItem = null;
    this.jobAbilityInfoItem = null;
    this.weaponInfoItem = null;
    this.armorInfoItem = null;
    this.accessoryInfoItem = null;
    
    // 클릭 콜백 함수들
    this.onJobClick = null;
    this.onElementClick = null;
    this.onAbilityClick = null;
    this.onJobAbilityClick = null;
    this.onWeaponClick = null;
    this.onArmorClick = null;
    this.onAccessoryClick = null;
  }

  // 클릭 콜백 설정
  setOnJobClick(callback) {
    this.onJobClick = callback;
  }

  setOnElementClick(callback) {
    this.onElementClick = callback;
  }

  setOnAbilityClick(callback) {
    this.onAbilityClick = callback;
  }

  setOnJobAbilityClick(callback) {
    this.onJobAbilityClick = callback;
  }

  setOnWeaponClick(callback) {
    this.onWeaponClick = callback;
  }

  setOnArmorClick(callback) {
    this.onArmorClick = callback;
  }

  setOnAccessoryClick(callback) {
    this.onAccessoryClick = callback;
  }

  // 정보 박스 생성
  createInfoBox() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // 직업 정보 아이템
    this.jobInfoItem = this.createClickableInfoItem(
      '선택된 직업',
      '직업을 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onJobClick && this.onJobClick()
    );
    this.jobInfoItem.iconElement.className = 'job-info-icon';
    this.jobInfoItem.valueElement.id = 'selected-job-display';

    // 속성 정보 아이템
    this.elementInfoItem = this.createClickableInfoItem(
      '선택된 속성',
      '속성을 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onElementClick && this.onElementClick()
    );
    this.elementInfoItem.iconElement.className = 'element-info-icon';
    this.elementInfoItem.valueElement.id = 'selected-element-display';

    // 어빌리티 정보 아이템
    this.abilityInfoItem = this.createClickableInfoItem(
      '메인 어빌리티',
      '어빌리티를 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onAbilityClick && this.onAbilityClick()
    );
    this.abilityInfoItem.iconElement.className = 'ability-info-icon';
    this.abilityInfoItem.valueElement.id = 'selected-ability-display';

    // 직업 어빌리티 정보 아이템
    this.jobAbilityInfoItem = this.createClickableInfoItem(
      '직업 어빌리티',
      '어빌리티를 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onJobAbilityClick && this.onJobAbilityClick()
    );
    this.jobAbilityInfoItem.iconElement.className = 'job-ability-info-icon';
    this.jobAbilityInfoItem.valueElement.id = 'selected-job-ability-display';

    // 무기 정보 아이템
    this.weaponInfoItem = this.createClickableInfoItem(
      '선택된 무기',
      '무기를 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onWeaponClick && this.onWeaponClick()
    );
    this.weaponInfoItem.iconElement.className = 'weapon-info-icon';
    this.weaponInfoItem.valueElement.id = 'selected-weapon-display';

    // 방어구 정보 아이템
    this.armorInfoItem = this.createClickableInfoItem(
      '선택된 방어구',
      '방어구를 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onArmorClick && this.onArmorClick()
    );
    this.armorInfoItem.iconElement.className = 'armor-info-icon';
    this.armorInfoItem.valueElement.id = 'selected-armor-display';

    // 장신구 정보 아이템
    this.accessoryInfoItem = this.createClickableInfoItem(
      '선택된 장신구',
      '장신구를 선택해주세요',
      '❓',
      '#f3f4f6',
      () => this.onAccessoryClick && this.onAccessoryClick()
    );
    this.accessoryInfoItem.iconElement.className = 'accessory-info-icon';
    this.accessoryInfoItem.valueElement.id = 'selected-accessory-display';

    content.appendChild(this.jobInfoItem.item);
    content.appendChild(this.elementInfoItem.item);
    content.appendChild(this.abilityInfoItem.item);
    content.appendChild(this.jobAbilityInfoItem.item);
    content.appendChild(this.weaponInfoItem.item);
    content.appendChild(this.armorInfoItem.item);
    content.appendChild(this.accessoryInfoItem.item);

    return content;
  }

  // 클릭 가능한 정보 아이템 생성
  createClickableInfoItem(label, value, icon, backgroundColor, onClick) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      border: 1px solid #e5e7eb;
    `;

    // 호버 효과
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-1px)';
      item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      item.style.borderColor = '#d1d5db';
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
      item.style.boxShadow = 'none';
      item.style.borderColor = '#e5e7eb';
    });

    // 클릭 이벤트
    item.addEventListener('click', onClick);

    const iconElement = document.createElement('div');
    iconElement.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: ${backgroundColor};
      flex-shrink: 0;
    `;
    iconElement.textContent = icon;

    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const labelElement = document.createElement('div');
    labelElement.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    labelElement.textContent = label;

    const valueElement = document.createElement('div');
    valueElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      white-space: pre-line;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.5;
    `;
    valueElement.textContent = value;

    content.appendChild(labelElement);
    content.appendChild(valueElement);
    item.appendChild(iconElement);
    item.appendChild(content);

    return {
      item,
      iconElement,
      valueElement
    };
  }

  // 직업 정보 업데이트
  updateJobInfo(job) {
    if (this.jobInfoItem && job) {
      this.jobInfoItem.valueElement.textContent = job.name;
      this.jobInfoItem.iconElement.textContent = job.icon;
      this.jobInfoItem.iconElement.style.background = `${job.color}20`;
    }
  }

  // 속성 정보 업데이트
  updateElementInfo(element) {
    if (this.elementInfoItem && element) {
      this.elementInfoItem.valueElement.textContent = element.name;
      this.elementInfoItem.iconElement.textContent = element.icon;
      this.elementInfoItem.iconElement.style.background = `${element.color}20`;
    }
  }

  // 어빌리티 정보 업데이트
  updateAbilityInfo(abilities) {
    if (this.abilityInfoItem && abilities) {
      if (abilities.length === 0) {
        this.abilityInfoItem.valueElement.textContent = '어빌리티를 선택해주세요';
        this.abilityInfoItem.iconElement.textContent = '❓';
        this.abilityInfoItem.iconElement.style.background = '#f3f4f6';
      } else if (abilities.length === 1) {
        const ability = abilities[0];
        // 어빌리티 데이터 구조에 맞게 수정
        this.abilityInfoItem.valueElement.textContent = ability['어빌리티명'];
        
        const job = ability['직업'];
        this.abilityInfoItem.iconElement.textContent = ABILITY_MAPPINGS.iconMap[job] || '💫';
        this.abilityInfoItem.iconElement.style.background = `${ABILITY_MAPPINGS.colorMap[job] || '#6b7280'}20`;
      } else {
        this.abilityInfoItem.valueElement.textContent = `${abilities.length}개 선택됨`;
        this.abilityInfoItem.iconElement.textContent = '💫';
        this.abilityInfoItem.iconElement.style.background = '#8b5cf620';
      }
    }
  }

  // 직업 어빌리티 정보 업데이트
  updateJobAbilityInfo(abilities) {
    if (this.jobAbilityInfoItem && abilities) {
      if (abilities.length === 0) {
        this.jobAbilityInfoItem.valueElement.textContent = '어빌리티를 선택해주세요';
        this.jobAbilityInfoItem.iconElement.textContent = '🎯';
        this.jobAbilityInfoItem.iconElement.style.background = '#f3f4f6';
      } else if (abilities.length === 1) {
        const ability = abilities[0];
        // 어빌리티 데이터 구조에 맞게 수정
        this.jobAbilityInfoItem.valueElement.textContent = ability['어빌리티명'];
        
        const job = ability['직업'];
        this.jobAbilityInfoItem.iconElement.textContent = ABILITY_MAPPINGS.iconMap[job] || '🎯';
        this.jobAbilityInfoItem.iconElement.style.background = `${ABILITY_MAPPINGS.colorMap[job] || '#6b7280'}20`;
      } else {
        this.jobAbilityInfoItem.valueElement.textContent = `${abilities.length}개 선택됨`;
        this.jobAbilityInfoItem.iconElement.textContent = '🎯';
        this.jobAbilityInfoItem.iconElement.style.background = '#8b5cf620';
      }
    }
  }

  // 무기 정보 업데이트
  updateWeaponInfo(items) {
    if (this.weaponInfoItem && items) {
      if (items.length === 0) {
        this.weaponInfoItem.valueElement.textContent = '무기를 선택해주세요';
        this.weaponInfoItem.iconElement.textContent = '❓';
        this.weaponInfoItem.iconElement.style.background = '#f3f4f6';
      } else if (items.length === 1) {
        const weapon = items[0];
        
        // 아이템 이름과 타입
        let displayName = weapon.name;
        if (weapon.type) {
          const categories = weapon.type.split('/');
          if (categories.length >= 2) {
            displayName = `${weapon.name} (${categories[1]})`;
          } else if (categories.length === 1 && categories[0] === '무기') {
            displayName = `${weapon.name} (미확인)`;
          }
        }
        
        // 속성 정보
        let attributesText = '';
        if (weapon.attributes && Array.isArray(weapon.attributes) && weapon.attributes.length > 0) {
          attributesText = weapon.attributes.join(', ');
        }
        
        // 위력과 무게 범위
        const powerRange = (weapon.power_min !== null && weapon.power_min !== undefined && weapon.power_max !== null && weapon.power_max !== undefined) 
          ? `${weapon.power_min}-${weapon.power_max}` : 'N/A';
        const weightRange = (weapon.weight_min !== null && weapon.weight_min !== undefined && weapon.weight_max !== null && weapon.weight_max !== undefined) 
          ? `${weapon.weight_min}-${weapon.weight_max}` : 'N/A';
        
        // 속성이 있으면 속성 포함, 없으면 기본 형식
        const statsText = attributesText ? 
          `${attributesText} | 위력: ${powerRange} | 무게: ${weightRange}` :
          `위력: ${powerRange} | 무게: ${weightRange}`;
        
        // 어빌리티 정보
        let abilitiesText = '';
        if (weapon.abilities && Array.isArray(weapon.abilities) && weapon.abilities.length > 0) {
          // 어빌리티 이름만 추출 (설명 제외)
          const abilityNames = weapon.abilities.map(ability => {
            // "어빌리티명: 설명" 형태에서 어빌리티명만 추출
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          abilitiesText = abilityNames.join(', ');
        }
        
        // 전체 텍스트 조합
        const fullText = abilitiesText ? `${displayName}\n${statsText}\n${abilitiesText}` : `${displayName}\n${statsText}`;
        
        this.weaponInfoItem.valueElement.textContent = fullText;
        this.weaponInfoItem.iconElement.textContent = ITEM_CATEGORIES.weapon.icon;
        this.weaponInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.weapon.color}20`;
      } else {
        this.weaponInfoItem.valueElement.textContent = `${items.length}개 선택됨`;
        this.weaponInfoItem.iconElement.textContent = ITEM_CATEGORIES.weapon.icon;
        this.weaponInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.weapon.color}20`;
      }
    }
  }

  // 방어구 정보 업데이트
  updateArmorInfo(items) {
    if (this.armorInfoItem && items) {
      if (items.length === 0) {
        this.armorInfoItem.valueElement.textContent = '방어구를 선택해주세요';
        this.armorInfoItem.iconElement.textContent = '❓';
        this.armorInfoItem.iconElement.style.background = '#f3f4f6';
      } else if (items.length === 1) {
        const armor = items[0];
        
        // 아이템 이름
        const nameText = armor.name;
        
        // 속성 정보
        let attributesText = '';
        if (armor.attributes && Array.isArray(armor.attributes) && armor.attributes.length > 0) {
          attributesText = armor.attributes.join(', ');
        }
        
        // 위력과 무게 범위
        const powerRange = (armor.power_min !== null && armor.power_min !== undefined && armor.power_max !== null && armor.power_max !== undefined) 
          ? `${armor.power_min}-${armor.power_max}` : 'N/A';
        const weightRange = (armor.weight_min !== null && armor.weight_min !== undefined && armor.weight_max !== null && armor.weight_max !== undefined) 
          ? `${armor.weight_min}-${armor.weight_max}` : 'N/A';
        
        // 속성이 있으면 속성 포함, 없으면 기본 형식
        const statsText = attributesText ? 
          `${attributesText} | 위력: ${powerRange} | 무게: ${weightRange}` :
          `위력: ${powerRange} | 무게: ${weightRange}`;
        
        // 어빌리티 정보
        let abilitiesText = '';
        if (armor.abilities && Array.isArray(armor.abilities) && armor.abilities.length > 0) {
          // 어빌리티 이름만 추출 (설명 제외)
          const abilityNames = armor.abilities.map(ability => {
            // "어빌리티명: 설명" 형태에서 어빌리티명만 추출
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          abilitiesText = abilityNames.join(', ');
        }
        
        // 전체 텍스트 조합
        const fullText = abilitiesText ? `${nameText}\n${statsText}\n${abilitiesText}` : `${nameText}\n${statsText}`;
        
        this.armorInfoItem.valueElement.textContent = fullText;
        this.armorInfoItem.iconElement.textContent = ITEM_CATEGORIES.armor.icon;
        this.armorInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.armor.color}20`;
      } else {
        this.armorInfoItem.valueElement.textContent = `${items.length}개 선택됨`;
        this.armorInfoItem.iconElement.textContent = ITEM_CATEGORIES.armor.icon;
        this.armorInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.armor.color}20`;
      }
    }
  }

  // 장신구 정보 업데이트
  updateAccessoryInfo(items) {
    if (this.accessoryInfoItem && items) {
      if (items.length === 0) {
        this.accessoryInfoItem.valueElement.textContent = '장신구를 선택해주세요';
        this.accessoryInfoItem.iconElement.textContent = '❓';
        this.accessoryInfoItem.iconElement.style.background = '#f3f4f6';
      } else if (items.length === 1) {
        const accessory = items[0];
        
        // 아이템 이름
        const nameText = accessory.name;
        
        // 속성 정보
        let attributesText = '';
        if (accessory.attributes && Array.isArray(accessory.attributes) && accessory.attributes.length > 0) {
          attributesText = accessory.attributes.join(', ');
        }
        
        // 위력과 무게 범위
        const powerRange = (accessory.power_min !== null && accessory.power_min !== undefined && accessory.power_max !== null && accessory.power_max !== undefined) 
          ? `${accessory.power_min}-${accessory.power_max}` : 'N/A';
        const weightRange = (accessory.weight_min !== null && accessory.weight_min !== undefined && accessory.weight_max !== null && accessory.weight_max !== undefined) 
          ? `${accessory.weight_min}-${accessory.weight_max}` : 'N/A';
        
        // 속성이 있으면 속성 포함, 없으면 기본 형식
        const statsText = attributesText ? 
          `${attributesText} | 위력: ${powerRange} | 무게: ${weightRange}` :
          `위력: ${powerRange} | 무게: ${weightRange}`;
        
        // 어빌리티 정보
        let abilitiesText = '';
        if (accessory.abilities && Array.isArray(accessory.abilities) && accessory.abilities.length > 0) {
          // 어빌리티 이름만 추출 (설명 제외)
          const abilityNames = accessory.abilities.map(ability => {
            // "어빌리티명: 설명" 형태에서 어빌리티명만 추출
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          abilitiesText = abilityNames.join(', ');
        }
        
        // 전체 텍스트 조합
        const fullText = abilitiesText ? `${nameText}\n${statsText}\n${abilitiesText}` : `${nameText}\n${statsText}`;
        
        this.accessoryInfoItem.valueElement.textContent = fullText;
        this.accessoryInfoItem.iconElement.textContent = ITEM_CATEGORIES.accessory.icon;
        this.accessoryInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.accessory.color}20`;
      } else {
        this.accessoryInfoItem.valueElement.textContent = `${items.length}개 선택됨`;
        this.accessoryInfoItem.iconElement.textContent = ITEM_CATEGORIES.accessory.icon;
        this.accessoryInfoItem.iconElement.style.background = `${ITEM_CATEGORIES.accessory.color}20`;
      }
    }
  }

  // 정보 박스 초기화
  reset() {
    if (this.jobInfoItem) {
      this.jobInfoItem.valueElement.textContent = '직업을 선택해주세요';
      this.jobInfoItem.iconElement.textContent = '❓';
      this.jobInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.elementInfoItem) {
      this.elementInfoItem.valueElement.textContent = '속성을 선택해주세요';
      this.elementInfoItem.iconElement.textContent = '❓';
      this.elementInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.abilityInfoItem) {
      this.abilityInfoItem.valueElement.textContent = '어빌리티를 선택해주세요';
      this.abilityInfoItem.iconElement.textContent = '❓';
      this.abilityInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.jobAbilityInfoItem) {
      this.jobAbilityInfoItem.valueElement.textContent = '어빌리티를 선택해주세요';
      this.jobAbilityInfoItem.iconElement.textContent = '🎯';
      this.jobAbilityInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.weaponInfoItem) {
      this.weaponInfoItem.valueElement.textContent = '무기를 선택해주세요';
      this.weaponInfoItem.iconElement.textContent = '❓';
      this.weaponInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.armorInfoItem) {
      this.armorInfoItem.valueElement.textContent = '방어구를 선택해주세요';
      this.armorInfoItem.iconElement.textContent = '❓';
      this.armorInfoItem.iconElement.style.background = '#f3f4f6';
    }

    if (this.accessoryInfoItem) {
      this.accessoryInfoItem.valueElement.textContent = '장신구를 선택해주세요';
      this.accessoryInfoItem.iconElement.textContent = '❓';
      this.accessoryInfoItem.iconElement.style.background = '#f3f4f6';
    }
  }
}
