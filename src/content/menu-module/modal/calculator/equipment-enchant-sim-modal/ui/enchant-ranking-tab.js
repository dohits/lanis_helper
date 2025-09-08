// 감정 순위 탭
import { enchantInfoRegistrationAPI } from '../data/equipment-data.js';

export class EnchantRankingTab {
  constructor() {
    this.currentRankingSubTab = 'sub-craftsman';
    this.rankingContentArea = null;
  }

  show(contentArea) {
    this.showEnchantRankingTab(contentArea);
  }

  showEnchantRankingTab(contentArea) {
    // 감정순위 탭 내용
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0px;
    `;

    // 서브 토글 버튼 섹션
    const subToggleSection = document.createElement('div');
    subToggleSection.id = 'ranking-sub-toggle';
    subToggleSection.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      flex-wrap: wrap;
    `;

    // 서브 토글 버튼들 생성
    const subButtons = [
      { id: 'sub-craftsman', text: '장인랭킹', active: true },
      { id: 'sub-equipment', text: '장비별랭킹', active: false }
    ];

    subButtons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 6px 12px;
        border: 2px solid #28a745;
        background: ${button.active ? '#28a745' : 'white'};
        color: ${button.active ? 'white' : '#28a745'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;
      
      btn.addEventListener('click', () => {
        this.switchRankingSubTab(button.id);
      });
      
      subToggleSection.appendChild(btn);
    });

    content.appendChild(subToggleSection);

    // 랭킹 콘텐츠 영역
    this.rankingContentArea = document.createElement('div');
    this.rankingContentArea.id = 'ranking-content-area';
    this.rankingContentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    content.appendChild(this.rankingContentArea);

    contentArea.appendChild(content);

    // 애니메이션으로 서브 토글 버튼 표시
    setTimeout(() => {
      const subToggle = document.getElementById('ranking-sub-toggle');
      if (subToggle) {
        subToggle.style.opacity = '1';
        subToggle.style.transform = 'translateY(0)';
      }
    }, 300);

