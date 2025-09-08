// 장비 감정 시뮬레이션 탭 (리팩토링된 버전)
import { EquipmentDraw } from './equipment-draw.js';
import { EnchantRegistration } from './enchant-registration.js';
import { Modals } from './modals.js';
import GradeCalculator from '../../../../../dom-modules/item-stats/GradeCalculator.js';
import { findWikiItemInfo, formatPowerInfo, formatWeightInfo, formatAbilitiesInfo, formatAttributesInfo, generateAppraisedStats, finalGradeColors, formatFinalTagWithColor, detectEquipmentType } from '../data/equipment-data.js';

export class EnchantSimulationTab {
  constructor() {
    this.currentSimulationSubTab = 'sub-equipment-draw';
    this.simulationContentArea = null;
    
    // 모듈 인스턴스 생성
    this.equipmentDraw = new EquipmentDraw();
    this.enchantRegistration = new EnchantRegistration();
    this.modals = new Modals();
    this.gradeCalculator = new GradeCalculator();
    
    // 콜백 설정
    this.setupCallbacks();
  }

  setupCallbacks() {
    // 장비 뽑기에서 감정정보 등록 요청 시 콜백
    this.equipmentDraw.setOnAppraiseCallback((equipment, appraisedStats, button) => {
      return this.enchantRegistration.handleEnchantInfoRegistration(equipment, appraisedStats, button);
    });

    // 감정정보 등록 성공 시 콜백
    this.enchantRegistration.setOnSuccessCallback((equipmentName, power, weight, score) => {
      this.modals.showSuccessModal(equipmentName, power, weight, score);
    });

    // 감정정보 등록 실패 시 콜백
    this.enchantRegistration.setOnErrorCallback((message) => {
      this.modals.showErrorModal(message);
    });
  }

  show(contentArea) {
    this.showEnchantSimulationTab(contentArea);
  }

