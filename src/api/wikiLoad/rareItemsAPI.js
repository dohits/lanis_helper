// 희귀 아이템 데이터 수집 API
import WikiAPI from './index.js';

class RareItemsAPI extends WikiAPI {
  constructor() {
    super();
    this.categoryTitle = 'Category:레어_아이템';
  }

    // 희귀 아이템 목록 수집
  async collectRareItems() {

    
    try {

      
      // 1. 카테고리 멤버 조회 (GET 요청)
      const categoryData = await this.getCategoryMembers(this.categoryTitle, 500);
      
      if (!categoryData.query || !categoryData.query.categorymembers) {
        throw new Error('카테고리 멤버를 가져올 수 없습니다.');
      }
  
      const itemTitles = categoryData.query.categorymembers.map(member => member.title);
      
      
      // 2. 아이템 정보 수집 (POST 요청)
      const items = await this.collectItemDetails(itemTitles);
      
      
      
      return {
        success: true,
        count: items.length,
        message: `레어 아이템 데이터 수집 완료 (${items.length}개 아이템)`,
        items
      };
  
    } catch (error) {
      console.error('❌ POST 수집 실패:', error.message);
      
      return {
        success: false,
        message: `수집 실패: ${error.message}`
      };
    }
  }

  // 아이템 상세 정보 수집 (POST 요청만 사용)
  async collectItemDetails(itemTitles) {
    
    
    const items = [];
    const batchSize = 50; // MediaWiki API 제한
    const totalBatches = Math.ceil(itemTitles.length / batchSize);
    
    // 50개씩 배치로 나누어 POST 요청
    for (let i = 0; i < itemTitles.length; i += batchSize) {
      const batch = itemTitles.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      
      // 프로그레스바 업데이트 (이벤트로 전달)
      window.dispatchEvent(new CustomEvent('itemCollectionProgress', {
        detail: { 
          current: items.length, // 현재까지 수집된 아이템 개수
          total: itemTitles.length, // 전체 아이템 개수
          batch: currentBatch,
          totalBatches: totalBatches
        }
      }));
      
      try {
        const titles = batch.join('|');
        const itemData = await this.getPageContent(titles);
        
        // 응답 구조 확인
        if (!itemData || !itemData.query || !itemData.query.pages) {
          console.error('잘못된 POST 응답 구조:', itemData);
          continue;
        }

        let successCount = 0;
        let failCount = 0;

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
        

        
        // 배치 간 지연 (성공적으로 작동하므로 지연 시간 단축)
        if (i + batchSize < itemTitles.length) {
          await this.sleep(50);
        }
        
      } catch (error) {
        console.error(`❌ POST 배치 실패:`, error.message);
      }
    }
    
    
    return items;
  }



  // 위키 텍스트에서 아이템 정보 파싱
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
        }
      }

      // 어빌리티 파싱
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
        return {
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
      }

      return null;
    } catch (error) {
      console.error('아이템 정보 파싱 오류:', error);
      return null;
    }
  }
}

export default RareItemsAPI; 