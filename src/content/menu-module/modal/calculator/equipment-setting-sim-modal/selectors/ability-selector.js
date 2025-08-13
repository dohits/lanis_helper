import { BaseAbilitySelector } from './base-ability-selector.js';
import { UIComponents } from '../ui/ui-components.js';
import AbilityInfoAPI from '../../../../../../api/googleSheetLoad/abilityInfoAPI.js';

// 메인 어빌리티 선택 관리 클래스
export class AbilitySelector extends BaseAbilitySelector {
  constructor() {
    super();
  }

  // 어빌리티 데이터 로드
  async loadAbilities() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      // 직접 API 호출 (ability-info-modal.js 방식)
      const abilityAPI = new AbilityInfoAPI();
      const result = await abilityAPI.fetchAbilityInfo();
      
      if (result && result.success && result.data) {
        this.data = result.data;
        
        // 직업이 "장비"인 어빌리티와 아이템 전용 어빌리티 제외하고 필터링
        this.data = this.data.filter(ability => {
          // 직업이 "장비"인 경우 제외
          if (ability['직업'] === '장비') {
            return false;
          }
          
          const effect = ability['효과'] || '';
          const weaponEffect = ability['무기 타입 효과'] || '';
          const combinedEffect = `${effect} ${weaponEffect}`;
          
          // 아이템 전용 어빌리티 키워드들
          const itemOnlyKeywords = [
            '아이템 전용', '장비 전용', '무기 전용', '방어구 전용',
            '검 전용', '방패 전용', '갑옷 전용', '신발 전용'
          ];
          
          // 아이템 전용이면 제외
          const isItemOnly = itemOnlyKeywords.some(keyword => 
            combinedEffect.toLowerCase().includes(keyword.toLowerCase())
          );
          
          return !isItemOnly;
        });

        console.log(`로드된 어빌리티: ${this.data.length}개`);
      } else {
        console.error('어빌리티 데이터 로드 실패:', result?.error);
      }
    } catch (error) {
      console.error('어빌리티 데이터 로드 중 오류:', error);
    } finally {
      this.isLoading = false;
    }
  }



  // 어빌리티 선택 버튼 생성
  createAbilityButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const button = UIComponents.createButton('메인 어빌리티 선택하기', '💫', 'primary', () => {
      this.openAbilitySelectionModal();
    });

    buttonContainer.appendChild(button);
    return buttonContainer;
  }

  // 어빌리티 선택 모달 열기
  async openAbilitySelectionModal() {
    // 데이터가 이미 로드되어 있으면 바로 모달 열기
    if (this.data) {
      const abilityModal = this.createAbilitySelectionModal();
      document.body.appendChild(abilityModal);
      return;
    }

    // 스켈레톤 모달 열기
    const skeletonModal = this.createSkeletonModal('메인 어빌리티 선택', '장비 셋팅 시뮬레이션을 위한 메인 어빌리티를 선택해주세요. (아이템 전용 어빌리티 제외)');
    document.body.appendChild(skeletonModal);

    // 로딩 중이면 데이터 로딩 완료를 기다림
    if (this.isLoading) {
      this.waitForDataLoad(skeletonModal);
      return;
    }

    // 데이터가 로드되지 않았다면 데이터 로드
    try {
      await this.loadAbilities();
      // 데이터 로드 완료 후 스켈레톤 모달을 실제 모달로 교체
      this.replaceSkeletonWithModal(skeletonModal);
    } catch (error) {
      console.error('어빌리티 데이터 로드 실패:', error);
      // 에러 발생 시 스켈레톤 모달에 에러 메시지 표시
      this.showErrorMessage(skeletonModal, '메인 어빌리티 선택', '어빌리티 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  // 어빌리티 선택 모달 생성
  createAbilitySelectionModal() {
    const { modal, content } = UIComponents.createModal({
      maxWidth: '900px'
    });

         // 헤더
     const header = UIComponents.createModalHeader('메인 어빌리티 선택', '💫', () => {
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
    description.textContent = '장비 셋팅 시뮬레이션을 위한 메인 어빌리티를 선택해주세요. (아이템 전용 어빌리티 제외)';

    // 검색 기능
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    const searchInput = document.createElement('input');
    searchInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    `;
    searchInput.placeholder = '어빌리티명/효과/무기 타입 효과 검색...';

    searchInput.addEventListener('input', (e) => {
      this.filterAbilities(e.target.value, abilityGrid);
    });

    searchContainer.appendChild(searchInput);

    // 직업 필터 버튼
    const jobFilterContainer = document.createElement('div');
    jobFilterContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    `;

    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.textContent = '전체';
    allBtn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    `;
    allBtn.onclick = () => {
      this.selectedJobFilter = '전체';
      this.updateJobFilters(jobFilterContainer);
      this.filterAbilities(searchInput.value, abilityGrid);
    };

    jobFilterContainer.appendChild(allBtn);

    // 직업별 버튼들
    if (this.data) {
      const jobs = Array.from(new Set(this.data.map(row => row['직업'])));
      jobs.forEach(job => {
        const jobBtn = document.createElement('button');
        jobBtn.textContent = job;
        jobBtn.style.cssText = `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        `;
        jobBtn.onclick = () => {
          this.selectedJobFilter = job;
          this.updateJobFilters(jobFilterContainer);
          this.filterAbilities(searchInput.value, abilityGrid);
        };
        jobFilterContainer.appendChild(jobBtn);
      });
    }

    this.selectedJobFilter = '전체';
    this.jobFilterContainer = jobFilterContainer;

    // 어빌리티 그리드
    const abilityGrid = document.createElement('div');
    abilityGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    `;

    // 어빌리티 카드들 생성
    this.createAbilityCards(abilityGrid, modal);

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(searchContainer);
    content.appendChild(jobFilterContainer);
    content.appendChild(abilityGrid);

         // 외부 클릭으로 닫기
     modal.addEventListener('click', (e) => {
       if (e.target === modal) {
         this.closeModal(modal);
       }
     });

    return modal;
  }

  // 직업 필터 버튼 상태 업데이트
  updateJobFilters(container) {
    container.querySelectorAll('button').forEach(btn => {
      if (btn.textContent === this.selectedJobFilter) {
        btn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        `;
      } else {
        btn.style.cssText = `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        `;
      }
    });
  }

  // 어빌리티 카드들 생성
  createAbilityCards(container, modal) {
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

    this.data.forEach(ability => {
      const isSelected = this.selectedAbility === ability['어빌리티명'];
      const card = this.createAbilityCard(ability, modal, isSelected);
      
      // 클릭 이벤트
      card.addEventListener('click', () => {
        this.selectAbility(ability['어빌리티명'], card, card.checkmark, modal);
      });
      
      container.appendChild(card);
    });
  }

  // 어빌리티 검색 필터링
  filterAbilities(searchTerm, container) {
    if (!this.data) return;

    let filteredData = this.data;

    // 직업 필터 적용
    if (this.selectedJobFilter && this.selectedJobFilter !== '전체') {
      filteredData = filteredData.filter(ability => 
        ability['직업'] === this.selectedJobFilter
      );
    }

    // 베이스 클래스의 필터링 메서드 사용
    super.filterAbilities(searchTerm, container, filteredData, container.closest('.modal'));
  }





  // 데이터 로딩 완료를 기다리는 메서드
  waitForDataLoad(skeletonModal) {
    const checkDataLoad = () => {
      if (this.data && !this.isLoading) {
        // 데이터 로딩 완료, 스켈레톤을 실제 모달로 교체
        this.replaceSkeletonWithModal(skeletonModal);
      } else if (this.isLoading) {
        // 아직 로딩 중, 계속 대기
        setTimeout(checkDataLoad, 100);
      } else {
        // 로딩 실패, 에러 메시지 표시
        this.showErrorMessage(skeletonModal, '메인 어빌리티 선택', '어빌리티 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    };
    
    checkDataLoad();
  }

  // 스켈레톤 모달을 실제 모달로 교체
  replaceSkeletonWithModal(skeletonModal) {
    // 스켈레톤 모달 닫기
    this.closeModal(skeletonModal);
    
    // 실제 모달 열기
    const abilityModal = this.createAbilitySelectionModal();
    document.body.appendChild(abilityModal);
  }

  // 재시도 액션 오버라이드
  retryAction() {
    this.openAbilitySelectionModal();
  }
}
