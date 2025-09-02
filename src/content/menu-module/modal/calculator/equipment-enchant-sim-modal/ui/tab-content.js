// 장비 감정 시뮬 모달 전용 탭 콘텐츠
import EquipmentDrawAPI from '../../../../../../api/googleSheetLoad/equipmentDrawAPI.js';
import GradeCalculator from '../../../../../dom-modules/item-stats/GradeCalculator.js';
import FinalTagAdder from '../../../../../dom-modules/item-stats/FinalTagAdder.js';
import ITEM_COLORS from '../../../../../../styles/item-colors.js';
import EnchantInfoRegistrationAPI from '../../../../../../api/googleSheetWrite/enchantInfoRegistrationAPI.js';

class TabContent {
  constructor() {
    this.equipmentDrawAPI = new EquipmentDrawAPI();
    this.gradeCalculator = new GradeCalculator();
    this.finalTagAdder = new FinalTagAdder();
    this.enchantInfoRegistrationAPI = new EnchantInfoRegistrationAPI();
  }

  showEnchantSimulationTab(contentArea) {
    // 감정시뮬 탭 내용 - 장비 뽑기 기능
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    `;

    // 초기 메시지 영역
    const messageArea = document.createElement('div');
    messageArea.style.cssText = `
      text-align: center;
      color: #6b7280;
    `;
    messageArea.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px;">🎲</div>
        <div style="font-size: 16px; font-weight: 500;">버튼을 클릭하여 장비를 뽑아보세요!</div>
    `;

    // 뽑기 버튼
    const drawButton = document.createElement('button');
    drawButton.textContent = '🎯 장비 뽑기';
    drawButton.style.cssText = `
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      width: 100%;
    `;

    drawButton.addEventListener('mouseenter', () => {
      drawButton.style.background = '#2563eb';
    });

    drawButton.addEventListener('mouseleave', () => {
      drawButton.style.background = '#3b82f6';
    });

    drawButton.addEventListener('click', () => {
      this.handleEquipmentDraw(messageArea, drawButton);
    });

    content.appendChild(messageArea);
    content.appendChild(drawButton);
    contentArea.appendChild(content);
  }

  // 랜덤 장비 뽑기 기능 (준비 중 - 주석처리)
  /*
  async drawRandomEquipment() {
    // resultArea는 매개변수로 전달받음
    if (!resultArea) return;

    // 로딩 표시
    resultArea.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 32px; margin-bottom: 12px;">🎲</div>
        <div>장비를 뽑는 중...</div>
      </div>
    `;

    try {
      // 레어 아이템 데이터 로드
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (!result.rareItems || result.rareItems.length === 0) {
        // 데이터가 없는 경우 수집 필요 모달 표시
        this.showCollectionNeededModal();
        resultArea.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
            <div style="color: #ef4444;">아이템 데이터를 먼저 수집해주세요!</div>
          </div>
        `;
        return;
      }

      // 랜덤 장비 선택 (모든 확률 동일)
      const randomIndex = Math.floor(Math.random() * result.rareItems.length);
      const selectedItem = result.rareItems[randomIndex];

      // 결과 표시
      this.displaySelectedEquipment(selectedItem, resultArea);

    } catch (error) {
      console.error('장비 뽑기 오류:', error);
      resultArea.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 32px; margin-bottom: 12px;">❌</div>
          <div style="color: #ef4444;">장비 뽑기 중 오류가 발생했습니다.</div>
        </div>
      `;
    }
  }

  // 선택된 장비 표시 (준비 중 - 주석처리)
  displaySelectedEquipment(item, resultArea) {
    const gradeColors = {
      '흰색': '#9ca3af',
      '파랑': '#3b82f6', 
      '노랑': '#f59e0b',
      '보라': '#8b5cf6',
      '빨강': '#ef4444'
    };

    const gradeColor = gradeColors[item.grade] || '#6b7280';

    resultArea.innerHTML = `
      <div style="text-align: center; width: 100%;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <div style="font-size: 20px; font-weight: 700; color: ${gradeColor}; margin-bottom: 8px;">
          ${item.name}
        </div>
        <div style="display: inline-block; padding: 4px 12px; background: ${gradeColor}; color: white; border-radius: 16px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
          ${item.grade} 등급
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 16px; text-align: left;">
          ${item.type ? `<div><strong>종류:</strong> ${item.type}</div>` : ''}
          ${item.power ? `<div><strong>위력:</strong> ${item.power}</div>` : ''}
          ${item.weight ? `<div><strong>무게:</strong> ${item.weight}</div>` : ''}
          ${item.ability ? `<div><strong>어빌리티:</strong> ${item.ability}</div>` : ''}
        </div>
        ${item.description ? `<div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #4b5563;">${item.description}</div>` : ''}
      </div>
    `;
  }

  // 수집 필요 모달 표시 (준비 중 - 주석처리)
  showCollectionNeededModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.collection-needed-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'collection-needed-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      z-index: 10030;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    modalContent.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">📦</div>
      <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #374151;">아이템 데이터 수집 필요</h3>
      <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.6;">
        장비 뽑기를 사용하려면 먼저 라니스 위키에서 레어 아이템 데이터를 수집해야 합니다.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="close-collection-modal" style="
          padding: 12px 24px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s ease;
        ">닫기</button>
        <button id="go-to-collection" style="
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s ease;
        ">아이템 수집하기</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.getElementById('close-collection-modal').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('go-to-collection').addEventListener('click', () => {
      modal.remove();
      // 설정 메뉴의 아이템 수집 모달 열기
      if (window.menuManager && window.menuManager.itemCollectionModal) {
        window.menuManager.itemCollectionModal.open();
      }
    });
  }
  */

