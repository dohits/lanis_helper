// 기댓값 탭 UI (React 코드와 동일한 스타일)
import { ARTIFACT_GRADE_DATA, STAT_NAMES } from '../data/artifact-grade-data.js';
import { calculateExpectedValueDP } from '../data/dp-calculator.js';

const MAX_STAT = 10;

export class ExpectedValueTab {
  constructor() {
    this.selectedGradeId = 'common';
    this.targetSum = 10;
    this.isCalculating = false;
    this.result = null;
  }

  show(contentArea) {
    contentArea.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = `
      min-height: 100%;
      background: linear-gradient(to bottom right, #0f172a, #581c87, #0f172a);
      padding: 8px;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      padding: 16px;
      border: 1px solid rgba(168, 85, 247, 0.2);
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    `;

    // 유물 등급 선택
    const gradeSection = this.createGradeSelector();
    card.appendChild(gradeSection);

    // 유물 정보
    const infoSection = this.createGradeInfo();
    card.appendChild(infoSection);

    // 목표 합계
    const targetSection = this.createTargetInput();
    card.appendChild(targetSection);

    // 계산 버튼
    const buttonSection = this.createCalculateButton();
    card.appendChild(buttonSection);

    // 결과 표시 영역
    const resultSection = this.createResultArea();
    card.appendChild(resultSection);

    // 설명
    const descriptionSection = this.createDescription();
    card.appendChild(descriptionSection);

    container.appendChild(card);
    contentArea.appendChild(container);
  }

  createGradeSelector() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
    `;

    const label = document.createElement('label');
    label.textContent = '유물 등급';
    label.style.cssText = `
      display: block;
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 13px;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      width: 100%;
    `;

    ARTIFACT_GRADE_DATA.grades.forEach(grade => {
      const button = document.createElement('button');
      button.textContent = '';
      button.dataset.gradeId = grade.id;
      
      const isSelected = this.selectedGradeId === grade.id;
      button.style.cssText = `
        padding: 10px 8px;
        border-radius: 6px;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
        background: ${isSelected ? '#9333ea' : 'rgba(51, 65, 85, 1)'};
        color: ${isSelected ? 'white' : '#cbd5e1'};
        ${isSelected ? 'box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.5);' : ''}
        font-size: 12px;
        min-height: 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      `;

      button.addEventListener('mouseenter', () => {
        if (!isSelected) {
          button.style.background = 'rgba(71, 85, 105, 1)';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!isSelected) {
          button.style.background = 'rgba(51, 65, 85, 1)';
        }
      });

      button.addEventListener('click', () => {
        this.selectedGradeId = grade.id;
        this.updateGradeSelector();
        this.updateGradeInfo();
        this.updateTargetInput();
      });

      const nameDiv = document.createElement('div');
      nameDiv.textContent = grade.name;
      nameDiv.style.cssText = `
        font-weight: bold;
        margin-bottom: 2px;
        font-size: 13px;
        line-height: 1.2;
      `;

      const itemDiv = document.createElement('div');
      itemDiv.textContent = grade.itemName;
      itemDiv.style.cssText = `
        font-size: 10px;
        opacity: 0.8;
        line-height: 1.2;
        word-break: keep-all;
      `;

      button.appendChild(nameDiv);
      button.appendChild(itemDiv);
      grid.appendChild(button);
    });

    section.appendChild(label);
    section.appendChild(grid);

    return section;
  }

  updateGradeSelector() {
    const buttons = document.querySelectorAll('[data-grade-id]');
    buttons.forEach(button => {
      const gradeId = button.dataset.gradeId;
      const isSelected = this.selectedGradeId === gradeId;
      button.style.background = isSelected ? '#9333ea' : 'rgba(51, 65, 85, 1)';
      button.style.color = isSelected ? 'white' : '#cbd5e1';
      if (isSelected) {
        button.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.5)';
      } else {
        button.style.boxShadow = 'none';
      }
    });
  }

  createGradeInfo() {
    const section = document.createElement('div');
    section.id = 'grade-info-section';
    section.style.cssText = `
      background: rgba(51, 65, 85, 0.5);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      text-align: center;
    `;

    const currentGrade = ARTIFACT_GRADE_DATA.grades.find(g => g.id === this.selectedGradeId);

    const items = [
      { label: '스텟 수', value: `${currentGrade.numStats}개`, color: 'white' },
      { label: '시행 횟수', value: `${currentGrade.numRounds}회`, color: 'white' },
      { label: '소모 골드', value: currentGrade.cost.toLocaleString(), color: '#facc15' }
    ];

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      
      const labelDiv = document.createElement('div');
      labelDiv.textContent = item.label;
      labelDiv.style.cssText = `
        color: #94a3b8;
        font-size: 10px;
        margin-bottom: 4px;
        word-break: keep-all;
        line-height: 1.3;
      `;

      const valueDiv = document.createElement('div');
      valueDiv.textContent = item.value;
      valueDiv.style.cssText = `
        color: ${item.color};
        font-weight: bold;
        font-size: 14px;
        word-break: break-all;
        line-height: 1.3;
      `;

      itemDiv.appendChild(labelDiv);
      itemDiv.appendChild(valueDiv);
      grid.appendChild(itemDiv);
    });

    section.appendChild(grid);
    return section;
  }

  updateGradeInfo() {
    const section = document.getElementById('grade-info-section');
    if (!section) return;

    const grid = section.querySelector('div');
    grid.innerHTML = '';

    const currentGrade = ARTIFACT_GRADE_DATA.grades.find(g => g.id === this.selectedGradeId);

    const items = [
      { label: '스텟 수', value: `${currentGrade.numStats}개`, color: 'white' },
      { label: '시행 횟수', value: `${currentGrade.numRounds}회`, color: 'white' },
      { label: '소모 골드', value: currentGrade.cost.toLocaleString(), color: '#facc15' }
    ];

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      
      const labelDiv = document.createElement('div');
      labelDiv.textContent = item.label;
      labelDiv.style.cssText = `
        color: #94a3b8;
        font-size: 10px;
        margin-bottom: 4px;
        word-break: keep-all;
        line-height: 1.3;
      `;

      const valueDiv = document.createElement('div');
      valueDiv.textContent = item.value;
      valueDiv.style.cssText = `
        color: ${item.color};
        font-weight: bold;
        font-size: 14px;
        word-break: break-all;
        line-height: 1.3;
      `;

      itemDiv.appendChild(labelDiv);
      itemDiv.appendChild(valueDiv);
      grid.appendChild(itemDiv);
    });
  }

  createTargetInput() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
    `;

