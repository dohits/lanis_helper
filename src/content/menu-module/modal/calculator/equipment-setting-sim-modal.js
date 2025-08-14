import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { JobSelector } from './equipment-setting-sim-modal/selectors/job-selector.js';
import { ElementSelector } from './equipment-setting-sim-modal/selectors/element-selector.js';
import { AbilitySelector } from './equipment-setting-sim-modal/selectors/ability-selector.js';
import { JobAbilitySelector } from './equipment-setting-sim-modal/selectors/job-ability-selector.js';
import { WeaponSelector } from './equipment-setting-sim-modal/selectors/weapon-selector.js';
import { ArmorSelector } from './equipment-setting-sim-modal/selectors/armor-selector.js';
import { AccessorySelector } from './equipment-setting-sim-modal/selectors/accessory-selector.js';
import { InfoBox } from './equipment-setting-sim-modal/ui/info-box.js';
import { UIComponents } from './equipment-setting-sim-modal/ui/ui-components.js';
import { EquipmentSettingAPI } from '../../../../api/googleSheetWrite/equipmentSettingAPI.js';
import { EquipmentSettingLoadAPI } from '../../../../api/googleSheetLoad/equipmentSettingLoadAPI.js';

// 장비 셋팅 시뮬레이션 모달
export class EquipmentSettingSimModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.equipmentSettingSim);
    
    this.jobSelector = new JobSelector();
    this.elementSelector = new ElementSelector();
    this.abilitySelector = new AbilitySelector();
    this.jobAbilitySelector = new JobAbilitySelector();
    this.weaponSelector = new WeaponSelector();
    this.armorSelector = new ArmorSelector();
    this.accessorySelector = new AccessorySelector();
    this.infoBox = new InfoBox();
    
    // 구글 시트 API 초기화
    this.equipmentAPI = new EquipmentSettingAPI();
    this.equipmentLoadAPI = new EquipmentSettingLoadAPI();
    
    // 저장 상태 추적
    this.isSaving = false;
    this.lastSavedData = null;
    
    this.setupCallbacks();
  }

  // 콜백 설정
  setupCallbacks() {
    this.jobSelector.setOnJobSelect((job) => {
      this.infoBox.updateJobInfo(job);
    });

    this.elementSelector.setOnElementSelect((element) => {
      this.infoBox.updateElementInfo(element);
    });

    this.abilitySelector.setOnAbilitySelect((abilities) => {
      this.infoBox.updateAbilityInfo(abilities);
    });

    this.jobAbilitySelector.setOnAbilitySelect((abilities) => {
      this.infoBox.updateJobAbilityInfo(abilities);
    });

    this.weaponSelector.setOnItemSelect((items) => {
      this.infoBox.updateWeaponInfo(items);
    });

    this.armorSelector.setOnItemSelect((items) => {
      this.infoBox.updateArmorInfo(items);
    });

    this.accessorySelector.setOnItemSelect((items) => {
      this.infoBox.updateAccessoryInfo(items);
    });

    // JobSelector와 JobAbilitySelector 연결
    this.jobSelector.setJobAbilitySelector(this.jobAbilitySelector);

    // 정보 박스 클릭 이벤트 연결
    this.infoBox.setOnJobClick(() => {
      this.jobSelector.openJobSelectionModal();
    });

    this.infoBox.setOnElementClick(() => {
      this.elementSelector.openElementSelectionModal();
    });

    this.infoBox.setOnAbilityClick(() => {
      this.abilitySelector.openAbilitySelectionModal();
    });

    this.infoBox.setOnJobAbilityClick(() => {
      this.jobAbilitySelector.openJobAbilitySelectionModal();
    });

    this.infoBox.setOnWeaponClick(() => {
      this.weaponSelector.openWeaponSelectionModal();
    });

    this.infoBox.setOnArmorClick(() => {
      this.armorSelector.openArmorSelectionModal();
    });

    this.infoBox.setOnAccessoryClick(() => {
      this.accessorySelector.openAccessorySelectionModal();
    });
  }

  // 모달 열기 (오버라이드)
  open() {
    super.open();
    
    // 모달 바디 패딩을 16px로 설정
    if (this.body) {
      this.body.style.padding = '16px';
    }
    
    this.createContent();
    this.preloadData();
  }

  // 모달 콘텐츠 생성
  createContent() {
    // 탭 구조 생성
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 0px;
      padding: 0px;
      min-height: 400px;
      max-height: calc(90vh - 120px);
    `;

    // 토글 버튼 섹션
    const toggleSection = document.createElement('div');
    toggleSection.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    // 토글 버튼들 생성
    const buttons = [
      { id: 'tab1', text: '추천 셋팅', active: true },
      { id: 'tab2', text: '셋팅 만들기', active: false },
      { id: 'tab3', text: '탭3', active: false }
    ];

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #007bff;
        background: ${button.active ? '#007bff' : 'white'};
        color: ${button.active ? 'white' : '#007bff'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;
      
      btn.addEventListener('click', () => {
        this.switchTab(button.id);
      });
      
      toggleSection.appendChild(btn);
    });

    container.appendChild(toggleSection);

    // 콘텐츠 영역
    this.contentArea = document.createElement('div');
    this.contentArea.id = 'equipment-content-area';
    this.contentArea.style.cssText = `
      flex: 1;
      min-height: 300px;
      overflow-y: auto;
    `;
    container.appendChild(this.contentArea);

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);

    // 초기 탭 설정
    this.currentTab = 'tab1';
    this.showTabContent('tab1');
  }

  // 탭 전환
  async switchTab(tabId) {
    // 모든 버튼 비활성화
    const buttons = document.querySelectorAll('#tab1, #tab2, #tab3');
    buttons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#007bff';
    });

    // 선택된 버튼 활성화
    const selectedBtn = document.getElementById(tabId);
    if (selectedBtn) {
      selectedBtn.style.background = '#007bff';
      selectedBtn.style.color = 'white';
    }

    // 콘텐츠 전환
    this.currentTab = tabId;
    await this.showTabContent(tabId);
  }

  // 탭 콘텐츠 표시
  async showTabContent(tabId) {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = '';

    switch (tabId) {
      case 'tab1':
        await this.showTab1Content();
        break;
      case 'tab2':
        this.showTab2Content();
        break;
      case 'tab3':
        this.showTab3Content();
        break;
    }
  }

  // 탭1 콘텐츠 (추천 셋팅)
  async showTab1Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      max-height: 70vh;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 로딩 상태 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    loadingDiv.textContent = '추천 셋팅을 불러오는 중...';
    content.appendChild(loadingDiv);

    // contentArea에 content 추가
    this.contentArea.appendChild(content);

    try {
      // 구글 시트에서 추천 셋팅 데이터 가져오기
      const result = await this.equipmentLoadAPI.getAllSettings();
      
      // 데이터 안전성 검사
      if (result && result.success && result.data && Array.isArray(result.data.settings) && result.data.settings.length > 0) {
        // 로딩 상태 제거
        content.removeChild(loadingDiv);
        
        // 추천 셋팅 목록 생성
        const settingsList = document.createElement('div');
        settingsList.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 4px;
        `;

        // 데이터는 이미 최신순으로 정렬되어 있음 (API에서 역순으로 처리)
        const settings = result.data.settings;

        // 각 셋팅을 아코디언으로 표시
        for (let i = 0; i < settings.length; i++) {
          const setting = settings[i];
          // 행 인덱스는 헤더(1행) + 데이터 시작 행(2행) + 정렬된 인덱스
          const rowIndex = 2 + i;
          const accordion = this.createSettingAccordion(setting, rowIndex);
          settingsList.appendChild(accordion);
        }

        content.appendChild(settingsList);

        // 데이터 개수 표시
        const countInfo = document.createElement('div');
        countInfo.style.cssText = `
          text-align: center;
          padding: 16px 12px;
          color: #6b7280;
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
          margin-top: 16px;
          background: #f9fafb;
          border-radius: 0 0 8px 8px;
        `;
        countInfo.textContent = `총 ${result.data.totalCount || settings.length}개의 추천 셋팅`;
        content.appendChild(countInfo);

      } else {
        // 데이터가 없거나 오류인 경우
        loadingDiv.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">아직 추천 셋팅이 없습니다</div>
            <div style="font-size: 14px; color: #6b7280;">첫 번째 셋팅을 만들어보세요!</div>
          </div>
        `;
        loadingDiv.style.padding = '60px 20px';
      }

    } catch (error) {
      console.error('[EquipmentSettingSimModal] 추천 셋팅 로드 중 오류:', error);
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc2626;">추천 셋팅을 불러오는 중 오류가 발생했습니다</div>
          <div style="font-size: 14px; color: #6b7280;">잠시 후 다시 시도해주세요</div>
        </div>
      `;
      loadingDiv.style.padding = '60px 20px';
    }
  }

  // 셋팅 아코디언 생성
  createSettingAccordion(setting, rowIndex) {
    // 아코디언 헤더 (좌측: 장비 세트 이름, 우측: 닉네임)
    const headerTitle = `${setting.setName || '무제'} | ${setting.nickname || '익명'}`;
    
    // 아코디언 콘텐츠
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
    `;

    // 기본 정보 표시
    const basicInfo = document.createElement('div');
    basicInfo.style.cssText = `
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      font-size: 13px;
      color: #1f2937;
    `;

    // 기본 정보 내용
    const basicInfoContent = document.createElement('div');
    basicInfoContent.style.cssText = `
      color: #1f2937;
    `;
    basicInfoContent.innerHTML = `
      <div style="margin-bottom: 6px;"><strong>직업:</strong> ${setting.job || '-'}</div>
      <div style="margin-bottom: 6px;"><strong>속성:</strong> ${setting.element || '-'}</div>
      <div style="margin-bottom: 6px;"><strong>메인 어빌리티:</strong> ${setting.mainAbility || '-'}</div>
      <div style="margin-bottom: 6px;"><strong>직업 어빌리티:</strong> ${setting.jobAbility || '-'}</div>
      <div style="margin-bottom: 6px;"><strong>저장 시간:</strong> ${setting.saveTime || '-'}</div>
    `;

    basicInfo.appendChild(basicInfoContent);
    content.appendChild(basicInfo);

    // 무기 상세 정보
    if (setting.weapon || setting.weaponAttribute || setting.weaponPower || setting.weaponWeight || setting.weaponAbility) {
      const weaponInfo = document.createElement('div');
      weaponInfo.style.cssText = `
        padding: 12px;
        background: #f0f9ff;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
        font-size: 13px;
        color: #1f2937;
        word-break: break-word;
      `;
      weaponInfo.innerHTML = `
        <div style="margin-bottom: 6px;"><strong>⚔️ 무기:</strong> ${setting.weapon || '-'}</div>
        <div style="margin-bottom: 4px; font-size: 12px;"><strong>속성:</strong> ${setting.weaponAttribute || '-'} | <strong>위력:</strong> ${setting.weaponPower || '-'} | <strong>무게:</strong> ${setting.weaponWeight || '-'}</div>
        <div style="font-size: 12px;"><strong>어빌리티:</strong> ${setting.weaponAbility || '-'}</div>
      `;
      content.appendChild(weaponInfo);
    }

    // 방어구 상세 정보
    if (setting.armor || setting.armorAttribute || setting.armorPower || setting.armorWeight || setting.armorAbility) {
      const armorInfo = document.createElement('div');
      armorInfo.style.cssText = `
        padding: 12px;
        background: #fef3c7;
        border-radius: 8px;
        border-left: 4px solid #f59e0b;
        font-size: 13px;
        color: #1f2937;
        word-break: break-word;
      `;
      armorInfo.innerHTML = `
        <div style="margin-bottom: 6px;"><strong>🛡️ 방어구:</strong> ${setting.armor || '-'}</div>
        <div style="margin-bottom: 4px; font-size: 12px;"><strong>속성:</strong> ${setting.armorAttribute || '-'} | <strong>위력:</strong> ${setting.armorPower || '-'} | <strong>무게:</strong> ${setting.armorWeight || '-'}</div>
        <div style="font-size: 12px;"><strong>어빌리티:</strong> ${setting.armorAbility || '-'}</div>
      `;
      content.appendChild(armorInfo);
    }

    // 장신구 상세 정보
    if (setting.accessory || setting.accessoryAttribute || setting.accessoryPower || setting.accessoryWeight || setting.accessoryAbility) {
      const accessoryInfo = document.createElement('div');
      accessoryInfo.style.cssText = `
        padding: 12px;
        background: #f3e8ff;
        border-radius: 8px;
        border-left: 4px solid #8b5cf6;
        font-size: 13px;
        color: #1f2937;
        word-break: break-word;
      `;
      accessoryInfo.innerHTML = `
        <div style="margin-bottom: 6px;"><strong>💎 장신구:</strong> ${setting.accessory || '-'}</div>
        <div style="margin-bottom: 4px; font-size: 12px;"><strong>속성:</strong> ${setting.accessoryAttribute || '-'} | <strong>위력:</strong> ${setting.accessoryPower || '-'} | <strong>무게:</strong> ${setting.accessoryWeight || '-'}</div>
        <div style="font-size: 12px;"><strong>어빌리티:</strong> ${setting.accessoryAbility || '-'}</div>
      `;
      content.appendChild(accessoryInfo);
    }

    // 설명이 있는 경우 표시
    if (setting.setDescription && setting.setDescription.trim()) {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.style.cssText = `
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #10b981;
        font-size: 13px;
        line-height: 1.5;
        color: #1f2937;
        word-break: break-word;
      `;
      descriptionDiv.innerHTML = `<strong>📝 설명:</strong> ${setting.setDescription}`;
      content.appendChild(descriptionDiv);
    }

    // 추천인 정보와 추천 버튼
    const recommendSection = document.createElement('div');
    recommendSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
      font-size: 13px;
      color: #1f2937;
    `;

    // 추천인 정보
    const recommendersInfo = document.createElement('div');
    recommendersInfo.style.cssText = `
      word-break: break-word;
    `;
    
    if (setting.recommenders && setting.recommenders.trim()) {
      const recommenderList = setting.recommenders.split('/').map(r => r.trim()).filter(r => r);
      recommendersInfo.innerHTML = `
        <div style="margin-bottom: 4px;"><strong>👍 추천인:</strong> ${recommenderList.join(', ')}</div>
        <div style="font-size: 11px; color: #6b7280;">총 ${recommenderList.length}명이 추천</div>
      `;
    } else {
      recommendersInfo.innerHTML = `
        <div style="margin-bottom: 4px;"><strong>👍 추천인:</strong> 아직 추천이 없습니다</div>
        <div style="font-size: 11px; color: #6b7280;">첫 번째 추천자가 되어보세요!</div>
      `;
    }

    // 추천 버튼
    const recommendButton = document.createElement('button');
    recommendButton.textContent = '추천하기';
    recommendButton.style.cssText = `
      padding: 10px 16px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      align-self: flex-start;
      min-width: 80px;
      white-space: nowrap;
    `;

    // 추천 버튼 클릭 이벤트
    recommendButton.addEventListener('click', async () => {
      try {
        recommendButton.disabled = true;
        recommendButton.textContent = '추천 중...';
        recommendButton.style.background = '#9ca3af';

        // 현재 사용자 닉네임 가져오기 (설정에서)
        const currentUserName = this.getCurrentUserName();
        
        if (!currentUserName) {
          alert('Lanis 로그인을 해 주세요.');
          recommendButton.disabled = false;
          recommendButton.textContent = '추천하기';
          recommendButton.style.background = '#ef4444';
          return;
        }

        // 추천 API 호출
        const equipmentSettingAPI = new EquipmentSettingAPI();
        const result = await equipmentSettingAPI.recommendSetting(currentUserName, rowIndex);

        if (result && result.success) {
          alert('추천이 성공적으로 추가되었습니다!');
          // 추천인 정보 업데이트
          if (setting.recommenders && setting.recommenders.trim()) {
            setting.recommenders = `${setting.recommenders}/${currentUserName}`;
          } else {
            setting.recommenders = currentUserName;
          }
          
          // UI 업데이트
          const recommenderList = setting.recommenders.split('/').map(r => r.trim());
          recommendersInfo.innerHTML = `
            <div style="margin-bottom: 4px;"><strong>👍 추천인:</strong> ${recommenderList.join(', ')}</div>
            <div style="font-size: 11px; color: #6b7280;">총 ${recommenderList.length}명이 추천</div>
          `;
          
          recommendButton.textContent = '추천됨';
          recommendButton.style.background = '#10b981';
          recommendButton.disabled = true;
        } else {
          const errorMessage = result && result.error ? result.error : '추천 처리 중 오류가 발생했습니다.';
          alert(`추천 실패: ${errorMessage}`);
          recommendButton.disabled = false;
          recommendButton.textContent = '추천하기';
          recommendButton.style.background = '#ef4444';
        }
      } catch (error) {
        console.error('추천 처리 중 오류:', error);
        alert('추천 처리 중 오류가 발생했습니다.');
        recommendButton.disabled = false;
        recommendButton.textContent = '추천하기';
        recommendButton.style.background = '#ef4444';
      }
    });

    // 호버 효과
    recommendButton.addEventListener('mouseenter', () => {
      if (!recommendButton.disabled) {
        recommendButton.style.background = '#dc2626';
      }
    });

    recommendButton.addEventListener('mouseleave', () => {
      if (!recommendButton.disabled) {
        recommendButton.style.background = '#ef4444';
      }
    });

    recommendSection.appendChild(recommendersInfo);
    recommendSection.appendChild(recommendButton);
    content.appendChild(recommendSection);

    // 아코디언 생성
    return UIComponents.createAccordion(headerTitle, content, false);
  }

  // 탭2 콘텐츠 (셋팅 만들기)
  showTab2Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 100%;
      overflow-x: hidden;
    `;

    // 장비 세트 정보 아코디언
    const setInfoContent = document.createElement('div');
    
    // 장비 세트 이름 입력
    const setNameInput = UIComponents.createTextInput(
      '장비 세트 이름',
      '예: 검술 바람 세트, 마법사 얼음 세트...',
      false
    );
    setNameInput.input.id = 'equipment-set-name';
    setInfoContent.appendChild(setNameInput.container);
    
    // 장비 세트 설명 입력
    const setDescInput = UIComponents.createTextInput(
      '장비 세트 설명',
      '이 세트의 특징이나 사용법을 자유롭게 작성해주세요...',
      true,
      4
    );
    setDescInput.input.id = 'equipment-set-description';
    setInfoContent.appendChild(setDescInput.container);
    
    const setInfoAccordion = UIComponents.createAccordion(
      '📝 장비 세트 정보',
      setInfoContent,
      true // 기본적으로 열려있음
    );
    content.appendChild(setInfoAccordion);

    // 정보 박스
    const infoBox = this.infoBox.createInfoBox();
    content.appendChild(infoBox);

    // 저장 버튼 섹션
    const saveSection = document.createElement('div');
    saveSection.style.cssText = `
      display: flex;
      justify-content: center;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      margin-top: 16px;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 셋팅 저장하기';
    saveButton.setAttribute('data-action', 'save-setting');
    saveButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 호버 효과
    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.transform = 'translateY(-2px)';
      saveButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
    });

    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.transform = 'translateY(0)';
      saveButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    });

    // 클릭 이벤트
    saveButton.addEventListener('click', () => {
      this.saveCurrentSetting();
    });

    saveSection.appendChild(saveButton);
    content.appendChild(saveSection);

    this.contentArea.appendChild(content);
  }

  // 탭3 콘텐츠 (향후 구현)
  showTab3Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 100%;
      overflow-x: hidden;
    `;

    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 14px;
    `;
    placeholder.innerHTML = '탭3 콘텐츠 (향후 구현)';

    content.appendChild(placeholder);
    this.contentArea.appendChild(content);
  }

  // 데이터 사전 로드
  async preloadData() {
    try {
      // 어빌리티 데이터 로드
      await this.abilitySelector.loadAbilities();
      this.jobAbilitySelector.setData(this.abilitySelector.data);
    } catch (error) {
      console.error('데이터 로드 중 오류:', error);
    }
  }

  // 현재 셋팅 저장
  async saveCurrentSetting() {
    // 이미 저장 중인 경우 중복 요청 방지
    if (this.isSaving) {
      this.showNotification('⏳ 이미 저장 중입니다. 잠시만 기다려주세요.', 'info');
      return;
    }

    try {
      // 저장 상태 시작
      this.isSaving = true;

      // 저장 버튼 비활성화 및 로딩 상태 표시
      const saveButton = document.querySelector('button[data-action="save-setting"]');
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '⏳ 저장 중...';
      }

      // 장비 세트 정보 가져오기
      const setNameInput = document.getElementById('equipment-set-name');
      const setDescInput = document.getElementById('equipment-set-description');
      
      const setName = setNameInput ? setNameInput.value.trim() : '';
      const setDescription = setDescInput ? setDescInput.value.trim() : '';

      // 유효성 검사
      const validationErrors = [];

      // 장비 세트 이름 검사
      if (!setName) {
        validationErrors.push('장비 세트 이름을 입력해주세요.');
      }

      // 직업 선택 검사
      const selectedJob = this.jobSelector.getSelectedJob();
      if (!selectedJob) {
        validationErrors.push('직업을 선택해주세요.');
      }

      // 속성 선택 검사
      const selectedElement = this.elementSelector.getSelectedElement();
      if (!selectedElement) {
        validationErrors.push('속성을 선택해주세요.');
      }

      // 메인 어빌리티 선택 검사
      const selectedMainAbilities = this.abilitySelector.getSelectedAbilities();
      if (!selectedMainAbilities || selectedMainAbilities.length === 0) {
        validationErrors.push('메인 어빌리티를 선택해주세요.');
      }

      // 직업 어빌리티 선택 검사
      const selectedJobAbilities = this.jobAbilitySelector.getSelectedAbilities();
      if (!selectedJobAbilities || selectedJobAbilities.length === 0) {
        validationErrors.push('직업 어빌리티를 선택해주세요.');
      }

      // 무기 선택 검사
      const selectedWeapons = this.weaponSelector.getSelectedItems();
      if (!selectedWeapons || selectedWeapons.length === 0) {
        validationErrors.push('무기를 선택해주세요.');
      }

      // 방어구 선택 검사
      const selectedArmors = this.armorSelector.getSelectedItems();
      if (!selectedArmors || selectedArmors.length === 0) {
        validationErrors.push('방어구를 선택해주세요.');
      }

      // 장신구 선택 검사
      const selectedAccessories = this.accessorySelector.getSelectedItems();
      if (!selectedAccessories || selectedAccessories.length === 0) {
        validationErrors.push('장신구를 선택해주세요.');
      }

      // 유효성 검사 실패 시
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.join('\n');
        this.showNotification(`❌ 다음 항목을 확인해주세요:\n${errorMessage}`, 'error');
        return;
      }

      // 현재 선택된 데이터 수집
      const settingData = {
        userId: 'anonymous', // 익명 사용자
        userName: this.getUserNickname() || '익명 사용자',
        setName: setName,
        setDescription: setDescription,
        job: selectedJob,
        element: selectedElement,
        mainAbility: selectedMainAbilities,
        jobAbility: selectedJobAbilities,
        weapon: selectedWeapons,
        armor: selectedArmors,
        accessory: selectedAccessories,
        notes: `저장 시간: ${new Date().toLocaleString('ko-KR')}`
      };

      // 이전 저장 데이터와 비교 (시간 제외)
      if (this.lastSavedData && this.isSameData(settingData, this.lastSavedData)) {
        this.showNotification('⚠️ 동일한 데이터가 이미 저장되어 있습니다.', 'info');
        return;
      }

      // 셋팅 저장
      const saveResult = await this.equipmentAPI.saveEquipmentSetting(settingData);
      
      if (saveResult.success) {
        // 성공 시 마지막 저장 데이터 업데이트
        this.lastSavedData = settingData;
        
        // 성공 메시지 표시
        this.showNotification('✅ 셋팅이 성공적으로 저장되었습니다!', 'success');
        console.log('셋팅 저장 성공:', saveResult.data);
      } else {
        // 실패 메시지 표시
        this.showNotification(`❌ 저장 실패: ${saveResult.error}`, 'error');
        console.error('셋팅 저장 실패:', saveResult.error);
      }

    } catch (error) {
      // 에러 메시지 표시
      this.showNotification(`❌ 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
      console.error('셋팅 저장 중 오류:', error);
    } finally {
      // 저장 상태 종료
      this.isSaving = false;
      
      // 저장 버튼 상태 복원
      const saveButton = document.querySelector('button[data-action="save-setting"]');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = '💾 셋팅 저장하기';
      }
    }
  }

  // 데이터 비교 함수 (시간 제외)
  isSameData(data1, data2) {
    // 비교할 필드들 (notes는 시간이 포함되므로 제외)
    const fieldsToCompare = [
      'setName', 'setDescription', 'job', 'element', 
      'mainAbility', 'jobAbility', 'weapon', 'armor', 'accessory'
    ];

    for (const field of fieldsToCompare) {
      const val1 = data1[field];
      const val2 = data2[field];

      // 배열 비교
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        
        // 배열 내 객체 비교 (name 속성 기준)
        for (let i = 0; i < val1.length; i++) {
          const item1 = val1[i];
          const item2 = val2[i];
          
          if (typeof item1 === 'object' && typeof item2 === 'object') {
            const name1 = item1.name || item1['어빌리티명'] || '';
            const name2 = item2.name || item2['어빌리티명'] || '';
            if (name1 !== name2) return false;
          } else if (item1 !== item2) {
            return false;
          }
        }
      }
      // 객체 비교 (name 속성 기준)
      else if (typeof val1 === 'object' && typeof val2 === 'object') {
        const name1 = val1.name || '';
        const name2 = val2.name || '';
        if (name1 !== name2) return false;
      }
      // 기본 값 비교
      else if (val1 !== val2) {
        return false;
      }
    }

    return true;
  }

  // 사용자 닉네임 가져오기
  getUserNickname() {
    try {
      // DOMModulesManager를 통해 저장된 닉네임 가져오기
      if (window.lanisHelper && window.lanisHelper.domModulesManager) {
        return window.lanisHelper.domModulesManager.getCurrentNickname();
      }
      
      // 직접 세션 스토리지에서 가져오기
      return sessionStorage.getItem('lanis_user_nickname');
    } catch (error) {
      console.error('[EquipmentSettingSimModal] 닉네임 가져오기 중 오류:', error);
      return null;
    }
  }

  // 현재 사용자 닉네임 가져오기
  getCurrentUserName() {
    // 닉네임 체커에서 저장한 닉네임을 가져오기 (세션 스토리지)
    const savedUserName = sessionStorage.getItem('lanis_user_nickname');
    return savedUserName || '';
  }

  // 알림 메시지 표시
  showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.equipment-setting-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'equipment-setting-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      max-width: 350px;
      word-wrap: break-word;
      white-space: pre-line;
      line-height: 1.4;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // 타입에 따른 스타일 설정
    if (type === 'success') {
      notification.style.background = '#10b981';
      notification.style.color = 'white';
    } else if (type === 'error') {
      notification.style.background = '#ef4444';
      notification.style.color = 'white';
    } else {
      notification.style.background = '#3b82f6';
      notification.style.color = 'white';
    }

    notification.textContent = message;

    // 애니메이션 CSS 추가
    if (!document.querySelector('#equipment-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'equipment-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // 5초 후 자동 제거 (에러 메시지는 8초)
    const autoRemoveTime = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, autoRemoveTime);

    // 클릭으로 제거
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    });
  }

  // 모달 닫기 (오버라이드)
  close() {
    super.close();
  }
}
