// 점수표 탭
import { 
  equipmentDrawAPI, 
  detectEquipmentType 
} from '../data/equipment-data.js';

export class ScoreTableTab {
  constructor() {
    this.columnVisibility = {
      name: true,
      ability: true,
      powerRange: true,
      weightRange: true,
      score: true,
      attributes: true
    };
  }

  show(contentArea) {
    this.showScoreTableTab(contentArea);
  }

  showScoreTableTab(contentArea) {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    `;

    // 제목
    const title = document.createElement('h3');
    title.textContent = '장비별 점수표';
    title.style.cssText = `
      margin: 0 0 16px 0;
      text-align: center;
      color: #374151;
      font-size: 18px;
      font-weight: 600;
    `;
    content.appendChild(title);

    // 설명
    const description = document.createElement('p');
    description.innerHTML = '각 장비별로 계산된 점수입니다.<br>• 무기/방어구: (위력범위 최대값) - (무게범위 최솟값 × 2)<br>• 장신구: (위력범위 최대값 × 5.5) - (무게범위 최솟값 × 2)<br>각 정보는 위키에 올바른 템플릿으로 등록되어야 올바르게 표현됩니다.';
    description.style.cssText = `
      margin: 0 0 16px 0;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    content.appendChild(description);

    // 컬럼 토글 버튼 영역
    const columnToggleArea = document.createElement('div');
    columnToggleArea.id = 'column-toggle-area';
    columnToggleArea.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    `;
    
    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = '컬럼 표시:';
    toggleLabel.style.cssText = `
      font-weight: 600;
      color: #374151;
      margin-right: 8px;
    `;
    columnToggleArea.appendChild(toggleLabel);
    
    // 컬럼 토글 버튼들 (장비명 제외)
    const columns = [
      { key: 'ability', label: '어빌리티' },
      { key: 'powerRange', label: '위력범위' },
      { key: 'weightRange', label: '무게범위' },
      { key: 'score', label: '점수' },
      { key: 'attributes', label: '장비속성' }
    ];
    
    columns.forEach(column => {
      const button = document.createElement('button');
      button.textContent = column.label;
      button.dataset.column = column.key;
      button.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      
      // 초기 상태 설정
      this.updateToggleButton(button, true);
      
      button.addEventListener('click', () => {
        this.columnVisibility[column.key] = !this.columnVisibility[column.key];
        this.updateToggleButton(button, this.columnVisibility[column.key]);
        this.updateTableColumnVisibility();
      });
      
      columnToggleArea.appendChild(button);
    });
    
    content.appendChild(columnToggleArea);

    // 로딩 표시
    const loadingArea = document.createElement('div');
    loadingArea.id = 'score-table-loading';
    loadingArea.style.cssText = `
      text-align: center;
      color: #6b7280;
      padding: 20px;
    `;
    loadingArea.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      <div>장비 데이터를 불러오는 중...</div>
    `;
    content.appendChild(loadingArea);

    // 점수표 영역
    const scoreTableArea = document.createElement('div');
    scoreTableArea.id = 'score-table-content';
    scoreTableArea.style.cssText = `
      display: none;
    `;
    content.appendChild(scoreTableArea);

    contentArea.appendChild(content);

    // 장비 데이터 로드 및 점수표 생성
    this.loadEquipmentDataAndCreateScoreTable(loadingArea, scoreTableArea);
  }

  updateToggleButton(button, isVisible) {
    if (isVisible) {
      button.style.background = '#3b82f6';
      button.style.color = '#ffffff';
      button.style.borderColor = '#3b82f6';
    } else {
      button.style.background = '#ffffff';
      button.style.color = '#6b7280';
      button.style.borderColor = '#d1d5db';
    }
  }

