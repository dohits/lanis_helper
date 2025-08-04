import { TradeDataParser } from './tradeDataParser.js';

/**
 * 아이템 검색 모듈
 * 거래 데이터에서 아이템명을 검색하는 기능
 */

export class ItemSearch {
  /**
   * 아이템 검색 기능
   * @param {Array} newRows - 신형 거래 데이터
   * @param {string} query - 검색어
   * @returns {Array} 검색 결과
   */
  static searchItems(newRows, query) {
    const allItems = new Set();
    
    // 신형 데이터에서 아이템명 추출
    for (let i = 0; i < newRows.length; i++) {
      const row = newRows[i];
      if (row.length === 0) continue;
      
      const cellA = (row[0] || '').replace(/"/g, '').trim();
      
      if (cellA.includes('거래 완료')) {
        // 아이템 정보 찾기 (i+2 행) - exam 파일과 동일한 로직
        if (i + 2 < newRows.length) {
          const itemRow = newRows[i + 2];
          if (itemRow && itemRow.length > 0) {
            const itemText = (itemRow[0] || '').replace(/"/g, '').trim();
            
            // 가격 추출
            const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
            if (priceMatch) {
              // 아이템명 추출 - exam 파일과 동일한 정규식
              const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
              const extractedItemName = itemMatch ? itemMatch[1].trim() : '';
              
              if (extractedItemName && extractedItemName.toLowerCase().includes(query.toLowerCase())) {
                allItems.add(extractedItemName);
              }
            }
          }
        }
      }
    }
    
    return Array.from(allItems).sort();
  }
} 