    // 초기 서브 탭 설정
    this.currentRankingSubTab = 'sub-craftsman';
    this.showRankingSubTabContent('sub-craftsman');
  }

  switchRankingSubTab(subTabId) {
    // 모든 서브 버튼 비활성화
    const subButtons = document.querySelectorAll('#sub-craftsman, #sub-equipment');
    subButtons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#28a745';
    });

    // 선택된 서브 버튼 활성화
    const selectedSubBtn = document.getElementById(subTabId);
    if (selectedSubBtn) {
      selectedSubBtn.style.background = '#28a745';
      selectedSubBtn.style.color = 'white';
    }

    // 콘텐츠 전환
    this.currentRankingSubTab = subTabId;
    this.showRankingSubTabContent(subTabId);
  }

  showRankingSubTabContent(subTabId) {
    if (!this.rankingContentArea) return;

    this.rankingContentArea.innerHTML = '';

    switch (subTabId) {
      case 'sub-craftsman':
        this.showCraftsmanRankingContent();
        break;
      case 'sub-equipment':
        this.showEquipmentRankingContent();
        break;
    }
  }

  async showCraftsmanRankingContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      max-width: 100%;
      overflow-x: hidden;
      height: 100%;
    `;

    // 로딩 상태 표시
    content.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 24px; margin-bottom: 16px;">⏳</div>
        <div style="font-size: 14px; color: #6b7280;">랭킹 데이터를 불러오는 중...</div>
      </div>
    `;

    this.rankingContentArea.appendChild(content);

    try {
      // 장인랭킹 데이터 가져오기
      const rankingData = await enchantInfoRegistrationAPI.getCraftsmanRanking();
      
      if (rankingData.length === 0) {
        content.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">장인랭킹</div>
            <div style="font-size: 14px; color: #6b7280;">아직 등록된 데이터가 없습니다</div>
      </div>
    `;
        return;
      }

      // 랭킹 테이블 생성
      const table = document.createElement('table');
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;

      // 테이블 헤더
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 60px;">순위</th>
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 80px;">메달</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057;">닉네임</th>
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 80px;">등록수</th>
        </tr>
      `;

      // 테이블 바디
      const tbody = document.createElement('tbody');
      
      rankingData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.cssText = `
          border-bottom: 1px solid #e9ecef;
          transition: background-color 0.2s ease;
        `;
        
        // 마우스 호버 효과
        row.addEventListener('mouseenter', () => {
          row.style.backgroundColor = '#f8f9fa';
        });
        row.addEventListener('mouseleave', () => {
          row.style.backgroundColor = 'white';
        });

        // 메달 아이콘 결정
        let medalIcon = '🥉'; // 기본 동메달
        if (item.rank === 1) medalIcon = '🥇';
        else if (item.rank === 2) medalIcon = '🥈';
        else if (item.rank <= 10) medalIcon = '🏅';
        else if (item.rank <= 20) medalIcon = '🎖️';
        else if (item.rank <= 30) medalIcon = '⭐';
        else if (item.rank <= 40) medalIcon = '💎';
        else medalIcon = '🥉';

        row.innerHTML = `
          <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">
            ${item.rank}
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 20px;">
            ${medalIcon}
          </td>
          <td style="padding: 12px 8px; font-weight: 500; color: #212529;">
            ${item.nickname}
          </td>
          <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #28a745;">
            ${item.count}회
          </td>
        `;
        
        tbody.appendChild(row);
      });

      table.appendChild(thead);
      table.appendChild(tbody);

      // 기존 콘텐츠 제거하고 테이블 추가
      content.innerHTML = '';
      content.appendChild(table);

    } catch (error) {
      console.error('장인랭킹 데이터 로딩 실패:', error);
      content.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc3545;">데이터 로딩 실패</div>
          <div style="font-size: 14px; color: #6b7280;">${error.message}</div>
        </div>
      `;
    }
  }

  async showEquipmentRankingContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      max-width: 100%;
      overflow-x: hidden;
      height: 100%;
    `;

    // 로딩 상태 표시
    content.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 24px; margin-bottom: 16px;">⏳</div>
        <div style="font-size: 14px; color: #6b7280;">장비 데이터를 불러오는 중...</div>
      </div>
    `;

    this.rankingContentArea.appendChild(content);

    try {
      // 장비별 랭킹 데이터 가져오기
      const equipmentData = await enchantInfoRegistrationAPI.getEquipmentRanking();
      
      if (equipmentData.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">장비별랭킹</div>
            <div style="font-size: 14px; color: #6b7280;">등록된 장비가 없습니다</div>
          </div>
        `;
        return;
      }

      // 장비별 랭킹 테이블들을 담을 컨테이너
      const tableContainer = document.createElement('div');
      tableContainer.style.cssText = `
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `;
      
      equipmentData.forEach((item, index) => {
        // 감정 정보가 없는 경우 "등록자없음" 처리
        const power = item.power || '-';
        const weight = item.weight || '-';
        const score = item.score || '-';
        const nickname = item.nickname || '등록자없음';

        // 감정 정보가 없는 행은 회색으로 표시
        const textColor = item.hasEnchantInfo ? '#212529' : '#6b7280';
        const rowBackground = item.hasEnchantInfo ? 'white' : '#f8f9fa';

        // 각 장비별 개별 테이블 생성
        const table = document.createElement('table');
        table.style.cssText = `
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-size: 12px;
        `;

        const tbody = document.createElement('tbody');

        // 1번째 줄: 장비타입 | 장비명 (컬럼 헤더 없이, 별도 배경색)
        const equipmentRow = document.createElement('tr');
        equipmentRow.style.cssText = `
          border-bottom: 1px solid #dee2e6;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: background-color 0.2s ease;
        `;
        equipmentRow.innerHTML = `
          <td style="padding: 12px 8px; text-align: center; font-weight: 700; color: white; border-right: 1px solid rgba(255,255,255,0.3);">
            ${item.equipmentType}
          </td>
          <td style="padding: 12px 8px; text-align: center; font-style: italic; font-weight: 600; color: white;" colspan="3">
            ${item.equipmentName}
          </td>
        `;

        // 2번째 줄: 위력 | 무게 | 점수 | 닉네임 (컬럼명)
        const headerRow = document.createElement('tr');
        headerRow.style.cssText = `
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        `;
        headerRow.innerHTML = `
          <td style="padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-right: 1px solid #dee2e6;">위력</td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 600; color: #495057;">무게</td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 600; color: #495057;">점수</td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 600; color: #495057;">닉네임</td>
        `;

        // 3번째 줄: 실제 데이터
        const dataRow = document.createElement('tr');
        dataRow.style.cssText = `
          border-bottom: 1px solid #e9ecef;
          background: ${rowBackground};
          transition: background-color 0.2s ease;
        `;
        dataRow.innerHTML = `
          <td style="padding: 8px 4px; text-align: center; font-weight: 500; color: ${textColor}; border-right: 1px solid #dee2e6;">
            ${power}
          </td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 500; color: ${textColor};">
            ${weight}
          </td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 500; color: ${textColor};">
            ${score}
          </td>
          <td style="padding: 8px 4px; text-align: center; font-weight: 500; color: ${textColor};">
            ${nickname}
          </td>
        `;

        // 마우스 호버 효과 (3줄 모두에 적용)
        const applyHoverEffect = () => {
          dataRow.style.backgroundColor = '#f8f9fa';
        };
        
        const removeHoverEffect = () => {
          dataRow.style.backgroundColor = rowBackground;
        };

        dataRow.addEventListener('mouseenter', applyHoverEffect);
        dataRow.addEventListener('mouseleave', removeHoverEffect);

        // 3줄을 tbody에 추가
        tbody.appendChild(equipmentRow);
        tbody.appendChild(headerRow);
        tbody.appendChild(dataRow);

        table.appendChild(tbody);
        
        // 개별 테이블을 컨테이너에 추가
        tableContainer.appendChild(table);
      });

      // 기존 콘텐츠 제거하고 테이블 컨테이너 추가
      content.innerHTML = '';
      content.appendChild(tableContainer);

    } catch (error) {
      console.error('장비별 랭킹 데이터 로딩 실패:', error);
      content.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc3545;">데이터 로딩 실패</div>
          <div style="font-size: 14px; color: #6b7280;">${error.message}</div>
        </div>
      `;
    }
  }
}

