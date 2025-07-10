// Lanis 사용자 프로필 링크 확장프로그램
(function() {
  'use strict';

  // 설정 상태
  let settings = {
    profileLink: true,
    feature2: false,
    feature3: false,
    showItemStats: true  // 아이템 스탯 표시 기능 추가
  };

  // 크롤링한 아이템 데이터
  let rareItemsData = [];

  // 설정 로드
  function loadSettings() {
    chrome.storage.sync.get({
      profileLink: true,
      feature2: false,
      feature3: false,
      showItemStats: true
    }, function(items) {
      settings = items;
      // 설정이 변경되면 페이지 다시 처리
      if (settings.profileLink) {
        processUserNames();
      } else {
        removeUserNames();
      }
      
      // 아이템 스탯 표시 설정 변경 시
      if (settings.showItemStats) {
        loadRareItemsData();
      } else {
        removeItemStats();
      }
    });
  }

  // 크롤링한 아이템 데이터 로드
  function loadRareItemsData() {
    chrome.storage.local.get(['rareItems'], function(result) {
      if (result.rareItems && result.rareItems.length > 0) {
        rareItemsData = result.rareItems;
        processItemStats();
      }
    });
  }

  // 아이템 스탯 표시 처리
  function processItemStats() {
    if (!settings.showItemStats || rareItemsData.length === 0) return;
    
    // 아이템명이 있는 p 태그를 찾아서 스탯 추가 (정확한 CSS 클래스 사용)
    const itemNameElements = document.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    
    let foundElements = 0;
    let matchedItems = 0;
    
    itemNameElements.forEach(element => {
      const text = element.textContent.trim();
      if (!text || text.length < 2 || text.length > 50) return; // 너무 짧거나 긴 텍스트 제외
      
      // 이미 처리된 요소는 건너뛰기
      if (element.classList.contains('item-stats-processed')) return;
      
      // 아이템명에서 추가 정보 제거 (예: "(봉인됨)" 제거)
      let cleanItemName = text;
      if (text.includes('(')) {
        cleanItemName = text.split('(')[0].trim();
      }
      
      // 아이템명이 크롤링 데이터에 있는지 확인
      const itemData = rareItemsData.find(item => {
        if (!item.name) return false;
        const itemName = item.name.trim();
        return cleanItemName === itemName;
      });
      
      if (itemData) {
        matchedItems++;
        
        // 해당 아이템의 위력과 무게 값 옆에 범위 정보 추가
        addRangeInfoToStats(element, itemData);
        
        // 처리 완료 표시
        element.classList.add('item-stats-processed');
      }
      
      foundElements++;
    });
    
    // 매칭이 적으면 더 넓은 범위로 검색
    if (matchedItems === 0 && foundElements > 0) {
      searchInWiderRange();
    }
  }
  
  // 아이템의 위력과 무게 값 옆에 범위 정보와 등급 추가
  function addRangeInfoToStats(itemNameElement, itemData) {
    // 아이템명 요소의 상위 컨테이너를 찾아서 위력/무게 값에 범위 정보 추가
    let container = itemNameElement.closest('.MuiBox-root');
    if (!container) {
      return;
    }
    
    // 더 상위의 전체 아이템 컨테이너 찾기 (css-38zrbw)
    while (container && !container.classList.contains('css-38zrbw')) {
      container = container.parentElement;
    }
    
    if (!container) {
      return;
    }
    
    // 위력과 무게 값을 찾아서 범위 정보와 등급 추가
    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm');
    
    let powerGrade = null;
    let weightGrade = null;
    
    statContainers.forEach((statContainer, index) => {
      const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv');
      
      if (pElements.length === 2) {
        const labelElement = pElements[0];
        const valueElement = pElements[1];
        const label = labelElement.textContent.trim();
        const value = valueElement.textContent.trim();
        
        // 위력 처리
        if (label === '위력' && 
            itemData.power_min !== null && itemData.power_max !== null && 
            itemData.power_min !== itemData.power_max) {
          
          // 이미 처리된 요소는 건너뛰기
          if (valueElement.classList.contains('power-range-processed')) {
            return;
          }
          
          const currentPower = parseInt(value);
          const { grade, color } = calculateGrade(currentPower, itemData.power_min, itemData.power_max);
          powerGrade = grade;
          
          // 범위 정보 추가
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.power_min}-${itemData.power_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('power-range-info');
          
          // 등급 정보 추가
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('power-grade-info');
          
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.classList.add('power-range-processed');
        }
        
        // 무게 처리
        if (label === '무게' && 
            itemData.weight_min !== null && itemData.weight_max !== null && 
            itemData.weight_min !== itemData.weight_max) {
          
          // 이미 처리된 요소는 건너뛰기
          if (valueElement.classList.contains('weight-range-processed')) {
            return;
          }
          
          const currentWeight = parseInt(value);
          const { grade, color } = calculateGrade(currentWeight, itemData.weight_min, itemData.weight_max, true);
          weightGrade = grade;
          
          // 범위 정보 추가
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.weight_min}-${itemData.weight_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('weight-range-info');
          
          // 등급 정보 추가
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('weight-grade-info');
          
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.classList.add('weight-range-processed');
        }
      }
    });
    
    // 종결/준종결 태그 추가
    if (powerGrade && weightGrade) {
      addFinalTag(itemNameElement, powerGrade, weightGrade);
    }
  }
  
  // 종결/준종결 태그 추가 함수
  function addFinalTag(itemNameElement, powerGrade, weightGrade) {
    // 이미 태그가 있는지 확인
    if (itemNameElement.querySelector('.final-tag')) {
      return;
    }
    
    let tagText = '';
    let tagColor = '';
    
    // 둘 다 최상인 경우 [종결]
    if (powerGrade === '최상' && weightGrade === '최상') {
      tagText = '[종결]';
      tagColor = '#FF4444'; // 밝은 붉은색
    }
    // 하나는 최상이고 다른 하나는 상인 경우 [준종결]
    else if ((powerGrade === '최상' && weightGrade === '상') || 
             (powerGrade === '상' && weightGrade === '최상')) {
      tagText = '[준종결]';
      tagColor = '#FF66FF'; // 밝은 분홍색
    }
    
    // 태그가 필요한 경우에만 추가
    if (tagText) {
      const tagSpan = document.createElement('span');
      tagSpan.textContent = ` ${tagText}`;
      tagSpan.style.color = tagColor;
      tagSpan.style.fontSize = '0.9em';
      tagSpan.style.fontWeight = 'bold';
      tagSpan.style.fontStyle = 'italic';
      tagSpan.classList.add('final-tag');
      
      itemNameElement.appendChild(tagSpan);
    }
  }
  
  // 등급 계산 함수
  function calculateGrade(currentValue, minValue, maxValue, isWeight = false) {
    if (currentValue < minValue || currentValue > maxValue) {
      return { grade: '최하', color: '#FFFFFF' }; // 범위 밖이면 최하
    }
    
    const range = maxValue - minValue;
    let percentage = ((currentValue - minValue) / range) * 100;
    
    // 무게의 경우 등급을 반대로 계산 (가벼울수록 좋음)
    if (isWeight) {
      percentage = 100 - percentage;
    }
    
    if (percentage >= 90) {
      return { grade: '최상', color: '#FF4444' }; // 밝은 붉은색
    } else if (percentage >= 70) {
      return { grade: '상', color: '#FF66FF' }; // 밝은 분홍색
    } else if (percentage >= 50) {
      return { grade: '중', color: '#FFDD44' }; // 밝은 주황색
    } else if (percentage >= 30) {
      return { grade: '하', color: '#44AAFF' }; // 밝은 파란색
    } else {
      return { grade: '최하', color: '#CCCCCC' }; // 밝은 회색
    }
  }

  // 더 넓은 범위에서 아이템 검색
  function searchInWiderRange() {
    // 아이템 상세 정보 컨테이너만 검색 (css-38zrbw)
    const itemContainers = document.querySelectorAll('.css-38zrbw');
    let foundItems = 0;
    
    itemContainers.forEach(container => {
      // 컨테이너 내부의 아이템명 요소 찾기
      const itemNameElements = container.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
      
      itemNameElements.forEach(element => {
        const text = element.textContent.trim();
        if (!text || text.length < 2 || text.length > 50) return;
        
        // 이미 처리된 요소는 건너뛰기
        if (element.classList.contains('item-stats-processed')) return;
        
        // 아이템명에서 추가 정보 제거 (예: "(봉인됨)" 제거)
        let cleanItemName = text;
        if (text.includes('(')) {
          cleanItemName = text.split('(')[0].trim();
        }
        
        // 아이템명이 크롤링 데이터에 있는지 확인
        const itemData = rareItemsData.find(item => {
          if (!item.name) return false;
          const itemName = item.name.trim();
          return cleanItemName === itemName;
        });
        
        if (itemData) {
          foundItems++;
          
          // 해당 아이템의 위력과 무게 값 옆에 범위 정보 추가
          addRangeInfoToStats(element, itemData);
          
          // 처리 완료 표시
          element.classList.add('item-stats-processed');
        }
      });
    });
  }

  // 아이템 스탯 제거
  function removeItemStats() {
    // 기존 아이템명 옆 스탯 정보 제거
    const statsElements = document.querySelectorAll('.item-stats-info');
    statsElements.forEach(element => {
      element.remove();
    });
    
    // 위력 범위 정보 제거
    const powerRangeElements = document.querySelectorAll('.power-range-info');
    powerRangeElements.forEach(element => {
      element.remove();
    });
    
    // 위력 등급 정보 제거
    const powerGradeElements = document.querySelectorAll('.power-grade-info');
    powerGradeElements.forEach(element => {
      element.remove();
    });
    
    // 무게 범위 정보 제거
    const weightRangeElements = document.querySelectorAll('.weight-range-info');
    weightRangeElements.forEach(element => {
      element.remove();
    });
    
    // 무게 등급 정보 제거
    const weightGradeElements = document.querySelectorAll('.weight-grade-info');
    weightGradeElements.forEach(element => {
      element.remove();
    });
    
    // 종결/준종결 태그 제거
    const finalTagElements = document.querySelectorAll('.final-tag');
    finalTagElements.forEach(element => {
      element.remove();
    });
    
    // 처리 완료 표시 제거
    const processedElements = document.querySelectorAll('.item-stats-processed, .power-range-processed, .weight-range-processed');
    processedElements.forEach(element => {
      element.classList.remove('item-stats-processed', 'power-range-processed', 'weight-range-processed');
    });
  }

  // 페이지 로드 완료 확인 후 처리
  function initializeExtension() {
    // 설정 로드
    loadSettings();
    
    // DOM이 완전히 로드된 후 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        if (settings.profileLink) {
          processUserNames();
        }
        if (settings.showItemStats) {
          loadRareItemsData();
        }
      });
    } else {
      if (settings.profileLink) {
        processUserNames();
      }
      if (settings.showItemStats) {
        loadRareItemsData();
      }
    }
  }

  // 사용자 이름 처리 함수
  function processUserNames() {
    // li 태그들을 찾아서 사용자 이름 처리
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
          
          // 클릭 이벤트 추가
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
  }

  // 사용자 이름 기능 제거
  function removeUserNames() {
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
  }

  // 레어 아이템 API 수집 함수
  async function collectRareItems() {
    try {
      // 기존 데이터 확인 (캐시 카운트용)
      const existingData = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'lastCrawlTime', 'crawlCount'], (result) => {
          resolve(result);
        });
      });

      const now = Date.now();

      const items = [];
      
      // Lanis 위키 레어 아이템 페이지 URL
      const targetUrl = 'https://laniswiki.lovestoblog.com/index.php/%EB%B6%84%EB%A5%98:%EB%A0%88%EC%96%B4_%EC%95%84%EC%9D%B4%ED%85%9C';
      
      try {
        // MediaWiki API를 사용하여 레어 아이템 목록 가져오기
        const apiUrl = 'https://laniswiki.lovestoblog.com/api.php';
        
        // 1. 레어 아이템 분류 페이지의 링크 목록 가져오기
        const categoryQuery = `${apiUrl}?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=500`;
        
        // 백그라운드 스크립트를 통해서만 API 요청
        const categoryResult = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'fetchWikiData',
            url: categoryQuery
          }, response => {
            if (response && response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || 'API 요청 실패'));
            }
          });
        });
        
        const categoryData = categoryResult;
        const itemTitles = categoryData.query.categorymembers.map(member => member.title);
        
        // 2. 각 아이템의 상세 정보 가져오기 (배치 처리)
        const batchSize = 10; // 한 번에 10개씩 처리
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < itemTitles.length; i += batchSize) {
          const batch = itemTitles.slice(i, i + batchSize);
          const titles = batch.join('|');
          
          const itemQuery = `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=revisions&rvprop=content`;
          
          // 백그라운드 스크립트를 통해서만 API 요청
          const itemResult = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'fetchWikiData',
              url: itemQuery
            }, response => {
              if (response && response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response?.error || 'API 요청 실패'));
              }
            });
          });
          
          const itemData = itemResult;
            
          // 각 아이템 정보 파싱
          for (const pageId in itemData.query.pages) {
            const page = itemData.query.pages[pageId];
            if (page.revisions && page.revisions[0]) {
              const content = page.revisions[0]['*'];
              const itemInfo = parseItemFromWikiText(content, page.title);
              if (itemInfo) {
                items.push(itemInfo);
                successCount++;
              } else {
                failCount++;
              }
            }
          }
          
          // 배치 간 지연 (0.5초)
          if (i + batchSize < itemTitles.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
      } catch (error) {
        console.error('API 수집 상세 오류:', error);
        
        // API 실패 시 대안 방법 시도
        try {
          const alternativeResult = await collectRareItemsAlternative();
          if (alternativeResult.success) {
            return alternativeResult;
          }
        } catch (altError) {
          console.error('대안 방법도 실패:', altError);
        }
        
        return { 
          success: false, 
          message: `API 수집 실패: ${error.message}. 위키 API에 접근할 수 없습니다.` 
        };
      }
      
      // Chrome 스토리지에 저장 (수집 시간 포함)
      const saveData = {
        rareItems: items,
        lastCrawlTime: now,
        crawlCount: (existingData.crawlCount || 0) + 1
      };
      
      chrome.storage.local.set(saveData, function() {
        // 저장 완료
      });
      
      return { 
        success: true, 
        count: items.length, 
        items: items,
        message: `수집 완료 (${items.length}개 아이템)`
      };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 대안 방법: 백그라운드 스크립트를 통한 API 재시도
  async function collectRareItemsAlternative() {
    try {
      // 간단한 API 요청으로 재시도
      const apiUrl = 'https://laniswiki.lovestoblog.com/api.php';
      const simpleQuery = `${apiUrl}?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=10`;
      
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'fetchWikiData',
          url: simpleQuery
        }, response => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'API 요청 실패'));
          }
        });
      });
      
      if (result.query && result.query.categorymembers) {
        return {
          success: true,
          count: result.query.categorymembers.length,
          items: result.query.categorymembers,
          message: `백그라운드 API 재시도 성공 (${result.query.categorymembers.length}개 아이템)`
        };
      } else {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }
      
    } catch (error) {
      console.error('대안 방법 실패:', error);
      return { success: false, message: `백그라운드 API 재시도 실패: ${error.message}` };
    }
  }



  // 아이템 정보 추출 함수
  function extractItemInfo(doc, itemName) {
    try {
      let powerMin = null;
      let powerMax = null;
      let weightMin = null;
      let weightMax = null;
      
      // 테이블에서 정보 찾기
      const tables = doc.querySelectorAll('table');
      
      for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
        const table = tables[tableIndex];
        
        const rows = table.querySelectorAll('tr');
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cells = row.querySelectorAll('td, th');
          
          for (let i = 0; i < cells.length; i++) {
            const cellText = cells[i].textContent.trim();
            
            // 공격력 정보 찾기 (더 다양한 패턴)
            if (cellText.includes('공격력') || 
                cellText.includes('Power') || 
                cellText.includes('공격') ||
                cellText.includes('ATK') ||
                cellText.includes('Attack')) {
              
              const nextCell = cells[i + 1];
              if (nextCell) {
                const powerText = nextCell.textContent.trim();
                
                // 다양한 숫자 패턴 매칭
                const powerMatch = powerText.match(/(\d+)(?:\s*[-~]\s*(\d+))?/);
                if (powerMatch) {
                  powerMin = parseInt(powerMatch[1]);
                  powerMax = powerMatch[2] ? parseInt(powerMatch[2]) : powerMin;
                }
              }
            }
            
            // 무게 정보 찾기 (더 다양한 패턴)
            if (cellText.includes('무게') || 
                cellText.includes('Weight') ||
                cellText.includes('WT') ||
                cellText.includes('Wt')) {
              
              const nextCell = cells[i + 1];
              if (nextCell) {
                const weightText = nextCell.textContent.trim();
                
                // 다양한 숫자 패턴 매칭
                const weightMatch = weightText.match(/(\d+)(?:\s*[-~]\s*(\d+))?/);
                if (weightMatch) {
                  weightMin = parseInt(weightMatch[1]);
                  weightMax = weightMatch[2] ? parseInt(weightMatch[2]) : weightMin;
                }
              }
            }
          }
        }
      }
      
      // 정보가 하나라도 있으면 반환
      if (powerMin !== null || weightMin !== null) {
        const result = {
          name: itemName,
          power_min: powerMin,
          power_max: powerMax,
          weight_min: weightMin,
          weight_max: weightMax
        };
        return result;
      } else {
        return null;
      }
      
    } catch (error) {
      return null;
    }
  }

  // 문서에서 아이템 정보 추출 (기존 함수 수정)
  function extractItemsFromDocument(doc) {
    const items = [];
    
    // 문서의 테이블에서 아이템 정보 찾기
    const tables = doc.querySelectorAll('table');
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th');
        
        // 아이템명과 정보가 모두 있는 행 찾기
        let itemName = null;
        let powerMin = null, powerMax = null;
        let weightMin = null, weightMax = null;
        
        for (let i = 0; i < cells.length; i++) {
          const cellText = cells[i].textContent.trim();
          
          // 아이템명 찾기 (링크가 있는 경우)
          if (!itemName && cells[i].querySelector('a')) {
            itemName = cellText;
          }
          
          // 공격력 정보 찾기
          if (cellText.includes('공격력') || cellText.includes('Power') || 
              cellText.includes('공격') || cellText.includes('ATK')) {
            const nextCell = cells[i + 1];
            if (nextCell) {
              const powerText = nextCell.textContent.trim();
              const powerMatch = powerText.match(/(\d+)(?:\s*[-~]\s*(\d+))?/);
              if (powerMatch) {
                powerMin = parseInt(powerMatch[1]);
                powerMax = powerMatch[2] ? parseInt(powerMatch[2]) : powerMin;
              }
            }
          }
          
          // 무게 정보 찾기
          if (cellText.includes('무게') || cellText.includes('Weight') || 
              cellText.includes('WT') || cellText.includes('Wt')) {
            const nextCell = cells[i + 1];
            if (nextCell) {
              const weightText = nextCell.textContent.trim();
              const weightMatch = weightText.match(/(\d+)(?:\s*[-~]\s*(\d+))?/);
              if (weightMatch) {
                weightMin = parseInt(weightMatch[1]);
                weightMax = weightMatch[2] ? parseInt(weightMatch[2]) : weightMin;
              }
            }
          }
        }
        
        // 유효한 아이템 정보가 있으면 추가
        if (itemName && (powerMin !== null || weightMin !== null)) {
          items.push({
            name: itemName,
            power_min: powerMin,
            power_max: powerMax,
            weight_min: weightMin,
            weight_max: weightMax
          });
        }
      }
    }
    
    return items;
  }

  // WikiText에서 아이템 정보 파싱
  function parseItemFromWikiText(wikiText, itemName) {
    try {
      let powerMin = null, powerMax = null;
      let weightMin = null, weightMax = null;
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 위력 정보 찾기
      const powerMatch = wikiText.match(/\|\s*위력\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (powerMatch) {
        powerMin = parseInt(powerMatch[1]);
        powerMax = parseInt(powerMatch[2]);
      }
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 무게 정보 찾기
      const weightMatch = wikiText.match(/\|\s*무게\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (weightMatch) {
        weightMin = parseInt(weightMatch[1]);
        weightMax = parseInt(weightMatch[2]);
      }
      
      // 유효한 정보가 있으면 반환
      if (powerMin !== null || weightMin !== null) {
        const result = {
          name: itemName,
          power_min: powerMin,
          power_max: powerMax,
          weight_min: weightMin,
          weight_max: weightMax
        };
        return result;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 초기 실행
  initializeExtension();

  // 설정 변경 메시지 수신
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
      if (request.action === 'ping') {
        // content script가 로드되었는지 확인하는 ping
        sendResponse({success: true, message: 'Content script loaded'});
      } else if (request.action === 'settingsChanged') {
        settings = request.settings;
        
        if (settings.profileLink) {
          processUserNames();
        } else {
          removeUserNames();
        }

        // 아이템 스탯 표시 설정 변경 시
        if (settings.showItemStats) {
          loadRareItemsData();
        } else {
          removeItemStats();
        }
        // 응답 전송 (선택사항)
        sendResponse({success: true});
      } else if (request.action === 'startCrawling') {
        // API 수집 시작
        collectRareItems().then(result => {
          sendResponse(result);
        });
        return true; // 비동기 응답을 위해 true 반환
      }
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
  });

  // 동적 콘텐츠 감지를 위한 MutationObserver
  const observer = new MutationObserver((mutations) => {
    let shouldProcessUsers = false;
    let shouldProcessItems = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 새로 추가된 li 태그나 li 태그를 포함하는 요소가 있는지 확인
            if (node.tagName === 'LI' || node.querySelector('li[id^="message-"]')) {
              shouldProcessUsers = true;
            }
            
            // 새로 추가된 아이템 요소가 있는지 확인
            if (node.querySelector && node.querySelector('p.MuiTypography-body2')) {
              shouldProcessItems = true;
            }
          }
        });
      }
    });
    
    if (shouldProcessUsers && settings.profileLink) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 처리
      setTimeout(processUserNames, 100);
    }
    
    if (shouldProcessItems && settings.showItemStats) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 처리
      setTimeout(processItemStats, 100);
    }
  });

  // DOM 변경 감지 시작
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
