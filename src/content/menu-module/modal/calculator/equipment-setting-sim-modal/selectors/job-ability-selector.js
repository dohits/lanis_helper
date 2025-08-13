import { BaseAbilitySelector } from './base-ability-selector.js';
import { UIComponents } from '../ui/ui-components.js';

// 직업 어빌리티 선택 관리 클래스
export class JobAbilitySelector extends BaseAbilitySelector {
  constructor() {
    super();
    this.selectedJob = null; // 선택된 직업
  }

  // 직업 설정 (JobSelector에서 호출됨)
  setSelectedJob(job) {
    this.selectedJob = job;
    // 직업이 변경되면 선택된 어빌리티 초기화
    this.selectedAbility = null;
  }

  // 선택된 직업 이름 가져오기
  getSelectedJobName() {
    return this.selectedJob ? (typeof this.selectedJob === 'string' ? this.selectedJob : this.selectedJob.name) : null;
  }


  // 직업 어빌리티 선택 버튼 생성
  createJobAbilityButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const button = UIComponents.createButton('직업 어빌리티 선택하기', '🎯', 'primary', () => {
      this.openJobAbilitySelectionModal();
    });

    buttonContainer.appendChild(button);
    return buttonContainer;
  }

  // 직업 어빌리티 선택 모달 열기
  openJobAbilitySelectionModal() {
    // 직업이 선택되지 않았으면 경고 모달 표시
    if (!this.getSelectedJobName()) {
      this.showJobWarningModal();
      return;
    }

    // 데이터가 없으면 경고 모달 표시
    if (!this.data) {
      this.showDataWarningModal();
      return;
    }

    // 직업 어빌리티 모달 열기
    const abilityModal = this.createJobAbilitySelectionModal();
    document.body.appendChild(abilityModal);
  }

  // 직업 미선택 경고 모달
  showJobWarningModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '400px'
    });

    // 헤더
    const header = UIComponents.createModalHeader('직업 선택 필요', '⚠️', () => {
      this.closeModal(modal);
    });

    // 경고 메시지
    const warningMessage = document.createElement('div');
    warningMessage.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    `;

    const warningIcon = document.createElement('div');
    warningIcon.style.cssText = `
      font-size: 48px;
      margin-bottom: 20px;
    `;
    warningIcon.textContent = '⚠️';

    const warningTitle = document.createElement('h3');
    warningTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #f59e0b;
    `;
    warningTitle.textContent = '직업을 먼저 선택해주세요';

    const warningDescription = document.createElement('p');
    warningDescription.style.cssText = `
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    warningDescription.textContent = '직업 어빌리티를 선택하기 전에 먼저 직업을 선택해주세요.';

    const okButton = document.createElement('button');
    okButton.style.cssText = `
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s ease;
    `;
    okButton.textContent = '확인';
    okButton.onclick = () => {
      this.closeModal(modal);
    };

    warningMessage.appendChild(warningIcon);
    warningMessage.appendChild(warningTitle);
    warningMessage.appendChild(warningDescription);
    warningMessage.appendChild(okButton);

    content.appendChild(header);
    content.appendChild(warningMessage);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    document.body.appendChild(modal);
  }

  // 데이터 없음 경고 모달
  showDataWarningModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '400px'
    });

    // 헤더
    const header = UIComponents.createModalHeader('데이터 없음', '❌', () => {
      this.closeModal(modal);
    });

    // 경고 메시지
    const warningMessage = document.createElement('div');
    warningMessage.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    `;

    const warningIcon = document.createElement('div');
    warningIcon.style.cssText = `
      font-size: 48px;
      margin-bottom: 20px;
    `;
    warningIcon.textContent = '❌';

    const warningTitle = document.createElement('h3');
    warningTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #dc2626;
    `;
    warningTitle.textContent = '어빌리티 데이터가 없습니다';

    const warningDescription = document.createElement('p');
    warningDescription.style.cssText = `
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    warningDescription.textContent = '어빌리티 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.';

    const okButton = document.createElement('button');
    okButton.style.cssText = `
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s ease;
    `;
    okButton.textContent = '확인';
    okButton.onclick = () => {
      this.closeModal(modal);
    };

    warningMessage.appendChild(warningIcon);
    warningMessage.appendChild(warningTitle);
    warningMessage.appendChild(warningDescription);
    warningMessage.appendChild(okButton);

    content.appendChild(header);
    content.appendChild(warningMessage);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    document.body.appendChild(modal);
  }

  // 직업 어빌리티 선택 모달 생성
  createJobAbilitySelectionModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '900px'
    });

    // 헤더
    const header = UIComponents.createModalHeader(`${this.getSelectedJobName()} 어빌리티 선택`, '🎯', () => {
      this.closeModal(modal);
    });

    // 설명
    const description = document.createElement('p');
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    description.textContent = `선택된 직업 "${this.getSelectedJobName()}"의 어빌리티를 선택해주세요. (아이템 전용 어빌리티 제외)`;

    // 어빌리티 그리드
    const abilityGrid = document.createElement('div');
    abilityGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    `;

    // 직업별 어빌리티 카드들 생성
    this.createJobAbilityCards(abilityGrid, modal);

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(abilityGrid);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  // 직업별 어빌리티 카드들 생성
  createJobAbilityCards(container, modal) {
    container.innerHTML = '';

    if (!this.data) {
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #666;
      `;
      loadingDiv.textContent = '데이터를 불러오는 중...';
      container.appendChild(loadingDiv);
      return;
    }

    // 선택된 직업의 어빌리티만 필터링
    const jobAbilities = this.data.filter(ability => ability['직업'] === this.getSelectedJobName());

    if (jobAbilities.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #666;
      `;
      noDataDiv.textContent = `"${this.getSelectedJobName()}" 직업의 어빌리티가 없습니다.`;
      container.appendChild(noDataDiv);
      return;
    }

    jobAbilities.forEach(ability => {
      const isSelected = this.selectedAbility === ability['어빌리티명'];
      const card = this.createAbilityCard(ability, modal, isSelected);
      
      // 클릭 이벤트
      card.addEventListener('click', () => {
        this.selectAbility(ability['어빌리티명'], card, card.checkmark, modal);
      });
      
      container.appendChild(card);
    });
  }
}
