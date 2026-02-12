// 전투력 스티커 모듈
class CombatPowerSticker {
  constructor() {
    this.stickerClass = 'css-temp-sticker';
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  process() {
    try {
      this.addCombatPowerStickers();
    } catch (error) {
      console.error('전투력 스티커 처리 중 오류:', error);
    }
  }

  addCombatPowerStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
      
      // 직업/레벨 스티커 컨테이너 찾기 (다크모드/화이트모드, 일반/자신 프로필 모두 지원)
      const jobLevelContainers = document.querySelectorAll(
        '.MuiBox-root.css-1ep0pmc, ' +
        '.MuiBox-root.css-auxkcs, ' +
        '.MuiBox-root.css-1q60s4v, ' +
        '.MuiBox-root.css-1uojo6s, ' +
        '.MuiBox-root.css-zkvdw9, ' +
        '.MuiBox-root.css-1pvbt06, ' +
        '.MuiBox-root.css-dz79az'
      );
      
      jobLevelContainers.forEach(container => {
        // 직업과 레벨 요소 확인 (새로운 구조 지원, 일반 프로필 보기 포함)
        const jobElement = container.querySelector(
          '.MuiBox-root.css-new8hh p, ' +
          '.MuiBox-root.css-1q60s4v p, ' +
          '.MuiBox-root.css-zkvdw9 p'
        );
        const levelElement = container.querySelector(
          '.MuiBox-root.css-10cne0w p, ' +
          '.MuiBox-root.css-1uojo6s p, ' +
          '.MuiBox-root.css-1pvbt06 p, ' +
          '.MuiBox-root.css-1afk1pn p'
        );
        
        // 일반 프로필 보기의 경우, 컨테이너 자체가 직업/레벨을 포함하는 경우도 처리
        if (!jobElement || !levelElement) {
          // 일반 프로필 보기 구조: .css-dz79az 내부에 직업/레벨이 직접 있음
          if (container.classList.contains('css-dz79az')) {
            const directJobElement = container.querySelector('.MuiBox-root.css-zkvdw9 p');
            const directLevelElement = container.querySelector('.MuiBox-root.css-1afk1pn p');
            if (directJobElement && directLevelElement) {
              // 전투력 계산
              const combatPower = this.calculateCombatPower();
              
              // 전투력 스티커 컨테이너 생성
              const tempStickerContainer = document.createElement('div');
              tempStickerContainer.className = `MuiBox-root ${this.stickerClass}`;
              tempStickerContainer.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 8px;
                padding: 2px 6px;
                background: linear-gradient(135deg, rgb(0 0 0) 0%, rgb(255 13 0) 100%);
                border-radius: 12px;
                border: 1px solid rgb(255 255 255);
              `;
              
              // 전투력 스티커 텍스트
              const tempStickerText = document.createElement('p');
              tempStickerText.className = 'MuiTypography-root MuiTypography-body1';
              tempStickerText.style.cssText = `
                color: white;
                font-size: 11px;
                font-weight: bold;
                margin: 0;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              `;
              tempStickerText.textContent = `전투력 ${combatPower}`;
              
              tempStickerContainer.appendChild(tempStickerText);
              container.appendChild(tempStickerContainer);
            }
          }
          return; // 일반 프로필 보기 처리가 완료되었거나 요소를 찾지 못한 경우
        }
        
        if (jobElement && levelElement) {
          // 전투력 계산
          const combatPower = this.calculateCombatPower();
          
          // 전투력 스티커 컨테이너 생성
          const tempStickerContainer = document.createElement('div');
          tempStickerContainer.className = `MuiBox-root ${this.stickerClass}`;
          tempStickerContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
            padding: 2px 6px;
            background: linear-gradient(135deg, rgb(0 0 0) 0%, rgb(255 13 0) 100%);
            border-radius: 12px;
            border: 1px solid rgb(255 255 255);
          `;
          
          // 전투력 스티커 텍스트
          const tempStickerText = document.createElement('p');
          tempStickerText.className = 'MuiTypography-root MuiTypography-body1';
          tempStickerText.style.cssText = `
            color: white;
            font-size: 11px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          `;
          tempStickerText.textContent = `전투력 ${combatPower}`;
          
          tempStickerContainer.appendChild(tempStickerText);
          container.appendChild(tempStickerContainer);
        }
      });
      
    } catch (error) {
      console.error('전투력 스티커 추가 중 오류:', error);
    }
  }

  calculateCombatPower() {
    try {
      let totalPower = 0;
      let hp = 0;
      let mp = 0;
      
      // 기본 스탯 섹션 찾기
      const statSections = document.querySelectorAll('.MuiPaper-root');
      
      statSections.forEach(section => {
        // "기본 스탯" 제목이 있는 섹션 찾기
        const titleElement = section.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 스탯')) {
          // 기본 스탯 섹션 내의 Grid 컨테이너 찾기 (더 정확한 범위 지정)
          const gridContainer = section.querySelector('.MuiGrid-root.MuiGrid-container');
          if (!gridContainer) {
            return; // Grid 컨테이너가 없으면 건너뛰기
          }
          
          // 스탯 요소들 찾기 (변경된 DOM 구조 지원: div.MuiBox-root 또는 p.MuiTypography-root)
          // Grid 컨테이너 내에서만 찾아서 정확도 향상
          const statElements = gridContainer.querySelectorAll(
            'div.MuiBox-root.css-1rmhebz, ' +
            'div.MuiBox-root.css-6tgdh8, ' +
            'p.MuiTypography-root.MuiTypography-body1'
          );
          
          statElements.forEach(statElement => {
            const statText = statElement.textContent.trim();
            
            // 스탯 패턴 매칭 (힘, 생명, 정신, 지능, 행운, 속도)
            const statPatterns = [
              /힘:\s*(\d+)/,
              /생명:\s*(\d+)/,
              /정신:\s*(\d+)/,
              /지능:\s*(\d+)/,
              /행운:\s*(\d+)/,
              /속도:\s*(\d+)/
            ];
            
            statPatterns.forEach(pattern => {
              const match = statText.match(pattern);
              if (match) {
                // 괄호가 있는 경우 (자신 프로필) 첫 번째 숫자만 사용
                let statValue = parseInt(match[1]);
                
                // 괄호가 있는 경우 처리 (예: "힘: 401 (434)")
                const bracketMatch = statText.match(/\((\d+)\)/);
                if (bracketMatch) {
                  // 괄호 안의 숫자는 무시하고 첫 번째 숫자만 사용
                  statValue = parseInt(match[1]);
                }
                
                totalPower += statValue;
              }
            });
          });
        }
      });
      
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
      
      // 최종 전투력 계산: 스탯 합계 + (체력+마력)/3
      const hpMpBonus = Math.floor((hp + mp) / 3);
      const finalPower = totalPower + hpMpBonus;
      
      // 부동소수점 오류 방지를 위해 정수로 반환
      return Math.floor(finalPower);
      
    } catch (error) {
      console.error('전투력 계산 중 오류:', error);
      return 0;
    }
  }

  destroy() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
    } catch (error) {
      console.error('전투력 스티커 제거 중 오류:', error);
    }
  }
}

export default CombatPowerSticker; 