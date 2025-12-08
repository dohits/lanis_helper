/**
 * 스펙 계산기 설정 저장 관리자
 * 로컬스토리지를 사용하여 최대 5개의 설정을 저장/불러오기
 */
const STORAGE_KEY = 'spec-calculator-presets';
const MAX_PRESETS = 5;

export class StorageManager {
  /**
   * 모든 프리셋 가져오기
   * @returns {Array} 프리셋 배열
   */
  static getAllPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('프리셋 불러오기 실패:', error);
      return [];
    }
  }

  /**
   * 프리셋 저장
   * @param {string} name - 프리셋 이름
   * @param {Object} data - 저장할 데이터
   * @returns {boolean} 저장 성공 여부
   */
  static savePreset(name, data) {
    if (!name || name.trim() === '') {
      return { success: false, message: '이름을 입력해주세요.' };
    }

    try {
      const presets = this.getAllPresets();
      
      // 최대 개수 확인
      if (presets.length >= MAX_PRESETS) {
        return { success: false, message: `최대 ${MAX_PRESETS}개까지 저장할 수 있습니다.` };
      }

      // 중복 이름 확인
      if (presets.some(p => p.name === name.trim())) {
        return { success: false, message: '이미 같은 이름의 설정이 있습니다.' };
      }

      // 새 프리셋 추가
      const newPreset = {
        id: Date.now().toString(),
        name: name.trim(),
        data: { ...data },
        createdAt: new Date().toISOString()
      };

      presets.push(newPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

      return { success: true, message: '저장되었습니다.' };
    } catch (error) {
      console.error('프리셋 저장 실패:', error);
      return { success: false, message: '저장에 실패했습니다.' };
    }
  }

  /**
   * 프리셋 불러오기
   * @param {string} id - 프리셋 ID
   * @returns {Object|null} 프리셋 데이터
   */
  static loadPreset(id) {
    try {
      const presets = this.getAllPresets();
      const preset = presets.find(p => p.id === id);
      return preset ? preset.data : null;
    } catch (error) {
      console.error('프리셋 불러오기 실패:', error);
      return null;
    }
  }

  /**
   * 프리셋 삭제
   * @param {string} id - 프리셋 ID
   * @returns {boolean} 삭제 성공 여부
   */
  static deletePreset(id) {
    try {
      const presets = this.getAllPresets();
      const filtered = presets.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('프리셋 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 프리셋 업데이트
   * @param {string} id - 프리셋 ID
   * @param {Object} data - 업데이트할 데이터
   * @returns {boolean} 업데이트 성공 여부
   */
  static updatePreset(id, data) {
    try {
      const presets = this.getAllPresets();
      const index = presets.findIndex(p => p.id === id);
      
      if (index === -1) return false;

      presets[index].data = { ...data };
      presets[index].updatedAt = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      return true;
    } catch (error) {
      console.error('프리셋 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 저장 가능한 개수 확인
   * @returns {number} 남은 저장 가능 개수
   */
  static getRemainingSlots() {
    const presets = this.getAllPresets();
    return Math.max(0, MAX_PRESETS - presets.length);
  }
}

