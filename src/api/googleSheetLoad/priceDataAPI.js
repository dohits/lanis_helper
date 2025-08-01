// 시세 데이터 전용 API 모듈
import GoogleSheetAPI from './index.js';

class PriceDataAPI extends GoogleSheetAPI {
  constructor() {
    super();
    // 트레이드 차트와 동일한 시트 정보 사용
    this.sheetId = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
    this.oldGid = '439005150'; // 기존 데이터 (A,B,C열 형식)
    this.newGid = '1489625214'; // 새로운 데이터 (A열 세로형 형식)
  }

  /**
   * 시세 데이터 가져오기 (2개 시트 조합)
   * @returns {Promise<Object>} 기존/새로운 데이터
   */
  async fetchPriceData() {
    try {
      // 기존 데이터 (A,B,C열 형식) - gid=439005150
      const oldRows = await this.fetchCSVData(this.sheetId, this.oldGid);
      
      // 새로운 데이터 (A열 세로형 형식) - gid=1489625214
      const newRows = await this.fetchCSVData(this.sheetId, this.newGid);
      
      return { oldRows, newRows };
    } catch (error) {
      console.error('구글 시트에서 시세 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 정확한 아이템명 매칭 함수
   * @param {string} itemText - 아이템 텍스트
   * @param {string} searchItemName - 검색할 아이템명
   * @returns {boolean} 매칭 여부
   */
  isExactItemMatch(itemText, searchItemName) {
    // 아이템명에서 수량 정보 제거 (예: "붉은 구슬 6개가" -> "붉은 구슬")
    const cleanItemText = itemText.replace(/\s+\d+개가.*$/, '').trim();
    
    // 정확한 매칭 또는 단어 경계 매칭
    if (cleanItemText === searchItemName) {
      return true;
    }
    
    // 단어 경계 매칭 (예: "붉은" 검색시 "붉은 구슬"은 매칭되지만 "붉은색 구슬"은 매칭 안됨)
    const words = cleanItemText.split(/\s+/);
    return words.some(word => word === searchItemName);
  }

  /**
   * 새로운 형식 거래 데이터 파싱
   * @param {Array} rows - CSV 행 데이터
   * @param {string} itemName - 검색할 아이템명
   * @returns {Object} 파싱된 거래 데이터
   */
  parseTradeData(rows, itemName) {
    const tradeItems = [];
    
    // 데이터 형식 판별 및 파싱
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
        
        // 아이템 정보 찾기 (i+2 행) - 실제 데이터에는 빈 행이 없음
        let itemText = '';
        if (i + 2 < rows.length) {
          const itemRow = rows[i + 2];
          if (itemRow.length > 0) {
            itemText = (itemRow[0] || '').replace(/"/g, '').trim();
            
            // 시간 정보가 아닌 실제 아이템 정보인지 확인
            if (itemText && !itemText.match(/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(오전|오후)/)) {
              // 아이템명 추출 및 정확한 매칭
              const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
              const extractedItemName = itemMatch ? itemMatch[1].trim() : '';
              
              // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
              if (extractedItemName === itemName) {
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
                  
                  // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                  if (price && price > 90000 && price < 1000000000) {
                    const unitPrice = Math.round(price / count);
                    
                    // 시간 정보를 Date 객체로 변환
                    let timestamp = new Date(0); // 기본값
                    if (timeStr) {
                      // "2025. 7. 28. 오후 2:10:22" 형식을 파싱
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
                    
                    // 거래 아이템 정보 저장
                    for (let j = 0; j < count; j++) {
                      tradeItems.push({
                        price: unitPrice,
                        timestamp: timestamp,
                        originalText: itemText,
                        format: 'new'
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      // 기존 형식: 순번, 아이템, 가격 형식
      else if (cellA.match(/^\d+$/) && row.length >= 3) {
        const sequence = parseInt(cellA, 10);
        const itemText = (row[1] || '').replace(/"/g, '').trim();
        const priceText = (row[2] || '').replace(/"/g, '').trim();
        
        // 가격 추출
        const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
        if (priceMatch) {
          const priceStr = priceMatch[1].replace(/,/g, '');
          const price = parseInt(priceStr, 10);
          
          // 수량 처리
          let count = 1;
          const countMatch = itemText.match(/x\s*(\d+)/);
          if (countMatch) {
            count = parseInt(countMatch[1], 10);
          }
          
          // 아이템명 추출
          const extractedItemName = itemText.replace(/\s*x\s*\d+$/, '').trim();
          
          // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
          if (extractedItemName === itemName) {
            // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
            if (price && price > 90000 && price < 1000000000) {
              const unitPrice = Math.round(price / count);
              
              // 거래 아이템 정보 저장
              for (let j = 0; j < count; j++) {
                tradeItems.push({
                  price: unitPrice,
                  sequence: sequence,
                  originalText: `${sequence}\t${itemText}\t${priceText}`,
                  format: 'old'
                });
              }
            }
          }
        }
      }
    }
    
    // 시간순으로 정렬 (최신이 위로)
    tradeItems.sort((a, b) => {
      if (a.format === 'new' && b.format === 'old') return -1; // 새로운 형식이 우선
      if (a.format === 'old' && b.format === 'new') return 1;
      
      if (a.format === 'new') {
        return b.timestamp - a.timestamp;
      } else {
        // 기존 형식은 순번 역순 (큰 순번이 최신)
        return (b.sequence || 0) - (a.sequence || 0);
      }
    });
    
    // 가격과 라벨 추출
    const prices = tradeItems.map(item => item.price);
    const labels = tradeItems.map((item, index) => {
      if (index === 0) return '최근 거래';
      return `${index}건 이전 거래`;
    });
    
    return { prices, labels };
  }

  /**
   * 기존 형식 가격 데이터 파싱
   * @param {Array} rows - CSV 행 데이터
   * @param {string} itemName - 검색할 아이템명
   * @returns {Object} 파싱된 가격 데이터
   */
  parsePriceData(rows, itemName) {
    const prices = [];
    const labels = [];
    
    // 헤더 인덱스 파악
    const header = rows[0].map(h => h.trim());
    const idxSequence = header.findIndex(h => h.includes('순번'));
    const idxName = header.findIndex(h => h.includes('아이템'));
    const idxPrice = header.findIndex(h => h.includes('가격'));
    
    if (idxName === -1 || idxPrice === -1) {
      return { prices: [], labels: [] };
    }
    
    // 필터링
    const filtered = rows.slice(1).filter(r => {
      const name = (r[idxName]||'').replace(/"/g,'').trim();
      const baseName = name.replace(/ x \d+$/, '').trim();
      return baseName === itemName;
    });
    
    if (filtered.length === 0) {
      return { prices: [], labels: [] };
    }
    
    // 순번 기준으로 최신순 정렬 (순번이 클수록 최근)
    if (idxSequence !== -1) {
      filtered.sort((a, b) => {
        const seqA = parseInt((a[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
        const seqB = parseInt((b[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
        return seqB - seqA; // 내림차순 (큰 순번이 위로 - 최신 거래가 위로)
      });
    } else {
      // 순번 컬럼이 없으면 기존 방식 사용
      filtered.reverse();
    }
    
    // 최대 50건
    const dataN = filtered.slice(0, 50);
    
    // robust 가격 파싱 및 수량 처리
    dataN.forEach(row => {
      let name = (row[idxName]||'').replace(/"/g,'').trim();
      let count = 1;
      const match = name.match(/ x (\d+)$/);
      if (match) count = parseInt(match[1], 10) || 1;
      
      // 가격 파싱
      let priceRaw = (row[idxPrice] || '').replace(/"/g, '').replace(/[^\d]/g, '');
      let price = parseInt(priceRaw, 10);
      
      // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
      if (price && price > 90000 && price < 1000000000) {
        if (count > 1) price = Math.round(price / count);
        for (let i = 0; i < count; i++) {
          prices.push(price);
        }
      }
    });
    
    // 기존 데이터는 순번순으로 정렬되어 있음 (큰 순번이 최신)
    // 라벨 생성 (순번순 - 최신 거래가 위로)
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        labels.push('최근 거래');
      } else {
        labels.push(`${i}건 이전 거래`);
      }
    }
    
    return { prices, labels };
  }

  /**
   * 특정 아이템의 시세 데이터 가져오기
   * @param {string} itemName - 아이템명
   * @param {string} priceType - 가격 타입 ('recent' 또는 'average')
   * @returns {Promise<number>} 가격
   */
  async getItemPrice(itemName, priceType = 'recent') {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        throw new Error('데이터가 충분하지 않습니다.');
      }
      
      // 트레이드 차트와 동일한 데이터 처리
      const priceData = this.parsePriceData(oldRows, itemName);
      const tradeData = this.parseTradeData(newRows, itemName);
      
      // 두 데이터 합치기 (시간순으로 통합)
      const allPrices = [];
      const allLabels = [];
      
      // 새로운 거래 데이터가 더 최신이므로 먼저 추가
      allPrices.push(...tradeData.prices);
      allLabels.push(...tradeData.labels);
      
      // 기존 시세 데이터 추가
      allPrices.push(...priceData.prices);
      allLabels.push(...priceData.labels);
      
      // 전체 데이터를 시간순으로 재정렬 (최신이 위로)
      const combinedData = allPrices.map((price, index) => ({
        price,
        label: allLabels[index],
        source: index < tradeData.prices.length ? 'trade' : 'price'
      }));
      
      // 시간순 정렬 (최신이 위로)
      combinedData.sort((a, b) => {
        // 새로운 거래 데이터가 더 최신이므로 우선순위
        if (a.source === 'trade' && b.source === 'price') return -1;
        if (a.source === 'price' && b.source === 'trade') return 1;
        return 0; // 같은 소스 내에서는 기존 순서 유지
      });
      
      // 정렬된 데이터 추출
      const finalPrices = combinedData.map(item => item.price);
      
      if (finalPrices.length === 0) {
        throw new Error(`${itemName}의 유효한 가격 데이터를 찾을 수 없습니다.`);
      }
      
      if (priceType === 'average') {
        // 평균 판매가 (트레이드 차트와 동일)
        return Math.round(finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length);
      } else if (priceType === 'recent') {
        // 최근 판매가(가장 최신 가격) (트레이드 차트와 동일)
        return finalPrices[0];
      } else {
        throw new Error(`알 수 없는 가격 타입: ${priceType}`);
      }
      
    } catch (error) {
      console.error(`${itemName} 시세 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * 여러 아이템의 시세를 한 번에 가져오기
   * @param {Array} items - 아이템명 배열
   * @param {string} priceType - 가격 타입
   * @returns {Promise<Object>} 아이템별 가격 객체
   */
  async getMultipleItemPrices(items, priceType = 'recent') {
    const results = {};
    
    for (const itemName of items) {
      try {
        results[itemName] = await this.getItemPrice(itemName, priceType);
      } catch (error) {
        console.error(`${itemName} 시세 가져오기 실패:`, error);
        results[itemName] = 0; // 실패 시 0으로 설정
      }
    }
    
    return results;
  }

  /**
   * 트레이드 차트용 데이터 가져오기 (차트와 정보 표시용)
   * @param {string} itemName - 아이템명
   * @returns {Promise<Object>} 차트 데이터
   */
  async getChartData(itemName) {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        throw new Error('데이터가 충분하지 않습니다.');
      }
      
      // 트레이드 차트와 동일한 파싱 함수들
      const parseTradeData = (rows, itemName) => {
        const tradeItems = [];
        
        // 데이터 형식 판별 및 파싱
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
            
            // 아이템 정보 찾기 (i+2 행) - 실제 데이터에는 빈 행이 없음
            let itemText = '';
            if (i + 2 < rows.length) {
              const itemRow = rows[i + 2];
              if (itemRow.length > 0) {
                itemText = (itemRow[0] || '').replace(/"/g, '').trim();
                
                // 시간 정보가 아닌 실제 아이템 정보인지 확인
                if (itemText && !itemText.match(/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(오전|오후)/)) {
                  // 아이템명 추출 및 정확한 매칭
                  const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
                  const extractedItemName = itemMatch ? itemMatch[1].trim() : '';
                  
                  // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
                  if (extractedItemName === itemName) {
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
                      
                      // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                      if (price && price > 90000 && price < 1000000000) {
                        const unitPrice = Math.round(price / count);
                        
                        // 시간 정보를 Date 객체로 변환
                        let timestamp = new Date(0); // 기본값
                        if (timeStr) {
                          // "2025. 7. 28. 오후 2:10:22" 형식을 파싱
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
                        
                        // 거래 아이템 정보 저장
                        for (let j = 0; j < count; j++) {
                          tradeItems.push({
                            price: unitPrice,
                            timestamp: timestamp,
                            originalText: itemText,
                            format: 'new'
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          // 기존 형식: 순번, 아이템, 가격 형식
          else if (cellA.match(/^\d+$/) && row.length >= 3) {
            const sequence = parseInt(cellA, 10);
            const itemText = (row[1] || '').replace(/"/g, '').trim();
            const priceText = (row[2] || '').replace(/"/g, '').trim();
            
            // 가격 추출
            const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
            if (priceMatch) {
              const priceStr = priceMatch[1].replace(/,/g, '');
              const price = parseInt(priceStr, 10);
              
              // 수량 처리
              let count = 1;
              const countMatch = itemText.match(/x\s*(\d+)/);
              if (countMatch) {
                count = parseInt(countMatch[1], 10);
              }
              
              // 아이템명 추출
              const extractedItemName = itemText.replace(/\s*x\s*\d+$/, '').trim();
              
              // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
              if (extractedItemName === itemName) {
                // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                if (price && price > 90000 && price < 1000000000) {
                  const unitPrice = Math.round(price / count);
                  
                  // 거래 아이템 정보 저장
                  for (let j = 0; j < count; j++) {
                    tradeItems.push({
                      price: unitPrice,
                      sequence: sequence,
                      originalText: `${sequence}\t${itemText}\t${priceText}`,
                      format: 'old'
                    });
                  }
                }
              }
            }
          }
        }
        
        // 시간순으로 정렬 (최신이 위로)
        tradeItems.sort((a, b) => {
          if (a.format === 'new' && b.format === 'old') return -1; // 새로운 형식이 우선
          if (a.format === 'old' && b.format === 'new') return 1;
          
          if (a.format === 'new') {
            return b.timestamp - a.timestamp;
          } else {
            // 기존 형식은 순번 역순 (큰 순번이 최신)
            return (b.sequence || 0) - (a.sequence || 0);
          }
        });
        
        // 가격과 라벨 추출
        const prices = tradeItems.map(item => item.price);
        const labels = tradeItems.map((item, index) => {
          if (index === 0) return '최근 거래';
          return `${index}건 이전 거래`;
        });
        
        return { prices, labels };
      };
      
      const parsePriceData = (rows, itemName) => {
        const prices = [];
        const labels = [];
        
        // 헤더 인덱스 파악
        const header = rows[0].map(h => h.trim());
        const idxSequence = header.findIndex(h => h.includes('순번'));
        const idxName = header.findIndex(h => h.includes('아이템'));
        const idxPrice = header.findIndex(h => h.includes('가격'));
        
        if (idxName === -1 || idxPrice === -1) {
          return { prices: [], labels: [] };
        }
        
        // 필터링 (정확한 아이템명 매칭)
        const filtered = rows.slice(1).filter(r => {
          const name = (r[idxName]||'').replace(/"/g,'').trim();
          const baseName = name.replace(/ x \d+$/, '').trim();
          return baseName === itemName; // 정확한 매칭
        });
        
        if (filtered.length === 0) {
          return { prices: [], labels: [] };
        }
        
        // 순번 기준으로 최신순 정렬 (순번이 클수록 최근)
        if (idxSequence !== -1) {
          filtered.sort((a, b) => {
            const seqA = parseInt((a[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
            const seqB = parseInt((b[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
            return seqB - seqA; // 내림차순 (큰 순번이 위로 - 최신 거래가 위로)
          });
        } else {
          // 순번 컬럼이 없으면 기존 방식 사용
          filtered.reverse();
        }
        
        // 최대 50건
        const dataN = filtered.slice(0, 50);
        
        // robust 가격 파싱 및 수량 처리
        dataN.forEach(row => {
          let name = (row[idxName]||'').replace(/"/g,'').trim();
          let count = 1;
          const match = name.match(/ x (\d+)$/);
          if (match) count = parseInt(match[1], 10) || 1;
          
          // 가격 파싱
          let priceRaw = (row[idxPrice] || '').replace(/"/g, '').replace(/[^\d]/g, '');
          let price = parseInt(priceRaw, 10);
          
          // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
          if (price && price > 90000 && price < 1000000000) {
            if (count > 1) price = Math.round(price / count);
            for (let i = 0; i < count; i++) {
              prices.push(price);
            }
          }
        });
        
        // 기존 데이터는 순번순으로 정렬되어 있음 (큰 순번이 최신)
        // 라벨 생성 (순번순 - 최신 거래가 위로)
        for (let i = 0; i < prices.length; i++) {
          if (i === 0) {
            labels.push('최근 거래');
          } else {
            labels.push(`${i}건 이전 거래`);
          }
        }
        
        return { prices, labels };
      };
      
      // 트레이드 차트와 동일한 데이터 처리
      const priceData = parsePriceData(oldRows, itemName);
      const tradeData = parseTradeData(newRows, itemName);
      
      // 두 데이터 합치기 (시간순으로 통합)
      const allPrices = [];
      const allLabels = [];
      
      // 새로운 거래 데이터가 더 최신이므로 먼저 추가
      allPrices.push(...tradeData.prices);
      allLabels.push(...tradeData.labels);
      
      // 기존 시세 데이터 추가
      allPrices.push(...priceData.prices);
      allLabels.push(...priceData.labels);
      
      // 전체 데이터를 시간순으로 재정렬 (최신이 위로)
      const combinedData = allPrices.map((price, index) => ({
        price,
        label: allLabels[index],
        source: index < tradeData.prices.length ? 'trade' : 'price'
      }));
      
      // 시간순 정렬 (최신이 위로)
      combinedData.sort((a, b) => {
        // 새로운 거래 데이터가 더 최신이므로 우선순위
        if (a.source === 'trade' && b.source === 'price') return -1;
        if (a.source === 'price' && b.source === 'trade') return 1;
        return 0; // 같은 소스 내에서는 기존 순서 유지
      });
      
      // 정렬된 데이터 추출
      const finalPrices = combinedData.map(item => item.price);
      const finalLabels = combinedData.map((item, index) => {
        if (index === 0) return '최근 거래';
        return `${index}건 이전 거래`;
      });
      
      if (finalPrices.length === 0) {
        // 데이터가 없을 때는 오류 대신 빈 데이터 객체 반환
        return {
          timeOrderedPrices: [],
          timeOrderedLabels: [],
          recentPrice: null,
          avgPrice: null,
          finalPrices: [],
          finalLabels: [],
          noData: true
        };
      }
      
      // 데이터를 시간순으로 뒤집기 (왼쪽이 오래된 거래, 오른쪽이 최신 거래)
      const timeOrderedPrices = [...finalPrices].reverse();
      const timeOrderedLabels = [...finalLabels].reverse();
      
      // 최근 판매가(가장 최신 가격)
      const recentPrice = finalPrices.length > 0 ? finalPrices[0] : null;
      // 평균 판매가
      const avgPrice = finalPrices.length > 0 ? Math.round(finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length) : null;
      
      return {
        timeOrderedPrices,
        timeOrderedLabels,
        recentPrice,
        avgPrice,
        finalPrices,
        finalLabels
      };
      
    } catch (error) {
      console.error(`${itemName} 차트 데이터 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * 아이템 검색 (자동완성용) - 2개 시트 조합
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Array>} 검색된 아이템명 배열
   */
  async searchItems(query) {
    try {
      const { oldRows, newRows } = await this.fetchPriceData();
      
      if (!this.validateData(oldRows) && !this.validateData(newRows)) {
        return [];
      }
      
      const items = new Set();
      
      // 새로운 데이터에서 아이템 검색 (A열)
      newRows.slice(1).forEach(row => {
        const name = (row[0] || '').replace(/"/g, '').trim();
        if (name && name.includes(query)) {
          items.add(name);
        }
      });
      
      // 기존 데이터에서 아이템 검색 (B열)
      oldRows.slice(1).forEach(row => {
        const name = (row[1] || '').replace(/"/g, '').trim();
        if (name && name.includes(query)) {
          items.add(name);
        }
      });
      
      return [...items]; // Set을 배열로 변환
    } catch (error) {
      console.error('아이템 검색 실패:', error);
      return [];
    }
  }
}

// ES6 모듈로 export
export default PriceDataAPI; 