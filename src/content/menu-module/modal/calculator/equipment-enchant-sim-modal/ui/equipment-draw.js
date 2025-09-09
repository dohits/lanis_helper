// 장비 뽑기 관련 로직
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

export class EquipmentDraw {
  constructor() {
    this.onAppraiseCallback = null;
    this.registrationData = null; // 등록된 사람 데이터 캐시
  }

  setOnAppraiseCallback(callback) {
    this.onAppraiseCallback = callback;
  }

  // 등록된 사람 데이터 로드
  async loadRegistrationData() {
    try {
      if (!this.registrationData) {
        this.registrationData = await enchantInfoRegistrationAPI.getEquipmentRanking();
      }
    } catch (error) {
      console.error('등록된 사람 데이터 로드 실패:', error);
      this.registrationData = [];
    }
  }

  // 특정 장비의 등록된 사람 정보 찾기
  findRegistrationInfo(equipmentName) {
    if (!this.registrationData) return null;
    
    return this.registrationData.find(item => 
      item.equipmentName === equipmentName && item.hasEnchantInfo
    );
  }

  async showEquipmentDrawTab(contentArea) {
    // 장비 뽑기 탭 내용
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // 등록된 사람 데이터 미리 로드
    await this.loadRegistrationData();

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
    // 등록된 사람 정보 찾기
    const registrationInfo = this.findRegistrationInfo(equipment.name);
    
    // 위키 정보가 있으면 상세 정보 표시
    if (wikiItemInfo) {
      messageArea.innerHTML = `
        <div style="width: 100%; max-width: 400px; margin: 0 auto;">
          <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px; position: relative;">
            ${registrationInfo ? `
              <div style="position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 4px; background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px);">
                <span style="font-size: 12px;">👑</span>
                <span style="font-size: 11px; color: #ffffff; font-weight: 500;">${registrationInfo.nickname}</span>
                <span style="font-size: 10px; color: #ffd700; font-weight: 600;">${registrationInfo.score}</span>
              </div>
            ` : ''}
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
          <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px; position: relative;">
            ${registrationInfo ? `
              <div style="position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 4px; background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px);">
                <span style="font-size: 12px;">👑</span>
                <span style="font-size: 11px; color: #ffffff; font-weight: 500;">${registrationInfo.nickname}</span>
                <span style="font-size: 10px; color: #ffd700; font-weight: 600;">${registrationInfo.score}</span>
              </div>
            ` : ''}
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
    // 등록된 사람 정보 찾기
    const registrationInfo = this.findRegistrationInfo(equipment.name);
    
    resultArea.innerHTML = `
      <div style="width: 100%; max-width: 400px; margin: 0 auto;">
        <div style="background: #000000; border-radius: 8px; box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); padding: 16px; position: relative;">
          ${registrationInfo ? `
            <div style="position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 4px; background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px);">
              <span style="font-size: 12px;">👑</span>
              <span style="font-size: 11px; color: #ffffff; font-weight: 500;">${registrationInfo.nickname}</span>
              <span style="font-size: 10px; color: #ffd700; font-weight: 600;">${registrationInfo.score}</span>
            </div>
          ` : ''}
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
      if (registerButton && this.onAppraiseCallback) {
        registerButton.addEventListener('click', async () => {
          await this.onAppraiseCallback(equipment, appraisedStats, registerButton);
        });
      }
    }, 100);
  }
}
