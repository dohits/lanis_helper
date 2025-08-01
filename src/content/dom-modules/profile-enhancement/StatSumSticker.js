// 스탯합계 스티커 모듈
class StatSumSticker {
  constructor() {
    this.stickerClass = 'css-stat-sum-sticker';
  }

  init() {
    // 초기화 시 필요한 작업이 있다면 여기에 추가
  }

  process() {
    try {
      this.addStatSumStickers();
    } catch (error) {
      console.error('스탯합계 스티커 처리 중 오류:', error);
    }
  }

  addStatSumStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
      
      // 기본 스탯 섹션 찾기
      const statSections = document.querySelectorAll('.MuiPaper-root');
      
      statSections.forEach(section => {
        // "기본 스탯" 제목이 있는 섹션 찾기
        const titleElement = section.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 스탯')) {
          // 스탯합계 계산
          const statSum = this.calculateStatSum();
          
          // 스탯합계 스티커 컨테이너 생성
          const statSumStickerContainer = document.createElement('div');
          statSumStickerContainer.className = `MuiBox-root ${this.stickerClass}`;
          statSumStickerContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            padding: 2px 6px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            border-radius: 12px;
            border: 1px solid #2E7D32;
            width: auto;
            min-width: fit-content;
          `;
          
          // 스탯합계 스티커 텍스트
          const statSumStickerText = document.createElement('p');
          statSumStickerText.className = 'MuiTypography-root MuiTypography-body1';
          statSumStickerText.style.cssText = `
            color: white;
            font-size: 11px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          `;
          statSumStickerText.textContent = `스탯 점수 ${statSum}`;
          
          statSumStickerContainer.appendChild(statSumStickerText);
          
          // 제목 컨테이너를 flex로 만들어서 양 끝 정렬
          titleElement.style.display = 'flex';
          titleElement.style.justifyContent = 'space-between';
          titleElement.style.alignItems = 'center';
          titleElement.style.width = '100%';
          
          titleElement.appendChild(statSumStickerContainer);
        }
      });
      
    } catch (error) {
      console.error('스탯합계 스티커 추가 중 오류:', error);
    }
  }

  calculateStatSum() {
    try {
      let totalStat = 0;
      
      // 기본 스탯 섹션 찾기
      const statSections = document.querySelectorAll('.MuiPaper-root');
      
      statSections.forEach(section => {
        // "기본 스탯" 제목이 있는 섹션 찾기
        const titleElement = section.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 스탯')) {
          // 스탯 요소들 찾기
          const statElements = section.querySelectorAll('p.MuiTypography-root.MuiTypography-body1');
          
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
                
                totalStat += statValue;
              }
            });
          });
        }
      });
      
      return totalStat;
      
    } catch (error) {
      console.error('스탯합계 계산 중 오류:', error);
      return 0;
    }
  }

  destroy() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}`);
      existingStickers.forEach(sticker => sticker.remove());
    } catch (error) {
      console.error('스탯합계 스티커 제거 중 오류:', error);
    }
  }
}

export default StatSumSticker; 