  showEnchantSimulationTab(contentArea) {
    // 시뮬레이터 탭 내용 - 하위 탭 구조
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0px;
    `;

    // 서브 토글 버튼 섹션
    const subToggleSection = document.createElement('div');
    subToggleSection.id = 'simulation-sub-toggle';
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
      { id: 'sub-equipment-draw', text: '장비뽑기', active: true },
      { id: 'sub-coming-soon', text: '미감정 기댓값', active: false }
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
        this.switchSimulationSubTab(button.id);
      });
      
      subToggleSection.appendChild(btn);
    });

    content.appendChild(subToggleSection);

    // 시뮬레이션 콘텐츠 영역
    this.simulationContentArea = document.createElement('div');
    this.simulationContentArea.id = 'simulation-content-area';
    this.simulationContentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    content.appendChild(this.simulationContentArea);

    contentArea.appendChild(content);

    // 애니메이션으로 서브 토글 버튼 표시
    setTimeout(() => {
      const subToggle = document.getElementById('simulation-sub-toggle');
      if (subToggle) {
        subToggle.style.opacity = '1';
        subToggle.style.transform = 'translateY(0)';
      }
    }, 300);

    // 초기 서브 탭 설정
    this.currentSimulationSubTab = 'sub-equipment-draw';
    this.showSimulationSubTabContent('sub-equipment-draw');
  }

  switchSimulationSubTab(subTabId) {
    // 모든 서브 버튼 비활성화
    const subButtons = document.querySelectorAll('#sub-equipment-draw, #sub-coming-soon');
    subButtons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#28a745';
    });

    // 클릭된 버튼 활성화
    const activeBtn = document.getElementById(subTabId);
    if (activeBtn) {
      activeBtn.style.background = '#28a745';
      activeBtn.style.color = 'white';
    }

    // 현재 서브 탭 업데이트
    this.currentSimulationSubTab = subTabId;
    this.showSimulationSubTabContent(subTabId);
  }

  showSimulationSubTabContent(subTabId) {
    if (!this.simulationContentArea) return;

    this.simulationContentArea.innerHTML = '';

    if (subTabId === 'sub-equipment-draw') {
      this.equipmentDraw.showEquipmentDrawTab(this.simulationContentArea);
    } else if (subTabId === 'sub-coming-soon') {
      this.showComingSoonTab(this.simulationContentArea);
    }
  }

  // 미감정 기댓값 탭 표시
  showComingSoonTab(contentArea) {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0 4px;
    `;

    // 빈 카드 데이터 (초기 상태)
    const emptyCard = {
      name: '',
      type: '',
      final: '',
      finalColor: '',
      score: '',
      scorePercent: '',
      power: { value: 0, min: 0, max: 0, grade: '', color: '', percent: '' },
      weight: { value: 0, min: 0, max: 0, grade: '', color: '', percent: '' },
      attribute: '',
      ability: ''
    };

    // 샘플 카드 생성
    const cardContainer = document.createElement('div');
    cardContainer.style.cssText = `
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    `;

    cardContainer.innerHTML = `
      <div style="
        background: #000000;
        border-radius: 8px;
        box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12);
        padding: 16px;
        cursor: pointer;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          text-align: center;
          color: #6b7280;
          font-size: 18px;
          font-weight: 500;
        ">
          장비를 선택 해 주세요.
        </div>
      </div>
    `;

    // 카드에 클릭 이벤트 추가 (중복 방지)
    const cardElement = cardContainer.querySelector('div');
    // 기존 이벤트 리스너 제거 후 새로 추가
    cardElement.removeEventListener('click', this.cardClickHandler);
    this.cardClickHandler = () => {
      this.showEditModal(emptyCard, cardContainer);
    };
    cardElement.addEventListener('click', this.cardClickHandler);

    content.appendChild(cardContainer);

    // 하단에 설명 텍스트 추가
    const descriptionDiv = document.createElement('div');
    descriptionDiv.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      margin-top: 16px;
    `;
    descriptionDiv.innerHTML = `
      <div style="line-height: 1.6;">
        <div id="expectation-result" style="font-size: 12px; color: #9CA3AF; margin-top: 8px; min-height: 40px; display: flex; align-items: center; justify-content: center;">
          장비를 선택하면 기댓값이 계산됩니다
        </div>
      </div>
    `;

    content.appendChild(descriptionDiv);
    contentArea.appendChild(content);
  }

  // 편집 모달 표시
  showEditModal(sampleCard, cardContainer) {
    // 이미 모달이 열려있는지 확인
    const existingModal = document.querySelector('.edit-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
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
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        text-align: center;
      ">
        <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">${sampleCard.name} 수정</h3>
        
        <!-- 탭 헤더 -->
        <div style="display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;">
          <button id="tab-1" class="modal-tab active" style="
            flex: 1;
            padding: 12px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
          ">장비 검색</button>
          <button id="tab-2" class="modal-tab" style="
            flex: 1;
            padding: 12px 16px;
            background: #f3f4f6;
            color: #6b7280;
            border: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
          ">위력변경</button>
        </div>
        
        <!-- 탭 내용 -->
        <div id="tab-content-1" class="tab-content" style="display: block;">
          <div style="padding: 20px;">
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">장비 이름</label>
              <input type="text" id="equipment-search-input" placeholder="장비 이름을 입력하세요" style="
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <button id="search-equipment-btn" style="
              width: 100%;
              padding: 12px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.3s;
            ">검색</button>
            <div id="search-result" style="margin-top: 16px;"></div>
          </div>
        </div>
        
        <div id="tab-content-2" class="tab-content" style="display: none;">
          <div style="padding: 20px;">
            <div style="margin-bottom: 20px; text-align: left;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">위력 변경</label>
              <input type="number" id="edit-power-tab2" value="${sampleCard.power.value}" min="${sampleCard.power.min}" max="${sampleCard.power.max}" style="
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              " />
              <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">범위: ${sampleCard.power.min} - ${sampleCard.power.max}</div>
            </div>
            
            <div style="margin-bottom: 24px; text-align: left;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">무게 변경</label>
              <input type="number" id="edit-weight-tab2" value="${sampleCard.weight.value}" min="${sampleCard.weight.min}" max="${sampleCard.weight.max}" style="
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              " />
              <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">범위: ${sampleCard.weight.min} - ${sampleCard.weight.max}</div>
            </div>
            
            <!-- 위력변경 탭 전용 버튼 영역 -->
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="cancel-btn" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">취소</button>
              <button id="save-btn" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">저장</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이벤트 리스너 추가
    const cancelBtn = modal.querySelector('#cancel-btn');
    const saveBtn = modal.querySelector('#save-btn');
    const tab1Btn = modal.querySelector('#tab-1');
    const tab2Btn = modal.querySelector('#tab-2');
    const tabContent1 = modal.querySelector('#tab-content-1');
    const tabContent2 = modal.querySelector('#tab-content-2');
    const searchBtn = modal.querySelector('#search-equipment-btn');
    const searchInput = modal.querySelector('#equipment-search-input');
    const searchResult = modal.querySelector('#search-result');
    
    // 탭 전환 기능
    tab1Btn.addEventListener('click', () => {
      // 탭 버튼 스타일 변경
      tab1Btn.style.background = '#3b82f6';
      tab1Btn.style.color = 'white';
      tab2Btn.style.background = '#f3f4f6';
      tab2Btn.style.color = '#6b7280';
      
      // 탭 내용 표시/숨김
      tabContent1.style.display = 'block';
      tabContent2.style.display = 'none';
    });
    
    tab2Btn.addEventListener('click', () => {
      // 탭 버튼 스타일 변경
      tab2Btn.style.background = '#3b82f6';
      tab2Btn.style.color = 'white';
      tab1Btn.style.background = '#f3f4f6';
      tab1Btn.style.color = '#6b7280';
      
      // 탭 내용 표시/숨김
      tabContent2.style.display = 'block';
      tabContent1.style.display = 'none';
    });
    
    // 검색 버튼 이벤트
    searchBtn.addEventListener('click', async () => {
      const equipmentName = searchInput.value.trim();
      if (!equipmentName) {
        searchResult.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 10px;">장비 이름을 입력해주세요.</div>';
        return;
      }
      
      searchBtn.textContent = '검색 중...';
      searchBtn.disabled = true;
      
      try {
        const wikiItemInfo = await findWikiItemInfo(equipmentName);
        if (wikiItemInfo) {
          // 장비 정보가 있으면 카드 업데이트 후 모달 닫기
          this.updateCardWithSearchResult(wikiItemInfo, sampleCard, cardContainer);
          modal.remove(); // 모달 닫기
        } else {
          // 장비 정보가 없으면 경고 모달 표시
          this.showEquipmentNotFoundModal(equipmentName);
          searchResult.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 10px;">해당 장비 데이터가 없습니다.</div>';
        }
      } catch (error) {
        console.error('장비 검색 오류:', error);
        searchResult.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 10px;">검색 중 오류가 발생했습니다.</div>';
      } finally {
        searchBtn.textContent = '검색';
        searchBtn.disabled = false;
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    saveBtn.addEventListener('click', () => {
      // 현재 활성화된 탭의 입력값 가져오기
      const isTab1Active = tabContent1.style.display !== 'none';
      const powerInput = isTab1Active ? modal.querySelector('#edit-power') : modal.querySelector('#edit-power-tab2');
      const weightInput = isTab1Active ? modal.querySelector('#edit-weight') : modal.querySelector('#edit-weight-tab2');
      
      const newPower = parseInt(powerInput.value);
      const newWeight = parseInt(weightInput.value);
      
      // 유효성 검사
      if (newPower < sampleCard.power.min || newPower > sampleCard.power.max) {
        alert(`위력은 ${sampleCard.power.min} - ${sampleCard.power.max} 범위 내에서 입력해주세요.`);
        return;
      }
      
      if (newWeight < sampleCard.weight.min || newWeight > sampleCard.weight.max) {
        alert(`무게는 ${sampleCard.weight.min} - ${sampleCard.weight.max} 범위 내에서 입력해주세요.`);
        return;
      }
      
      // 카드 데이터 업데이트
      sampleCard.power.value = newPower;
      sampleCard.weight.value = newWeight;
      
      // 점수 재계산 (장신구 기준)
      const newScore = newPower * 5.5 - newWeight * 2;
      sampleCard.score = `${newScore} (${sampleCard.power.min * 5.5 - sampleCard.weight.max * 2}~${sampleCard.power.max * 5.5 - sampleCard.weight.min * 2})`;
      
      // 카드 UI 업데이트
      this.updateCardDisplay(sampleCard, cardContainer);
      
      modal.remove();
    });
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 카드 표시 업데이트
  updateCardDisplay(sampleCard, cardContainer) {
    // 카드 전체를 다시 렌더링하는 방식으로 변경
    const cardElement = cardContainer.querySelector('div');
    
    // 초기 상태의 중앙 정렬 스타일 제거
    cardElement.style.display = 'block';
    cardElement.style.alignItems = 'unset';
    cardElement.style.justifyContent = 'unset';
    
    // 실제 계산 로직을 사용하여 위력과 무게 등급 재계산
    const powerResult = this.gradeCalculator.calculateGrade(
      sampleCard.power.value, 
      sampleCard.power.min, 
      sampleCard.power.max, 
      false
    );
    
    const weightResult = this.gradeCalculator.calculateGrade(
      sampleCard.weight.value, 
      sampleCard.weight.min, 
      sampleCard.weight.max, 
      true
    );
    
    // 위력과 무게 정보 업데이트
    sampleCard.power.grade = powerResult.grade;
    sampleCard.power.color = powerResult.color;
    sampleCard.power.percent = powerResult.percentage?.toFixed(1) || '0.0';
    
    sampleCard.weight.grade = weightResult.grade;
    sampleCard.weight.color = weightResult.color;
    sampleCard.weight.percent = weightResult.percentage?.toFixed(1) || '0.0';
    
    // 장비 타입 감지
    const equipmentType = detectEquipmentType(sampleCard.name, sampleCard.type);
    
    // 최종 점수와 등급 계산 (장비 타입별)
    let newScore, minScore, maxScore;
    if (equipmentType === 'accessory') {
      // 장신구: 위력*5.5 - 무게*2
      newScore = sampleCard.power.value * 5.5 - sampleCard.weight.value * 2;
      minScore = sampleCard.power.min * 5.5 - sampleCard.weight.max * 2;
      maxScore = sampleCard.power.max * 5.5 - sampleCard.weight.min * 2;
    } else {
      // 무기/방어구: 위력 - 무게*2
      newScore = sampleCard.power.value - sampleCard.weight.value * 2;
      minScore = sampleCard.power.min - sampleCard.weight.max * 2;
      maxScore = sampleCard.power.max - sampleCard.weight.min * 2;
    }
    
    let finalGrade = '최하급';
    let scorePercent = 0;
    
    if (minScore !== maxScore) {
      scorePercent = ((newScore - minScore) / (maxScore - minScore)) * 100;
      
      if (scorePercent >= 100) {
        finalGrade = '완전무결';
      } else if (scorePercent >= 95) {
        finalGrade = '종결';
      } else if (scorePercent >= 90) {
        finalGrade = '준종결';
      }
    }
    
    // sampleCard.final 객체 생성 (formatFinalTagWithColor와 호환)
    sampleCard.final = {
      score: newScore,
      grade: finalGrade,
      tagMinValue: minScore,
      tagMaxValue: maxScore,
      tagPercentage: scorePercent
    };
    
    // 카드 전체 HTML 다시 생성
    cardElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff; text-align: left;">${sampleCard.name}</p>
          <div style="margin-top: 4px; text-align: left;">
            ${formatFinalTagWithColor(sampleCard.final, finalGradeColors)}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <p style="margin: 0; font-size: 14px; color: #cccccc;">${sampleCard.type}</p>
        </div>
      </div>
      
      <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; flex-direction: column; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 500px !important; overflow-y: auto !important;">
        <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">위력</p>
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
            ${sampleCard.power.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${sampleCard.power.min} - ${sampleCard.power.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${powerResult.color};" data-grade="${powerResult.grade}"> [${powerResult.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: inline-block; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${powerResult.color}; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${powerResult.percentage?.toFixed(1) || '0.0'}%)</span></span>
          </p>
        </div>
        
        <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">무게</p>
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
            ${sampleCard.weight.value}<span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; box-sizing: inherit; margin: 0px 0px 0px 4px; font-weight: 400; line-height: 1.5; color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; word-break: break-all !important; overflow-wrap: anywhere !important;">(${sampleCard.weight.min} - ${sampleCard.weight.max})</span><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); line-height: 1.43; text-align: right !important; box-sizing: inherit; font-size: 0.9em !important; font-weight: bold !important; margin-left: 4px !important; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${weightResult.color};" data-grade="${weightResult.grade}"> [${weightResult.grade}]</span><span class="stat-detail-row" style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); font-weight: 400; text-align: right !important; box-sizing: inherit; display: inline-block; font-size: 0.8rem; color: rgb(102, 102, 102); line-height: 1.2; margin: 0px; padding: 0px; word-break: break-all !important; overflow-wrap: anywhere !important;"><span style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); text-align: right !important; line-height: 1.2; box-sizing: inherit; word-break: break-all !important; overflow-wrap: anywhere !important; color: ${weightResult.color}; font-size: 0.9em; font-weight: normal; font-style: italic;"> (${weightResult.percentage?.toFixed(1) || '0.0'}%)</span></span>
          </p>
        </div>
        
        <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">속성</p>
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important;">
            ${sampleCard.attribute || '없음'}
          </p>
        </div>
        
        <div style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; font-weight: 400; font-size: 1rem; line-height: 1.5; color: rgba(255, 255, 255, 0.9); white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; display: flex; -webkit-box-pack: justify; justify-content: space-between; align-items: center; word-break: break-all !important; overflow-wrap: anywhere !important; max-height: 70vh !important; overflow-y: auto !important;">
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: nowrap; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; text-align: left; color: white; font-size: 0.75rem; word-break: break-all !important; overflow-wrap: anywhere !important;">어빌리티</p>
          <p style="text-size-adjust: 100%; -webkit-font-smoothing: antialiased; white-space: pre-line; --Paper-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12); box-sizing: inherit; margin: 0px; font-weight: 400; line-height: 1.43; color: white; font-size: 0.75rem; text-align: right !important; word-break: break-all !important; overflow-wrap: anywhere !important; margin-left: 30px;">
            ${sampleCard.abilities || '없음'}
          </p>
        </div>
      </div>
    `;
    
    // 클릭 이벤트 다시 추가 (중복 방지)
    cardElement.removeEventListener('click', this.cardClickHandler);
    this.cardClickHandler = () => {
      this.showEditModal(sampleCard, cardContainer);
    };
    cardElement.addEventListener('click', this.cardClickHandler);
    
    // 기댓값 계산 및 표시
    this.calculateAndDisplayExpectation(sampleCard, equipmentType);
  }

