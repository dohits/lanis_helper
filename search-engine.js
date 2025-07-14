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
            console.log('희귀 아이템 데이터 로드 완료:', this.rareItemsData.length);
          } else {
            console.log('희귀 아이템 데이터가 없습니다.');
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
    console.log('아이템 수집 시작');
    try {
      // 기존 데이터 확인 (캐시 카운트용)
      const existingData = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'lastCrawlTime', 'crawlCount'], (result) => {
          resolve(result);
        });
      });

      const now = Date.now();
      const items = [];
      console.log('기존 데이터 확인 완료:', existingData);
      
      // 기존 방식: 분류 페이지에서 아이템 목록 수집
      console.log('분류 페이지에서 아이템 수집 시작');
      
      try {
        // MediaWiki API를 사용하여 레어 아이템 목록 가져오기
        const apiUrl = 'https://laniswiki.lovestoblog.com/api.php';
        
        // 1. 레어 아이템 분류 페이지의 링크 목록 가져오기 (최대 500개)
        const categoryQuery = `${apiUrl}?action=query&format=json&list=categorymembers&cmtitle=Category:레어_아이템&cmlimit=500`;
        
        // 구버전 방식: 직접 fetch 사용
        console.log('카테고리 쿼리 요청:', categoryQuery);
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
        console.log('카테고리 응답 길이:', categoryText.length);
        console.log('카테고리 응답 시작:', categoryText.substring(0, 300));
        
        if (categoryText.trim().startsWith('<html') || categoryText.trim().startsWith('<!DOCTYPE')) {
          console.error('카테고리 HTML 응답:', categoryText.substring(0, 1000));
          throw new Error('서버가 HTML을 반환했습니다. 위키 API 접근 권한이 없을 수 있습니다.');
        }
        
        const categoryData = JSON.parse(categoryText);
        console.log('카테고리 쿼리 성공:', categoryData);
        
        const itemTitles = categoryData.query.categorymembers.map(member => member.title);
        console.log(`총 ${itemTitles.length}개 아이템 발견`);
        
        // 2. 최적화된 방법: 한 번에 모든 아이템 정보 가져오기
        if (itemTitles.length <= 50) {
          // 50개 이하면 한 번에 처리
          const allTitles = itemTitles.join('|');
          const allItemsQuery = `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(allTitles)}&prop=revisions&rvprop=content`;
          
          console.log('한 번에 모든 아이템 처리:', allItemsQuery);
          
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
          console.log('한 번에 모든 아이템 처리 성공');
          
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
          
          console.log(`한 번에 처리 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
          
        } else {
          // 50개 초과면 배치 처리 (최적화된 배치 크기)
          const batchSize = 50; // 한 번에 50개씩 처리 (속도 개선)
          let successCount = 0;
          let failCount = 0;
          
          for (let i = 0; i < itemTitles.length; i += batchSize) {
            const batch = itemTitles.slice(i, i + batchSize);
            const titles = batch.join('|');
            
            const itemQuery = `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=revisions&rvprop=content`;
            
            console.log(`배치 ${Math.floor(i/batchSize) + 1} 아이템 쿼리 요청 (${batch.length}개)`);
            
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
            console.log(`배치 ${Math.floor(i/batchSize) + 1} 아이템 쿼리 성공`);
              
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
          
          console.log(`배치 처리 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
        }
        
      } catch (error) {
        console.error('API 수집 상세 오류:', error);
        
        // API 실패 시 대안 방법 시도
        try {
          console.log('API 실패, 대안 방법 시도 중...');
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
      console.log('대안 방법: 직접 fetch를 통한 API 재시도');
      
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
      console.log('대안 API 응답:', text.substring(0, 300));
      
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
      
      console.log(`아이템 파싱 시작: ${itemName}`);
      console.log('위키 텍스트 샘플:', wikiText.substring(0, 500));
      
      // 무기 타입 파싱 (예: (무기/지팡이) 형식)
      const weaponTypeMatch = wikiText.match(/\(([^)]+)\)/);
      if (weaponTypeMatch) {
        weaponType = weaponTypeMatch[1].trim();
        console.log(`무기 타입 파싱 성공: ${weaponType}`);
      }
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 위력 정보 찾기 (개선된 패턴)
      const powerMatch = wikiText.match(/\|\s*위력\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (powerMatch) {
        powerMin = parseInt(powerMatch[1]);
        powerMax = parseInt(powerMatch[2]);
        console.log(`위력 파싱 성공: ${powerMin} ~ ${powerMax}`);
      } else {
        // 대안 패턴: 위력이 별도 행에 있는 경우
        const powerMatchAlt = wikiText.match(/\|\s*위력\s*\n\|\s*(\d+)\s*~\s*(\d+)/);
        if (powerMatchAlt) {
          powerMin = parseInt(powerMatchAlt[1]);
          powerMax = parseInt(powerMatchAlt[2]);
          console.log(`위력 파싱 성공 (대안): ${powerMin} ~ ${powerMax}`);
        } else {
          console.log('위력 정보를 찾을 수 없습니다.');
        }
      }
      
      // MediaWiki 테이블 구조에 맞는 패턴으로 무게 정보 찾기 (개선된 패턴)
      const weightMatch = wikiText.match(/\|\s*무게\s*\|\|\s*(\d+)\s*~\s*(\d+)/);
      if (weightMatch) {
        weightMin = parseInt(weightMatch[1]);
        weightMax = parseInt(weightMatch[2]);
        console.log(`무게 파싱 성공: ${weightMin} ~ ${weightMax}`);
      } else {
        // 대안 패턴: 무게가 별도 행에 있는 경우
        const weightMatchAlt = wikiText.match(/\|\s*무게\s*\n\|\s*(\d+)\s*~\s*(\d+)/);
        if (weightMatchAlt) {
          weightMin = parseInt(weightMatchAlt[1]);
          weightMax = parseInt(weightMatchAlt[2]);
          console.log(`무게 파싱 성공 (대안): ${weightMin} ~ ${weightMax}`);
        } else {
          console.log('무게 정보를 찾을 수 없습니다.');
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
            console.log(`어빌리티 파싱 성공: ${abilities.join(', ')}`);
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
            console.log(`속성 파싱 성공: ${attributes.join(', ')}`);
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
        console.log(`아이템 파싱 완료:`, result);
        return result;
      }
      
      console.log(`아이템 파싱 실패: ${itemName} - 유효한 정보가 없습니다.`);
      return null;
    } catch (error) {
      console.error('아이템 정보 파싱 오류:', error);
      return null;
    }
  }

  async executeQuickSearch(searchConfig, buttonIndex) {
    console.log('퀵검색 실행 시작', { searchConfig, buttonIndex });

    // 거래소 페이지가 아닐 경우 이동
    if (!window.location.href.includes('/market')) {
      sessionStorage.setItem('pendingQuickSearch', JSON.stringify({ searchConfig, buttonIndex }));
      window.location.href = 'https://lanis.me/market';
      return;
    }

    const button = document.querySelector(`.quick-buttons-sub-container .quick-button:nth-child(${buttonIndex + 1})`);
    if (button) button.classList.add('loading');

    try {
      // 1. 카테고리 탭 이동 (탭 버튼이 나타날 때까지 대기)
      if (searchConfig.category) {
        await this.waitForElement('button[role="tab"]', 5000);
        await this.switchToCategory(searchConfig.category);
        // 탭 이동 완료 후 충분한 대기 시간
        await this.sleep(1500);
      }

      // 2. 검색 패널 열기 (탭 이동 완료 후)
      await this.openSearchPanelIfNeeded();

      // 3. 입력 필드가 나타날 때까지 대기 (검색 패널 내부에서)
      await this.waitForElement('.css-1e25jpw input[placeholder*="아이템 이름"]', 5000);

      // 4. 검색 조건 입력
      await this.fillSearchConditions(searchConfig);

      // 5. 검색 실행
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
    const maxWait = 7000;

    while (Date.now() - start < maxWait) {
      // 검색 패널이 열렸는지 다시 확인
      searchPanel = document.querySelector('.css-1e25jpw');
      if (searchPanel) return;

      // 검색 버튼 클릭
      searchButton.click();
      await this.sleep(400);
    }
    
    console.log('검색 패널을 열 수 없습니다. 현재 페이지의 패널들:', 
                Array.from(document.querySelectorAll('.css-1e25jpw')).map(p => ({
                  className: p.className,
                  visible: p.offsetParent !== null
                })));
    throw new Error('검색 패널을 열 수 없습니다.');
  }

  async fillSearchConditions(config) {
    await this.sleep(300); // 검색 패널이 완전히 로드될 때까지 대기

    // 키워드 검색
    const panel = document.querySelector('.css-1e25jpw');
    if (config.keyword && panel) {
      const keywordInput = panel.querySelector('input[placeholder*="아이템 이름"]');
      if (keywordInput) {
        keywordInput.value = config.keyword;
        keywordInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
    }

    // 모든 입력 필드 찾기 (검색 패널 내부에서만)
    const allInputs = panel ? panel.querySelectorAll('input[type="text"], input[type="number"]') : [];
    let inputIndex = 0;

    // 입찰가 범위 (첫 번째, 두 번째 입력 필드)
    if (config.bidMin || config.bidMax) {
      if (allInputs.length > inputIndex && config.bidMin) {
        allInputs[inputIndex].value = config.bidMin;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
      if (allInputs.length > inputIndex && config.bidMax) {
        allInputs[inputIndex].value = config.bidMax;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
    } else {
      inputIndex += 2; // 입찰가 필드 건너뛰기
    }

    // 즉시구매가 범위 (세 번째, 네 번째 입력 필드)
    if (config.buyMin || config.buyMax) {
      if (allInputs.length > inputIndex && config.buyMin) {
        allInputs[inputIndex].value = config.buyMin;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
      if (allInputs.length > inputIndex && config.buyMax) {
        allInputs[inputIndex].value = config.buyMax;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
    } else {
      inputIndex += 2; // 즉시구매가 필드 건너뛰기
    }

    // 위력 범위 (다섯 번째, 여섯 번째 입력 필드)
    if (config.powerMin || config.powerMax) {
      if (allInputs.length > inputIndex && config.powerMin) {
        allInputs[inputIndex].value = config.powerMin;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
      if (allInputs.length > inputIndex && config.powerMax) {
        allInputs[inputIndex].value = config.powerMax;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
    } else {
      inputIndex += 2; // 위력 필드 건너뛰기
    }

    // 무게 범위 (일곱 번째, 여덟 번째 입력 필드)
    if (config.weightMin || config.weightMax) {
      if (allInputs.length > inputIndex && config.weightMin) {
        allInputs[inputIndex].value = config.weightMin;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
      if (allInputs.length > inputIndex && config.weightMax) {
        allInputs[inputIndex].value = config.weightMax;
        allInputs[inputIndex].dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
      }
      inputIndex++;
    } else {
      inputIndex += 2; // 무게 필드 건너뛰기
    }

    // 속성 선택
    if (config.attribute && panel) {
      const attributeSelect = panel.querySelector('select');
      if (attributeSelect) {
        const options = Array.from(attributeSelect.options);
        const targetOption = options.find(option => 
          option.textContent.includes(config.attribute)
        );
        if (targetOption) {
          attributeSelect.value = targetOption.value;
          attributeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          await this.sleep(100);
        }
      }
    }

    console.log('검색 조건 입력 완료');
  }

  async switchToCategory(category) {
    console.log('카테고리 전환:', category);
    
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
      console.log('알 수 없는 카테고리:', category);
      return;
    }

    const tabButtons = document.querySelectorAll('button[role="tab"]');
    for (const button of tabButtons) {
      if (button.textContent.includes(targetCategory)) {
        button.click();
        console.log('카테고리 탭 클릭:', targetCategory);
        await this.sleep(500);
        return;
      }
    }

    console.log('카테고리 탭을 찾을 수 없음:', targetCategory);
  }

  async executeSearch() {
    console.log('검색 실행');
    
    // 검색 버튼 찾기 및 클릭
    const searchButton = document.querySelector('button[type="submit"], button:contains("검색")');
    if (searchButton) {
      searchButton.click();
      console.log('검색 버튼 클릭');
    } else {
      console.log('검색 버튼을 찾을 수 없음');
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
        
        // 페이지 로드 완료 후 검색 실행
        setTimeout(() => {
          this.executeQuickSearch(searchConfig, buttonIndex);
        }, 2000);
        
        console.log('대기 중인 퀵검색 실행:', { searchConfig, buttonIndex });
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

// 전역 인스턴스 생성 (개선된 버전)
console.log('SearchEngine 클래스 정의 완료');
console.log('SearchEngine 인스턴스 생성 시작');
console.log('현재 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료 - SearchEngine 인스턴스 생성');
    window.searchEngine = new SearchEngine();
    console.log('SearchEngine 인스턴스 생성 완료:', window.searchEngine);
    console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
  });
} else {
  console.log('DOM 이미 로드됨 - SearchEngine 인스턴스 즉시 생성');
window.searchEngine = new SearchEngine(); 
  console.log('SearchEngine 인스턴스 생성 완료:', window.searchEngine);
  console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
} 