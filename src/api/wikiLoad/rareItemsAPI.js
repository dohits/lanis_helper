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
      // 1. 카테고리 멤버 조회
      const categoryData = await this.getCategoryMembers(this.categoryTitle, 500);
      
      if (!categoryData.query || !categoryData.query.categorymembers) {
        throw new Error('카테고리 멤버를 가져올 수 없습니다.');
      }

      const itemTitles = categoryData.query.categorymembers.map(member => member.title);
      
      // 2. 아이템 정보 수집
      const items = await this.collectItemDetails(itemTitles);
      
      return {
        success: true,
        count: items.length,
        message: `레어 아이템 데이터 수집 완료 (${items.length}개 아이템)`,
        items
      };

    } catch (error) {
      console.error('희귀 아이템 수집 실패:', error);
      
      // 대안 방법 시도
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
  }

  // 아이템 상세 정보 수집
  async collectItemDetails(itemTitles) {
    const items = [];

    if (itemTitles.length <= 50) {
      // 50개 이하면 한 번에 처리
      const result = await this.processBatch([itemTitles], 1, async (batch) => {
        const titles = batch[0];
        const allItemsData = await this.getPageContent(titles);
        
        const batchItems = [];
        let successCount = 0;
        let failCount = 0;

        for (const pageId in allItemsData.query.pages) {
          const page = allItemsData.query.pages[pageId];
          if (page.revisions && page.revisions[0]) {
            const content = page.revisions[0]['*'];
            const itemInfo = this.parseItemFromWikiText(content, page.title);
            if (itemInfo) {
              batchItems.push(itemInfo);
              successCount++;
            } else {
              failCount++;
            }
          }
        }

        return { items: batchItems, successCount, failCount };
      });

      return result.items;

    } else {
      // 50개 초과면 배치 처리
      const result = await this.processBatch(itemTitles, 50, async (batch) => {
        const titles = batch.join('|');
        const itemData = await this.getPageContent(titles);
        
        const batchItems = [];
        let successCount = 0;
        let failCount = 0;

        for (const pageId in itemData.query.pages) {
          const page = itemData.query.pages[pageId];
          if (page.revisions && page.revisions[0]) {
            const content = page.revisions[0]['*'];
            const itemInfo = this.parseItemFromWikiText(content, page.title);
            if (itemInfo) {
              batchItems.push(itemInfo);
              successCount++;
            } else {
              failCount++;
            }
          }
        }

        return { items: batchItems, successCount, failCount };
      });

      return result.items;
    }
  }

  // 대안 방법: 간단한 API 재시도
  async collectRareItemsAlternative() {
    try {
      const simpleQuery = `${this.baseUrl}?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(this.categoryTitle)}&cmlimit=10`;
      
      const response = await fetch(simpleQuery, {
        method: 'GET',
        headers: this.headers
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