  // 검색 결과로 카드 업데이트
  updateCardWithSearchResult(wikiItemInfo, sampleCard, cardContainer) {
    // 장비 타입 감지
    const equipmentType = detectEquipmentType(wikiItemInfo.name, wikiItemInfo.type);
    
    // 감정 정보 생성
    const appraisedStats = generateAppraisedStats(wikiItemInfo);
    
    // 샘플 카드 데이터 업데이트
    sampleCard.name = wikiItemInfo.name;
    sampleCard.type = wikiItemInfo.type || '장비';
    sampleCard.power = {
      value: appraisedStats.power.value,
      min: appraisedStats.power.min,
      max: appraisedStats.power.max,
      grade: appraisedStats.power.grade,
      color: appraisedStats.power.color,
      percent: appraisedStats.power.percent
    };
    sampleCard.weight = {
      value: appraisedStats.weight.value,
      min: appraisedStats.weight.min,
      max: appraisedStats.weight.max,
      grade: appraisedStats.weight.grade,
      color: appraisedStats.weight.color,
      percent: appraisedStats.weight.percent
    };
    // 속성과 어빌리티 정보 설정
    sampleCard.attribute = formatAttributesInfo(wikiItemInfo);
    sampleCard.abilities = formatAbilitiesInfo(wikiItemInfo);
    
    // generateAppraisedStats에서 이미 계산된 최종태그 정보 사용
    sampleCard.score = `${appraisedStats.final.score} (${appraisedStats.final.tagMinValue}~${appraisedStats.final.tagMaxValue})`;
    sampleCard.scorePercent = appraisedStats.final.tagPercentage?.toFixed(1) || '0.0';
    sampleCard.final = appraisedStats.final.grade;
    sampleCard.finalColor = finalGradeColors[appraisedStats.final.grade] || '#CCCCCC';
    
    // 카드 UI 업데이트
    this.updateCardDisplay(sampleCard, cardContainer);
    
    // 기댓값 계산 및 표시
    this.calculateAndDisplayExpectation(sampleCard, equipmentType);
  }