    const currentGrade = ARTIFACT_GRADE_DATA.grades.find(g => g.id === this.selectedGradeId);
    const maxPossibleSum = currentGrade.numStats * MAX_STAT;

    const label = document.createElement('label');
    label.textContent = `목표 스텟 합계 (최대: ${maxPossibleSum})`;
    label.style.cssText = `
      display: block;
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 13px;
      word-break: keep-all;
    `;

    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'target-sum-input';
    input.value = this.targetSum;
    input.min = '1';
    input.max = maxPossibleSum.toString();
    input.style.cssText = `
      width: 100%;
      background: rgba(51, 65, 85, 1);
      color: white;
      padding: 10px 12px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
    `;

    input.addEventListener('focus', () => {
      input.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.5)';
    });

    input.addEventListener('blur', () => {
      input.style.boxShadow = 'none';
    });

    input.addEventListener('input', (e) => {
      const value = Math.min(maxPossibleSum, Math.max(1, parseInt(e.target.value) || 1));
      this.targetSum = value;
      slider.value = value;
    });

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'target-sum-slider';
    slider.min = '1';
    slider.max = maxPossibleSum.toString();
    slider.value = this.targetSum;
    slider.style.cssText = `
      width: 100%;
      margin-top: 8px;
      cursor: pointer;
      height: 6px;
    `;

    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.targetSum = value;
      input.value = value;
    });

    section.appendChild(label);
    section.appendChild(input);
    section.appendChild(slider);

    return section;
  }

  updateTargetInput() {
    const input = document.getElementById('target-sum-input');
    const slider = document.getElementById('target-sum-slider');
    if (!input || !slider) return;

    const currentGrade = ARTIFACT_GRADE_DATA.grades.find(g => g.id === this.selectedGradeId);
    const maxPossibleSum = currentGrade.numStats * MAX_STAT;

    input.max = maxPossibleSum.toString();
    slider.max = maxPossibleSum.toString();
    
    const label = input.previousElementSibling;
    if (label) {
      label.textContent = `목표 스텟 합계 (최대: ${maxPossibleSum})`;
    }

    // 현재 값이 최대값을 초과하면 조정
    if (this.targetSum > maxPossibleSum) {
      this.targetSum = maxPossibleSum;
      input.value = this.targetSum;
      slider.value = this.targetSum;
    }
  }

  createCalculateButton() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
    `;

    const button = document.createElement('button');
    button.id = 'calculate-btn';
    button.textContent = '기댓값 계산하기';
    button.style.cssText = `
      width: 100%;
      background: linear-gradient(to right, #9333ea, #db2777);
      color: white;
      font-weight: bold;
      padding: 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      word-break: keep-all;
    `;

    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.background = 'linear-gradient(to right, #7e22ce, #be185d)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.background = 'linear-gradient(to right, #9333ea, #db2777)';
      }
    });

    button.addEventListener('click', () => {
      this.calculate();
    });

    section.appendChild(button);

    return section;
  }

  createResultArea() {
    const section = document.createElement('div');
    section.id = 'result-area';
    section.style.cssText = `
      display: none;
      margin-top: 20px;
      background: linear-gradient(to right, rgba(88, 28, 135, 0.5), rgba(219, 39, 119, 0.5));
      border-radius: 8px;
      padding: 16px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      box-sizing: border-box;
    `;

    return section;
  }

  createDescription() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-top: 20px;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
    `;

    const items = [
      { label: '전략:', value: '항상 가장 낮은 스텟을 선택' },
      { label: '선택 스텟:', value: '0~3 랜덤 상승 (각 25%)' },
      { label: '나머지 스텟:', value: '0 또는 1 랜덤 상승 (각 50%)' },
      { label: '최대치:', value: '모든 스텟 10 제한' }
    ];

    items.forEach(item => {
      const p = document.createElement('p');
      p.innerHTML = `<strong style="color: #c084fc;">${item.label}</strong> ${item.value}`;
      section.appendChild(p);
    });

    return section;
  }

  async calculate() {
    const currentGrade = ARTIFACT_GRADE_DATA.grades.find(g => g.id === this.selectedGradeId);
    
    if (!currentGrade) {
      alert('유물을 선택해주세요.');
      return;
    }

    if (!this.targetSum || this.targetSum <= 0) {
      alert('목표 합계를 입력해주세요.');
      return;
    }

    // 계산 버튼 비활성화
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = '계산 중...';
      this.isCalculating = true;
    }

    // DP 계산 실행 (비동기로 처리하여 UI 블로킹 방지)
    setTimeout(() => {
      try {
        const result = calculateExpectedValueDP(
          currentGrade.numStats,
          currentGrade.numRounds,
          this.targetSum,
          currentGrade.cost
        );

        this.result = result;
        this.displayResult();
      } catch (error) {
        console.error('계산 중 오류:', error);
        const resultArea = document.getElementById('result-area');
        if (resultArea) {
          resultArea.style.display = 'block';
          resultArea.innerHTML = `
            <div style="background: rgba(127, 29, 29, 0.3); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px; padding: 16px; color: #fca5a5;">
              계산 중 오류가 발생했습니다: ${error.message}
            </div>
          `;
        }
      } finally {
        // 계산 버튼 활성화
        if (calculateBtn) {
          calculateBtn.disabled = false;
          calculateBtn.textContent = '기댓값 계산하기';
          this.isCalculating = false;
        }
      }
    }, 100);
  }

  displayResult() {
    const resultArea = document.getElementById('result-area');
    if (!resultArea || !this.result) return;

    resultArea.style.display = 'block';
    resultArea.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = '계산 결과';
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: white;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    const titleIcon = document.createElement('span');
    titleIcon.textContent = '📈';
    titleIcon.style.cssText = 'font-size: 18px;';
    title.appendChild(titleIcon);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 12px;
    `;

    const items = [
      {
        icon: '#',
        label: '예상 유물 사용량',
        value: `${this.result.avgArtifacts.toFixed(2)}개`,
        color: 'white'
      },
      {
        icon: '📈',
        label: '예상 총 시행 횟수',
        value: `${this.result.avgRounds.toFixed(2)}회`,
        color: 'white'
      },
      {
        icon: '💰',
        label: '예상 총 소모 골드',
        value: Math.round(this.result.avgGold).toLocaleString(),
        color: '#facc15',
        span: 2
      }
    ];

    items.forEach(item => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(30, 41, 59, 0.5);
        border-radius: 6px;
        padding: 12px;
        ${item.span === 2 ? 'grid-column: 1 / -1;' : ''}
        box-sizing: border-box;
      `;

      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c084fc;
        margin-bottom: 6px;
        font-size: 12px;
      `;

      const iconSpan = document.createElement('span');
      iconSpan.textContent = item.icon;
      iconSpan.style.cssText = `
        font-size: 14px;
        flex-shrink: 0;
      `;

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      labelSpan.style.cssText = 'word-break: keep-all;';

      labelDiv.appendChild(iconSpan);
      labelDiv.appendChild(labelSpan);

      const valueDiv = document.createElement('div');
      valueDiv.textContent = item.value;
      valueDiv.style.cssText = `
        color: ${item.color};
        font-weight: bold;
        font-size: ${item.span === 2 ? '24px' : '20px'};
        word-break: break-all;
      `;

      card.appendChild(labelDiv);
      card.appendChild(valueDiv);
      grid.appendChild(card);
    });

    const probabilityDiv = document.createElement('div');
    probabilityDiv.style.cssText = `
      margin-top: 12px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      word-break: keep-all;
    `;
    probabilityDiv.textContent = `성공 확률: ${(this.result.probability * 100).toFixed(2)}%`;

    resultArea.appendChild(title);
    resultArea.appendChild(grid);
    resultArea.appendChild(probabilityDiv);
  }
}
