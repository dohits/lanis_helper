// 검색 엔진
// 유틸: 정규식 이스케이프
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class SearchEngine {
  constructor() {
    this.rareItemsData = [];
  }

  async init() {
    await this.loadRareItemsData();
  }

  async loadRareItemsData() {
    try {
      // chrome.storage.local에서 데이터 로드 (구버전 방식)
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            this.rareItemsData = result.rareItems;
          } else {
            this.rareItemsData = [];
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('희귀 아이템 데이터 로드 실패:', error);
      this.rareItemsData = [];
    }
  }

  // 아이템 데이터 수집 기능 (최적화된 방식)
  async collectRareItems() {
    try {
      // 기존 데이터 확인 (캐시 카운트용)
      const existingData = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'lastCrawlTime', 'crawlCount'], (result) => {
          resolve(result);
        });
      });

      const now = Date.now();
      const items = [];
      
      // 기존 방식: 분류 페이지에서 아이템 목록 수집
      
      try {
        // MediaWiki API를 사용하여 레어 아이템 목록 가져오기
        const apiUrl = 'https://laniswiki.lovestoblog.com/api.php';
        
        // 1. 레어 아이템 분류 페이지의 링크 목록 가져오기 (최대 500개)
        const categoryQuery = `${apiUrl}?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=500`;
        
        // 구버전 방식: 직접 fetch 사용
        const categoryResponse = await fetch(categoryQuery, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!categoryResponse.ok) {
          throw new Error(`HTTP ${categoryResponse.status}: ${categoryResponse.statusText}`);
        }
        
        const categoryText = await categoryResponse.text();
        
        if (categoryText.trim().startsWith('<html') || categoryText.trim().startsWith('<!DOCTYPE')) {
          console.error('카테고리 HTML 응답:', categoryText.substring(0, 1000));
          throw new Error('서버가 HTML을 반환했습니다. 위키 API 접근 권한이 없을 수 있습니다.');
        }
        
        const categoryData = JSON.parse(categoryText);
        
        const itemTitles = categoryData.query.categorymembers.map(member => member.title);
        
        // 2. 최적화된 방법: 한 번에 모든 아이템 정보 가져오기
        if (itemTitles.length <= 50) {
          // 50개 이하면 한 번에 처리
          const allTitles = itemTitles.join('|');
          const allItemsQuery = `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(allTitles)}&prop=revisions&rvprop=content`;
          
          const allItemsResponse = await fetch(allItemsQuery, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!allItemsResponse.ok) {
            throw new Error(`HTTP ${allItemsResponse.status}: ${allItemsResponse.statusText}`);
          }
          
          const allItemsText = await allItemsResponse.text();
          
          if (allItemsText.trim().startsWith('<html') || allItemsText.trim().startsWith('<!DOCTYPE')) {
            throw new Error('서버가 HTML을 반환했습니다.');
          }
          
          const allItemsData = JSON.parse(allItemsText);
          
          let successCount = 0;
          let failCount = 0;
          
          for (const pageId in allItemsData.query.pages) {
            const page = allItemsData.query.pages[pageId];
            if (page.revisions && page.revisions[0]) {
              const content = page.revisions[0]['*'];
              const itemInfo = this.parseItemFromWikiText(content, page.title);
              if (itemInfo) {
                items.push(itemInfo);
                successCount++;
              } else {
                failCount++;
              }
            }
          }
          
        } else {
          // 50개 초과면 배치 처리 (최적화된 배치 크기)
          const batchSize = 50; // 한 번에 50개씩 처리 (속도 개선)
          let successCount = 0;
          let failCount = 0;
          
          for (let i = 0; i < itemTitles.length; i += batchSize) {
            const batch = itemTitles.slice(i, i + batchSize);
            const titles = batch.join('|');
            
            const itemQuery = `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=revisions&rvprop=content`;
            
            const itemResponse = await fetch(itemQuery, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (!itemResponse.ok) {
              throw new Error(`HTTP ${itemResponse.status}: ${itemResponse.statusText}`);
            }
            
            const itemText = await itemResponse.text();
            
            if (itemText.trim().startsWith('<html') || itemText.trim().startsWith('<!DOCTYPE')) {
              throw new Error('서버가 HTML을 반환했습니다.');
            }
            
            const itemData = JSON.parse(itemText);
              
            // 각 아이템 정보 파싱
            for (const pageId in itemData.query.pages) {
              const page = itemData.query.pages[pageId];
              if (page.revisions && page.revisions[0]) {
                const content = page.revisions[0]['*'];
                const itemInfo = this.parseItemFromWikiText(content, page.title);
                if (itemInfo) {
                  items.push(itemInfo);
                  successCount++;
                } else {
                  failCount++;
                }
              }
            }
            
            // 배치 간 지연 (0.3초로 단축 - 속도 개선)
            if (i + batchSize < itemTitles.length) {
              await this.sleep(300);
            }
          }
          
        }
        
      } catch (error) {
        console.error('API 수집 상세 오류:', error);
        
        // API 실패 시 대안 방법 시도
        try {
          const alternativeResult = await this.collectRareItemsAlternative();
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
      
      // 메모리에도 업데이트
      this.rareItemsData = items;
      
      return { 
        success: true, 
        count: items.length, 
        message: `레어 아이템 데이터 수집 완료 (${items.length}개 아이템)` 
      };
      
    } catch (error) {
      console.error('아이템 수집 전체 오류:', error);
      return { 
        success: false, 
        message: `수집 실패: ${error.message}` 
      };
    }
  }

  // 대안 방법: 직접 fetch를 통한 API 재시도
  async collectRareItemsAlternative() {
    try {
      
      // 간단한 API 요청으로 재시도
      const apiUrl = 'https://laniswiki.lovestoblog.com/api.php';
      const simpleQuery = `${apiUrl}?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=10`;
      
      const response = await fetch(simpleQuery, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        throw new Error('서버가 HTML을 반환했습니다.');
      }
      
      const result = JSON.parse(text);
      
      if (result.query && result.query.categorymembers) {
        return {
          success: true,
          count: result.query.categorymembers.length,
          items: result.query.categorymembers,
          message: `직접 fetch API 재시도 성공 (${result.query.categorymembers.length}개 아이템)`
        };
      } else {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }
      
    } catch (error) {
      console.error('대안 방법 실패:', error);
      return { success: false, message: `직접 fetch API 재시도 실패: ${error.message}` };
    }
  }

  // 위키 텍스트에서 아이템 정보 파싱 (확장된 버전)
  parseItemFromWikiText(wikiText, itemName) {
    try {
      let powerMin = null, powerMax = null;
      let weightMin = null, weightMax = null;
      let weaponType = null;
      let abilities = [];
      let attributes = [];
      // 이름은 title만 사용
      const name = itemName.trim();
      // 타입은 표 캡션에서 title 다음 괄호만 추출
      let type = '';
      const captionMatch = wikiText.match(/\|\+\s*'''(.+?)'''/);
      if (captionMatch) {
        const caption = captionMatch[1].trim();
        if (caption.startsWith(name)) {
          const rest = caption.slice(name.length).trim();
          const typeMatch = rest.match(/^\(([^)]+)\)$/);
          if (typeMatch) {
            type = typeMatch[1].trim();
          }
        }
      }
      // fallback: [[분류:XXX 레어 아이템]]에서 추출
      if (!type) {
        const categoryMatch = wikiText.match(/\[\[분류:([^\]]+) 레어 아이템\]\]/);
        if (categoryMatch) {
          type = categoryMatch[1].trim();
        }
      }
      // 기존 weaponType 파싱 유지(추가 정보용)
      const weaponTypeMatch = wikiText.match(/\(([^)]+)\)/);
      if (weaponTypeMatch) {
        weaponType = weaponTypeMatch[1].trim();
      }
      // 이하 기존 파싱 로직 동일
      // MediaWiki 테이블 구조에 맞는 패턴으로 위력 정보 찾기 (음수값, 0값 지원)
      const powerMatch = wikiText.match(/\|\s*위력\s*\|\|\s*(-?\d+)\s*~\s*(-?\d+)/);
      if (powerMatch) {
        powerMin = parseInt(powerMatch[1]);
        powerMax = parseInt(powerMatch[2]);
      } else {
        // 대안 패턴: 위력이 별도 행에 있는 경우
        const powerMatchAlt = wikiText.match(/\|\s*위력\s*\n\|\s*(-?\d+)\s*~\s*(-?\d+)/);
        if (powerMatchAlt) {
          powerMin = parseInt(powerMatchAlt[1]);
          powerMax = parseInt(powerMatchAlt[2]);
        } else {
        }
      }
      // MediaWiki 테이블 구조에 맞는 패턴으로 무게 정보 찾기 (음수값, 0값 지원)
      const weightMatch = wikiText.match(/\|\s*무게\s*\|\|\s*(-?\d+)\s*~\s*(-?\d+)/);
      if (weightMatch) {
        weightMin = parseInt(weightMatch[1]);
        weightMax = parseInt(weightMatch[2]);
      } else {
        // 대안 패턴: 무게가 별도 행에 있는 경우
        const weightMatchAlt = wikiText.match(/\|\s*무게\s*\n\|\s*(-?\d+)\s*~\s*(-?\d+)/);
        if (weightMatchAlt) {
          weightMin = parseInt(weightMatchAlt[1]);
          weightMax = parseInt(weightMatchAlt[2]);
        } else {
        }
      }
      // 어빌리티 파싱
      // 어빌리티 섹션을 찾기 위한 패턴들
      const abilityPatterns = [
        /\|\s*어빌리티\s*\|\|\s*([^|\n]+)/,  // 기본 패턴
        /\|\s*어빌리티\s*\n\|\s*([^|\n]+)/,  // 별도 행 패턴
        /어빌리티[:\s]*([^|\n]+)/,           // 일반 텍스트 패턴
      ];
      
      for (const pattern of abilityPatterns) {
        const abilityMatch = wikiText.match(pattern);
        if (abilityMatch) {
          const abilityText = abilityMatch[1].trim();
          if (abilityText && abilityText !== '') {
            // 쉼표나 줄바꿈으로 구분된 어빌리티들을 분리
            const abilityList = abilityText.split(/[,，\n]/).map(ability => ability.trim()).filter(ability => ability.length > 0);
            abilities = abilityList;
            break;
          }
        }
      }
      
      // 속성 파싱
      // 속성 섹션을 찾기 위한 패턴들
      const attributePatterns = [
        /\|\s*속성\s*\|\|\s*([^|\n]+)/,      // 기본 패턴
        /\|\s*속성\s*\n\|\s*([^|\n]+)/,      // 별도 행 패턴
        /속성[:\s]*([^|\n]+)/,               // 일반 텍스트 패턴
      ];
      
      for (const pattern of attributePatterns) {
        const attributeMatch = wikiText.match(pattern);
        if (attributeMatch) {
          const attributeText = attributeMatch[1].trim();
          if (attributeText && attributeText !== '') {
            // 쉼표나 줄바꿈으로 구분된 속성들을 분리
            const attributeList = attributeText.split(/[,，\n]/).map(attribute => attribute.trim()).filter(attribute => attribute.length > 0);
            attributes = attributeList;
            break;
          }
        }
      }
      
      // 유효한 정보가 있으면 반환 (위력, 무게, 무기타입, 어빌리티, 속성 중 하나라도 있으면)
      if (powerMin !== null || weightMin !== null || weaponType !== null || abilities.length > 0 || attributes.length > 0) {
        const result = {
          name: name,
          type: type,
          power_min: powerMin,
          power_max: powerMax,
          weight_min: weightMin,
          weight_max: weightMax,
          weapon_type: weaponType,
          abilities: abilities,
          attributes: attributes
        };
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('아이템 정보 파싱 오류:', error);
      return null;
    }
  }

  // 거래소 퀵검색 자동화 (새로운 HTML 구조 기반)
  async executeQuickSearch(searchConfig, buttonIndex) {
    // 거래소 페이지가 아닐 경우 이동
    if (!window.location.href.includes('/market')) {
      sessionStorage.setItem('pendingQuickSearch', JSON.stringify({ searchConfig, buttonIndex }));
      window.location.href = 'https://lanis.me/market';
      return;
    }

    const button = document.querySelector(`.quick-buttons-sub-container .quick-button:nth-child(${buttonIndex + 1})`);
    if (button) button.classList.add('loading');

    try {
      // 기존 단일 값 필드와 새로운 범위 필드 호환성 처리
      const normalizedConfig = this.normalizeSearchConfig(searchConfig);
      
      // 1. 거래소 패널이 열려있는지 확인하고 필요시 열기
      await this.openMarketPanelIfNeeded();
      
      // 2. 카테고리 탭으로 이동 (필요시)
      if (normalizedConfig.category) {
        await this.moveToMarketTab(normalizedConfig.category);
      }
      
      // 3. 검색 패널 열기
      await this.openMarketSearchPanel();
      
      // 4. 검색 조건 입력
      await this.fillMarketSearchFields(normalizedConfig);
      
      // 5. 검색 실행
      await this.clickMarketSearchButton();
      
      // 6. 결과 저장 및 모달 표시
      const result = {
        success: true,
        searchConfig,
        timestamp: Date.now(),
        message: '거래소 검색이 완료되었습니다.'
      };
      
      this.saveMarketSearchResultToSession(result);
      this.showFinalMarketModal(result);
      
    } catch (error) {
      console.error('거래소 퀵검색 실행 중 오류:', error);
      
      const result = {
        success: false,
        searchConfig,
        timestamp: Date.now(),
        error: error.message,
        message: '거래소 검색 중 오류가 발생했습니다.'
      };
      
      this.saveMarketSearchResultToSession(result);
      this.showFinalMarketModal(result);
      
    } finally {
      if (button) button.classList.remove('loading');
    }
  }

  // 거래소 패널이 닫혀 있으면 자동으로 열기
  async openMarketPanelIfNeeded() {
    // 거래소 패널이 이미 열려있는지 확인
    const marketPanel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-s1ntyf');
    if (marketPanel) {
      return;
    }

    // 거래소 메뉴/버튼 찾기 (여러 방법으로 시도)
    let marketButton = null;
    
    // 방법 1: 메뉴에서 "거래소" 텍스트로 찾기
    const menuButtons = document.querySelectorAll('button, a');
    for (const button of menuButtons) {
      if (button.textContent.includes('거래소') && !button.closest('.css-s1ntyf')) {
        marketButton = button;
        break;
      }
    }
    
    // 방법 2: 네비게이션 메뉴에서 찾기
    if (!marketButton) {
      const navItems = document.querySelectorAll('[role="menuitem"], .MuiListItem-root');
      for (const item of navItems) {
        if (item.textContent.includes('거래소')) {
          marketButton = item;
          break;
        }
      }
    }
    
    // 방법 3: 사이드바 메뉴에서 찾기
    if (!marketButton) {
      const sidebarItems = document.querySelectorAll('.MuiDrawer-root button, .MuiDrawer-root a');
      for (const item of sidebarItems) {
        if (item.textContent.includes('거래소')) {
          marketButton = item;
          break;
        }
      }
    }

    if (!marketButton) {
      console.error('거래소 버튼을 찾을 수 없습니다.');
      throw new Error('거래소 버튼을 찾을 수 없습니다.');
    }

    marketButton.click();
    
    // 거래소 패널이 열릴 때까지 감지
    await this.waitForMarketPanel();
  }

  // 거래소 패널이 완전히 열릴 때까지 감지
  async waitForMarketPanel() {
    let attempts = 0;
    const maxAttempts = 30; // 최대 3초 대기
    
    while (attempts < maxAttempts) {
      const marketPanel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-s1ntyf');
      if (marketPanel) {
        // 탭 버튼들이 로드되었는지도 확인
        const tabButtons = marketPanel.querySelectorAll('button[role="tab"]');
        if (tabButtons.length > 0) {
          return;
        }
      }
      
      await this.sleep(100);
      attempts++;
    }
    
    throw new Error('거래소 패널을 열 수 없습니다.');
  }

  // 카테고리 탭으로 이동
  async moveToMarketTab(tabName) {
    const categoryMap = {
      'weapon': '무기',
      'armor': '방어구', 
      'accessory': '장신구',
      'material': '재료',
      'potion': '포션',
      'consumable': '소모품',
      'favorite': '관심목록'
    };

    const targetCategory = categoryMap[tabName];
    if (!targetCategory) {
      console.error(`알 수 없는 카테고리: ${tabName}`);
      return;
    }

    // 거래소 패널 내의 탭 버튼들 찾기
    const marketPanel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-s1ntyf');
    if (!marketPanel) {
      throw new Error('거래소 패널을 찾을 수 없습니다.');
    }

    const tabButtons = marketPanel.querySelectorAll('button[role="tab"]');
    let targetTab = null;
    
    for (const button of tabButtons) {
      if (button.textContent.includes(targetCategory)) {
        targetTab = button;
        break;
      }
    }

    if (!targetTab) {
      console.error(`카테고리 탭을 찾을 수 없음: ${targetCategory}`);
      throw new Error(`카테고리 탭을 찾을 수 없음: ${targetCategory}`);
    }

    // 이미 선택된 탭인지 확인
    if (targetTab.getAttribute('aria-selected') === 'true') {
      return;
    }

    targetTab.click();
    
    // 탭 전환 후 해당 탭의 내용이 로드될 때까지 대기
    await this.waitForMarketTabLoaded(targetCategory);
  }

  // 탭 전환 후 해당 탭의 내용이 로드될 때까지 대기
  async waitForMarketTabLoaded(category) {
    let attempts = 0;
    const maxAttempts = 30; // 최대 3초 대기
    
    while (attempts < maxAttempts) {
      // 탭이 선택되었는지 확인
      const marketPanel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-s1ntyf');
      if (marketPanel) {
        const selectedTab = marketPanel.querySelector('button[role="tab"][aria-selected="true"]');
        if (selectedTab && selectedTab.textContent.includes(category)) {
          return;
        }
      }
      
      await this.sleep(100);
      attempts++;
    }
    
  }

  // 검색 패널 열기
  async openMarketSearchPanel() {
    // 검색 패널이 이미 열려있는지 확인
    const searchPanel = document.querySelector('.css-1e25jpw');
    if (searchPanel) {
      return;
    }

    // 거래소 패널 내의 검색 버튼 찾기
    const marketPanel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-s1ntyf');
    if (!marketPanel) {
      throw new Error('거래소 패널을 찾을 수 없습니다.');
    }

    // 검색 버튼 찾기 (제공된 HTML 구조 기반)
    let searchButton = null;
    
    // 방법 1: "검색" 텍스트가 포함된 버튼 찾기
    const buttons = marketPanel.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent.includes('검색') && !button.textContent.includes('초기화')) {
        searchButton = button;
        break;
      }
    }
    
    // 방법 2: SVG 아이콘으로 찾기 (화살표 아래 아이콘)
    if (!searchButton) {
      for (const button of buttons) {
        const icon = button.querySelector('svg');
        if (icon && icon.innerHTML.includes('m12 8-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z')) {
          searchButton = button;
          break;
        }
      }
    }

    if (!searchButton) {
      console.error('검색 버튼을 찾을 수 없습니다.');
      throw new Error('검색 버튼을 찾을 수 없습니다.');
    }

    searchButton.click();
    
    // 검색 패널이 열릴 때까지 감지
    await this.waitForMarketSearchPanel();
  }

  // 검색 패널이 완전히 열릴 때까지 감지
  async waitForMarketSearchPanel() {
    let attempts = 0;
    const maxAttempts = 30; // 최대 3초 대기
    
    while (attempts < maxAttempts) {
      const searchPanel = document.querySelector('.css-1e25jpw');
      if (searchPanel) {
        // 입력 필드가 로드되었는지도 확인
        const inputFields = searchPanel.querySelectorAll('input');
        if (inputFields.length > 0) {
          return;
        }
      }
      
      await this.sleep(100);
      attempts++;
    }
    
    throw new Error('검색 패널을 열 수 없습니다.');
  }

  // 검색 설정 정규화 (기존 단일 값 필드와 새로운 범위 필드 호환성)
  normalizeSearchConfig(searchConfig) {
    const normalized = { ...searchConfig };
    
    // 기존 단일 값 필드를 새로운 범위 필드로 변환
    if (searchConfig.bidPrice && !searchConfig.bidMin) {
      normalized.bidMin = searchConfig.bidPrice;
    }
    if (searchConfig.buyPrice && !searchConfig.buyMin) {
      normalized.buyMin = searchConfig.buyPrice;
    }
    if (searchConfig.power && !searchConfig.powerMin) {
      normalized.powerMin = searchConfig.power;
    }
    if (searchConfig.weight && !searchConfig.weightMin) {
      normalized.weightMin = searchConfig.weight;
    }
    
    return normalized;
  }

  // 검색 조건 입력
  async fillMarketSearchFields(config) {
    
    const searchPanel = document.querySelector('.css-1e25jpw');
    if (!searchPanel) {
      throw new Error('검색 패널을 찾을 수 없습니다.');
    }

    // React/MUI 입력 필드 값을 설정하는 헬퍼 함수 (최적화된 버전)
    const setInputValue = async (input, value) => {
      try {
        
        // 즉시 값 설정 (대기 시간 없음)
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // React의 onChange 이벤트 시뮬레이션
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        input.blur();

        return true;
      } catch (error) {
        console.error('입력 필드 값 설정 실패:', error);
        return false;
      }
    };

    // 1. 키워드 검색
    if (config.keyword) {
      const keywordInput = searchPanel.querySelector('input[placeholder*="아이템 이름"], input[placeholder*="검색"]');
      if (keywordInput) {
        await setInputValue(keywordInput, config.keyword);
      }
    }

    // 2. 모든 입력 필드 분석
    
    const allInputs = searchPanel.querySelectorAll('input');
    
    allInputs.forEach((input, index) => {
      const container = input.closest('.MuiBox-root') || input.parentElement;
      const label = container?.textContent || '';
    });

    // 3. 범위 입력 필드 찾기 (입찰가, 즉시구매가, 위력, 무게)
    // 실제 HTML에서는 type="text"이지만 placeholder로 구분
    const rangeInputs = searchPanel.querySelectorAll('input[placeholder*="최소"], input[placeholder*="최대"]');
    
    // 각 범위 입력 필드의 컨텍스트 분석
    rangeInputs.forEach((input, index) => {
      const container = input.closest('.MuiBox-root') || input.parentElement;
      const context = container?.textContent || '';
    });

    // 4. 입찰가 범위 입력
    if (config.bidMin || config.bidMax) {
      
      // 입찰가 섹션을 정확히 찾기 (HTML 구조 기반)
      const bidSection = Array.from(searchPanel.querySelectorAll('p')).find(p => p.textContent.includes('🟢 입찰가:'));
      
          if (bidSection) {
        // 입찰가 섹션의 부모 컨테이너에서 입력 필드 찾기
        const container = bidSection.closest('.MuiBox-root');
        if (container) {
          // 해당 컨테이너 내의 첫 번째, 두 번째 입력 필드 (최소, 최대)
          const bidInputs = container.querySelectorAll('input[placeholder="최소"], input[placeholder="최대"]');
          
          if (bidInputs.length >= 2) {
            if (config.bidMin) {
              await setInputValue(bidInputs[0], config.bidMin);
            }
            if (config.bidMax) {
              await setInputValue(bidInputs[1], config.bidMax);
            }
          }
        }
      }
    }



    // 5. 즉시구매가 범위 입력
    if (config.buyMin || config.buyMax) {
      
      // 즉시구매가 섹션을 정확히 찾기 (HTML 구조 기반)
      const buySection = Array.from(searchPanel.querySelectorAll('p')).find(p => p.textContent.includes('🟠 즉시구매:'));
      
          if (buySection) {
        // 즉시구매가 섹션의 부모 컨테이너에서 입력 필드 찾기
        const container = buySection.closest('.MuiBox-root');
        if (container) {
          // 해당 컨테이너 내의 첫 번째, 두 번째 입력 필드 (최소, 최대)
          const buyInputs = container.querySelectorAll('input[placeholder="최소"], input[placeholder="최대"]');
          
          if (buyInputs.length >= 2) {
            if (config.buyMin) {
              await setInputValue(buyInputs[0], config.buyMin);
            }
            if (config.buyMax) {
              await setInputValue(buyInputs[1], config.buyMax);
            }
          }
        }
      }
    }

    // 6. 위력 범위 입력
    if (config.powerMin || config.powerMax) {
      
      // 위력 섹션을 정확히 찾기 (HTML 구조 기반)
      const powerSection = Array.from(searchPanel.querySelectorAll('p')).find(p => p.textContent.includes('🔵 위력:'));
      
          if (powerSection) {
        // 위력 섹션의 부모 컨테이너에서 입력 필드 찾기
        const container = powerSection.closest('.MuiBox-root');
        if (container) {
          // 해당 컨테이너 내의 첫 번째, 두 번째 입력 필드 (최소, 최대)
          const powerInputs = container.querySelectorAll('input[placeholder="최소"], input[placeholder="최대"]');
          
          if (powerInputs.length >= 2) {
            if (config.powerMin) {
              await setInputValue(powerInputs[0], config.powerMin);
            }
            if (config.powerMax) {
              await setInputValue(powerInputs[1], config.powerMax);
            }
          }
        }
      }
    }

    // 7. 무게 범위 입력
    if (config.weightMin || config.weightMax) {
      
      // 무게 섹션을 정확히 찾기 (HTML 구조 기반)
      const weightSection = Array.from(searchPanel.querySelectorAll('p')).find(p => p.textContent.includes('🟣 무게:'));
      
          if (weightSection) {
        // 무게 섹션의 부모 컨테이너에서 입력 필드 찾기
        const container = weightSection.closest('.MuiBox-root');
        if (container) {
          // 해당 컨테이너 내의 첫 번째, 두 번째 입력 필드 (최소, 최대)
          const weightInputs = container.querySelectorAll('input[placeholder="최소"], input[placeholder="최대"]');
          
          if (weightInputs.length >= 2) {
            if (config.weightMin) {
              await setInputValue(weightInputs[0], config.weightMin);
            }
            if (config.weightMax) {
              await setInputValue(weightInputs[1], config.weightMax);
            }
          }
        }
      }
    }

    // 8. 속성 선택
    if (config.attribute) {
      
      // 속성 드롭다운 컨테이너 찾기
      const searchPanel = document.querySelector('.css-1e25jpw');
      if (!searchPanel) {
        return;
      }
      
      // 먼저 이미 열린 메뉴들이 있는지 확인하고 닫기
      const openMenus = document.querySelectorAll('.MuiMenu-root, .MuiPopover-root');
      if (openMenus.length > 0) {
        document.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Escape', 
          bubbles: true 
        }));
        await this.sleep(200);
      }
      
      // 속성 드롭다운 찾기 (정확한 선택자 사용)
      let attributeSelect = null;
      
      // 방법 1: 속성 관련 텍스트가 있는 드롭다운 찾기
      const allSelects = searchPanel.querySelectorAll('.MuiSelect-select, .MuiSelect-root, [role="combobox"]');
      for (const select of allSelects) {
        const text = select.textContent?.trim();
        if (text && (text.includes('속성') || text.includes('선택') || text === '')) {
          attributeSelect = select;
          break;
        }
      }
      
      // 방법 2: 특정 클래스나 속성으로 찾기
      if (!attributeSelect) {
        attributeSelect = searchPanel.querySelector('.MuiSelect-select[role="combobox"]');
      }
      if (!attributeSelect) {
        attributeSelect = searchPanel.querySelector('.MuiSelect-root');
      }
      if (!attributeSelect) {
        attributeSelect = searchPanel.querySelector('[aria-haspopup="listbox"]');
      }
      
      if (!attributeSelect) {
        return;
      }
      
      
      try {
        // 드롭다운 열기 시도
        let dropdownOpened = false;
        
        // 방법 1: 클릭
          attributeSelect.click();
        await this.sleep(500);
        
        // 드롭다운이 열렸는지 확인
        const menuItems = document.querySelectorAll('.MuiMenuItem-root');
        if (menuItems.length > 0) {
          dropdownOpened = true;
        } else {
        }
        
        // 방법 2: 포커스 + 스페이스바
        if (!dropdownOpened) {
          attributeSelect.focus();
          await this.sleep(200);
          
          attributeSelect.dispatchEvent(new KeyboardEvent('keydown', { 
            key: ' ', 
            code: 'Space',
            bubbles: true,
            cancelable: true
          }));
          await this.sleep(500);
          
          const menuItems2 = document.querySelectorAll('.MuiMenuItem-root');
          if (menuItems2.length > 0) {
            dropdownOpened = true;
          } else {
          }
        }
        
        // 방법 3: 엔터키
        if (!dropdownOpened) {
          attributeSelect.focus();
          await this.sleep(200);
          
          attributeSelect.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Enter', 
            code: 'Enter',
            bubbles: true,
            cancelable: true
          }));
          await this.sleep(500);
          
          const menuItems3 = document.querySelectorAll('.MuiMenuItem-root');
          if (menuItems3.length > 0) {
            dropdownOpened = true;
      } else {
          }
        }
        
        if (!dropdownOpened) {
          return;
        }
        
        // 열린 메뉴에서 옵션 찾기
        const finalMenuItems = document.querySelectorAll('.MuiMenuItem-root');
        
        // 원하는 속성 옵션 찾기
        let targetOption = null;
        for (const item of finalMenuItems) {
          const text = item.textContent?.trim();
          if (text === config.attribute) {
            targetOption = item;
                      break;
                    }
                  }
        
        if (targetOption) {
          
          // 옵션 클릭
          targetOption.click();
          
          // 메뉴가 닫힐 때까지 대기
          await this.sleep(300);
          
        } else {
          // 메뉴 닫기 (ESC 키)
          document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Escape', 
            bubbles: true 
          }));
        }
        
              } catch (error) {
        console.error('속성 선택 중 오류:', error);
        
        // 오류 발생 시 메뉴 닫기
        document.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Escape', 
          bubbles: true 
        }));
      }
    }

  }

  // 검색 버튼 클릭
  async clickMarketSearchButton() {
    
    const searchPanel = document.querySelector('.css-1e25jpw');
    if (!searchPanel) {
      throw new Error('검색 패널을 찾을 수 없습니다.');
    }

    // 검색 패널 내의 검색 버튼 찾기
    let searchButton = null;
    const buttons = searchPanel.querySelectorAll('button');
    
      for (const button of buttons) {
        if (button.textContent.includes('검색') && !button.textContent.includes('초기화')) {
          searchButton = button;
          break;
      }
    }
    
    if (!searchButton) {
      console.error('검색 버튼을 찾을 수 없습니다.');
      throw new Error('검색 버튼을 찾을 수 없습니다.');
    }

    searchButton.click();
    
    // 검색 결과가 로드될 때까지 대기
    await this.waitForMarketSearchResults();
  }

  // 검색 결과가 로드될 때까지 대기 (최적화된 버전)
  async waitForMarketSearchResults() {
    let attempts = 0;
    const maxAttempts = 30; // 최대 3초 대기 (단축)
    
    while (attempts < maxAttempts) {
      // 로딩 스피너가 사라졌는지 확인
      const loadingSpinner = document.querySelector('.MuiCircularProgress-root');
      
      // 검색 결과가 로드되었는지 확인
      const results = document.querySelectorAll('.MuiTableRow-root, .MuiCard-root, .MuiGrid-item');
      
      if (!loadingSpinner && results.length > 0) {
      return;
    }

      await this.sleep(100);
      attempts++;
    }
    
  }

  // 거래소 검색 결과를 sessionStorage에 저장
  saveMarketSearchResultToSession(result) {
    try {
      const searchResults = JSON.parse(sessionStorage.getItem('marketSearchResults') || '[]');
      searchResults.push(result);
      
      // 최대 10개까지만 유지
      if (searchResults.length > 10) {
        searchResults.splice(0, searchResults.length - 10);
      }
      
      sessionStorage.setItem('marketSearchResults', JSON.stringify(searchResults));
    } catch (error) {
      console.error('거래소 검색 결과 저장 실패:', error);
    }
  }

  // 최종 거래소 검색 완료 모달 표시
  showFinalMarketModal(result) {
    // 거래소 검색 모달 기능이 삭제되었습니다.
    // 이전 버전과의 호환성을 위해 빈 함수로 남겨둠
  }

  async waitForElement(selector, timeout = 3000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await this.sleep(50); // 더 빠른 확인 간격
    }
    
    throw new Error(`요소를 찾을 수 없음: ${selector}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // executeQuickSearch, checkPendingQuickSearch 등 퀵검색 관련 함수와 코드 전체 삭제

  // 공개 메서드들
  getRareItemsData() {
    return this.rareItemsData;
  }
}

// ES6 모듈로 export
export default SearchEngine; 