// 검색 엔진
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
      
      // 무기 타입 파싱 (예: (무기/지팡이) 형식)
      const weaponTypeMatch = wikiText.match(/\(([^)]+)\)/);
      if (weaponTypeMatch) {
        weaponType = weaponTypeMatch[1].trim();
      }
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 위력 정보 찾기 (개선된 패턴)
      const powerMatch = wikiText.match(/\|\s*위력\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (powerMatch) {
        powerMin = parseInt(powerMatch[1]);
        powerMax = parseInt(powerMatch[2]);
      } else {
        // 대안 패턴: 위력이 별도 행에 있는 경우
        const powerMatchAlt = wikiText.match(/\|\s*위력\s*\n\|\s*(\d+)\s*~\s*(\d+)/);
        if (powerMatchAlt) {
          powerMin = parseInt(powerMatchAlt[1]);
          powerMax = parseInt(powerMatchAlt[2]);
        } else {
        }
      }
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 무게 정보 찾기 (개선된 패턴)
      const weightMatch = wikiText.match(/\|\s*무게\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (weightMatch) {
        weightMin = parseInt(weightMatch[1]);
        weightMax = parseInt(weightMatch[2]);
      } else {
        // 대안 패턴: 무게가 별도 행에 있는 경우
        const weightMatchAlt = wikiText.match(/\|\s*무게\s*\n\|\s*(\d+)\s*~\s*(\d+)/);
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
          name: itemName,
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
      // 1. 카테고리 탭 이동과 검색 패널 열기를 병렬로 처리
      const promises = [];
      
      if (searchConfig.category) {
        promises.push(this.waitForElement('button[role="tab"]', 3000));
      }
      
      // 검색 패널이 이미 열려있는지 먼저 확인
      let searchPanel = document.querySelector('.css-1e25jpw');
      if (!searchPanel) {
        promises.push(this.openSearchPanelIfNeeded());
      }
      
      // 병렬로 대기
      await Promise.all(promises);
      
      // 2. 카테고리 전환 (대기 시간 단축)
      if (searchConfig.category) {
        await this.switchToCategory(searchConfig.category);
        await this.sleep(500); // 1500ms → 500ms로 단축
      }

      // 3. 검색 패널이 열려있는지 다시 확인 (이미 열려있으면 건너뛰기)
      searchPanel = document.querySelector('.css-1e25jpw');
      if (!searchPanel) {
        await this.openSearchPanelIfNeeded();
      }

      // 4. 입력 필드 대기 시간 단축
      await this.waitForElement('.css-1e25jpw input[placeholder*="아이템 이름"]', 3000); // 5000ms → 3000ms

      // 5. 검색 조건 입력 (대기 시간 단축)
      await this.fillSearchConditions(searchConfig);

      // 6. 검색 실행
      await this.executeSearch();

    } catch (error) {
      console.error('퀵검색 실행 중 오류:', error);
    } finally {
      if (button) button.classList.remove('loading');
    }
  }

  async openSearchPanelIfNeeded() {
    // 검색 패널이 이미 열려있는지 확인
    let searchPanel = document.querySelector('.css-1e25jpw');
    if (searchPanel) return;

    // 검색 버튼 찾기 (정확한 셀렉터 사용)
    let searchButton = null;
    
    // 방법 1: 텍스트로 찾기
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent.includes('검색')) {
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
      console.log('검색 버튼을 찾을 수 없습니다. 사용 가능한 버튼들:', 
                  Array.from(document.querySelectorAll('button')).map(b => ({
                    text: b.textContent,
                    ariaLabel: b.getAttribute('aria-label'),
                    title: b.getAttribute('title'),
                    className: b.className
                  })));
      throw new Error('검색 버튼을 찾을 수 없습니다.');
    }

    const start = Date.now();
    const maxWait = 4000; // 7000ms → 4000ms로 단축

    while (Date.now() - start < maxWait) {
      // 검색 패널이 열렸는지 다시 확인
      searchPanel = document.querySelector('.css-1e25jpw');
      if (searchPanel) return;

      // 검색 버튼 클릭
      searchButton.click();
      await this.sleep(200); // 400ms → 200ms로 단축
    }
    
    console.log('검색 패널을 열 수 없습니다. 현재 페이지의 패널들:', 
                Array.from(document.querySelectorAll('.css-1e25jpw')).map(p => ({
                  className: p.className,
                  visible: p.offsetParent !== null
                })));
    throw new Error('검색 패널을 열 수 없습니다.');
  }

  async fillSearchConditions(config) {
    
    await this.sleep(150);

    // React/MUI 입력 필드 값을 설정하는 헬퍼 함수
    const setInputValueById = (id, value) => {
      const input = document.getElementById(id);
      if (!input) {
        console.error(`ID ${id}를 가진 입력 필드를 찾을 수 없습니다.`);
        return false;
      }
      
      try {
        // React/MUI 방식: focus → value 변경 → input 이벤트 → blur
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();

        return true;
      } catch (error) {
        console.error(`ID ${id} 값 입력 실패:`, error);
        return false;
      }
    };

    // ID로 입력 필드를 찾을 수 없는 경우를 위한 fallback 함수
    const setInputValueByPlaceholder = (placeholder, value) => {
      const input = document.querySelector(`input[placeholder*="${placeholder}"]`);
      if (!input) {
        console.error(`placeholder "${placeholder}"를 가진 입력 필드를 찾을 수 없습니다.`);
        return false;
      }
      
      try {
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();

        return true;
      } catch (error) {
        console.error(`placeholder "${placeholder}" 값 입력 실패:`, error);
        return false;
      }
    };

    // 1. 키워드 검색 (ID: «r1t» 또는 placeholder로 fallback)
    if (config.keyword) {
      let success = setInputValueById('«r1t»', config.keyword);
      if (!success) {
        success = setInputValueByPlaceholder('아이템 이름 또는 설명으로 검색', config.keyword);
      }
      if (success) await this.sleep(50);
    }

    // 2. 입찰가 범위 입력 (ID: «r1u», «r1v»)
    if (config.bidMin || config.bidMax) {
      if (config.bidMin) {
        let success = setInputValueById('«r1u»', config.bidMin);
        if (!success) {
          // fallback: 입찰가 라벨 근처의 첫 번째 최소 입력 필드
          const bidSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟢 입찰가:'));
          if (bidSection) {
            const section = bidSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최소"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.bidMin;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
      
      if (config.bidMax) {
        let success = setInputValueById('«r1v»', config.bidMax);
        if (!success) {
          // fallback: 입찰가 라벨 근처의 첫 번째 최대 입력 필드
          const bidSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟢 입찰가:'));
          if (bidSection) {
            const section = bidSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최대"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.bidMax;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
    }

    // 3. 즉시구매가 범위 입력 (ID: «r20», «r21»)
    if (config.buyMin || config.buyMax) {
      if (config.buyMin) {
        let success = setInputValueById('«r20»', config.buyMin);
        if (!success) {
          // fallback: 즉시구매 라벨 근처의 첫 번째 최소 입력 필드
          const buySection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟠 즉시구매:'));
          if (buySection) {
            const section = buySection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최소"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.buyMin;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
      
      if (config.buyMax) {
        let success = setInputValueById('«r21»', config.buyMax);
        if (!success) {
          // fallback: 즉시구매 라벨 근처의 첫 번째 최대 입력 필드
          const buySection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟠 즉시구매:'));
          if (buySection) {
            const section = buySection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최대"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.buyMax;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
    }

    // 4. 위력 범위 입력 (ID: «r22», «r23»)
    if (config.powerMin || config.powerMax) {
      if (config.powerMin) {
        let success = setInputValueById('«r22»', config.powerMin);
        if (!success) {
          // fallback: 위력 라벨 근처의 첫 번째 최소 입력 필드
          const powerSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🔵 위력:'));
          if (powerSection) {
            const section = powerSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최소"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.powerMin;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
      
      if (config.powerMax) {
        let success = setInputValueById('«r23»', config.powerMax);
        if (!success) {
          // fallback: 위력 라벨 근처의 첫 번째 최대 입력 필드
          const powerSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🔵 위력:'));
          if (powerSection) {
            const section = powerSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최대"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.powerMax;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
    }

    // 5. 무게 범위 입력 (ID: «r24», «r25»)
    if (config.weightMin || config.weightMax) {
      if (config.weightMin) {
        let success = setInputValueById('«r24»', config.weightMin);
        if (!success) {
          // fallback: 무게 라벨 근처의 첫 번째 최소 입력 필드
          const weightSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟣 무게:'));
          if (weightSection) {
            const section = weightSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최소"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.weightMin;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
      
      if (config.weightMax) {
        let success = setInputValueById('«r25»', config.weightMax);
        if (!success) {
          // fallback: 무게 라벨 근처의 첫 번째 최대 입력 필드
          const weightSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🟣 무게:'));
          if (weightSection) {
            const section = weightSection.closest('.MuiBox-root');
            if (section) {
              const inputs = section.querySelectorAll('input[placeholder="최대"]');
              if (inputs.length > 0) {
                const input = inputs[0];
                input.focus();
                input.value = config.weightMax;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();

              }
            }
          }
        }
        await this.sleep(50);
      }
    }

    // 6. 속성 선택 (ID: «r26»)
    if (config.attribute) {
      
      const attributeSelect = document.getElementById('«r26»');
      if (attributeSelect) {
        try {
          // 드롭다운 클릭
          attributeSelect.click();
          await this.sleep(100);
          
          // 드롭다운 메뉴에서 옵션 찾기
          const listbox = document.querySelector('ul[role="listbox"]');
          if (listbox) {
            const options = listbox.querySelectorAll('li[role="option"]');
            for (const option of options) {
              if (option.textContent.trim() === config.attribute) {
                                  option.click();
                  await this.sleep(50);
                break;
              }
            }
          } else {
            console.error('속성 드롭다운 메뉴를 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('속성 선택 실패:', error);
        }
      } else {
        // fallback: 속성 라벨 근처의 드롭다운 찾기
        const attributeSection = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('🔴 속성:'));
        if (attributeSection) {
          const section = attributeSection.closest('.MuiBox-root');
          if (section) {
            const select = section.querySelector('div[role="combobox"]');
            if (select) {
              try {
                select.click();
                await this.sleep(100);
                
                const listbox = document.querySelector('ul[role="listbox"]');
                if (listbox) {
                  const options = listbox.querySelectorAll('li[role="option"]');
                  for (const option of options) {
                    if (option.textContent.trim() === config.attribute) {
                      option.click();
                      await this.sleep(50);
                      break;
                    }
                  }
                }
              } catch (error) {
                console.error('속성 선택 실패 (fallback):', error);
              }
            }
          }
        }
      }
    }
    

  }

  async switchToCategory(category) {
    
    const categoryMap = {
      'weapon': '무기',
      'armor': '방어구',
      'accessory': '장신구',
      'material': '재료',
      'potion': '포션',
      'consumable': '소모품'
    };

    const targetCategory = categoryMap[category];
    if (!targetCategory) {
      return;
    }

    const tabButtons = document.querySelectorAll('button[role="tab"]');
    for (const button of tabButtons) {
      if (button.textContent.includes(targetCategory)) {
        button.click();
        await this.sleep(500);
        return;
      }
    }
  }

  async executeSearch() {

    
    // 검색 버튼 찾기 (여러 방법으로 시도)
    let searchButton = null;
    
    // 1. 검색 패널 내의 검색 버튼 찾기 (우선순위 1)
    const panel = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.css-1e25jpw');
    if (panel) {
      const buttons = panel.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent.includes('검색') && !button.textContent.includes('초기화')) {
          searchButton = button;
          break;
        }
      }
    }
    
    // 2. 전체 페이지에서 검색 버튼 찾기 (우선순위 2)
    if (!searchButton) {
      const allButtons = document.querySelectorAll('button');
      for (const button of allButtons) {
        if (button.textContent.includes('검색') && 
            !button.textContent.includes('초기화') && 
            button.classList.contains('MuiButton-containedPrimary')) {
          searchButton = button;
          break;
        }
      }
    }
    
    // 3. 클래스 기반으로 검색 버튼 찾기 (우선순위 3)
    if (!searchButton) {
      searchButton = document.querySelector('button.MuiButton-containedPrimary');
      if (searchButton && searchButton.textContent.includes('검색')) {
      } else {
        searchButton = null;
      }
    }
    
    // 4. 마지막 fallback: 검색 아이콘이 있는 버튼 찾기
    if (!searchButton) {
      const buttonsWithSearchIcon = document.querySelectorAll('button');
      for (const button of buttonsWithSearchIcon) {
        const searchIcon = button.querySelector('svg');
        if (searchIcon && button.textContent.includes('검색')) {
          searchButton = button;
          break;
        }
      }
    }
    
    if (searchButton) {
      try {
        searchButton.click();
        await this.sleep(500); // 검색 결과 로딩 대기
        return true;
      } catch (error) {
        console.error('검색 버튼 클릭 실패:', error);
        return false;
      }
    } else {
      console.error('검색 버튼을 찾을 수 없습니다.');
      return false;
    }
  }

  async waitForElement(selector, timeout = 5000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await this.sleep(100);
    }
    
    throw new Error(`요소를 찾을 수 없음: ${selector}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  checkPendingQuickSearch() {
    const pendingSearch = sessionStorage.getItem('pendingQuickSearch');
    if (pendingSearch) {
      try {
        const { searchConfig, buttonIndex } = JSON.parse(pendingSearch);
        sessionStorage.removeItem('pendingQuickSearch');
        
        // 페이지 로드 완료 후 검색 실행 (대기 시간 단축)
        setTimeout(() => {
          this.executeQuickSearch(searchConfig, buttonIndex);
        }, 1000); // 2000ms → 1000ms로 단축
        
      } catch (error) {
        console.error('대기 중인 퀵검색 파싱 실패:', error);
        sessionStorage.removeItem('pendingQuickSearch');
      }
    }
  }

  // 공개 메서드들
  getRareItemsData() {
    return this.rareItemsData;
  }
}

// 전역 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchEngine = new SearchEngine();
  });
} else {
  window.searchEngine = new SearchEngine(); 
} 