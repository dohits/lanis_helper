/**
 * 거래 데이터 파싱 모듈
 * 신형 거래 데이터 형식을 파싱하는 기능
 */

export class TradeDataParser {
  /**
   * 신형 거래 데이터 파싱
   * @param {Array} rows - CSV 행 데이터
   * @param {string} itemName - 검색할 아이템명
   * @returns {Object} 파싱된 거래 데이터
   */
  static parseTradeData(rows, itemName) {
    const tradeItems = [];
    
    // 새로운 형식 데이터 파싱
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
            
            console.log(`[TradeDataParser] 파싱 시도 - 시간: ${timeStr}, 아이템텍스트: "${itemText}"`);
            
            // 가격 추출
            const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
            if (priceMatch) {
              const priceStr = priceMatch[1].replace(/,/g, '');
              const price = parseInt(priceStr, 10);
              
              // 수량 처리 - 2개 이상일 때만 "N개가" 표시, 1개일 때는 없음
              let count = 1;
              const countMatch = itemText.match(/(\d+)개가/);
              if (countMatch) {
                count = parseInt(countMatch[1], 10);
              }
              
              // 아이템명 추출 - 수량 텍스트 처리 개선
              // 1개일 때: "아이템명이 거래소에서 가격 Gold에 판매되었다." 또는 "아이템명이 가격 Gold에 판매되었다."
              // 2개 이상일 때: "아이템명 N개가 거래소에서 가격 Gold에 판매되었다." 또는 "아이템명 N개가 가격 Gold에 판매되었다."
              let extractedItemName = '';
              if (count > 1) {
                // 2개 이상: "N개가" 패턴으로 추출 (거래소에서 있거나 없거나)
                const itemMatch = itemText.match(/(.+?)\s+\d+개가(?:\s+거래소에서)?\s+\d{1,3}(?:,\d{3})*\s*Gold/);
                extractedItemName = itemMatch ? itemMatch[1].trim() : '';
              } else {
                // 1개: "이" 패턴으로 추출 (거래소에서 있거나 없거나)
                const itemMatch = itemText.match(/(.+?)이(?:\s+거래소에서)?\s+\d{1,3}(?:,\d{3})*\s*Gold/);
                extractedItemName = itemMatch ? itemMatch[1].trim() : '';
              }
              
              console.log(`[TradeDataParser] 추출 결과 - 아이템명: "${extractedItemName}", 검색어: "${itemName}", 매칭: ${extractedItemName === itemName}`);
              
              // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
              if (extractedItemName === itemName && price && price > 90000 && price < 1000000000) {
                console.log(`[TradeDataParser] 매칭 성공! 아이템: ${extractedItemName}, 가격: ${price}, 수량: ${count}, 시간: ${timeStr}`);
                const unitPrice = Math.round(price / count);
                
                // 시간 정보를 Date 객체로 변환
                let timestamp = new Date(0); // 기본값
                if (timeStr) {
                  // "2025. 8. 4. 오후 2:41:12" 형식을 파싱
                  const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
                  if (timeMatch) {
                    const [, year, month, day, ampm, hour, minute, second] = timeMatch;
                    let hour24 = parseInt(hour, 10);
                    if (ampm === '오후' && hour24 !== 12) hour24 += 12;
                    if (ampm === '오전' && hour24 === 12) hour24 = 0;
                    
                    timestamp = new Date(
                      parseInt(year, 10),
                      parseInt(month, 10) - 1, // 월은 0부터 시작
                      parseInt(day, 10),
                      hour24,
                      parseInt(minute, 10),
                      parseInt(second, 10)
                    );
                  }
                }
                
                // 거래 아이템 정보 저장 (분할하지 않고 하나의 거래로 저장)
                tradeItems.push({
                  price: unitPrice,
                  timestamp: timestamp,
                  originalText: itemText,
                  count: count,
                  format: 'new'
                });
              } else {
                if (extractedItemName !== itemName) {
                  console.log(`[TradeDataParser] 아이템명 불일치 - 추출: "${extractedItemName}", 검색: "${itemName}"`);
                }
                if (!price || price <= 90000 || price >= 1000000000) {
                  console.log(`[TradeDataParser] 가격 유효성 실패 - 가격: ${price}`);
                }
              }
            } else {
              console.log(`[TradeDataParser] 가격 추출 실패 - 텍스트: "${itemText}"`);
            }
          } else {
            console.log(`[TradeDataParser] 아이템 행이 비어있음 - 시간: ${timeStr}`);
          }
        } else {
          console.log(`[TradeDataParser] 아이템 행 인덱스 초과 - 시간: ${timeStr}`);
        }
      }
    }
    
    // 시간순으로 정렬 (최신이 위로)
    tradeItems.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
    
    // 50개 제한 적용
    const limitedTradeItems = tradeItems.slice(0, 50);
    
    // 개별 아이템 분할 (50개 제한 후)
    const finalTradeItems = [];
    limitedTradeItems.forEach((item, index) => {
      // 각 거래를 개별 아이템으로 분할
      for (let j = 0; j < item.count; j++) {
        finalTradeItems.push({
          price: item.price,
          timestamp: item.timestamp,
          originalText: item.originalText,
          format: 'new'
        });
      }
    });
    
    // 가격과 라벨 추출
    const prices = finalTradeItems.map(item => item.price).reverse();
    const labels = finalTradeItems.map((item, index) => {
      // 왼쪽이 오래된 거래, 오른쪽이 최신 거래가 되도록 순서 조정
      if (index === 0) return '최근 거래';
      return `${index}건 이전 거래`;
    }).reverse();
    
    return { prices, labels };
  }

  /**
   * 정확한 아이템명 매칭 검사
   * @param {string} itemText - 아이템 텍스트
   * @param {string} searchItemName - 검색할 아이템명
   * @returns {boolean} 매칭 여부
   */
  static isExactItemMatch(itemText, searchItemName) {
    if (!itemText || !searchItemName) return false;
    
    // 수량 정보 제거 후 정확한 매칭
    const cleanItemText = itemText.replace(/\s*x\s*\d+$/, '').trim();
    return cleanItemText === searchItemName;
  }
} 