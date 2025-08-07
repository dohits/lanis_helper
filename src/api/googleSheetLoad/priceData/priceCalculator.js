/**
 * 가격 계산 모듈
 * 거래 데이터에서 가격 정보를 계산하는 기능
 * 새로운 형식 (2025.07.26 이후): A열 세로형 (거래 완료, 시간, 아이템 정보)
 */

export class PriceCalculator {
  /**
   * 새로운 형식의 거래 데이터에서 가격 정보 추출
   * @param {Array} rows - CSV 파싱된 행 데이터
   * @returns {Array} 추출된 거래 아이템 배열
   */
  static parseNewFormatTradeData(rows) {
    const tradeItems = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0) continue;
      
      const cellA = (row[0] || '').replace(/"/g, '').trim();
      
      // 새로운 형식: "거래 완료" 패턴 찾기
      if (cellA.includes('거래 완료')) {
        // 시간 정보 추출 (i+1 행)
        let timeStr = '';
        if (i + 1 < rows.length) {
          timeStr = (rows[i + 1][0] || '').replace(/"/g, '').trim();
        }
        
        // 아이템 정보 행 찾기 (i+2)
        if (i + 2 < rows.length) {
          const itemRow = rows[i + 2];
          if (itemRow.length > 0) {
            const itemText = (itemRow[0] || '').replace(/"/g, '').trim();
            
            // 가격 추출
            const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
            if (priceMatch) {
              const priceStr = priceMatch[1].replace(/,/g, '');
              const price = parseInt(priceStr, 10);
              
              // 수량 처리
              let count = 1;
              const countMatch = itemText.match(/(\d+)개가/);
              if (countMatch) {
                count = parseInt(countMatch[1], 10);
              }
              
              // 아이템명 추출 - 개선된 로직 (수량 패턴 우선)
              let extractedItemName = '';
              
              // 패턴 5: "아이템명 N개가 가격 Gold에 판매되었다." (N개, 거래소 없음)
              let match = itemText.match(/^(.+?)\s+\d+개가\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
              if (match) {
                extractedItemName = match[1].trim();
              }
              
              // 패턴 6: "아이템명 N개가 거래소에서 가격 Gold에 판매되었다." (N개, 거래소 있음)
              if (!extractedItemName) {
                match = itemText.match(/^(.+?)\s+\d+개가\s+거래소에서\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
                if (match) {
                  extractedItemName = match[1].trim();
                }
              }
              
              // 패턴 1: "아이템명이 가격 Gold에 판매되었다." (1개, 거래소 없음)
              if (!extractedItemName) {
                match = itemText.match(/^(.+?)이\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
                if (match) {
                  extractedItemName = match[1].trim();
                }
              }
              
              // 패턴 2: "아이템명가 가격 Gold에 판매되었다." (1개, 거래소 없음)
              if (!extractedItemName) {
                match = itemText.match(/^(.+?)가\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
                if (match) {
                  extractedItemName = match[1].trim();
                }
              }
              
              // 패턴 3: "아이템명이 거래소에서 가격 Gold에 판매되었다." (1개, 거래소 있음)
              if (!extractedItemName) {
                match = itemText.match(/^(.+?)이\s+거래소에서\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
                if (match) {
                  extractedItemName = match[1].trim();
                }
              }
              
              // 패턴 4: "아이템명가 거래소에서 가격 Gold에 판매되었다." (1개, 거래소 있음)
              if (!extractedItemName) {
                match = itemText.match(/^(.+?)가\s+거래소에서\s+\d{1,3}(?:,\d{3})*\s*Gold에\s+판매되었다\.$/);
                if (match) {
                  extractedItemName = match[1].trim();
                }
              }
              
              // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
              if (price && price > 90000 && price < 1000000000 && extractedItemName) {
                tradeItems.push({
                  timestamp: timeStr,
                  item: extractedItemName,
                  count: count,
                  price: price,
                  unitPrice: Math.round(price / count),
                  originalText: itemText
                });
              }
            }
          }
        }
      }
    }
    
    // 시간순으로 정렬 (최신이 위로)
    tradeItems.sort((a, b) => {
      const timeA = this.parseTimeString(a.timestamp);
      const timeB = this.parseTimeString(b.timestamp);
      return timeB - timeA;
    });
    
    return tradeItems;
  }

  /**
   * 시간 문자열을 Date 객체로 변환하는 헬퍼 함수
   * @param {string} timeStr - 시간 문자열 (2025. 7. 28. 오후 2:10:22 형식)
   * @returns {Date} Date 객체
   */
  static parseTimeString(timeStr) {
    if (!timeStr) return new Date(0);
    
    const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const [, year, month, day, ampm, hour, minute, second] = timeMatch;
      let hour24 = parseInt(hour, 10);
      if (ampm === '오후' && hour24 !== 12) hour24 += 12;
      if (ampm === '오전' && hour24 === 12) hour24 = 0;
      
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // 월은 0부터 시작
        parseInt(day, 10),
        hour24,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    return new Date(0);
  }

  /**
   * 특정 아이템의 가격 데이터 추출
   * @param {Array} tradeItems - 거래 아이템 배열
   * @param {string} itemName - 아이템명
   * @returns {Array} 해당 아이템의 가격 배열 (최신순)
   */
  static extractItemPrices(tradeItems, itemName) {
    return tradeItems
      .filter(item => item.item === itemName)
      .map(item => item.unitPrice);
  }

  /**
   * 최대 50건으로 제한된 가격 데이터 계산
   * @param {Object} tradeData - 파싱된 거래 데이터
   * @returns {Object} 계산된 가격 정보
   */
  static calculateLimitedPrices(tradeData) {
    // TradeDataParser에서 이미 50개 제한을 적용했으므로 추가 제한하지 않음
    const prices = tradeData.prices;
    const labels = tradeData.labels;
    const actualDates = tradeData.actualDates || [];
    
    if (prices.length === 0) {
      return {
        prices: [],
        labels: [],
        averagePrice: 0,
        recentPrice: 0,
        totalTrades: 0,
        noData: true,
        actualDates: []
      };
    }
    
    return {
      prices: prices,
      labels: labels,
      averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      recentPrice: prices[prices.length - 1], // 차트에서 오른쪽이 최신이므로 마지막 요소
      totalTrades: prices.length,
      actualDates: actualDates
    };
  }

  /**
   * 특정 가격 타입에 따른 가격 계산
   * @param {Array} prices - 가격 배열
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {number} 계산된 가격
   */
  static calculatePrice(prices, priceType = 'recent') {
    if (prices.length === 0) {
      return 0; // 에러 대신 0 반환
    }
    
    if (priceType === 'average') {
      // 평균 판매가
      return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    } else if (priceType === 'recent') {
      // 최근 판매가(가장 최신 가격) - 차트에서 오른쪽이 최신이므로 마지막 요소
      return prices[prices.length - 1];
    } else {
      return 0; // 알 수 없는 타입도 0 반환
    }
  }

  /**
   * 여러 아이템의 가격을 한 번에 계산
   * @param {Object} priceData - 아이템별 가격 데이터
   * @param {string} priceType - 가격 타입
   * @returns {Object} 아이템별 계산된 가격
   */
  static calculateMultiplePrices(priceData, priceType = 'recent') {
    const results = {};
    
    for (const [itemName, prices] of Object.entries(priceData)) {
      try {
        results[itemName] = this.calculatePrice(prices, priceType);
      } catch (error) {
        console.error(`${itemName} 가격 계산 실패:`, error);
        results[itemName] = 0; // 실패 시 0으로 설정
      }
    }
    
    return results;
  }

  /**
   * 새로운 형식의 거래 데이터에서 아이템별 가격 정보 계산
   * @param {Array} tradeItems - 새로운 형식의 거래 아이템 배열
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Object} 아이템별 계산된 가격
   */
  static calculatePricesFromNewFormat(tradeItems, priceType = 'recent') {
    const results = {};
    
    // 아이템별로 그룹화
    const itemGroups = {};
    tradeItems.forEach(item => {
      if (!itemGroups[item.item]) {
        itemGroups[item.item] = [];
      }
      itemGroups[item.item].push(item.unitPrice);
    });
    
    // 각 아이템의 가격 계산
    for (const [itemName, prices] of Object.entries(itemGroups)) {
      try {
        results[itemName] = this.calculatePrice(prices, priceType);
      } catch (error) {
        console.error(`${itemName} 가격 계산 실패:`, error);
        results[itemName] = 0;
      }
    }
    
    return results;
  }
} 