  /**
   * 장비 뽑기 처리
   */
  async handleEquipmentDraw(messageArea, drawButton) {
    // 버튼 비활성화
    drawButton.disabled = true;
    drawButton.textContent = '🎲 뽑는 중...';
    drawButton.style.opacity = '0.7';

    // 로딩 표시
    messageArea.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎲</div>
        <div style="font-size: 16px; color: #6b7280;">뽑는 중...</div>
      </div>
    `;

    try {
      // 장비 데이터 로드
      const equipmentList = await this.equipmentDrawAPI.loadEquipmentData();
      
      if (!equipmentList || equipmentList.length === 0) {
        throw new Error('장비 데이터를 불러올 수 없습니다.');
      }

      // 랜덤 장비 뽑기
      const selectedEquipment = this.equipmentDrawAPI.drawRandomEquipment(equipmentList);
      
      // 위키에서 수집된 장비 정보 찾기
      const wikiItemInfo = await this.findWikiItemInfo(selectedEquipment.name);
      
      // 결과 표시
      this.displayEquipmentResult(selectedEquipment, messageArea, wikiItemInfo);

    } catch (error) {
      console.error('장비 뽑기 오류:', error);
      messageArea.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; color: #ef4444;">오류가 발생했습니다</div>
        </div>
      `;
    } finally {
      // 버튼 복원
      drawButton.disabled = false;
      drawButton.textContent = '🎯 장비 뽑기';
      drawButton.style.opacity = '1';
    }
  }

  /**
   * 위키에서 수집된 장비 정보 찾기
   */
  async findWikiItemInfo(equipmentName) {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (!result.rareItems || result.rareItems.length === 0) {
        return null;
      }

      // 정확한 이름 매칭 시도
      let wikiItem = result.rareItems.find(item => 
        item.name && item.name.trim() === equipmentName.trim()
      );

      // 정확한 매칭이 없으면 부분 매칭 시도
      if (!wikiItem) {
        wikiItem = result.rareItems.find(item => 
          item.name && item.name.includes(equipmentName) || equipmentName.includes(item.name)
        );
      }

      return wikiItem || null;
    } catch (error) {
      console.error('위키 아이템 정보 검색 오류:', error);
      return null;
    }
  }

  /**
   * 장비 결과 표시
   */
  displayEquipmentResult(equipment, messageArea, wikiItemInfo = null) {
    const typeColors = {
      '무기': '#ef4444',
      '방어구': '#3b82f6',
      '장신구': '#8b5cf6'
    };

    const typeColor = typeColors[equipment.type] || '#6b7280';

    // 위키 정보가 있으면 상세 정보 표시
    if (wikiItemInfo) {
      messageArea.innerHTML = `
        <div style="width: 100%; max-width: 400px; margin: 0 auto;">
          <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${equipment.name}</p>
                <div style="margin-top: 4px;">
                  <span style="color: #cccccc; font-size: 14px; font-style: italic;">(미감정)</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <p style="margin: 0; font-size: 14px; color: #cccccc;">${equipment.type}</p>
              </div>
            </div>
            
            <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; flex-direction: column; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 500px !important; overflow-y: auto !important;">
              ${this.formatPowerInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">위력</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${this.formatPowerInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${this.formatWeightInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">무게</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${this.formatWeightInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${this.formatAttributesInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">속성</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${this.formatAttributesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${this.formatAbilitiesInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: nowrap; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">어빌리티</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important; margin-left: 30px;">
                    ${this.formatAbilitiesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <div style="margin-top: 16px; text-align: center;">
              <button id="appraise-btn" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
                장비 감정
              </button>
            </div>
          </div>
        </div>
      `;

      // 감정 버튼 이벤트 리스너 추가
      const appraiseBtn = messageArea.querySelector('#appraise-btn');
      if (appraiseBtn) {
        appraiseBtn.addEventListener('click', () => {
          this.appraiseEquipment(equipment, messageArea, wikiItemInfo);
        });
      }
    } else {
      // 위키 정보가 없으면 기본 정보만 표시
      messageArea.innerHTML = `
        <div style="width: 100%; max-width: 400px; margin: 0 auto;">
          <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${equipment.name}</p>
                <div style="margin-top: 4px;">
                  <span style="color: #cccccc; font-size: 14px; font-style: italic;">(미감정)</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <p style="margin: 0; font-size: 14px; color: #cccccc;">${equipment.type}</p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #cccccc; font-size: 14px;">
              위키에 정보 없음
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * 위력 정보 포맷팅
   */
  formatPowerInfo(wikiItem) {
    if (wikiItem.power_min !== null && wikiItem.power_max !== null) {
      if (wikiItem.power_min === wikiItem.power_max) {
        return `${wikiItem.power_min}`;
      } else {
        return `${wikiItem.power_min}~${wikiItem.power_max}`;
      }
    }
    return '';
  }

  /**
   * 무게 정보 포맷팅
   */
  formatWeightInfo(wikiItem) {
    if (wikiItem.weight_min !== null && wikiItem.weight_max !== null) {
      if (wikiItem.weight_min === wikiItem.weight_max) {
        return `${wikiItem.weight_min}`;
      } else {
        return `${wikiItem.weight_min}~${wikiItem.weight_max}`;
      }
    }
    return '';
  }

  /**
   * 어빌리티 정보 포맷팅
   */
  formatAbilitiesInfo(wikiItem) {
    if (wikiItem.abilities && wikiItem.abilities.length > 0) {
      return wikiItem.abilities.join(', ');
    }
    return '';
  }

  /**
   * 속성 정보 포맷팅
   */
  formatAttributesInfo(wikiItem) {
    if (wikiItem.attributes && wikiItem.attributes.length > 0) {
      return wikiItem.attributes.join(', ');
    }
    return '';
  }

  /**
   * 장비 통계 로드
   */
  async loadEquipmentStats(statsArea) {
    try {
      const equipmentList = await this.equipmentDrawAPI.loadEquipmentData();
      
      if (equipmentList && equipmentList.length > 0) {
        const totalItems = equipmentList.length;
        const typeStats = {};
        
        equipmentList.forEach(item => {
          typeStats[item.type] = (typeStats[item.type] || 0) + 1;
        });

        const statsText = `총 ${totalItems}개 장비 | ${Object.entries(typeStats).map(([type, count]) => `${type}: ${count}개`).join(' | ')}`;
        
        statsArea.textContent = statsText;
      } else {
        statsArea.textContent = '장비 데이터를 불러올 수 없습니다.';
      }
    } catch (error) {
      console.error('통계 로드 오류:', error);
      statsArea.textContent = '통계 정보를 불러올 수 없습니다.';
    }
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

  /**
   * 랭킹 서브 탭 전환
   */
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

  /**
   * 랭킹 서브 탭 콘텐츠 표시
   */
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

  /**
   * 장인랭킹 콘텐츠 표시
   */
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
      const rankingData = await this.enchantInfoRegistrationAPI.getCraftsmanRanking();
      
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

  /**
   * 장비별랭킹 콘텐츠 표시
   */
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
      const equipmentData = await this.enchantInfoRegistrationAPI.getEquipmentRanking();
      
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

  showUnknownTab(contentArea) {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 4px;
    `;

    const placeholderDiv = document.createElement('div');
    placeholderDiv.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    placeholderDiv.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <div style="font-size: 48px; margin-bottom: 16px;">❓</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">알 수 없는 탭</div>
        <div style="font-size: 14px; color: #6b7280;">이 탭은 존재하지 않습니다</div>
      </div>
    `;

    content.appendChild(placeholderDiv);
    contentArea.appendChild(content);
  }

  /**
   * 장비 감정
   */
  appraiseEquipment(equipment, resultArea, wikiItemInfo) {
    const appraisedStats = this.generateAppraisedStats(wikiItemInfo);
    this.displayAppraisedResult(equipment, resultArea, wikiItemInfo, appraisedStats);
  }

  /**
   * 감정된 스탯 생성
   */
  generateAppraisedStats(wikiItemInfo) {
    const stats = {};

    // 위력 감정
    if (wikiItemInfo.power_min !== null && wikiItemInfo.power_max !== null) {
      const powerValue = Math.floor(Math.random() * (wikiItemInfo.power_max - wikiItemInfo.power_min + 1)) + wikiItemInfo.power_min;
      const powerResult = this.gradeCalculator.calculateGrade(powerValue, wikiItemInfo.power_min, wikiItemInfo.power_max, false);
      
      stats.power = {
        value: powerValue,
        min: wikiItemInfo.power_min,
        max: wikiItemInfo.power_max,
        percent: powerResult.percentage?.toFixed(1) || '0.0',
        grade: powerResult.grade,
        score: powerResult.score,
        color: powerResult.color
      };
    }

    // 무게 감정
    if (wikiItemInfo.weight_min !== null && wikiItemInfo.weight_max !== null) {
      const weightValue = Math.floor(Math.random() * (wikiItemInfo.weight_max - wikiItemInfo.weight_min + 1)) + wikiItemInfo.weight_min;
      const weightResult = this.gradeCalculator.calculateGrade(weightValue, wikiItemInfo.weight_min, wikiItemInfo.weight_max, true);
      
      stats.weight = {
        value: weightValue,
        min: wikiItemInfo.weight_min,
        max: wikiItemInfo.weight_max,
        percent: weightResult.percentage?.toFixed(1) || '0.0',
        grade: weightResult.grade,
        score: weightResult.score,
        color: weightResult.color
      };
    }



    // 종결 점수 계산 (기존 FinalTagAdder 로직 활용)
    const powerScore = stats.power?.score || 0;
    const weightScore = stats.weight?.score || 0;
    const powerGrade = stats.power?.grade || null;
    const weightGrade = stats.weight?.grade || null;
    
    // 범위가 좁은지 확인 (9 이하)
    const powerNarrow = Math.abs(stats.power?.max - stats.power?.min) <= 9;
    const weightNarrow = Math.abs(stats.weight?.max - stats.weight?.min) <= 9;
    
    // 임시 컨테이너 생성하여 기존 로직 활용
    const tempContainer = document.createElement('div');
    this.finalTagAdder.addFinalTag(tempContainer, powerGrade, weightGrade, powerScore, weightScore, powerNarrow, weightNarrow);
    
    // 결과에서 태그와 점수 추출
    const finalTagSpan = tempContainer.querySelector('.final-tag');
    let finalGrade = '최하급';
    let totalScore;
    
    if (finalTagSpan) {
      const tagText = finalTagSpan.textContent;
      // 점수 추출
      const scoreMatch = tagText.match(/\((\d+)점\)/);
      if (scoreMatch) {
        totalScore = parseInt(scoreMatch[1]);
      } else {
        totalScore = powerScore + weightScore;
      }
      
      // 등급 추출
      if (tagText.includes('완전무결')) {
        finalGrade = '완전무결';
      } else if (tagText.includes('종결')) {
        finalGrade = '종결';
      } else if (tagText.includes('준종결')) {
        finalGrade = '준종결';
      }
    } else {
      totalScore = powerScore + weightScore;
    }
    
    stats.final = {
      score: totalScore,
      grade: finalGrade
    };

    return stats;
  }

  /**
   * 감정정보 등록 이벤트 리스너 추가
   */
  addEnchantInfoRegistrationListener(resultArea, equipment, appraisedStats) {
    // DOM이 렌더링된 후 이벤트 리스너 추가
    setTimeout(() => {
      const registerButton = resultArea.querySelector('#register-enchant-info');
      if (registerButton) {
        registerButton.addEventListener('click', async () => {
          await this.handleEnchantInfoRegistration(equipment, appraisedStats, registerButton);
        });
      }
    }, 100);
  }

  /**
   * 감정정보 등록 처리
   */
  async handleEnchantInfoRegistration(equipment, appraisedStats, button) {
    try {
      // 버튼 비활성화
      button.disabled = true;
      button.textContent = '등록 중...';
      button.style.opacity = '0.7';

      // 닉네임 가져오기
      const nickname = this.getCurrentNickname();
      if (!nickname) {
        throw new Error('닉네임을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
      }

      // 30% 확률로 등록 성공, 70% 확률로 장비 파괴
      const successRate = Math.random();
      if (successRate > 0.3) {
        // 70% 확률로 장비 파괴
        // 에러 모달로 장비 파괴 메시지 표시
        this.showErrorModal('장비가 파괴되었습니다! (70% 파괴 확률)');
        
        // 파괴된 장비는 등록 버튼을 비활성화하고 텍스트 변경
        button.disabled = true;
        button.textContent = '장비 파괴됨';
        button.style.background = '#dc2626';
        button.style.color = 'white';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // 함수 종료 (API 호출하지 않음)
        return;
      }

      // 감정 정보 객체 생성
      const enchantInfo = {
        equipmentType: equipment.type,
        equipmentName: equipment.name,
        power: appraisedStats.power ? appraisedStats.power.value : 0,
        weight: appraisedStats.weight ? appraisedStats.weight.value : 0,
        nickname: nickname
      };

      // 감정정보 등록 API 호출
      const result = await this.enchantInfoRegistrationAPI.registerEnchantInfo(enchantInfo);

      if (result.success) {
        // 성공 메시지 표시
        button.textContent = '등록 완료!';
        button.style.background = '#10b981';
        button.style.color = 'white';
        
        // 3초 후 원래 상태로 복원
        setTimeout(() => {
          button.disabled = false;
          button.textContent = '감정정보 등록';
          button.style.background = '#3b82f6';
          button.style.opacity = '1';
        }, 3000);


      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('감정정보 등록 실패:', error);
      
      // 에러 모달 표시
      this.showErrorModal(error.message || '알 수 없는 오류가 발생했습니다.');
      
      // 버튼 상태 복원
      button.disabled = false;
      button.textContent = '감정정보 등록';
      button.style.background = '#3b82f6';
      button.style.opacity = '1';
    }
  }

  /**
   * 에러 모달 표시
   */
  showErrorModal(errorMessage) {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.error-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    // 에러 아이콘
    const errorIcon = document.createElement('div');
    errorIcon.innerHTML = '❌';
    errorIcon.style.cssText = `
      font-size: 48px;
      margin-bottom: 16px;
    `;

    // 에러 제목
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = '등록 실패';
    errorTitle.style.cssText = `
      margin: 0 0 16px 0;
      color: #dc2626;
      font-size: 20px;
      font-weight: 600;
    `;

    // 에러 메시지
    const errorMessageDiv = document.createElement('div');
    errorMessageDiv.textContent = errorMessage;
    errorMessageDiv.style.cssText = `
      margin: 0 0 24px 0;
      color: #374151;
      font-size: 16px;
      line-height: 1.5;
      word-break: break-word;
    `;

    // 확인 버튼
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '확인';
    confirmButton.style.cssText = `
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    `;

    confirmButton.addEventListener('mouseenter', () => {
      confirmButton.style.background = '#2563eb';
    });

    confirmButton.addEventListener('mouseleave', () => {
      confirmButton.style.background = '#3b82f6';
    });

    confirmButton.addEventListener('click', () => {
      modal.remove();
    });

    // 모달 닫기 (배경 클릭)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // 요소들을 모달에 추가
    modalContent.appendChild(errorIcon);
    modalContent.appendChild(errorTitle);
    modalContent.appendChild(errorMessageDiv);
    modalContent.appendChild(confirmButton);
    modal.appendChild(modalContent);

    // DOM에 모달 추가
    document.body.appendChild(modal);
  }

  /**
   * 현재 닉네임 가져오기
   */
  getCurrentNickname() {
    try {
      // sessionStorage에서 닉네임 가져오기
      return sessionStorage.getItem('lanis_user_nickname');
    } catch (error) {
      console.error('닉네임 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 감정 결과 표시 (미감정 상태와 동일한 스타일로 통일)
   */
  displayAppraisedResult(equipment, resultArea, wikiItemInfo, appraisedStats) {
    const finalGradeColors = {
      '완전무결': ITEM_COLORS.getGradeColor('무결'),
      '종결': ITEM_COLORS.getGradeColor('최상'),
      '준종결': ITEM_COLORS.getGradeColor('상'),
      '상급': ITEM_COLORS.getGradeColor('최상'),
      '중급': ITEM_COLORS.getGradeColor('중'),
      '하급': ITEM_COLORS.getGradeColor('하'),
      '최하급': ITEM_COLORS.getGradeColor('최하')
    };

    resultArea.innerHTML = `
      <div style="width: 100%; max-width: 400px; margin: 0 auto;">
        <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${equipment.name}</p>
                <div style="margin-top: 4px; text-align: left;">
                <span style="color: ${finalGradeColors[appraisedStats.final.grade]}; font-size: 14px; font-weight: 600; font-style: italic;">[${appraisedStats.final.grade}] (${appraisedStats.final.score}점)</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
              <p style="margin: 0; font-size: 14px; color: #cccccc;">${equipment.type}</p>
              </div>
            </div>
            
          <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; flex-direction: column; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 500px !important; overflow-y: auto !important;">
              ${appraisedStats.power ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">위력</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                  ${appraisedStats.power.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${appraisedStats.power.min} - ${appraisedStats.power.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.power.color};" data-grade="${appraisedStats.power.grade}"> [${appraisedStats.power.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: flex; justify-content: flex-end; align-items: center; width: 100%; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; gap: 4px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: #666666; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${appraisedStats.power.percent}%)</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.power.color};" data-grade="${appraisedStats.power.grade}"> (${appraisedStats.power.score}점)</span></span>
                  </p>
                </div>
              ` : ''}
              
              ${appraisedStats.weight ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">무게</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                  ${appraisedStats.weight.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${appraisedStats.weight.min} - ${appraisedStats.weight.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.weight.color};" data-grade="${appraisedStats.weight.grade}"> [${appraisedStats.weight.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: flex; justify-content: flex-end; align-items: center; width: 100%; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; gap: 4px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: #666666; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${appraisedStats.weight.percent}%)</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.weight.color};" data-grade="${appraisedStats.weight.grade}"> (${appraisedStats.weight.score}점)</span></span>
                  </p>
                </div>
              ` : ''}
              
              ${this.formatAttributesInfo(wikiItemInfo) ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">속성</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${this.formatAttributesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${this.formatAbilitiesInfo(wikiItemInfo) ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: nowrap; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">어빌리티</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important; margin-left: 30px;">
                    ${this.formatAbilitiesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
            
            <!-- 감정정보 등록 버튼 -->
            <div style="margin-top: 16px; text-align: center;">
              <button id="register-enchant-info" style="
                padding: 12px 24px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s ease;
              ">감정정보 등록</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 감정정보 등록 버튼 이벤트 리스너 추가
    this.addEnchantInfoRegistrationListener(resultArea, equipment, appraisedStats);
  }
}

export { TabContent };
