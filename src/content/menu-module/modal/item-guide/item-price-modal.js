import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import PriceFetcher from '../../../calculator/price-fetcher.js';

// 아이템 시세 조회 모달
class ItemPriceModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.itemPrice);
    this.chartInstance = null;
    this.chartCanvas = null;
    this.priceFetcher = new PriceFetcher();
  }

  // 모달 열기
  open() {
    super.open();
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    // 메인 컨테이너
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 16px;
    `;

    // 검색 폼 생성
    const searchForm = this.createSearchForm();

    // 차트/결과 영역
    const chartDiv = this.createChartDiv();

    // 콘텐츠 조립
    container.appendChild(searchForm);
    container.appendChild(chartDiv);

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 검색 폼 생성
  createSearchForm() {
    const form = document.createElement('form');
    form.className = 'item-price-search-form';
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
    form.onsubmit = (e) => {
      e.preventDefault();
      // 폼 제출 시 검색 버튼 클릭 이벤트 트리거
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    };

    // 검색 그룹 (라벨 + 입력필드 + 버튼)
    const searchGroup = document.createElement('div');
    searchGroup.className = 'item-price-search-group';
    searchGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // 입력 필드와 버튼을 한 라인에 배치
    const inputButtonRow = document.createElement('div');
    inputButtonRow.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: flex-end;
    `;

    // 입력 필드 생성 (BaseModal의 공통 메서드 사용)
    const input = this.createInput('검색할 아이템명을 입력하세요', 'text', true);
    input.className = 'item-price-search-input';
    input.style.flex = '1';
    input.style.minWidth = '0';

    // 검색 버튼 (BaseModal의 공통 메서드 사용)
    const submitButton = this.createButton('검색', 'primary');
    submitButton.type = 'submit';
    submitButton.style.flexShrink = '0';
    submitButton.style.width = '80px';

    inputButtonRow.appendChild(input);
    inputButtonRow.appendChild(submitButton);

    searchGroup.appendChild(inputButtonRow);

    // 폼 조립
    form.appendChild(searchGroup);

    // 입력 필드에 포커스
    input.focus();

    // 검색 이벤트 바인딩
    this.bindSearchEvents(input, submitButton);

    return form;
  }

  // 차트 영역 생성
  createChartDiv() {
    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      align-items: stretch;
      background: #fff;
      color: #888;
      padding: 0;
      min-height: 300px;
      min-width: 0;
    `;
    chartDiv.textContent = '최대 50회 트레이드의 최근 거래 동향을 확인 가능합니다.\n수량이 여러개일 경우 여러건으로 나뉘어 처리됩니다.';
    chartDiv.id = 'itemPriceChartDiv';
    this.chartDiv = chartDiv;
    return chartDiv;
  }

  // 검색 이벤트 바인딩
  bindSearchEvents(input, submitButton) {
    const handleSearch = async () => {
      const itemName = input.value.trim();
      if (!itemName) {
        this.chartDiv.textContent = '아이템명을 입력해주세요.';
        this.chartDiv.style.color = '#f44336';
        return;
      }

      this.chartDiv.textContent = '데이터 로딩 중...';
      this.chartDiv.style.color = '#374151';

      try {
        // PriceFetcher를 사용하여 차트 데이터 가져오기
        const chartData = await this.priceFetcher.getChartData(itemName);

        // 차트 영역 위에 텍스트 표시
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
          text-align: center;
          font-size: 10px;
          font-weight: normal;
          margin-bottom: 10px;
          flex: 0 0 auto;
        `;

        // 마지막 데이터 추가 정보
        let dataSourceInfo = '';
        try {
          const { oldRows, newRows } = await this.priceFetcher.fetchData();
          
          // 모든 거래 데이터 파싱
          const allTradeItems = [];
          
          for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            if (row.length === 0) continue;
            
            const cellA = (row[0] || '').replace(/"/g, '').trim();
            
            // 새로운 형식: "거래 완료" 패턴 찾기
            if (cellA.includes('거래 완료')) {
              // 시간 정보 추출 (i+1 행)
              let timeStr = '';
              if (i + 1 < newRows.length) {
                timeStr = (newRows[i + 1][0] || '').replace(/"/g, '').trim();
              }
              
              // 아이템 정보 행 찾기 (i+2)
              if (i + 2 < newRows.length) {
                const itemRow = newRows[i + 2];
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
                    
                    // 아이템명 추출
                    const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
                    const extractedItemName = itemMatch ? itemMatch[1].trim() : '';
                    
                    // 정확한 아이템명 매칭 (검색어와 정확히 일치하는지 확인)
                    const isExactMatch = extractedItemName === itemName;
                    
                    // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효) 및 정확한 매칭
                    if (price && price > 90000 && price < 1000000000 && extractedItemName && isExactMatch) {
                      // 시간 정보를 Date 객체로 변환
                      let timestamp = new Date(0);
                      if (timeStr) {
                        const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
                        if (timeMatch) {
                          const [, year, month, day, ampm, hour, minute, second] = timeMatch;
                          let hour24 = parseInt(hour, 10);
                          if (ampm === '오후' && hour24 !== 12) hour24 += 12;
                          if (ampm === '오전' && hour24 === 12) hour24 = 0;
                          
                          timestamp = new Date(
                            parseInt(year, 10),
                            parseInt(month, 10) - 1,
                            parseInt(day, 10),
                            hour24,
                            parseInt(minute, 10),
                            parseInt(second, 10)
                          );
                        }
                      }
                      
                      allTradeItems.push({
                        timestamp: timestamp,
                        item: extractedItemName,
                        count: count,
                        price: price,
                        originalText: itemText,
                        format: 'new'
                      });
                    }
                  }
                }
              }
            }
          }
          
          if (allTradeItems.length > 0) {
            const itemsWithTimestamp = allTradeItems.filter(item => 
              item.timestamp && item.timestamp !== new Date(0)
            );
            
            if (itemsWithTimestamp.length > 0) {
              const latestItem = itemsWithTimestamp.reduce((latest, current) => {
                return current.timestamp > latest.timestamp ? current : latest;
              });
              
              const latestDate = latestItem.timestamp.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              
                             dataSourceInfo = `<div style='color:#888;font-size:10px;font-weight:normal;'>마지막 데이터 추가 <strong>${latestDate}</strong><br>${latestItem.item} ${latestItem.count}개 ${latestItem.price.toLocaleString()}G</div>`;
            }
          }
        } catch (error) {
          console.warn('마지막 데이터 정보 추출 중 오류:', error);
        }
        
        infoDiv.innerHTML =
          dataSourceInfo +
          `<span style='color:#374151;'>최근 판매가 :</span> <span style='color:#667eea;'>${chartData.recentPrice ? chartData.recentPrice.toLocaleString() + ' G' : '-'}</span><br>
          <span style='color:#374151;'>평균 판매가 :</span> <span style='color:#764ba2;'>${chartData.avgPrice ? chartData.avgPrice.toLocaleString() + ' G' : '-'}</span>`;
        
        // 차트 영역 초기화 및 infoDiv 추가
        this.chartDiv.innerHTML = '';
        this.chartDiv.appendChild(infoDiv);
        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.style.cssText = `
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          display: block;
          flex: 1 1 0;
          min-height: 0;
          min-width: 0;
          margin: 0 auto;
        `;
        this.chartDiv.appendChild(this.chartCanvas);
        
        // Chart.js 동적 import
        const Chart = (await import('chart.js/auto')).default;
        if (this.chartInstance) { 
          this.chartInstance.destroy(); 
          this.chartInstance = null; 
        }
        this.chartInstance = new Chart(this.chartCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: chartData.timeOrderedLabels,
            datasets: [{
              label: itemName + ' 시세',
              data: chartData.timeOrderedPrices,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102,126,234,0.1)',
              pointRadius: 3,
              pointBackgroundColor: '#764ba2',
              fill: false,
              tension: 0.2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              title: { display: false }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            scales: {
              x: { title: { display: true, text: '최근 거래 순서' } },
              y: { title: { display: true, text: '가격(G)' }, beginAtZero: false }
            }
          }
        });

      } catch (err) {
        console.error('데이터 로드/파싱 오류:', err);
        this.chartDiv.textContent = '데이터 로드/파싱 오류: ' + (err.message || err);
        this.chartDiv.style.color = '#f44336';
      }
    };

    submitButton.onclick = handleSearch;
    input.addEventListener('keydown', e => { 
      if (e.key === 'Enter') handleSearch(); 
    });
  }



  // 모달 닫기 시 차트 정리
  close() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    super.close();
  }
}

export default ItemPriceModal; 