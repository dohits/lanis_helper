import GoogleSheetWriteAPI from './index.js';

// 장비 셋팅 시뮬레이션 전용 구글 시트 쓰기 API
export class EquipmentSettingAPI extends GoogleSheetWriteAPI {
  constructor() {
    super();
    
    // 장비 셋팅 시트 설정
    this.sheetId = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
    this.sheetName = '추천셋팅';
  }

  /**
   * 장비 셋팅 데이터를 구글 시트에 저장
   * @param {Object} settingData - 저장할 셋팅 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 결과 객체
   */
  async saveEquipmentSetting(settingData, options = {}) {
    if (!settingData) {
      return this.createErrorResponse('저장할 셋팅 데이터가 없습니다.');
    }

    try {
      // 데이터를 행 형태로 변환
      const rowData = this.convertSettingToRow(settingData);
      
      // 구글 시트에 추가
      const result = await this.appendData(this.sheetId, this.sheetName, [rowData], options);
      
      if (result.success) {
        return this.createSuccessResponse({
          message: '장비 셋팅이 성공적으로 저장되었습니다.',
          data: settingData
        });
      } else {
        return result;
      }

    } catch (error) {
      return this.createErrorResponse(`장비 셋팅 저장 실패: ${error.message}`);
    }
  }

  /**
   * 셋팅 추천하기
   * @param {string} userName - 추천하는 사용자 닉네임
   * @param {number} rowIndex - 추천할 행 인덱스 (1부터 시작)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 결과 객체
   */
  async recommendSetting(userName, rowIndex, options = {}) {
    try {
      if (!userName || !userName.trim()) {
        return this.createErrorResponse('사용자 닉네임이 필요합니다.');
      }

      if (!rowIndex || rowIndex < 1) {
        return this.createErrorResponse('유효한 행 인덱스가 필요합니다.');
      }

      // Google Apps Script 웹 앱을 통한 추천 업데이트
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbx_blLMp2K_iFufSZxybfHkLGMuZT6TsRaIsJyF9ACkkY8cd7YC18FYqBbpRmTqbZMvjA/exec';
      
      const { timeout = this.defaultTimeout } = options;

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'RECOMMEND_SETTING',
          url: webAppUrl,
          data: {
            action: 'recommend',
            userName: userName.trim(),
            rowIndex: rowIndex,
            sheetId: this.sheetId,
            sheetName: this.sheetName
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(this.createSuccessResponse({
              message: '추천이 성공적으로 추가되었습니다.',
              recommenders: response.recommenders,
              updatedCells: response.updatedCells
            }));
          } else {
            reject(new Error(response?.error || '추천 업데이트에 실패했습니다.'));
          }
        });
        
