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
      // 기존 스티커 제거 (이미 추가된 스티커는 제외)
      const existingStickers = document.querySelectorAll(`.${this.stickerClass}:not([data-enhanced="true"])`);
      existingStickers.forEach(sticker => sticker.remove());
      
      // 기본 스탯 섹션 찾기 (다크모드/화이트모드 모두 지원)
      const statSections = document.querySelectorAll('.MuiPaper-root');
      
      statSections.forEach(section => {
        // "기본 스탯" 제목이 있는 섹션 찾기
        const titleElement = section.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 스탯')) {
          // 이미 스티커가 있는지 확인
          const existingSticker = titleElement.querySelector(`.${this.stickerClass}`);
          if (existingSticker) {
            return; // 이미 스티커가 있으면 건너뛰기
          }
          
          // 스탯합계 계산
          const statSum = this.calculateStatSum(section);
          
          if (statSum === 0) {
            return; // 스탯 합계가 0이면 스티커 추가하지 않음
          }
          
          // 스탯합계 스티커 컨테이너 생성
          const statSumStickerContainer = document.createElement('div');
          statSumStickerContainer.className = `MuiBox-root ${this.stickerClass}`;
          statSumStickerContainer.setAttribute('data-enhanced', 'true');
          statSumStickerContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            padding: 2px 6px;
            background: linear-gradient(135deg, rgb(76, 175, 80) 0%, rgb(69, 160, 73) 100%);
            border-radius: 12px;
            border: 1px solid rgb(46, 125, 50);
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
            margin: 0px;
            text-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px;
          `;
          statSumStickerText.textContent = `스탯 점수 ${statSum.toLocaleString()}`;
          
          statSumStickerContainer.appendChild(statSumStickerText);
          
          // 제목 컨테이너를 flex로 만들어서 양 끝 정렬 (이미 스타일이 있으면 유지)
          if (!titleElement.style.display || titleElement.style.display !== 'flex') {
            titleElement.style.display = 'flex';
            titleElement.style.justifyContent = 'space-between';
            titleElement.style.alignItems = 'center';
            titleElement.style.width = '100%';
          }
          
          titleElement.appendChild(statSumStickerContainer);
        }
      });
      
    } catch (error) {
      console.error('스탯합계 스티커 추가 중 오류:', error);
    }
  }

  calculateStatSum(section) {
    try {
      let totalStat = 0;
      
      // 전달받은 섹션에서 스탯 계산, 없으면 전체 문서에서 찾기
      const targetSections = section ? [section] : document.querySelectorAll('.MuiPaper-root');
      
      targetSections.forEach(targetSection => {
        // "기본 스탯" 제목이 있는 섹션 찾기
        const titleElement = targetSection.querySelector('h6.MuiTypography-root');
        if (titleElement && titleElement.textContent.includes('기본 스탯')) {
          // 기본 스탯 섹션 내의 Grid 컨테이너 찾기 (더 정확한 범위 지정)
          const gridContainer = targetSection.querySelector('.MuiGrid-root.MuiGrid-container');
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