// 감정정보 등록 관련 로직
import { 
  enchantInfoRegistrationAPI,
  detectEquipmentType
} from '../data/equipment-data.js';

export class EnchantRegistration {
  constructor() {
    this.onSuccessCallback = null;
    this.onErrorCallback = null;
  }

  setOnSuccessCallback(callback) {
    this.onSuccessCallback = callback;
  }

  setOnErrorCallback(callback) {
    this.onErrorCallback = callback;
  }

  async handleEnchantInfoRegistration(equipment, appraisedStats, button) {
    try {
      // 버튼 비활성화
      button.disabled = true;
      button.textContent = '등록 중...';
      button.style.opacity = '0.7';

      // 현재 닉네임 가져오기
      const nickname = this.getCurrentNickname();
      if (!nickname) {
        throw new Error('닉네임을 찾을 수 없습니다. 프로필 페이지에서 다시 시도해주세요.');
      }

      // 30% 확률로 등록 성공, 70% 확률로 실패
      const successRate = Math.random();
      if (successRate > 0.3) {
        // 70% 확률로 실패
        // 실패 모달로 실패 메시지 표시
        if (this.onErrorCallback) {
          this.onErrorCallback('장비가 파괴 되었습니다.(70% 파괴)');
        }
        
        // 실패 시 등록 버튼을 비활성화하고 빨간색으로 변경
        button.disabled = true;
        button.textContent = '실패 발생';
        button.style.background = '#dc2626';
        button.style.color = 'white';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // 함수 종료 (API 호출하지 않음)
        return;
      }

      // 감정정보 객체 생성
      const enchantInfo = {
        equipmentType: equipment.type,
        equipmentName: equipment.name,
        power: appraisedStats.power ? appraisedStats.power.value : 0,
        weight: appraisedStats.weight ? appraisedStats.weight.value : 0,
        nickname: nickname
      };

      // 감정정보 등록 API 호출
      console.log('감정정보 등록 시도:', enchantInfo);
      let result;
      try {
        result = await enchantInfoRegistrationAPI.registerEnchantInfo(enchantInfo);
        console.log('API 응답:', result);
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        // API 오류를 result 형태로 변환
        result = {
          success: false,
          message: apiError.message || 'API 호출 중 오류가 발생했습니다.'
        };
      }

      if (result.success) {
        // 성공 메시지 표시
        button.textContent = '등록 완료!';
        button.style.background = '#10b981';
        button.style.color = 'white';
        
        // 등록 완료 후 버튼 비활성화 (재등록 방지)
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // 성공 모달 표시 - 올바른 점수 계산 사용
        const equipmentType = detectEquipmentType(equipment.name, equipment.type);
        let calculatedScore;
        if (equipmentType === 'accessory') {
          calculatedScore = appraisedStats.power.value * 5.5 - appraisedStats.weight.value * 2;
        } else {
          calculatedScore = appraisedStats.power.value - appraisedStats.weight.value * 2;
        }
        
        if (this.onSuccessCallback) {
          this.onSuccessCallback(equipment.name, appraisedStats.power.value, appraisedStats.weight.value, calculatedScore);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('감정정보 등록 오류:', error);
      
      // 오류 모달 표시
      if (this.onErrorCallback) {
        this.onErrorCallback(error.message || '알 수 없는 오류가 발생했습니다.');
      }
      
      // 점수 부족으로 실패한 경우 버튼 비활성화 (파괴된 것처럼 처리)
      if (error.message && error.message.includes('낮은 점수')) {
        button.disabled = true;
        button.textContent = '실패 발생';
        button.style.background = '#dc2626';
        button.style.color = 'white';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
      } else {
        // 다른 오류의 경우 버튼 상태 복원
        button.disabled = false;
        button.textContent = '감정정보 등록';
        button.style.background = '#3b82f6';
        button.style.opacity = '1';
      }
    }
  }

  // 현재 닉네임 가져오기
  getCurrentNickname() {
    try {
      // sessionStorage에서 닉네임 가져오기
      return sessionStorage.getItem('lanis_user_nickname');
    } catch (error) {
      console.error('닉네임 가져오기 실패:', error);
      return null;
    }
  }
}
