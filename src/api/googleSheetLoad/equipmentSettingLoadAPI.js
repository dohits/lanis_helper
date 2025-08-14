import GoogleSheetAPI from './index.js';
import { SHEET_IDS, EQUIPMENT_SETTING_GID } from '../../shared/constants.js';

// 장비 셋팅 데이터 로드 API
export class EquipmentSettingLoadAPI extends GoogleSheetAPI {
  constructor() {
    super();
    
    // 장비 셋팅 시트 설정
    this.sheetId = SHEET_IDS.EQUIPMENT_SETTING;
    this.sheetName = '추천셋팅';
  }

  /**
   * 모든 장비 셋팅 데이터를 가져오기
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 결과 객체
   */
  async getAllSettings(options = {}) {
    try {
      // 구글 시트에서 CSV 데이터 가져오기
      const csvData = await this.fetchCSVData(this.sheetId, EQUIPMENT_SETTING_GID, options);
      
      if (!this.validateData(csvData, 2)) {
        return this.createErrorResponse('데이터가 비어있거나 유효하지 않습니다.');
      }

      // 헤더 정보 추출
      const headers = csvData[0];
      const dataRows = csvData.slice(1);

      // 데이터 파싱 (역순으로 처리하여 최신 데이터가 먼저 오도록)
      const settings = dataRows.reverse().map((row, index) => {
        return this.parseSettingRow(row, headers, dataRows.length - index);
      }).filter(setting => setting !== null);

      return this.createSuccessResponse({
        settings: settings,
        totalCount: settings.length
      });

    } catch (error) {
      return this.createErrorResponse(`장비 셋팅 데이터 로드 실패: ${error.message}`);
    }
  }

