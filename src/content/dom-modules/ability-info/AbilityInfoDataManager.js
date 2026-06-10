// 어빌리티 정보 데이터 관리자 (공용 — 설정 모달 및 향후 아이템 스카우터에서 재사용)
import abilityData from '../../../shared/ability-data.json';

class AbilityInfoDataManager {
  // 번들된 JSON에서 데이터 반환
  getAbilityDataFromFile() {
    return abilityData || [];
  }

  // 현재 확장 프로그램 버전 (manifest 기준)
  getCurrentVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      return null;
    }
  }

  // 어빌리티 정보 로드 (버전 기반 Chrome 스토리지 캐싱, 항상 배열 반환)
  async load() {
    try {
      const currentVersion = this.getCurrentVersion();
      return await new Promise((resolve) => {
        chrome.storage.local.get(['abilityInfo', 'abilityInfoVersion'], (result) => {
          const cacheValid = result.abilityInfo
            && result.abilityInfo.length > 0
            && result.abilityInfoVersion === currentVersion;

          if (cacheValid) {
            resolve(result.abilityInfo);
          } else {
            const data = this.getAbilityDataFromFile();
            chrome.storage.local.set({
              abilityInfo: data,
              abilityInfoVersion: currentVersion,
              abilityInfoLastUpdate: Date.now()
            });
            resolve(data);
          }
        });
      });
    } catch (error) {
      console.error('[AbilityInfoDataManager] 어빌리티 정보 로드 실패:', error);
      return this.getAbilityDataFromFile();
    }
  }
}

export default AbilityInfoDataManager;
