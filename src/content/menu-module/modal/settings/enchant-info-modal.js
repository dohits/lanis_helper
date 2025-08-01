import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import EnchantInfoAPI from '../../../../api/googleSheetLoad/enchantInfoAPI.js';

// 장비 해방 정보 모달
class EnchantInfoModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.enchantInfo);
    this.currentType = 'armor'; // 기본값
  }

  // 모달 열기
  open() {
    super.open();
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    // 토글 버튼 컨테이너
    const toggleContainer = this.createToggleContainer();

    // 로딩 상태
    const loadingDiv = this.createLoadingDiv();

    // 테이블 컨테이너
    const tableContainer = this.createTableContainer();

    // 콘텐츠 조립
    this.body.appendChild(toggleContainer);
    this.body.appendChild(loadingDiv);
    this.body.appendChild(tableContainer);

    // 초기 데이터 로드
    this.fetchEnchantInfoData(loadingDiv, tableContainer);
  }

  // 토글 버튼 컨테이너 생성
  createToggleContainer() {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    `;

    const toggleButtons = [
      { id: 'weapon', text: '무기', color: '#007BFF' },
      { id: 'armor', text: '방어구', color: '#007BFF' },
      { id: 'accessory', text: '장신구', color: '#007BFF' }
    ];

    toggleButtons.forEach(btn => {
      const button = document.createElement('button');
      button.id = `toggle-${btn.id}`;
      button.textContent = btn.text;
      button.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 80px;
        min-height: 36px;
        height: auto;
        padding: 0 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        transition: all 0.3s;
        line-height: 1.5;
        white-space: nowrap;
        overflow: visible;
        vertical-align: middle;
        box-sizing: border-box;
        ${btn.id === this.currentType ? `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        ` : `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        `}
      `;

      button.onclick = () => {
        this.updateToggleButtons(btn.id, toggleButtons);
        this.currentType = btn.id;
        this.fetchEnchantInfoData(this.loadingDiv, this.tableContainer);
      };
      toggleContainer.appendChild(button);
    });

    return toggleContainer;
  }

  // 토글 버튼 상태 업데이트
  updateToggleButtons(selectedId, toggleButtons) {
    toggleButtons.forEach(b => {
      const btnElement = document.getElementById(`toggle-${b.id}`);
      if (btnElement) {
        if (b.id === selectedId) {
          btnElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          btnElement.style.color = 'white';
          btnElement.style.border = 'none';
          btnElement.style.borderRadius = '20px';
        } else {
          btnElement.style.background = 'white';
          btnElement.style.color = '#667eea';
          btnElement.style.border = '2px solid #667eea';
          btnElement.style.borderRadius = '20px';
        }
      }
    });
  }

  // 로딩 상태 생성
  createLoadingDiv() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'enchant-loading';
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 40px;
      color: #666;
    `;
    loadingDiv.innerHTML = '데이터를 불러오는 중...';
    this.loadingDiv = loadingDiv;
    return loadingDiv;
  }

  // 테이블 컨테이너 생성
  createTableContainer() {
    const tableContainer = document.createElement('div');
    tableContainer.id = 'enchant-table-container';
    tableContainer.style.display = 'none';
    this.tableContainer = tableContainer;
    return tableContainer;
  }

  // 해방 정보 데이터 가져오기
  async fetchEnchantInfoData(loadingDiv, tableContainer) {
    // 로딩 상태 표시
    loadingDiv.style.display = 'block';
    tableContainer.style.display = 'none';

    try {
      // 직접 API 호출
      const enchantAPI = new EnchantInfoAPI();
      const result = await enchantAPI.fetchEnchantInfo(this.currentType);

      if (result && result.success) {
        if (result.data && result.data.length > 0) {
          this.displayEnchantInfoTable(tableContainer, result.data);
          loadingDiv.style.display = 'none';
          tableContainer.style.display = 'block';
        } else {
          // 데이터가 없는 경우
          this.displayNoDataMessage(tableContainer, this.currentType);
          loadingDiv.style.display = 'none';
          tableContainer.style.display = 'block';
        }
      } else {
        const errorMsg = result ? (result.error || '데이터 가져오기 실패') : '응답이 없습니다';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[EnchantInfoModal] 해방 정보 데이터 가져오기 실패:', error);
      loadingDiv.innerHTML = `데이터 가져오기 실패: ${error.message}`;
      loadingDiv.style.color = '#f44336';
    }
  }

  // 해방 정보 테이블 표시
  displayEnchantInfoTable(tableContainer, data) {
    // 테이블 생성
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 14px;
      min-width: 300px;
      table-layout: fixed;
    `;

    // 헤더
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
      { text: '항목', color: '#f5f5f5' },
      { text: '동', color: '#CD7F32' },      // 동색 (브론즈)
      { text: '은', color: '#C0C0C0' },      // 은색
      { text: '금', color: '#FFD700' },      // 금색
      { text: '칠색', color: '#FF69B4' }     // 칠색 (핑크)
    ];

    headers.forEach((header, index) => {
      const th = document.createElement('th');
      th.textContent = header.text;
      th.style.cssText = `
        padding: 8px 4px;
        background: ${header.color};
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #222;
        font-size: 12px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        ${index === 0 ? 'width: 25%;' : 'width: 18.75%;'}
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 본문
    const tbody = document.createElement('tbody');

    data.forEach((item, index) => {
      const row = document.createElement('tr');

      // 항목명
      const typeCell = document.createElement('td');
      typeCell.textContent = item.type;
      typeCell.style.cssText = `
        padding: 8px 4px;
        border: 1px solid #ddd;
        font-weight: bold;
        background: #fafafa;
        font-size: 12px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        color: #222;
      `;
      row.appendChild(typeCell);

      // 등급별 수치 (파스텔톤 배경색)
      const gradeColors = {
        bronze: '#F5E6D3',    // 동색 파스텔 (연한 브론즈)
        silver: '#F0F0F0',    // 은색 파스텔 (연한 그레이)
        gold: '#FFF8DC',      // 금색 파스텔 (연한 골드)
        rainbow: '#FFE4E1'    // 칠색 파스텔 (연한 핑크)
      };

      ['bronze', 'silver', 'gold', 'rainbow'].forEach(grade => {
        const cell = document.createElement('td');
        cell.textContent = item[grade] || '-';
        cell.style.cssText = `
          padding: 8px 4px;
          border: 1px solid #ddd;
          text-align: center;
          background: ${item[grade] ? gradeColors[grade] : '#f9f9f9'};
          font-size: 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          color: #222;
        `;
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // 기존 내용 완전히 제거 후 새 테이블 추가
    tableContainer.innerHTML = '';

    // 테이블을 감싸는 스크롤 컨테이너 생성
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
      width: 100%;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 400px;
      margin-top: 20px;
    `;

    scrollContainer.appendChild(table);
    tableContainer.appendChild(scrollContainer);
  }

  // 데이터 없음 메시지 표시
  displayNoDataMessage(tableContainer, type) {
    const noDataDiv = document.createElement('div');
    noDataDiv.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #666;
      font-size: 16px;
    `;

    const typeNames = {
      'weapon': '무기',
      'armor': '방어구', 
      'accessory': '장신구'
    };

    noDataDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
      <div style="font-weight: bold; margin-bottom: 10px;">데이터 없음</div>
      <div>${typeNames[type] || type} 해방 정보가 아직 준비되지 않았습니다.</div>
      <div style="margin-top: 10px; font-size: 14px; color: #999;">
        구글 시트에 데이터가 추가되면 자동으로 표시됩니다.
      </div>
    `;

    // 기존 내용 제거 후 새 메시지 추가
    tableContainer.innerHTML = '';
    tableContainer.appendChild(noDataDiv);
  }
}

export default EnchantInfoModal; 