  // 기댓값 계산 및 표시
  calculateAndDisplayExpectation(sampleCard, equipmentType) {
    const expectationResult = document.getElementById('expectation-result');
    if (!expectationResult) return;
    
    // 장비 타입별 계산 공식
    let scoreFormula;
    if (equipmentType === 'accessory') {
      scoreFormula = (power, weight) => power * 5.5 - weight * 2;
    } else {
      scoreFormula = (power, weight) => power - weight * 2;
    }
    
    // 현재 점수 계산
    const currentScore = scoreFormula(sampleCard.power.value, sampleCard.weight.value);
    
    // 전체 경우의 수 계산 (주사위 두 개)
    const powerRange = sampleCard.power.max - sampleCard.power.min + 1;
    const weightRange = sampleCard.weight.max - sampleCard.weight.min + 1;
    const totalCombinations = powerRange * weightRange;
    
    // 현재 점수 이상의 점수를 가진 경우의 수 계산
    let betterCombinations = 0;
    for (let power = sampleCard.power.min; power <= sampleCard.power.max; power++) {
      for (let weight = sampleCard.weight.min; weight <= sampleCard.weight.max; weight++) {
        const score = scoreFormula(power, weight);
        if (score >= currentScore) {
          betterCombinations++;
        }
      }
    }
    
    // 확률 계산
    const probability = (betterCombinations / totalCombinations) * 100;
    const oneInN = Math.round(totalCombinations / betterCombinations);
    
    // 결과 표시
    expectationResult.innerHTML = `
      <div style="text-align: center; line-height: 1.4;">
        <div style="font-size: 13px; color: #374151; font-style: italic; margin-bottom: 8px;">
          이 옵션 이상의 옵션이 출현할 확률은?
        </div>
        <div style="font-size: 14px; color: #1f2937; margin: 4px 0;">
          <span style="color: #dc2626; font-weight: bold; font-style: italic; font-size: 16px;">${oneInN}</span>개 당 하나꼴<br>
          등장 확률 <span style="color: #dc2626; font-size: 16px;">${probability.toFixed(7)}%</span><br>
          나올 수 있는 총 경우의 수 <span style="color: #dc2626; font-size: 16px;">${totalCombinations}</span>개
        </div>
      </div>
    `;
  }

  // 장비를 찾을 수 없을 때 경고 모달 표시
  showEquipmentNotFoundModal(equipmentName) {
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
      z-index: 10040;
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
        <h3 style="color: #dc2626; margin: 0 0 16px 0;">장비 데이터 없음</h3>
        <p style="margin: 0 0 20px 0; color: #374151;">"${equipmentName}"에 해당하는 장비 데이터가 없습니다.</p>
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