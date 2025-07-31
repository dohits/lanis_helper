import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';

// 어빌리티 정보 모달
class AbilityInfoModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.abilityInfo);
    this.data = null;
    this.selectedJob = '전체';
  }

  // 모달 열기
  async open() {
    super.open();
    await this.createContent();
  }

  // 콘텐츠 생성
  async createContent() {
    // 검색창
    const searchSection = this.createSearchSection();

    // 직업 토글 버튼
    const jobToggleSection = this.createJobToggleSection();

    // 표 컨테이너
    const tableContainer = this.createTableContainer();

    // 로딩 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 40px;
      color: #666;
    `;
    loadingDiv.innerHTML = '데이터를 불러오는 중...';
    tableContainer.appendChild(loadingDiv);

    // 콘텐츠 조립
    this.body.appendChild(searchSection);
    this.body.appendChild(jobToggleSection);
    this.body.appendChild(tableContainer);

    // 데이터 로드
    await this.loadData(tableContainer, jobToggleSection);
  }

  // 검색 섹션 생성
  createSearchSection() {
    const searchSection = document.createElement('div');
    searchSection.style.cssText = `
      display: flex;
      gap: 8px;
      margin: 16px 0 8px 0;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '어빌리티명/효과/무기 타입 효과 검색...';
    searchInput.style.flex = '1';
    searchInput.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    `;
    searchInput.addEventListener('focus', () => {
      searchInput.style.borderColor = '#667eea';
    });
    searchInput.addEventListener('blur', () => {
      searchInput.style.borderColor = '#ddd';
    });

    searchSection.appendChild(searchInput);
    this.searchInput = searchInput;
    return searchSection;
  }

  // 직업 토글 섹션 생성
  createJobToggleSection() {
    const jobToggleSection = document.createElement('div');
    jobToggleSection.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    `;
    this.jobToggleSection = jobToggleSection;
    return jobToggleSection;
  }

  // 테이블 컨테이너 생성
  createTableContainer() {
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
      overflow: auto;
      max-height: 50vh;
      margin-top: 8px;
      overflow-x: auto;
      overflow-y: auto;
    `;
    this.tableContainer = tableContainer;
    return tableContainer;
  }

  // 데이터 로드
  async loadData(tableContainer, jobToggleSection) {
    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_ABILITY_INFO'
        }, (response) => {
          resolve(response);
        });
      });
      
      if (result && result.success && result.data) {
        this.data = result.data;
        this.createJobToggles(jobToggleSection);
        this.renderTable();
        this.bindSearchEvent();
      } else {
        this.showErrorMessage(tableContainer);
      }
    } catch (error) {
      console.error('[AbilityInfoModal] 어빌리티 정보 데이터 가져오기 실패:', error);
      this.showErrorMessage(tableContainer);
    }
  }

  // 직업 토글 버튼 생성
  createJobToggles(jobToggleSection) {
    const jobs = Array.from(new Set(this.data.map(row => row['직업'])));
    
    jobToggleSection.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.textContent = '전체';
    allBtn.className = 'category-btn main-category active';
    allBtn.onclick = () => { 
      this.selectedJob = '전체'; 
      this.renderTable(); 
      this.updateToggles(); 
    };
    jobToggleSection.appendChild(allBtn);

    jobs.forEach(job => {
      const btn = document.createElement('button');
      btn.textContent = job;
      btn.className = 'category-btn main-category';
      btn.onclick = () => { 
        this.selectedJob = job; 
        this.renderTable(); 
        this.updateToggles(); 
      };
      jobToggleSection.appendChild(btn);
    });

    this.updateToggles();
  }

  // 토글 버튼 상태 업데이트
  updateToggles() {
    this.jobToggleSection.querySelectorAll('button').forEach(btn => {
      if (btn.textContent === this.selectedJob) {
        btn.classList.add('active');
        btn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        `;
      } else {
        btn.classList.remove('active');
        btn.style.cssText = `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        `;
      }
    });
  }

  // 테이블 렌더링
  renderTable() {
    this.tableContainer.innerHTML = '';
    
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      min-width: 800px;
      border-collapse: collapse;
      font-size: 14px;
      table-layout: fixed;
    `;

    // 헤더
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    ['직업','전직','어빌리티명','효과','무기 타입 효과','숙련도'].forEach((h, idx) => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = `
        padding: 6px 2px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #222;
        ${idx === 0 ? 'width:56px;min-width:48px;max-width:72px;' : ''}
        ${idx === 1 ? 'width:48px;min-width:40px;max-width:56px;' : ''}
        ${idx === 5 ? 'width:80px;min-width:70px;max-width:90px;' : ''}
      `;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    // 본문
    const tbody = document.createElement('tbody');
    let filtered = this.data;
    
    if (this.selectedJob !== '전체') {
      filtered = filtered.filter(row => row['직업'] === this.selectedJob);
    }
    
    const search = this.searchInput.value.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(row =>
        row['어빌리티명'].toLowerCase().includes(search) ||
        row['효과'].toLowerCase().includes(search) ||
        row['무기 타입 효과'].toLowerCase().includes(search)
      );
    }

    filtered.forEach(row => {
      const tr = document.createElement('tr');
      ['직업','전직','어빌리티명','효과','무기 타입 효과','숙련도'].forEach((h, idx) => {
        const td = document.createElement('td');
        td.textContent = row[h] || '';
        td.style.cssText = `
          padding: 5px 2px;
          border: 1px solid #eee;
          text-align: center;
          word-break: break-all;
          color: #222;
          ${idx === 0 ? 'width:56px;min-width:48px;max-width:72px;' : ''}
          ${idx === 1 ? 'width:48px;min-width:40px;max-width:56px;' : ''}
          ${idx === 5 ? 'width:80px;min-width:70px;max-width:90px;' : ''}
        `;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    this.tableContainer.appendChild(table);
  }

  // 검색 이벤트 바인딩
  bindSearchEvent() {
    this.searchInput.oninput = () => this.renderTable();
  }

  // 오류 메시지 표시
  showErrorMessage(tableContainer) {
    tableContainer.innerHTML = `
      <div style="color:#f44336;text-align:center;padding:40px;">
        데이터를 불러오지 못했습니다.
      </div>
    `;
  }
}

export default AbilityInfoModal; 