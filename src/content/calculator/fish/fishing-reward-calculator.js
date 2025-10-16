import { FISHING_LEVEL_REWARDS, FISHING_LEVEL_PROBABILITIES, FISH_PER_ATTEMPT } from './fishing-level-data.js';
import OfficialPriceFetcher from '../official-price-fetcher.js';
import ExpectedValueCalculator from '../expected-value-calculator.js';
import { FishingLevelCalculator } from './fishing-level-calculator.js';

/**
 * 낚시 보상 계산기
 * 각 단계별 보상의 기댓값을 계산
 */
export class FishingRewardCalculator {
  constructor() {
    this.rewards = FISHING_LEVEL_REWARDS;
    this.probabilities = FISHING_LEVEL_PROBABILITIES;
    this.fishPerAttempt = FISH_PER_ATTEMPT;
    this.priceFetcher = new OfficialPriceFetcher();
    this.expectedValueCalculator = new ExpectedValueCalculator();
  }

  /**
   * 특정 단계의 보상 기댓값 계산
   * @param {number} level - 낚시 단계
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<Object>} 보상 기댓값 정보
   */
  async calculateExpectedReward(level, priceType = 'recent') {
    const levelRewards = this.rewards[level];
    if (!levelRewards) {
      return {
        level,
        totalExpectedValue: 0,
        rewards: [],
        message: `${level}단계에는 보상이 없습니다.`
      };
    }

    let totalExpectedValue = 0;
    const rewards = [];

    // 모든 아이템의 시세를 한 번에 가져오기
    const itemNames = levelRewards.map(reward => reward.item);
    const prices = await this.priceFetcher.getMultipleItemPrices(itemNames, priceType);

    // 대체 가격 계산을 위한 추가 데이터 가져오기
    // 초록 구슬 시세를 별도로 가져오기 (파편과 구슬이 다른 아이템이므로)
    const greenOrbPrices = await this.priceFetcher.getMultipleItemPrices(['초록 구슬'], priceType);
    const greenOrbPrice = greenOrbPrices['초록 구슬'] || 0;
    
    // 결정 제작 키트 폴백을 위한 재료 가격 미리 가져오기
    const crystalMaterialNames = ['붉은 결정', '푸른 결정'];
    const crystalPrices = await this.priceFetcher.getMultipleItemPrices(crystalMaterialNames, priceType);

    for (const reward of levelRewards) {
      let itemPrice = prices[reward.item] || 0;
      let priceNote = '';

      // 가격이 없는 경우 대체 가격 계산
      if (itemPrice === 0) {
        if (reward.item === '초록 구슬 파편') {
          // 초록 구슬 파편 시세가 없으면 초록 구슬 시세로 계산
          
          if (greenOrbPrice > 0) {
            itemPrice = Math.floor(Math.max(0, greenOrbPrice - 300000) / 10);
            priceNote = `(초록 구슬에서 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;

          }
        } else if (reward.item === '결정 제작 키트') {
          // 결정 제작 키트 시세가 없으면 붉은 결정/푸른 결정 중 더 비싼 것의 기댓값 계산 후 1/10
          try {
            const redCrystalPrice = crystalPrices['붉은 결정'] || 0;
            const blueCrystalPrice = crystalPrices['푸른 결정'] || 0;
            const maxCrystalPrice = Math.max(redCrystalPrice, blueCrystalPrice);
            
            if (maxCrystalPrice > 0) {
              // 더 비싼 결정의 기댓값 계산 (100% 성공률 기준)
              const materialCosts = {
                [maxCrystalPrice === redCrystalPrice ? 'redBead' : 'blueBead']: maxCrystalPrice / 2, // 결정 가격의 절반으로 원재료 가격 추정
                [maxCrystalPrice === redCrystalPrice ? 'crowClaw' : 'slimeFluid']: maxCrystalPrice / 2
              };
              
              const crystalType = maxCrystalPrice === redCrystalPrice ? 'red_crystal' : 'blue_crystal';
              const crystalResult = await this.expectedValueCalculator.calculateExpectedValue(crystalType, materialCosts);
              
                             if (crystalResult && crystalResult.bestExpectedValue > 0) {
                 // 조합 기댓값에서 최적조합비용과 조합비용 30만골드를 차감한 후 1/10
                 const netValue = crystalResult.bestExpectedValue - crystalResult.bestTotalCost;
                 itemPrice = Math.floor(Math.max(0, netValue - 300000) / 10);
                 const crystalName = maxCrystalPrice === redCrystalPrice ? '붉은 결정' : '푸른 결정';
                 priceNote = `(${crystalName} 조합 기댓값에서 최적조합비용과 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;
               }
            }
          } catch (error) {
            console.error('결정 기댓값 계산 실패:', error);
          }
        } else if (reward.item === '열쇠 제작 키트') {
          // 열쇠 제작 키트 시세가 없으면 기댓값 계산기로 봉인의 열쇠 조합 기댓값 계산 후 1/10
          try {
            // 봉인의 열쇠 조합에 필요한 재료들의 시세 가져오기
            const materialNames = ['붉은 결정', '푸른 결정', '고급 가죽끈'];
            const materialPrices = await this.priceFetcher.getMultipleItemPrices(materialNames, priceType);
            
            // materialCosts 객체 생성
            const materialCosts = {
              redCrystal: materialPrices['붉은 결정'] || 0,
              blueCrystal: materialPrices['푸른 결정'] || 0,
              highGradeLeather: materialPrices['고급 가죽끈'] || 0
            };
            
                         const sealKeyResult = await this.expectedValueCalculator.calculateExpectedValue('seal_key', materialCosts);
             if (sealKeyResult && sealKeyResult.bestExpectedValue > 0) {
               // 조합 기댓값에서 최적조합비용과 조합비용 30만골드를 차감한 후 1/10
               const netValue = sealKeyResult.bestExpectedValue - sealKeyResult.bestTotalCost;
               itemPrice = Math.floor(Math.max(0, netValue - 300000) / 10);
               priceNote = `(봉인의 열쇠 조합 기댓값에서 최적조합비용과 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;
             }
          } catch (error) {
            console.error('봉인의 열쇠 기댓값 계산 실패:', error);
          }
        }
      }

      // 각 아이템의 기댓값 계산 (수량 × 단가)
      const expectedValue = reward.quantity * itemPrice;
      
      // 총 기댓값에 추가 (가중평균 계산)
      totalExpectedValue += (expectedValue * reward.probability) / 100;
      
      rewards.push({
        item: reward.item,
        quantity: reward.quantity,
        probability: reward.probability,
        unitPrice: itemPrice,
        expectedValue: expectedValue,
        priceNote: priceNote
      });
    }

    return {
      level,
      totalExpectedValue,
      rewards,
      message: `${level}단계 보상 기댓값: ${totalExpectedValue.toLocaleString()}골드`
    };
  }

  /**
   * 모든 단계의 보상 기댓값 계산 (최적화된 버전)
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<Array>} 모든 단계의 보상 기댓값
   */
  async calculateAllLevelRewards(priceType = 'recent') {
    // 모든 단계의 아이템을 미리 수집
    const allItems = new Set();
    for (let level = 6; level <= 10; level++) {
      const levelRewards = this.rewards[level];
      if (levelRewards) {
        levelRewards.forEach(reward => allItems.add(reward.item));
      }
    }
    
    // 추가로 필요한 아이템들도 포함
    allItems.add('초록 구슬');
    allItems.add('붉은 결정');
    allItems.add('푸른 결정');
    allItems.add('고급 가죽끈');
    
    // 모든 아이템의 가격을 한 번에 가져오기
    const allPrices = await this.priceFetcher.getMultipleItemPrices([...allItems], priceType);
    
    // 각 단계별로 계산 (이제 API 호출 없이 캐시된 데이터 사용)
    const results = [];
    for (let level = 6; level <= 10; level++) {
      const result = await this.calculateExpectedRewardWithCache(level, priceType, allPrices);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 캐시된 가격 데이터를 사용한 보상 기댓값 계산 (원래 로직과 동일)
   * @param {number} level - 낚시 단계
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @param {Object} cachedPrices - 캐시된 가격 데이터
   * @returns {Promise<Object>} 보상 기댓값 정보
   */
  async calculateExpectedRewardWithCache(level, priceType, cachedPrices) {
    const levelRewards = this.rewards[level];
    if (!levelRewards) {
      return {
        level,
        totalExpectedValue: 0,
        rewards: [],
        message: `${level}단계에는 보상이 없습니다.`
      };
    }

    let totalExpectedValue = 0;
    const rewards = [];

    // 캐시된 가격 데이터에서 필요한 값들 추출
    const greenOrbPrice = cachedPrices['초록 구슬'] || 0;
    const redCrystalPrice = cachedPrices['붉은 결정'] || 0;
    const blueCrystalPrice = cachedPrices['푸른 결정'] || 0;

    for (const reward of levelRewards) {
      let itemPrice = cachedPrices[reward.item] || 0;
      let priceNote = '';

      // 가격이 없는 경우 대체 가격 계산 (원래 로직과 동일)
      if (itemPrice === 0) {
        if (reward.item === '초록 구슬 파편') {
          // 초록 구슬 파편 시세가 없으면 초록 구슬 시세로 계산
          if (greenOrbPrice > 0) {
            itemPrice = Math.floor(Math.max(0, greenOrbPrice - 300000) / 10);
            priceNote = `(초록 구슬에서 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;
          }
        } else if (reward.item === '결정 제작 키트') {
          // 결정 제작 키트 시세가 없으면 붉은 결정/푸른 결정 중 더 비싼 것의 기댓값 계산 후 1/10
          try {
            const maxCrystalPrice = Math.max(redCrystalPrice, blueCrystalPrice);
            
            if (maxCrystalPrice > 0) {
              // 더 비싼 결정의 기댓값 계산 (100% 성공률 기준)
              const materialCosts = {
                [maxCrystalPrice === redCrystalPrice ? 'redBead' : 'blueBead']: maxCrystalPrice / 2,
                [maxCrystalPrice === redCrystalPrice ? 'crowClaw' : 'slimeFluid']: maxCrystalPrice / 2
              };
              
              const crystalType = maxCrystalPrice === redCrystalPrice ? 'red_crystal' : 'blue_crystal';
              const crystalResult = await this.expectedValueCalculator.calculateExpectedValue(crystalType, materialCosts);
              
              if (crystalResult && crystalResult.bestExpectedValue > 0) {
                // 조합 기댓값에서 최적조합비용과 조합비용 30만골드를 차감한 후 1/10
                const netValue = crystalResult.bestExpectedValue - crystalResult.bestTotalCost;
                itemPrice = Math.floor(Math.max(0, netValue - 300000) / 10);
                const crystalName = maxCrystalPrice === redCrystalPrice ? '붉은 결정' : '푸른 결정';
                priceNote = `(${crystalName} 조합 기댓값에서 최적조합비용과 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;
              }
            }
          } catch (error) {
            console.error('결정 제작 키트 폴백 계산 실패:', error);
          }
        } else if (reward.item === '열쇠 제작 키트') {
          // 열쇠 제작 키트 시세가 없으면 기댓값 계산기로 봉인의 열쇠 조합 기댓값 계산 후 1/10
          try {
            // 캐시에서 필요한 재료 가격 가져오기
            const materialCosts = {
              redCrystal: cachedPrices['붉은 결정'] || 0,
              blueCrystal: cachedPrices['푸른 결정'] || 0,
              highGradeLeather: cachedPrices['고급 가죽끈'] || 0
            };
            
            const sealKeyResult = await this.expectedValueCalculator.calculateExpectedValue('seal_key', materialCosts);
            if (sealKeyResult && sealKeyResult.bestExpectedValue > 0) {
              // 조합 기댓값에서 최적조합비용과 조합비용 30만골드를 차감한 후 1/10
              const netValue = sealKeyResult.bestExpectedValue - sealKeyResult.bestTotalCost;
              itemPrice = Math.floor(Math.max(0, netValue - 300000) / 10);
              priceNote = `(봉인의 열쇠 조합 기댓값에서 최적조합비용과 조합비용 30만골드 차감 후 1/10 가격으로 계산)`;
            }
          } catch (error) {
            console.error('봉인의 열쇠 기댓값 계산 실패:', error);
          }
        }
      }

      // 기댓값 계산 (확률 * 수량 * 단가)
      const expectedValue = (reward.probability / 100) * reward.quantity * itemPrice;
      totalExpectedValue += expectedValue;

      rewards.push({
        item: reward.item,
        quantity: reward.quantity,
        probability: reward.probability,
        price: itemPrice,
        priceNote,
        expectedValue
      });
    }

    return {
      level,
      totalExpectedValue,
      rewards,
      message: `${level}단계 보상 기댓값: ${totalExpectedValue.toLocaleString()}골드`
    };
  }

  /**
   * 단계별 보상 결과 생성 (기댓값 계산기 스타일)
   * @param {Array} results - 계산 결과 배열
   * @param {string} priceType - 가격 타입
   * @returns {HTMLElement} 보상 결과 컨테이너
   */
  createRewardResults(results, priceType = 'recent') {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      max-width: 100%;
      overflow-x: hidden;
    `;



    // 각 단계별 결과 표시
    results.forEach(levelResult => {
      if (levelResult.rewards.length === 0) {
        // 보상이 없는 경우
        const noRewardCard = document.createElement('div');
        noRewardCard.style.cssText = `
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          text-align: center;
          color: #666;
          font-style: italic;
        `;
        noRewardCard.textContent = levelResult.message;
        container.appendChild(noRewardCard);
      } else {
        // 보상이 있는 경우 - 카드 스타일
        const levelCard = document.createElement('div');
        levelCard.style.cssText = `
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 8px;
          max-width: 100%;
          box-sizing: border-box;
        `;

        // 단계 헤더
        const levelHeader = document.createElement('div');
        levelHeader.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #007bff;
          flex-wrap: wrap;
          gap: 8px;
        `;
        
        const levelTitle = document.createElement('h5');
        levelTitle.textContent = `${levelResult.level}단계`;
        levelTitle.style.cssText = `
          margin: 0;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        `;
        
                 // 누적 물고기 수량과 마리당 골드효율 계산 (마코프 체인 기반)
         const calculator = new FishingLevelCalculator();
         const cumulativeFish = Math.ceil(calculator.calculateExpectedFishToLevel(levelResult.level));
         const goldPerFish = cumulativeFish > 0 ? levelResult.totalExpectedValue / cumulativeFish : 0;
         
         const totalValue = document.createElement('div');
         totalValue.style.cssText = `
           display: flex;
           flex-direction: column;
           align-items: flex-end;
           gap: 2px;
           flex-shrink: 0;
           min-width: 120px;
         `;
         
         const expectedValueText = document.createElement('div');
         expectedValueText.textContent = `기댓값: ${levelResult.totalExpectedValue.toLocaleString()}골드`;
         expectedValueText.style.cssText = `
           color: #28a745;
           font-weight: bold;
           font-size: 13px;
           white-space: nowrap;
         `;
         
         const efficiencyText = document.createElement('div');
         efficiencyText.textContent = `마리당: ${goldPerFish.toLocaleString()}골드`;
         efficiencyText.style.cssText = `
           color: #007bff;
           font-size: 11px;
           font-weight: bold;
           white-space: nowrap;
         `;
         
         const fishCountText = document.createElement('div');
         fishCountText.textContent = `누적: ${cumulativeFish.toLocaleString()}마리`;
         fishCountText.style.cssText = `
           color: #666;
           font-size: 10px;
           white-space: nowrap;
         `;
         
         totalValue.appendChild(expectedValueText);
         totalValue.appendChild(efficiencyText);
         totalValue.appendChild(fishCountText);
         
         levelHeader.appendChild(levelTitle);
         levelHeader.appendChild(totalValue);
        levelCard.appendChild(levelHeader);

        // 보상 아이템들
        levelResult.rewards.forEach(reward => {
          const rewardItem = document.createElement('div');
          rewardItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;
            gap: 12px;
          `;
          
          const itemInfo = document.createElement('div');
          itemInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          `;
          
          const itemName = document.createElement('div');
          itemName.textContent = reward.item;
          itemName.style.cssText = `
            font-weight: bold;
            color: #333;
            font-size: 13px;
            word-break: break-word;
          `;
          
          const itemDetails = document.createElement('div');
          itemDetails.textContent = `수량: ${reward.quantity}개 | 확률: ${reward.probability}%`;
          itemDetails.style.cssText = `
            color: #666;
            font-size: 11px;
            word-break: break-word;
          `;
          
          const itemValue = document.createElement('div');
          itemValue.style.cssText = `
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex-shrink: 0;
            min-width: 120px;
            align-items: flex-end;
          `;
          
          const unitPrice = document.createElement('div');
          unitPrice.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            color: #666;
            font-size: 11px;
            white-space: nowrap;
          `;
          
          const priceText = document.createElement('span');
          priceText.textContent = `단가: ${reward.price.toLocaleString()}골드`;
          unitPrice.appendChild(priceText);
           
           // 가격 노트가 있는 경우 아이콘으로 표시
           if (reward.priceNote) {
             const priceNoteIcon = document.createElement('span');
             priceNoteIcon.textContent = 'ℹ️';
             priceNoteIcon.style.cssText = `
               cursor: pointer;
               font-size: 12px;
               opacity: 0.7;
               transition: opacity 0.2s;
               flex-shrink: 0;
               user-select: none;
               position: relative;
             `;
             
             // 커스텀 툴팁 생성
             const tooltip = document.createElement('div');
             tooltip.textContent = reward.priceNote;
             tooltip.style.cssText = `
               position: fixed;
               background: #333;
               color: white;
               padding: 8px 12px;
               border-radius: 6px;
               font-size: 11px;
               z-index: 999999;
               display: none;
               pointer-events: none;
               box-shadow: 0 4px 12px rgba(0,0,0,0.3);
               max-width: 300px;
               white-space: normal;
               word-break: break-word;
               line-height: 1.4;
               border: 1px solid #555;
             `;
             
             let isTooltipVisible = false;
             
             let showTooltip = (event) => {
               const rect = priceNoteIcon.getBoundingClientRect();
               
               // 툴팁을 아이콘 위쪽에 표시 (더 안전한 위치)
               tooltip.style.left = Math.max(10, rect.left - 100) + 'px';
               tooltip.style.top = Math.max(10, rect.top - 60) + 'px';
               tooltip.style.display = 'block';
               tooltip.style.visibility = 'visible';
               tooltip.style.opacity = '1';
               priceNoteIcon.style.opacity = '1';
               isTooltipVisible = true;
             };
             
             let hideTooltip = () => {
               tooltip.style.display = 'none';
               priceNoteIcon.style.opacity = '0.7';
               isTooltipVisible = false;
             };
             
             // 이벤트 리스너
             priceNoteIcon.addEventListener('click', (e) => {
               e.preventDefault();
               e.stopPropagation();
               if (isTooltipVisible) {
                 hideTooltip();
               } else {
                 showTooltip(e);
               }
             });
             
             // 문서 클릭 이벤트로 툴팁 닫기
             const handleDocumentClick = (e) => {
               if (isTooltipVisible && !tooltip.contains(e.target) && !priceNoteIcon.contains(e.target)) {
                 hideTooltip();
               }
             };
             
             // 툴팁이 표시될 때만 문서 클릭 이벤트 추가
             const originalShowTooltip = showTooltip;
             showTooltip = (event) => {
               originalShowTooltip(event);
               document.addEventListener('click', handleDocumentClick);
             };
             
             const originalHideTooltip = hideTooltip;
             hideTooltip = () => {
               originalHideTooltip();
               document.removeEventListener('click', handleDocumentClick);
             };
             
             // 툴팁을 body에 추가
             document.body.appendChild(tooltip);
             unitPrice.appendChild(priceNoteIcon);
           }
          
          const expectedValue = document.createElement('div');
          expectedValue.textContent = `기댓값: ${reward.expectedValue.toLocaleString()}골드`;
          expectedValue.style.cssText = `
            color: #28a745;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
          `;
          
          itemInfo.appendChild(itemName);
          itemInfo.appendChild(itemDetails);
          itemValue.appendChild(unitPrice);
          itemValue.appendChild(expectedValue);
          rewardItem.appendChild(itemInfo);
          rewardItem.appendChild(itemValue);
          levelCard.appendChild(rewardItem);
        });
        
        container.appendChild(levelCard);
      }
    });
    
    return container;
  }
} 