import { JOBS } from '../data/data.js';
import { UIComponents } from '../ui/ui-components.js';

// 직업 선택 관리 클래스
export class JobSelector {
  constructor() {
    this.selectedJob = null;
    this.onJobSelect = null;
    this.jobAbilitySelector = null; // JobAbilitySelector 참조
  }

  // 직업 선택 버튼 생성
  createJobButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const button = UIComponents.createButton('직업 선택하기', '🎭', 'primary', () => {
      this.openJobSelectionModal();
    });

    buttonContainer.appendChild(button);
    return buttonContainer;
  }

  // 직업 선택 모달 열기
  openJobSelectionModal() {
    const jobModal = this.createJobSelectionModal();
    document.body.appendChild(jobModal);
  }

  // 직업 선택 모달 생성
  createJobSelectionModal() {
    const { modal, content } = UIComponents.createModal();

    // 헤더
    const header = UIComponents.createModalHeader('직업 선택', '🎭', () => {
      this.closeJobSelectionModal(modal);
    });

    // 설명
    const description = document.createElement('p');
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    `;
    description.textContent = '장비 셋팅 시뮬레이션을 위한 직업을 선택해주세요.';

    // 직업 그리드
    const jobGrid = document.createElement('div');
    jobGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    `;

    JOBS.forEach(job => {
      const { card, checkmark } = UIComponents.createCard(job, {
        description: `${job.name} 직업 장비 셋팅`
      });

      // 카드 참조 저장
      card.setAttribute('data-job-id', job.id);
      card.jobId = job.id;
      card.checkmark = checkmark;

      // 클릭 이벤트
      card.addEventListener('click', () => {
        this.selectJob(job.id);
        this.closeJobSelectionModal(modal);
      });

      jobGrid.appendChild(card);
    });

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(jobGrid);

    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeJobSelectionModal(modal);
      }
    });

    return modal;
  }

  // 직업 선택 모달 닫기
  closeJobSelectionModal(modal) {
    const content = modal.querySelector('div');
    modal.style.opacity = '0';
    content.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // 직업 선택
  selectJob(jobId) {
    // 이전 선택 해제
    if (this.selectedJob) {
      const prevCard = document.querySelector(`[data-job-id="${this.selectedJob}"]`);
      if (prevCard) {
        prevCard.style.borderColor = '#e5e7eb';
        prevCard.style.transform = 'translateY(0)';
        prevCard.style.boxShadow = 'none';
        prevCard.checkmark.style.display = 'none';
      }
    }

    // 새 선택 적용
    this.selectedJob = jobId;
    const newCard = document.querySelector(`[data-job-id="${jobId}"]`);
    if (newCard) {
      const selectedJob = JOBS.find(j => j.id === jobId);
      newCard.style.borderColor = selectedJob.color;
      newCard.style.transform = 'translateY(-2px)';
      newCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      newCard.checkmark.style.display = 'flex';
    }

    // 선택된 직업 객체 가져오기
    const selectedJob = JOBS.find(j => j.id === jobId);

    // 콜백 호출 (job 객체 전달)
    if (this.onJobSelect) {
      this.onJobSelect(selectedJob);
    }

    // JobAbilitySelector에 직업 변경 알림
    if (this.jobAbilitySelector) {
      this.jobAbilitySelector.setSelectedJob(selectedJob);
    }

    
  }

  // 정보 박스 업데이트
  updateInfoBox(jobId) {
    const jobDisplay = document.getElementById('selected-job-display');
    const jobIcon = document.querySelector('.job-info-icon');
    
    if (jobDisplay && jobIcon) {
      const selectedJob = JOBS.find(j => j.id === jobId);
      if (selectedJob) {
        jobDisplay.textContent = selectedJob.name;
        jobIcon.textContent = selectedJob.icon;
        jobIcon.style.background = `${selectedJob.color}20`;
      }
    }
  }

  // 선택된 직업 정보 반환
  getSelectedJob() {
    return this.selectedJob ? JOBS.find(j => j.id === this.selectedJob) : null;
  }

  // 직업 선택 콜백 설정
  setOnJobSelect(callback) {
    this.onJobSelect = callback;
  }

  // JobAbilitySelector 설정
  setJobAbilitySelector(jobAbilitySelector) {
    this.jobAbilitySelector = jobAbilitySelector;
  }
}