        // 타임아웃 설정
        setTimeout(() => {
          reject(new Error('타임아웃: 응답 대기 시간 초과'));
        }, 5000); // 5초로 단축
      });

    } catch (error) {
      return this.createErrorResponse(`추천 실패: ${error.message}`);
    }
  }

  /**
   * 현재 추천인 정보 가져오기
   * @param {number} rowIndex - 행 인덱스
   * @returns {Promise<string>} 추천인 문자열
   */
  async getCurrentRecommenders(rowIndex) {
    try {
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbx_blLMp2K_iFufSZxybfHkLGMuZT6TsRaIsJyF9ACkkY8cd7YC18FYqBbpRmTqbZMvjA/exec';

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'GET_RECOMMENDERS',
          url: webAppUrl,
          data: {
            action: 'getRecommenders',
            rowIndex: rowIndex,
            sheetId: this.sheetId,
            sheetName: this.sheetName
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('추천인 정보 가져오기 실패:', chrome.runtime.lastError);
            resolve('');
            return;
          }
          
          if (response && response.success) {
            resolve(response.recommenders || '');
          } else {
            console.error('추천인 정보 가져오기 실패:', response?.error);
            resolve('');
          }
        });
        
        // 타임아웃 설정
        setTimeout(() => {
          console.error('추천인 정보 가져오기 타임아웃');
          resolve('');
        }, 3000); // 3초로 단축
      });
    } catch (error) {
      console.error('추천인 정보 가져오기 실패:', error);
      return '';
    }
  }

  /**
   * 입력 데이터를 안전하게 처리하는 함수
   * @param {string} input - 입력 데이터
   * @returns {string} 안전한 데이터
   */
  sanitizeInput(input) {
    if (typeof input === 'string') {
      // 수식으로 시작하는 경우 작은따옴표 추가하여 텍스트로 처리
      if (input.startsWith('=')) {
        return `'${input}`;
      }
      // 특수 문자나 위험한 패턴 검사
      const dangerousPatterns = [
        /^=IMPORTXML\s*\(/i,
        /^=IMPORTHTML\s*\(/i,
        /^=HYPERLINK\s*\(/i,
        /^=GOOGLEFINANCE\s*\(/i,
        /^=INDIRECT\s*\(/i,
        /javascript:/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          return `'${input}`;
        }
      }
    }
    return input;
  }

  /**
   * 셋팅 데이터를 행 형태로 변환
   * @param {Object} settingData - 셋팅 데이터
   * @returns {Array} 행 데이터
   */
  convertSettingToRow(settingData) {
    const row = [];
    
    // 닉네임 (첫 번째 컬럼)
    row.push(this.sanitizeInput(settingData.userName || '익명 사용자'));
    
    // 장비 세트 이름
    row.push(this.sanitizeInput(settingData.setName || '무제'));
    
    // 장비 세트 설명
    row.push(this.sanitizeInput(settingData.setDescription || ''));
    
    // 직업 정보 - 객체에서 실제 값 추출
    let jobValue = '';
    if (settingData.job) {
      if (typeof settingData.job === 'object' && settingData.job.name) {
        jobValue = this.sanitizeInput(settingData.job.name);
      } else if (typeof settingData.job === 'string') {
        jobValue = this.sanitizeInput(settingData.job);
      }
    }
    row.push(jobValue);
    
    // 속성 정보 - 객체에서 실제 값 추출
    let elementValue = '';
    if (settingData.element) {
      if (typeof settingData.element === 'object' && settingData.element.name) {
        elementValue = this.sanitizeInput(settingData.element.name);
      } else if (typeof settingData.element === 'string') {
        elementValue = this.sanitizeInput(settingData.element);
      }
    }
    row.push(elementValue);
    
    // 어빌리티 정보 - 배열에서 이름 추출
    let mainAbilityValue = '';
    if (settingData.mainAbility && Array.isArray(settingData.mainAbility)) {
      mainAbilityValue = settingData.mainAbility.map(ability => {
        let abilityName = '';
        if (typeof ability === 'object' && ability['어빌리티명']) {
          abilityName = ability['어빌리티명'];
        } else if (typeof ability === 'object' && ability.name) {
          abilityName = ability.name;
        } else if (typeof ability === 'string') {
          abilityName = ability;
        }
        return this.sanitizeInput(abilityName);
      }).filter(name => name).join(', ');
    }
    row.push(mainAbilityValue);
    
    let jobAbilityValue = '';
    if (settingData.jobAbility && Array.isArray(settingData.jobAbility)) {
      jobAbilityValue = settingData.jobAbility.map(ability => {
        let abilityName = '';
        if (typeof ability === 'object' && ability['어빌리티명']) {
          abilityName = ability['어빌리티명'];
        } else if (typeof ability === 'object' && ability.name) {
          abilityName = ability.name;
        } else if (typeof ability === 'string') {
          abilityName = ability;
        }
        return this.sanitizeInput(abilityName);
      }).filter(name => name).join(', ');
    }
    row.push(jobAbilityValue);
    
    // 무기 정보 - 배열에서 이름 추출
    let weaponValue = '';
    let weaponAttribute = '';
    let weaponPower = '';
    let weaponWeight = '';
    let weaponAbility = '';
    
    if (settingData.weapon && Array.isArray(settingData.weapon)) {
      weaponValue = settingData.weapon.map(weapon => {
        let weaponName = '';
        if (typeof weapon === 'object' && weapon.name) {
          weaponName = weapon.name;
        } else if (typeof weapon === 'string') {
          weaponName = weapon;
        }
        return this.sanitizeInput(weaponName);
      }).filter(name => name).join(', ');
      
      // 첫 번째 무기의 상세 정보 추출
      if (settingData.weapon.length > 0 && typeof settingData.weapon[0] === 'object') {
        const weapon = settingData.weapon[0];
        
        // 속성 정보
        if (weapon.attributes && Array.isArray(weapon.attributes) && weapon.attributes.length > 0) {
          weaponAttribute = this.sanitizeInput(weapon.attributes.join(', '));
        }
        
        // 위력 정보
        if (weapon.power_min !== null && weapon.power_min !== undefined && 
            weapon.power_max !== null && weapon.power_max !== undefined) {
          weaponPower = this.sanitizeInput(`${weapon.power_min}-${weapon.power_max}`);
        }
        
        // 무게 정보
        if (weapon.weight_min !== null && weapon.weight_min !== undefined && 
            weapon.weight_max !== null && weapon.weight_max !== undefined) {
          weaponWeight = this.sanitizeInput(`${weapon.weight_min}-${weapon.weight_max}`);
        }
        
        // 어빌리티 정보
        if (weapon.abilities && Array.isArray(weapon.abilities) && weapon.abilities.length > 0) {
          const abilityNames = weapon.abilities.map(ability => {
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          weaponAbility = this.sanitizeInput(abilityNames.join(', '));
        }
      }
    }
    row.push(weaponValue);
    row.push(weaponAttribute);
    row.push(weaponPower);
    row.push(weaponWeight);
    row.push(weaponAbility);
    
    // 방어구 정보 - 배열에서 이름 추출
    let armorValue = '';
    let armorAttribute = '';
    let armorPower = '';
    let armorWeight = '';
    let armorAbility = '';
    
    if (settingData.armor && Array.isArray(settingData.armor)) {
      armorValue = settingData.armor.map(armor => {
        let armorName = '';
        if (typeof armor === 'object' && armor.name) {
          armorName = armor.name;
        } else if (typeof armor === 'string') {
          armorName = armor;
        }
        return this.sanitizeInput(armorName);
      }).filter(name => name).join(', ');
      
      // 첫 번째 방어구의 상세 정보 추출
      if (settingData.armor.length > 0 && typeof settingData.armor[0] === 'object') {
        const armor = settingData.armor[0];
        
        // 속성 정보
        if (armor.attributes && Array.isArray(armor.attributes) && armor.attributes.length > 0) {
          armorAttribute = this.sanitizeInput(armor.attributes.join(', '));
        }
        
        // 위력 정보
        if (armor.power_min !== null && armor.power_min !== undefined && 
            armor.power_max !== null && armor.power_max !== undefined) {
          armorPower = this.sanitizeInput(`${armor.power_min}-${armor.power_max}`);
        }
        
        // 무게 정보
        if (armor.weight_min !== null && armor.weight_min !== undefined && 
            armor.weight_max !== null && armor.weight_max !== undefined) {
          armorWeight = this.sanitizeInput(`${armor.weight_min}-${armor.weight_max}`);
        }
        
        // 어빌리티 정보
        if (armor.abilities && Array.isArray(armor.abilities) && armor.abilities.length > 0) {
          const abilityNames = armor.abilities.map(ability => {
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          armorAbility = this.sanitizeInput(abilityNames.join(', '));
        }
      }
    }
    row.push(armorValue);
    row.push(armorAttribute);
    row.push(armorPower);
    row.push(armorWeight);
    row.push(armorAbility);
    
    // 장신구 정보 - 배열에서 이름 추출
    let accessoryValue = '';
    let accessoryAttribute = '';
    let accessoryPower = '';
    let accessoryWeight = '';
    let accessoryAbility = '';
    
    if (settingData.accessory && Array.isArray(settingData.accessory)) {
      accessoryValue = settingData.accessory.map(accessory => {
        let accessoryName = '';
        if (typeof accessory === 'object' && accessory.name) {
          accessoryName = accessory.name;
        } else if (typeof accessory === 'string') {
          accessoryName = accessory;
        }
        return this.sanitizeInput(accessoryName);
      }).filter(name => name).join(', ');
      
      // 첫 번째 장신구의 상세 정보 추출
      if (settingData.accessory.length > 0 && typeof settingData.accessory[0] === 'object') {
        const accessory = settingData.accessory[0];
        
        // 속성 정보
        if (accessory.attributes && Array.isArray(accessory.attributes) && accessory.attributes.length > 0) {
          accessoryAttribute = this.sanitizeInput(accessory.attributes.join(', '));
        }
        
        // 위력 정보
        if (accessory.power_min !== null && accessory.power_min !== undefined && 
            accessory.power_max !== null && accessory.power_max !== undefined) {
          accessoryPower = this.sanitizeInput(`${accessory.power_min}-${accessory.power_max}`);
        }
        
        // 무게 정보
        if (accessory.weight_min !== null && accessory.weight_min !== undefined && 
            accessory.weight_max !== null && accessory.weight_max !== undefined) {
          accessoryWeight = this.sanitizeInput(`${accessory.weight_min}-${accessory.weight_max}`);
        }
        
        // 어빌리티 정보
        if (accessory.abilities && Array.isArray(accessory.abilities) && accessory.abilities.length > 0) {
          const abilityNames = accessory.abilities.map(ability => {
            const colonIndex = ability.indexOf(':');
            return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
          });
          accessoryAbility = this.sanitizeInput(abilityNames.join(', '));
        }
      }
    }
    row.push(accessoryValue);
    row.push(accessoryAttribute);
    row.push(accessoryPower);
    row.push(accessoryWeight);
    row.push(accessoryAbility);
    
    // 메모 - 중복 저장 시간 제거
    row.push(this.sanitizeInput(settingData.notes || ''));
    
    // 추천인 (기본값: 빈 문자열)
    row.push('');
    
    return row;
  }

  /**
   * 시트 초기화 (헤더 생성)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 결과 객체
   */
  async initializeSheet(options = {}) {
    try {
      // 헤더 데이터 생성
      const headers = [
        '닉네임',
        '장비 세트 이름',
        '장비 세트 설명',
        '직업',
        '속성',
        '메인 어빌리티',
        '직업 어빌리티',
        '무기',
        '무기 속성',
        '무기 위력',
        '무기 무게',
        '무기 어빌리티',
        '방어구',
        '방어구 속성',
        '방어구 위력',
        '방어구 무게',
        '방어구 어빌리티',
        '장신구',
        '장신구 속성',
        '장신구 위력',
        '장신구 무게',
        '장신구 어빌리티',
        '저장 시간',
        '추천인'
      ];
      
      // 헤더 추가
      const result = await this.appendData(this.sheetId, this.sheetName, [headers], options);
      
      if (result.success) {
        return this.createSuccessResponse({
          message: '시트가 성공적으로 초기화되었습니다.',
          headers: headers
        });
      } else {
        return result;
      }

    } catch (error) {
      return this.createErrorResponse(`시트 초기화 실패: ${error.message}`);
    }
  }
}
