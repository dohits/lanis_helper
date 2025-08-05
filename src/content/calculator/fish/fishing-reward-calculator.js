import { FISHING_LEVEL_REWARDS, FISHING_LEVEL_PROBABILITIES, FISH_PER_ATTEMPT } from './fishing-level-data.js';
import PriceFetcher from '../price-fetcher.js';
import ExpectedValueCalculator from '../expected-value-calculator.js';

/**
 * 낚시 보상 계산기
 * 각 단계별 보상의 기댓값을 계산
 */
export class FishingRewardCalculator {
  constructor() {
    this.rewards = FISHING_LEVEL_REWARDS;
    this.probabilities = FISHING_LEVEL_PROBABILITIES;
    this.fishPerAttempt = FISH_PER_ATTEMPT;
    this.priceFetcher = new PriceFetcher();
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
    
    // 디버깅: 가격 데이터 확인
    console.log('전체 가격 데이터:', prices);
    console.log('초록 구슬 가격:', greenOrbPrice);

    for (const reward of levelRewards) {
      let itemPrice = prices[reward.item] || 0;
      let priceNote = '';

      // 가격이 없는 경우 대체 가격 계산
      if (itemPrice === 0) {
        if (reward.item === '초록 구슬 파편') {
          // 초록 구슬 파편 시세가 없으면 초록 구슬 시세로 계산
          console.log(`초록 구슬 파편 폴백: 초록 구슬 가격 = ${greenOrbPrice}`);
          if (greenOrbPrice > 0) {
            itemPrice = Math.floor(greenOrbPrice / 10);
            priceNote = `(초록 구슬 1/10 가격으로 계산)`;
            console.log(`초록 구슬 파편 폴백 적용: ${itemPrice}`);
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
                 // 조합 기댓값에서 최적조합비용을 뺀 값의 1/10
                 const netValue = crystalResult.bestExpectedValue - crystalResult.bestTotalCost;
                 itemPrice = Math.floor(Math.max(0, netValue) / 10);
                 const crystalName = maxCrystalPrice === redCrystalPrice ? '붉은 결정' : '푸른 결정';
                 priceNote = `(${crystalName} 조합 기댓값에서 최적조합비용을 뺀 값의 1/10 가격으로 계산)`;
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
               // 조합 기댓값에서 최적조합비용을 뺀 값의 1/10
               const netValue = sealKeyResult.bestExpectedValue - sealKeyResult.bestTotalCost;
               itemPrice = Math.floor(Math.max(0, netValue) / 10);
               priceNote = `(봉인의 열쇠 조합 기댓값에서 최적조합비용을 뺀 값의 1/10 가격으로 계산)`;
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
   * 특정 단계까지 도달하는데 필요한 누적 물고기 수량 계산
   * @param {number} targetLevel - 목표 단계
   * @returns {number} 누적 물고기 수량
   */
  calculateCumulativeFishCount(targetLevel) {
    let cumulativeFish = 0;
    
    for (let level = 1; level < targetLevel; level++) {
      const prob = this.probabilities[level];
      if (!prob) continue;
      
      // 각 단계에서 레벨업까지 필요한 평균 시도 횟수 계산
      const successRate = (prob.plus1 + prob.plus2) / 100;
      const attemptsNeeded = successRate > 0 ? 1 / successRate : Infinity;
      
      // 해당 단계에서 소모되는 물고기 수량
      const fishForLevel = attemptsNeeded * this.fishPerAttempt;
      cumulativeFish += fishForLevel;
    }
    
    return Math.ceil(cumulativeFish);
  }

  /**
   * 모든 단계의 보상 기댓값 계산
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<Array>} 모든 단계의 보상 기댓값
   */
  async calculateAllLevelRewards(priceType = 'recent') {
    const results = [];
    
    for (let level = 6; level <= 10; level++) {
      const result = await this.calculateExpectedReward(level, priceType);
      results.push(result);
    }
    
    return results;
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
      gap: 16px;
      padding: 16px;
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
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        // 단계 헤더
        const levelHeader = document.createElement('div');
        levelHeader.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #007bff;
        `;
        
        const levelTitle = document.createElement('h5');
        levelTitle.textContent = `${levelResult.level}단계`;
        levelTitle.style.cssText = `
          margin: 0;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        `;
        
                 // 누적 물고기 수량과 마리당 골드효율 계산
         const cumulativeFish = this.calculateCumulativeFishCount(levelResult.level);
         const goldPerFish = cumulativeFish > 0 ? levelResult.totalExpectedValue / cumulativeFish : 0;
         
         const totalValue = document.createElement('div');
         totalValue.style.cssText = `
           display: flex;
           flex-direction: column;
           align-items: flex-end;
           gap: 2px;
         `;
         
         const expectedValueText = document.createElement('div');
         expectedValueText.textContent = `총 기댓값: ${levelResult.totalExpectedValue.toLocaleString()}골드`;
         expectedValueText.style.cssText = `
           color: #28a745;
           font-weight: bold;
           font-size: 14px;
         `;
         
         const efficiencyText = document.createElement('div');
         efficiencyText.textContent = `마리당: ${goldPerFish.toLocaleString()}골드`;
         efficiencyText.style.cssText = `
           color: #007bff;
           font-size: 12px;
           font-weight: bold;
         `;
         
         const fishCountText = document.createElement('div');
         fishCountText.textContent = `누적: ${cumulativeFish.toLocaleString()}마리`;
         fishCountText.style.cssText = `
           color: #666;
           font-size: 11px;
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
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          `;
          
          const itemInfo = document.createElement('div');
          itemInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
          `;
          
          const itemName = document.createElement('div');
          itemName.textContent = reward.item;
          itemName.style.cssText = `
            font-weight: bold;
            color: #333;
            font-size: 14px;
          `;
          
          const itemDetails = document.createElement('div');
          itemDetails.textContent = `수량: ${reward.quantity}개 | 확률: ${reward.probability}%`;
          itemDetails.style.cssText = `
            color: #666;
            font-size: 12px;
          `;
          
          const itemValue = document.createElement('div');
          itemValue.style.cssText = `
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 2px;
          `;
          
                     const unitPrice = document.createElement('div');
           unitPrice.textContent = `단가: ${reward.unitPrice.toLocaleString()}골드`;
           unitPrice.style.cssText = `
             color: #666;
             font-size: 12px;
           `;
           
           // 가격 노트가 있는 경우 표시
           if (reward.priceNote) {
             const priceNote = document.createElement('div');
             priceNote.textContent = reward.priceNote;
             priceNote.style.cssText = `
               color: #ff6b6b;
               font-size: 11px;
               font-style: italic;
             `;
             itemValue.appendChild(priceNote);
           }
          
          const expectedValue = document.createElement('div');
          expectedValue.textContent = `기댓값: ${reward.expectedValue.toLocaleString()}골드`;
          expectedValue.style.cssText = `
            color: #28a745;
            font-weight: bold;
            font-size: 14px;
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