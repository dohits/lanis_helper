// 사용자 프로필 관리자 (구버전 방식 완전 적용)
class UserProfileManager {
  constructor() {
    this.isProcessing = false;
    this.observer = null;
  }

  init() {
    this.processUserNames();
    this.startDynamicContentObserver();
    // 초기 스티커 추가
    this.addTemporaryStickers();
    this.addStatSumStickers();
    this.addHpMpBonusStickers();
  }

  processUserNames() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 구버전 방식: li 태그들을 찾아서 사용자 이름 처리
      const messageItems = document.querySelectorAll('li[id^="message-"]');
      
      messageItems.forEach(li => {
        // 이미 처리된 항목은 건너뛰기
        if (li.classList.contains('username-processed')) return;
        
        // li > div > div > p > span 구조에서 첫 번째 span이 사용자 이름
        const spans = li.querySelectorAll('p > span');
        if (spans.length >= 2) {
          const usernameSpan = spans[0];
          let username = usernameSpan.textContent.trim();
          
          // 사용자 이름에서 콜론(:) 부분 제거
          if (username.includes(':')) {
            username = username.split(':')[0].trim();
          }
          
          // 사용자 이름이 있고 아직 클릭 이벤트가 없는 경우
          if (username && !usernameSpan.classList.contains('username-clickable')) {
            usernameSpan.classList.add('username-clickable');
            
            // 구버전 방식: 클릭 이벤트 추가 (현재 창에서 이동)
            usernameSpan.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const profileUrl = `https://lanis.me/users/${encodeURIComponent(username)}`;
              window.location.href = profileUrl; // 현재 창에서 이동
            });
          }
        }
        
        // 처리 완료 표시
        li.classList.add('username-processed');
      });

              // 직업/레벨 스티커에 임시 스티커 추가
        this.addTemporaryStickers();
        
        // 기본 스탯 오른쪽에 스탯합계 스티커 추가
        this.addStatSumStickers();
        
        // 기본 정보 오른쪽에 HP/MP 보너스 스티커 추가
        this.addHpMpBonusStickers();

    } catch (error) {
      console.error('사용자명 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 직업/레벨 스티커에 전투력 스티커 추가
  addTemporaryStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll('.css-temp-sticker');
      existingStickers.forEach(sticker => sticker.remove());
      
      // 직업/레벨 스티커 컨테이너 찾기
      const jobLevelContainers = document.querySelectorAll('.MuiBox-root.css-auxkcs');
      
      jobLevelContainers.forEach(container => {
        // 직업과 레벨 요소 확인
        const jobElement = container.querySelector('.MuiBox-root.css-new8hh p');
        const levelElement = container.querySelector('.MuiBox-root.css-10cne0w p');
        
        if (jobElement && levelElement) {
          // 전투력 계산
          const combatPower = this.calculateCombatPower();
          
          // 전투력 스티커 컨테이너 생성
          const tempStickerContainer = document.createElement('div');
          tempStickerContainer.className = 'MuiBox-root css-temp-sticker';
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

  // 기본 스탯 오른쪽에 스탯합계 스티커 추가
  addStatSumStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll('.css-stat-sum-sticker');
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
          statSumStickerContainer.className = 'MuiBox-root css-stat-sum-sticker';
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

  // 스탯합계 계산 (HP/MP 제외한 순수 스탯만)
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

  // 기본 정보 오른쪽에 HP/MP 보너스 스티커 추가
  addHpMpBonusStickers() {
    try {
      // 기존 스티커 제거
      const existingStickers = document.querySelectorAll('.css-hp-mp-bonus-sticker');
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
          hpMpBonusStickerContainer.className = 'MuiBox-root css-hp-mp-bonus-sticker';
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

  // HP/MP 보너스 계산 ((HP+MP)/3)
  calculateHpMpBonus() {
    try {
      let hp = 0;
      let mp = 0;
      
      // HP/MP 값 찾기 - 더 정확한 선택자 사용
      const hpMpContainers = document.querySelectorAll('.MuiBox-root.css-ti5bpj, .MuiBox-root.css-0');
      
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

  // 전투력 계산 (스탯 합계 + (체력+마력)/3)
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
                
                totalPower += statValue;
              }
            });
          });
        }
      });
      
      // HP/MP 값 찾기 - 더 정확한 선택자 사용
      const hpMpContainers = document.querySelectorAll('.MuiBox-root.css-ti5bpj, .MuiBox-root.css-0');
      
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

  startDynamicContentObserver() {
    // 기존 observer가 있으면 중지
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // MutationObserver로 DOM 변경 감지 (빠른 스티커 처리)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로 추가된 메시지 요소인지 확인
              if (node.matches && node.matches('li[id^="message-"]')) {
                this.processUserNames(); // 전체 재처리
              } else if (node.querySelectorAll) {
                // 새로 추가된 요소 내의 메시지들 확인
                const messageElements = node.querySelectorAll('li[id^="message-"]');
                if (messageElements.length > 0) {
                  this.processUserNames(); // 전체 재처리
                }
                
                // 사용자 프로필 DOM 감지 (기존 방식 유지)
                const profileContainers = node.querySelectorAll('.MuiBox-root.css-zwlyuw');
                if (profileContainers.length > 0) {
                  // 프로필이 감지되면 전체 재처리
                  this.processUserNames();
                }
              }
            }
          });
        }
      });
    });

    // body 전체를 관찰
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  }

  removeUserNames() {
    // MutationObserver 중지
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    try {
      // 구버전 방식: 클릭 가능한 요소들 제거
      const clickableElements = document.querySelectorAll('.username-clickable');
      clickableElements.forEach(element => {
        element.classList.remove('username-clickable');
        // 이벤트 리스너 제거 (새로운 요소로 교체)
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
      });
      
      // 처리 완료 표시 제거
      const processedElements = document.querySelectorAll('.username-processed');
      processedElements.forEach(element => {
        element.classList.remove('username-processed');
      });
      
    } catch (error) {
      console.error('사용자명 링크 제거 중 오류:', error);
    }
  }

  processDynamicContent() {
    // 구버전과 동일: 동적 콘텐츠 처리
    this.processUserNames();
  }

  isProcessingProfiles() {
    return this.isProcessing;
  }

  getProcessedCount() {
    const processedElements = document.querySelectorAll('.username-processed');
    return processedElements.length;
  }
}

// ES6 모듈로 export
export default UserProfileManager; 