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
      width: 100%;
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
      width: 100%;
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

        // 데이터가 없는 경우 메시지 표시
        if (chartData.totalTrades === 0 || chartData.prices.length === 0) {
          this.chartDiv.innerHTML = '';
          this.chartDiv.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #666;
            font-size: 16px;
            text-align: center;
            padding: 20px;
          `;
          this.chartDiv.textContent = `"${itemName}"의 거래 데이터가 존재하지 않습니다.`;
          return;
        }

        // 차트 영역 위에 텍스트 표시
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
          text-align: center;
          font-size: 10px;
          font-weight: normal;
          margin-bottom: 10px;
          flex: 0 0 auto;
          order: 1;
        `;
        
        infoDiv.innerHTML =
          `<span style='color:#374151;'>최근 판매가 :</span> <span style='color:#667eea;'>${chartData.recentPrice ? chartData.recentPrice.toLocaleString() + ' G' : '-'}</span><br>
          <span style='color:#374151;'>평균 판매가 :</span> <span style='color:#764ba2;'>${chartData.averagePrice ? chartData.averagePrice.toLocaleString() + ' G' : '-'}</span><br>
          <span style='color:#374151;'>총 거래 건수 :</span> <span style='color:#10b981;'>${chartData.totalTrades}건</span>`;
        
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
          order: 2;
        `;
        this.chartDiv.appendChild(this.chartCanvas);

        // 최신 거래내역 표시 영역 추가
        const latestTradeDiv = document.createElement('div');
        latestTradeDiv.style.cssText = `
          margin-top: 10px;
          padding: 10px;
          font-size: 12px;
          color: #666;
          text-align: right;
          order: 3;
        `;
        this.chartDiv.appendChild(latestTradeDiv);

        // 최신 거래 데이터 가져오기
        try {
          const latestTrade = await this.priceFetcher.getLatestTradeData();
          if (latestTrade) {
            const timeStr = latestTrade.timeStr || '';
            const itemName = latestTrade.itemName || '';
            const count = latestTrade.count || 1;
            const price = latestTrade.price || 0;
            
            latestTradeDiv.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 5px; color: #333;">마지막으로 추가된 거래내역</div>
              <div style="line-height: 1.4;">
                <div>${timeStr}</div>
                <div>${itemName} ${count}개 ${price.toLocaleString()} Gold</div>
              </div>
            `;
          } else {
            latestTradeDiv.innerHTML = '<div style="color: #999;">거래 데이터를 불러올 수 없습니다.</div>';
          }
        } catch (error) {
          console.error('최신 거래 데이터 로드 실패:', error);
          latestTradeDiv.innerHTML = '<div style="color: #999;">거래 데이터를 불러올 수 없습니다.</div>';
        }
        
        // Chart.js 동적 import
        const Chart = (await import('chart.js/auto')).default;
        if (this.chartInstance) { 
          this.chartInstance.destroy(); 
          this.chartInstance = null; 
        }
        this.chartInstance = new Chart(this.chartCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: itemName + ' 시세',
              data: chartData.prices,
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
              title: { display: false },
              tooltip: {
                callbacks: {
                  title: function(context) {
                    const dataIndex = context[0].dataIndex;
                    const actualDate = chartData.actualDates[dataIndex];
                    if (actualDate) {
                      const year = actualDate.getFullYear();
                      const month = String(actualDate.getMonth() + 1).padStart(2, '0');
                      const day = String(actualDate.getDate()).padStart(2, '0');
                      const hours = String(actualDate.getHours()).padStart(2, '0');
                      const minutes = String(actualDate.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day} ${hours}:${minutes}`;
                    }
                    return context[0].label;
                  }
                }
              }
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