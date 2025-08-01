// 설정 관리자 모듈
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      showItemStats: true
    };
  }

  // 설정 로드
  async loadSettings() {
    try {
      // Chrome 스토리지에서 설정 로드
      return new Promise((resolve) => {
        chrome.storage.local.get(['itemStatsSettings'], (result) => {
          if (result.itemStatsSettings) {
            // 기존 설정과 기본 설정을 병합
            const settings = { ...this.defaultSettings, ...result.itemStatsSettings };
            resolve(settings);
          } else {
            // 기본 설정 사용
            resolve(this.defaultSettings);
          }
        });
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      return this.defaultSettings;
    }
  }

  // 설정 저장
  async saveSettings(settings) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({ itemStatsSettings: settings }, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  // 특정 설정 업데이트
  async updateSetting(key, value) {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings = { ...currentSettings, [key]: value };
      await this.saveSettings(newSettings);
      return newSettings;
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      return null;
    }
  }

  // 설정 초기화
  async resetSettings() {
    try {
      await this.saveSettings(this.defaultSettings);
      return this.defaultSettings;
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      return this.defaultSettings;
    }
  }
}

export default SettingsManager; 