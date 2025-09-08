// 장비 감정 시뮬레이션 탭
import { 
  equipmentDrawAPI, 
  findWikiItemInfo, 
  formatPowerInfo, 
  formatWeightInfo, 
  formatAbilitiesInfo, 
  formatAttributesInfo,
  generateAppraisedStats,
  finalGradeColors,
  formatFinalTagWithColor,
  enchantInfoRegistrationAPI,
  detectEquipmentType
} from '../data/equipment-data.js';

export class EnchantSimulationTab {
  constructor() {
    // 초기화
  }

  show(contentArea) {
    this.showEnchantSimulationTab(contentArea);
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
      const equipmentList = await equipmentDrawAPI.loadEquipmentData();
      
      if (!equipmentList || equipmentList.length === 0) {
        throw new Error('장비 데이터를 불러올 수 없습니다.');
      }

      // 랜덤 장비 뽑기
      const selectedEquipment = equipmentDrawAPI.drawRandomEquipment(equipmentList);
      
      // 위키에서 수집된 장비 정보 찾기
      const wikiItemInfo = await findWikiItemInfo(selectedEquipment.name);
      
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

  displayEquipmentResult(equipment, messageArea, wikiItemInfo = null) {
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
              ${formatPowerInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">위력</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${formatPowerInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${formatWeightInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">무게</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${formatWeightInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${formatAttributesInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">속성</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${formatAttributesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${formatAbilitiesInfo(wikiItemInfo) ? `
                <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: flex-end; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: nowrap; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">어빌리티</p>
                  <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important; margin-left: 30px;">
                    ${formatAbilitiesInfo(wikiItemInfo)}
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

  appraiseEquipment(equipment, resultArea, wikiItemInfo) {
    const appraisedStats = generateAppraisedStats(wikiItemInfo);
    this.displayAppraisedResult(equipment, resultArea, wikiItemInfo, appraisedStats);
  }

  displayAppraisedResult(equipment, resultArea, wikiItemInfo, appraisedStats) {
    resultArea.innerHTML = `
      <div style="width: 100%; max-width: 400px; margin: 0 auto;">
        <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff; text-align: left;">${equipment.name}</p>
                <div style="margin-top: 4px; text-align: left;">
                ${formatFinalTagWithColor(appraisedStats.final, finalGradeColors)}
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
                  ${appraisedStats.power.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${appraisedStats.power.min} - ${appraisedStats.power.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.power.color};" data-grade="${appraisedStats.power.grade}"> [${appraisedStats.power.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: inline-block; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.power.color}; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${appraisedStats.power.percent}%)</span></span>
                  </p>
                </div>
              ` : ''}
              
              ${appraisedStats.weight ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">무게</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                  ${appraisedStats.weight.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${appraisedStats.weight.min} - ${appraisedStats.weight.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.weight.color};" data-grade="${appraisedStats.weight.grade}"> [${appraisedStats.weight.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: inline-block; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${appraisedStats.weight.color}; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${appraisedStats.weight.percent}%)</span></span>
                  </p>
                </div>
              ` : ''}
              
              ${formatAttributesInfo(wikiItemInfo) ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">속성</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
                    ${formatAttributesInfo(wikiItemInfo)}
                  </p>
                </div>
              ` : ''}
              
              ${formatAbilitiesInfo(wikiItemInfo) ? `
              <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: nowrap; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">어빌리티</p>
                <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important; margin-left: 30px;">
                    ${formatAbilitiesInfo(wikiItemInfo)}
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

  async handleEnchantInfoRegistration(equipment, appraisedStats, button) {
    try {
      // 버튼 비활성화
      button.disabled = true;
      button.textContent = '등록 중...';
      button.style.opacity = '0.7';

      // 현재 닉네임 가져오기
      const nickname = this.getCurrentNickname();
      if (!nickname) {
        throw new Error('닉네임을 찾을 수 없습니다. 프로필 페이지에서 다시 시도해주세요.');
      }

      // 30% 확률로 등록 성공, 70% 확률로 실패
      const successRate = Math.random();
      if (successRate > 0.3) {
        // 70% 확률로 실패
        // 실패 모달로 실패 메시지 표시
        this.showErrorModal('장비가 파괴 되었습니다.(70% 파괴)');
        
        // 실패 시 등록 버튼을 비활성화하고 빨간색으로 변경
        button.disabled = true;
        button.textContent = '실패 발생';
        button.style.background = '#dc2626';
        button.style.color = 'white';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // 함수 종료 (API 호출하지 않음)
        return;
      }

      // 감정정보 객체 생성
      const enchantInfo = {
        equipmentType: equipment.type,
        equipmentName: equipment.name,
        power: appraisedStats.power ? appraisedStats.power.value : 0,
        weight: appraisedStats.weight ? appraisedStats.weight.value : 0,
        nickname: nickname
      };

      // 감정정보 등록 API 호출
      console.log('감정정보 등록 시도:', enchantInfo);
      let result;
      try {
        result = await enchantInfoRegistrationAPI.registerEnchantInfo(enchantInfo);
        console.log('API 응답:', result);
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        // API 오류를 result 형태로 변환
        result = {
          success: false,
          message: apiError.message || 'API 호출 중 오류가 발생했습니다.'
        };
      }

      if (result.success) {
        // 성공 메시지 표시
        button.textContent = '등록 완료!';
        button.style.background = '#10b981';
        button.style.color = 'white';
        
        // 등록 완료 후 버튼 비활성화 (재등록 방지)
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // 성공 모달 표시 - 올바른 점수 계산 사용
        const equipmentType = detectEquipmentType(equipment.name, equipment.type);
        let calculatedScore;
        if (equipmentType === 'accessory') {
          calculatedScore = appraisedStats.power.value * 5.5 - appraisedStats.weight.value * 2;
        } else {
          calculatedScore = appraisedStats.power.value - appraisedStats.weight.value * 2;
        }
        this.showSuccessModal(equipment.name, appraisedStats.power.value, appraisedStats.weight.value, calculatedScore);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('감정정보 등록 오류:', error);
      
      // 오류 모달 표시
      this.showErrorModal(error.message || '알 수 없는 오류가 발생했습니다.');
      
      // 점수 부족으로 실패한 경우 버튼 비활성화 (파괴된 것처럼 처리)
      if (error.message && error.message.includes('낮은 점수')) {
        button.disabled = true;
        button.textContent = '실패 발생';
        button.style.background = '#dc2626';
        button.style.color = 'white';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
      } else {
        // 다른 오류의 경우 버튼 상태 복원
        button.disabled = false;
        button.textContent = '감정정보 등록';
        button.style.background = '#3b82f6';
        button.style.opacity = '1';
      }
    }
  }

  // 현재 닉네임 가져오기
  getCurrentNickname() {
    try {
      // sessionStorage에서 닉네임 가져오기
      return sessionStorage.getItem('lanis_user_nickname');
    } catch (error) {
      console.error('닉네임 가져오기 실패:', error);
      return null;
    }
  }

  // 성공 모달 표시
  showSuccessModal(equipmentName, power, weight, score) {
    const modal = document.createElement('div');
    modal.className = 'success-modal';
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
      z-index: 10030;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #10b981; margin: 0 0 16px 0;">등록 성공</h3>
        <div style="margin: 0 0 20px 0; color: #374151; text-align: left;">
          <p style="margin: 0 0 8px 0;"><strong>장비:</strong> ${equipmentName}</p>
          <p style="margin: 0 0 8px 0;"><strong>위력:</strong> ${power}</p>
          <p style="margin: 0 0 8px 0;"><strong>무게:</strong> ${weight}</p>
          <p style="margin: 0;"><strong>점수:</strong> ${score}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 실패 모달 표시
  showErrorModal(message) {
    const modal = document.createElement('div');
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
      z-index: 10030;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #dc2626; margin: 0 0 16px 0;">등록 실패</h3>
        <p style="margin: 0 0 20px 0; color: #374151;">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}