  updateTableColumnVisibility() {
    const tables = document.querySelectorAll('#score-table-content table');
    tables.forEach(table => {
      const headers = table.querySelectorAll('thead th');
      const rows = table.querySelectorAll('tbody tr');
      
      headers.forEach((header, index) => {
        const columnKey = this.getColumnKeyByIndex(index);
        if (columnKey === 'name') {
          // 장비명 컬럼은 항상 표시
          header.style.display = '';
        } else if (columnKey && this.columnVisibility[columnKey] !== undefined) {
          header.style.display = this.columnVisibility[columnKey] ? '' : 'none';
        }
      });
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          const columnKey = this.getColumnKeyByIndex(index);
          if (columnKey === 'name') {
            // 장비명 컬럼은 항상 표시
            cell.style.display = '';
          } else if (columnKey && this.columnVisibility[columnKey] !== undefined) {
            cell.style.display = this.columnVisibility[columnKey] ? '' : 'none';
          }
        });
      });
    });
  }

  getColumnKeyByIndex(index) {
    const columnKeys = ['name', 'ability', 'powerRange', 'weightRange', 'score', 'attributes'];
    return columnKeys[index];
  }

  async loadEquipmentDataAndCreateScoreTable(loadingArea, scoreTableArea) {
    try {
      // Chrome 스토리지에서 레어 아이템 데이터 로드
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (!result.rareItems || result.rareItems.length === 0) {
        loadingArea.innerHTML = `
          <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
          <div style="color: #ef4444;">아이템 데이터가 없습니다.</div>
          <div style="margin-top: 8px; color: #6b7280; font-size: 12px;">
            먼저 아이템 수집을 진행해주세요.
          </div>
        `;
        return;
      }

      // 점수표 생성
      const scoreTable = this.createScoreTable(result.rareItems);
      
      // 로딩 영역 숨기고 점수표 표시
      loadingArea.style.display = 'none';
      scoreTableArea.style.display = 'block';
      scoreTableArea.appendChild(scoreTable);

    } catch (error) {
      console.error('점수표 생성 오류:', error);
      loadingArea.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 12px;">❌</div>
        <div style="color: #ef4444;">점수표 생성 중 오류가 발생했습니다.</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 12px;">
          ${error.message}
        </div>
      `;
    }
  }

  createScoreTable(rareItems) {
    // 유효한 데이터만 필터링 (위력과 무게 정보가 있는 아이템)
    const validItems = rareItems.filter(item => 
      item.power_min !== null && item.power_max !== null && 
      item.weight_min !== null && item.weight_max !== null
    );

    if (validItems.length === 0) {
      const noDataMessage = document.createElement('div');
      noDataMessage.style.cssText = `
        text-align: center;
        color: #6b7280;
        padding: 20px;
      `;
      noDataMessage.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
        <div>유효한 장비 데이터가 없습니다.</div>
      `;
      return noDataMessage;
    }

    // 점수 계산 및 정렬 (새로운 로직: 장비 타입별 계산)
    const scoredItems = validItems.map(item => {
      // 아이템 데이터에 equipmentType이나 type 필드가 있으면 사용, 없으면 이름으로 감지
      let equipmentType;
      if (item.equipmentType) {
        equipmentType = item.equipmentType.toLowerCase();
      } else if (item.type) {
        equipmentType = item.type.toLowerCase();
      } else {
        equipmentType = detectEquipmentType(item.name);
      }
      
      let score;
      
      if (equipmentType === 'accessory' || equipmentType === '장신구') {
        // 장신구: 위력*5.5 - 무게*2 (최적값: 최대위력*5.5 - 최소무게*2)
        score = item.power_max * 5.5 - (item.weight_min * 2);
      } else {
        // 무기/방어구: 위력 - 무게*2 (최적값: 최대위력 - 최소무게*2)
        score = item.power_max - (item.weight_min * 2);
      }
      
      return {
        ...item,
        score: score,
        equipmentType: equipmentType
      };
    }).sort((a, b) => b.score - a.score); // 점수 내림차순 정렬

    // 장비 타입별로 그룹화
    const groupedItems = this.groupItemsByType(scoredItems);

    // 점수표 컨테이너
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 100%;
      overflow: hidden;
    `;

    // 각 장비 타입별로 테이블 생성
    Object.entries(groupedItems).forEach(([type, items]) => {
      const typeTable = this.createTypeScoreTable(type, items);
      tableContainer.appendChild(typeTable);
    });

    return tableContainer;
  }

  groupItemsByType(items) {
    const grouped = {};
    
    items.forEach(item => {
      let type = '기타';
      
      if (item.type) {
        if (item.type.includes('무기')) {
          type = '무기';
        } else if (item.type.includes('방어구')) {
          type = '방어구';
        } else if (item.type.includes('장신구')) {
          type = '장신구';
        } else {
          type = item.type;
        }
      }
      
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(item);
    });

    return grouped;
  }

  createTypeScoreTable(type, items) {
    const typeContainer = document.createElement('div');
    typeContainer.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      max-width: 100%;
    `;

    // 타입 헤더
    const typeHeader = document.createElement('div');
    typeHeader.style.cssText = `
      background: #f9fafb;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      font-size: 16px;
    `;
    typeHeader.textContent = `${type} (${items.length}개)`;
    typeContainer.appendChild(typeHeader);

    // 테이블
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    `;

    // 테이블 헤더
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="padding: 6px 8px; text-align: left; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">장비명</th>
        <th style="padding: 6px 8px; text-align: center; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">어빌리티</th>
        <th style="padding: 6px 8px; text-align: center; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">위력범위</th>
        <th style="padding: 6px 8px; text-align: center; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">무게범위</th>
        <th style="padding: 6px 8px; text-align: center; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">점수</th>
        <th style="padding: 6px 8px; text-align: center; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 8px;">장비 속성</th>
      </tr>
    `;
    table.appendChild(thead);

    // 테이블 바디
    const tbody = document.createElement('tbody');
    items.forEach((item, index) => {
      const row = document.createElement('tr');
      row.style.cssText = `
        background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};
        border-bottom: 1px solid #e5e7eb;
      `;
      
      // 어빌리티 정보 처리
      let abilityText = '';
      let abilityStyle = 'color: #6b7280;';
      
      if (item.abilities && Array.isArray(item.abilities) && item.abilities.length > 0) {
        // 어빌리티가 있는 경우, 이름만 추출하여 파란글씨로 표시
        const abilityNames = item.abilities.map(ability => {
          const colonIndex = ability.indexOf(':');
          return colonIndex > 0 ? ability.substring(0, colonIndex).trim() : ability;
        });
        abilityText = abilityNames.join(', ');
        abilityStyle = 'color: #3b82f6; font-weight: 500;';
      }
      
      // 장비명 처리 - 무기 타입일 때는 "무기명(무기타입)" 형식으로 표시
      let displayName = item.name;
      if (type === '무기' && item.type) {
        // 무기 타입에서 "무기" 부분을 제거하고 괄호 안에 표시
        const weaponType = item.type.replace('무기', '').trim();
        if (weaponType) {
          displayName = `${item.name} (${weaponType})`;
        }
      }
      
      // 장비 속성 정보 처리
      let attributesText = '';
      if (item.attributes && Array.isArray(item.attributes) && item.attributes.length > 0) {
        attributesText = item.attributes.join(', ');
      }
      
      row.innerHTML = `
        <td style="padding: 6px 8px; text-align: left; color: #374151; font-weight: 500; font-size: 8px;">${displayName}</td>
        <td style="padding: 6px 8px; text-align: center; ${abilityStyle} font-size: 8px;">${abilityText}</td>
        <td style="padding: 6px 8px; text-align: center; color: #6b7280; font-size: 8px;">${item.power_min} ~ ${item.power_max}</td>
        <td style="padding: 6px 8px; text-align: center; color: #6b7280; font-size: 8px;">${item.weight_min} ~ ${item.weight_max}</td>
        <td style="padding: 6px 8px; text-align: center; color: #059669; font-weight: 600; font-size: 10px;">${item.score}</td>
        <td style="padding: 6px 8px; text-align: center; color: #8b5cf6; font-weight: 500; font-size: 8px;">${attributesText}</td>
      `;
      
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    typeContainer.appendChild(table);
    return typeContainer;
  }
}

