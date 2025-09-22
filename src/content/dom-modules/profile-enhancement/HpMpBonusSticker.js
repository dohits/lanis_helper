// HP/MP 보너스 스티커 모듈
class HpMpBonusSticker {
  constructor() {
    this.stickerClass = 'css-hp-mp-bonus-sticker';
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  process() {
    try {
      this.addHpMpBonusStickers();
    } catch (error) {
      console.error('HP/MP 보너스 스티커 처리 중 오류:', error);
    }
  }

  addHpMpBonusStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
      
      // 기본 정보 섹션 찾기 - 더 구체적인 선택자 사용
      const infoSections = document.querySelectorAll('.MuiPaper-root');
      let addedToFirst = false; // 첫 번째 섹션에만 추가하기 위한 플래그
      
      infoSections.forEach(section => {
        // "기본 정보" 제목이 있는 섹션 찾기
        const titleElement = section.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 정보') && !addedToFirst) {
          // HP/MP 보너스 계산
          const hpMpBonus = this.calculateHpMpBonus();
          
          // HP/MP 보너스 스티커 컨테이너 생성
          const hpMpBonusStickerContainer = document.createElement('div');
          hpMpBonusStickerContainer.className = `MuiBox-root ${this.stickerClass}`;
          hpMpBonusStickerContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            padding: 2px 6px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border-radius: 12px;
            border: 1px solid #0D47A1;
            width: auto;
            min-width: fit-content;
          `;
          
          // HP/MP 보너스 스티커 텍스트
          const hpMpBonusStickerText = document.createElement('p');
          hpMpBonusStickerText.className = 'MuiTypography-root MuiTypography-body1';
          hpMpBonusStickerText.style.cssText = `
            color: white;
            font-size: 11px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          `;
          hpMpBonusStickerText.textContent = `HP/MP 점수 ${hpMpBonus}`;
          
          hpMpBonusStickerContainer.appendChild(hpMpBonusStickerText);
          
          // 제목 컨테이너를 flex로 만들어서 양 끝 정렬
          titleElement.style.display = 'flex';
          titleElement.style.justifyContent = 'space-between';
          titleElement.style.alignItems = 'center';
          titleElement.style.width = '100%';
          
          titleElement.appendChild(hpMpBonusStickerContainer);
          
          addedToFirst = true; // 첫 번째 섹션에 추가했음을 표시
        }
      });
      
    } catch (error) {
      console.error('HP/MP 보너스 스티커 추가 중 오류:', error);
    }
  }

  calculateHpMpBonus() {
    try {
      let hp = 0;
      let mp = 0;
      
      // HP/MP 값 찾기 - 새로운 CSS 클래스 지원
      const hpMpContainers = document.querySelectorAll('.MuiBox-root.css-ti5bpj, .MuiBox-root.css-0, .MuiBox-root.css-1s43vpi');
      
      hpMpContainers.forEach(container => {
        const hpMpElements = container.querySelectorAll('p.MuiTypography-root.MuiTypography-body1');
        
        hpMpElements.forEach(element => {
          const text = element.textContent.trim();
          
          // HP 패턴 매칭 (예: "2350 / 2350", "2126 / 2126")
          const hpMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/);
          if (hpMatch) {
            // 이전 요소가 "HP"인지 확인
            const prevElement = element.previousElementSibling;
            if (prevElement && prevElement.textContent.trim() === 'HP') {
              hp = parseInt(hpMatch[2]); // 최대 HP 값 사용
            }
          }
          
          // MP 패턴 매칭 (예: "1094 / 1094", "68 / 788")
          const mpMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/);
          if (mpMatch) {
            // 이전 요소가 "MP"인지 확인
            const prevElement = element.previousElementSibling;
            if (prevElement && prevElement.textContent.trim() === 'MP') {
              mp = parseInt(mpMatch[2]); // 최대 MP 값 사용
            }
          }
        });
      });
      
      // HP/MP 보너스 계산: (HP+MP)/3
      const hpMpBonus = Math.floor((hp + mp) / 3);
      
      return hpMpBonus;
      
    } catch (error) {
      console.error('HP/MP 보너스 계산 중 오류:', error);
      return 0;
    }
  }

  destroy() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
    } catch (error) {
      console.error('HP/MP 보너스 스티커 제거 중 오류:', error);
    }
  }
}

export default HpMpBonusSticker; 