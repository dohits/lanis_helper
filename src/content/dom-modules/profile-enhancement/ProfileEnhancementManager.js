// 프로필 강화 관리자 (스티커 표시 기능)
import CombatPowerSticker from './CombatPowerSticker.js';
import StatSumSticker from './StatSumSticker.js';
import HpMpBonusSticker from './HpMpBonusSticker.js';
import DynamicContentObserver from './DynamicContentObserver.js';

class ProfileEnhancementManager {
  constructor() {
    this.isProcessing = false;
    this.modules = {
      combatPowerSticker: new CombatPowerSticker(),
      statSumSticker: new StatSumSticker(),
      hpMpBonusSticker: new HpMpBonusSticker(),
      dynamicObserver: new DynamicContentObserver()
    };
  }

  init() {
    try {
      // 각 모듈 초기화
      this.modules.combatPowerSticker.init();
      this.modules.statSumSticker.init();
      this.modules.hpMpBonusSticker.init();
      this.modules.dynamicObserver.init(this);
      
      console.log('ProfileEnhancementManager 초기화 완료');
    } catch (error) {
      console.error('ProfileEnhancementManager 초기화 중 오류:', error);
    }
  }

  processProfileEnhancement() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 각 스티커 모듈의 처리 메서드 호출
      this.modules.combatPowerSticker.process();
      this.modules.statSumSticker.process();
      this.modules.hpMpBonusSticker.process();

    } catch (error) {
      console.error('프로필 강화 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  destroy() {
    try {
      // 각 모듈 정리
      this.modules.combatPowerSticker.destroy();
      this.modules.statSumSticker.destroy();
      this.modules.hpMpBonusSticker.destroy();
      this.modules.dynamicObserver.destroy();
      
      console.log('ProfileEnhancementManager 정리 완료');
    } catch (error) {
      console.error('ProfileEnhancementManager 정리 중 오류:', error);
    }
  }

  isProcessingEnhancement() {
    return this.isProcessing;
  }
}

export default ProfileEnhancementManager; 