  /**
   * 행 데이터를 셋팅 객체로 파싱
   * @param {Array} row - 행 데이터
   * @param {Array} headers - 헤더 정보
   * @param {number} rowIndex - 행 인덱스
   * @returns {Object|null} 파싱된 셋팅 객체
   */
  parseSettingRow(row, headers, rowIndex) {
    try {
      // 디버깅: 실제 헤더 출력
      if (rowIndex === 1) {
        console.log('[EquipmentSettingLoadAPI] 실제 헤더:', headers);
      }

      // 빈 행 체크 (모든 셀이 비어있는 경우)
      const isEmptyRow = row.every(cell => !cell || cell.trim() === '');
      if (isEmptyRow) {
        return null;
      }

      // 헤더 인덱스 매핑
      const headerIndices = {
        nickname: this.findHeaderIndex(headers, '닉네임'),
        setName: this.findHeaderIndex(headers, '장비 세트 이름'),
        setDescription: this.findHeaderIndex(headers, '장비 세트 설명'),
        job: this.findHeaderIndex(headers, '직업'),
        element: this.findHeaderIndex(headers, '속성'),
        mainAbility: this.findHeaderIndex(headers, '메인 어빌리티'),
        jobAbility: this.findHeaderIndex(headers, '직업 어빌리티'),
        weapon: this.findHeaderIndex(headers, '무기'),
        weaponAttribute: this.findHeaderIndex(headers, '무기 속성'),
        weaponPower: this.findHeaderIndex(headers, '무기 위력'),
        weaponWeight: this.findHeaderIndex(headers, '무기 무게'),
        weaponAbility: this.findHeaderIndex(headers, '무기 어빌리티'),
        armor: this.findHeaderIndex(headers, '방어구'),
        armorAttribute: this.findHeaderIndex(headers, '방어구 속성'),
        armorPower: this.findHeaderIndex(headers, '방어구 위력'),
        armorWeight: this.findHeaderIndex(headers, '방어구 무게'),
        armorAbility: this.findHeaderIndex(headers, '방어구 어빌리티'),
        accessory: this.findHeaderIndex(headers, '장신구'),
        accessoryAttribute: this.findHeaderIndex(headers, '장신구 속성'),
        accessoryPower: this.findHeaderIndex(headers, '장신구 위력'),
        accessoryWeight: this.findHeaderIndex(headers, '장신구 무게'),
        accessoryAbility: this.findHeaderIndex(headers, '장신구 어빌리티'),
        saveTime: this.findHeaderIndex(headers, '저장 시간'),
        recommenders: this.findHeaderIndex(headers, '추천인')
      };

      // 디버깅: 헤더 인덱스 출력
      if (rowIndex === 1) {
        console.log('[EquipmentSettingLoadAPI] 헤더 인덱스:', headerIndices);
      }

      // 필수 필드 검증 (닉네임이나 장비 세트 이름 중 하나라도 있으면 OK)
      if (headerIndices.nickname === -1 && headerIndices.setName === -1) {
        console.warn(`[EquipmentSettingLoadAPI] 필수 헤더 누락: 행 ${rowIndex}`, {
          nicknameIndex: headerIndices.nickname,
          setNameIndex: headerIndices.setName,
          headers: headers
        });
        return null;
      }

      // 닉네임이나 셋팅 이름이 비어있는 경우 제외
      const nickname = headerIndices.nickname !== -1 ? (row[headerIndices.nickname] || '') : '';
      const setName = headerIndices.setName !== -1 ? (row[headerIndices.setName] || '') : '';
      
      if (!nickname.trim() && !setName.trim()) {
        return null;
      }

      return {
        id: rowIndex,
        nickname: nickname,
        setName: setName,
        setDescription: headerIndices.setDescription !== -1 ? (row[headerIndices.setDescription] || '') : '',
        job: headerIndices.job !== -1 ? (row[headerIndices.job] || '') : '',
        element: headerIndices.element !== -1 ? (row[headerIndices.element] || '') : '',
        mainAbility: headerIndices.mainAbility !== -1 ? (row[headerIndices.mainAbility] || '') : '',
        jobAbility: headerIndices.jobAbility !== -1 ? (row[headerIndices.jobAbility] || '') : '',
        weapon: headerIndices.weapon !== -1 ? (row[headerIndices.weapon] || '') : '',
        weaponAttribute: headerIndices.weaponAttribute !== -1 ? (row[headerIndices.weaponAttribute] || '') : '',
        weaponPower: headerIndices.weaponPower !== -1 ? (row[headerIndices.weaponPower] || '') : '',
        weaponWeight: headerIndices.weaponWeight !== -1 ? (row[headerIndices.weaponWeight] || '') : '',
        weaponAbility: headerIndices.weaponAbility !== -1 ? (row[headerIndices.weaponAbility] || '') : '',
        armor: headerIndices.armor !== -1 ? (row[headerIndices.armor] || '') : '',
        armorAttribute: headerIndices.armorAttribute !== -1 ? (row[headerIndices.armorAttribute] || '') : '',
        armorPower: headerIndices.armorPower !== -1 ? (row[headerIndices.armorPower] || '') : '',
        armorWeight: headerIndices.armorWeight !== -1 ? (row[headerIndices.armorWeight] || '') : '',
        armorAbility: headerIndices.armorAbility !== -1 ? (row[headerIndices.armorAbility] || '') : '',
        accessory: headerIndices.accessory !== -1 ? (row[headerIndices.accessory] || '') : '',
        accessoryAttribute: headerIndices.accessoryAttribute !== -1 ? (row[headerIndices.accessoryAttribute] || '') : '',
        accessoryPower: headerIndices.accessoryPower !== -1 ? (row[headerIndices.accessoryPower] || '') : '',
        accessoryWeight: headerIndices.accessoryWeight !== -1 ? (row[headerIndices.accessoryWeight] || '') : '',
        accessoryAbility: headerIndices.accessoryAbility !== -1 ? (row[headerIndices.accessoryAbility] || '') : '',
        saveTime: headerIndices.saveTime !== -1 ? (row[headerIndices.saveTime] || '') : '',
        recommenders: headerIndices.recommenders !== -1 ? (row[headerIndices.recommenders] || '') : ''
      };

    } catch (error) {
      console.error(`[EquipmentSettingLoadAPI] 행 ${rowIndex} 파싱 오류:`, error);
      return null;
    }
  }

  /**
   * 헤더에서 특정 컬럼의 인덱스 찾기
   * @param {Array} headers - 헤더 배열
   * @param {string} columnName - 찾을 컬럼명
   * @returns {number} 컬럼 인덱스 (-1이면 없음)
   */
  findHeaderIndex(headers, columnName) {
    return headers.findIndex(header => 
      header && header.trim() === columnName
    );
  }
}
