import { FISHING_LEVEL_PROBABILITIES } from './fishing-level-data.js';
import { FishingLevelCalculator } from './fishing-level-calculator.js';

/**
 * 낚시 계산기 UI 헬퍼 클래스
 */
export class FishingUIHelper {
  /**
   * 등급별 레벨업 확률 테이블 생성
   * @returns {HTMLElement} 확률 테이블
   */
  static createProbabilityTable() {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 12px;
    `;

    // 헤더 생성
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background: #f8f9fa;';
    
    const headers = ['단계', '+2', '+1', '0', '-1', '초기화', '누적 물고기'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.cssText = `
        padding: 8px;
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #000;
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 데이터 행 생성
    const tbody = document.createElement('tbody');
    const calculator = new FishingLevelCalculator();
    
    for (let level = 1; level <= 10; level++) {
      const row = document.createElement('tr');
      const prob = FISHING_LEVEL_PROBABILITIES[level];
      
      // 단계
      const levelCell = document.createElement('td');
      levelCell.textContent = `${level} 단계`;
      levelCell.style.cssText = `
        padding: 6px 8px;
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #000;
      `;
      row.appendChild(levelCell);
      
      // 확률들
      const probabilities = [prob.plus2, prob.plus1, prob.zero, prob.minus1, prob.reset];
      probabilities.forEach(probValue => {
        const cell = document.createElement('td');
        cell.textContent = `${probValue}%`;
        cell.style.cssText = `
          padding: 6px 8px;
          border: 1px solid #ddd;
          text-align: center;
          color: #000;
        `;
        row.appendChild(cell);
      });
      
      // 누적 물고기 수량 계산
      let cumulativeFish = 0;
      if (level === 1) {
        // 1단계는 시작점이므로 0개
        cumulativeFish = 0;
      } else {
        // 2단계부터는 해당 단계까지의 누적 계산
        cumulativeFish = calculator.calculateExpectedFishToLevel(level);
      }
      
      const cumulativeCell = document.createElement('td');
      cumulativeCell.textContent = `${cumulativeFish.toLocaleString()}개`;
      cumulativeCell.style.cssText = `
        padding: 6px 8px;
        border: 1px solid #ddd;
        text-align: center;
        color: #000;
        font-weight: bold;
      `;
      row.appendChild(cumulativeCell);
      
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    return table;
  }

  /**
   * 계산 결과 표시 섹션 생성
   * @param {Object} result - 계산 결과
   * @returns {HTMLElement} 결과 섹션
   */
  static createResultSection(result) {
    const container = document.createElement('div');
    container.style.cssText = `
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 10px 0;
    `;

    if (result.message) {
      container.innerHTML = `
        <div style="text-align: center; color: #666;">
          <div style="font-size: 16px; margin-bottom: 10px;">${result.message}</div>
        </div>
      `;
      return container;
    }

    const currentLevelName = FISHING_LEVEL_NAMES[result.currentLevel] || `등급 ${result.currentLevel}`;
    const targetLevelName = FISHING_LEVEL_NAMES[result.targetLevel] || `등급 ${result.targetLevel}`;

    // 안전한 숫자 처리
    const safeAttempts = typeof result.totalAttempts === 'number' ? result.totalAttempts : 0;
    const safeFish = typeof result.totalFish === 'number' ? result.totalFish : 0;
    const safeSuccessRate = typeof result.successRate === 'number' ? result.successRate : 0;

    container.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">계산 결과</h4>
        <div style="font-size: 14px; line-height: 1.6;">
          <div><strong>현재 등급:</strong> ${currentLevelName} (${result.currentLevel}단계)</div>
          <div><strong>목표 등급:</strong> ${targetLevelName} (${result.targetLevel}단계)</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="background: white; padding: 12px; border-radius: 6px;">
          <div style="font-weight: bold; color: #333; margin-bottom: 5px;">예상 시도 횟수</div>
          <div style="font-size: 18px; color: #667eea;">${safeAttempts.toLocaleString()}회</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px;">
          <div style="font-weight: bold; color: #333; margin-bottom: 5px;">필요 물고기 수</div>
          <div style="font-size: 18px; color: #10b981;">${safeFish.toLocaleString()}개</div>
        </div>
      </div>
      
      <div style="background: white; padding: 12px; border-radius: 6px;">
        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">전체 성공률</div>
        <div style="font-size: 18px; color: #764ba2;">${safeSuccessRate.toFixed(2)}%</div>
      </div>
    `;

    return container;
  }

  /**
   * 등급별 상세 결과 테이블 생성
   * @param {Array} levelResults - 등급별 결과
   * @returns {HTMLElement} 상세 결과 테이블
   */
  static createDetailedResultTable(levelResults) {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 12px;
    `;

    // 헤더
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background: #f8f9fa;';
    
    const headers = ['등급', '등급명', '예상 시도', '필요 물고기', '성공률', '누적 사용량'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.cssText = `
        padding: 8px;
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #000;
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 데이터 행
    const tbody = document.createElement('tbody');
    let cumulativeFish = 0;
    
    levelResults.forEach(result => {
      const row = document.createElement('tr');
      const levelName = FISHING_LEVEL_NAMES[result.level] || `등급 ${result.level}`;
      
      // 안전한 숫자 처리
      const safeAttempts = typeof result.attempts === 'number' ? result.attempts : 0;
      const safeTotalFish = typeof result.totalFish === 'number' ? result.totalFish : 0;
      const safeSuccessRate = typeof result.successRate === 'number' ? result.successRate : 0;
      
      // 누적 사용량 계산
      cumulativeFish += safeTotalFish;
      
      const cells = [
        `${result.level}단계`,
        levelName,
        `${safeAttempts.toLocaleString()}회`,
        `${safeTotalFish.toLocaleString()}개`,
        `${safeSuccessRate}%`,
        `${cumulativeFish.toLocaleString()}개`
      ];
      
      cells.forEach(cellText => {
        const cell = document.createElement('td');
        cell.textContent = cellText;
        cell.style.cssText = `
          padding: 6px 8px;
          border: 1px solid #ddd;
          text-align: center;
          color: #000;
        `;
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
  }

  /**
   * 입력 폼 생성
   * @param {Function} onCalculate - 계산 버튼 클릭 시 호출될 함수
   * @returns {HTMLElement} 입력 폼
   */
  static createInputForm(onCalculate) {
    const form = document.createElement('div');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    `;

    // 현재 등급 입력
    const currentLevelGroup = document.createElement('div');
    currentLevelGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    const currentLevelLabel = document.createElement('label');
    currentLevelLabel.textContent = '현재 등급';
    currentLevelLabel.style.cssText = 'font-weight: bold; color: #333;';
    
    const currentLevelSelect = document.createElement('select');
    currentLevelSelect.id = 'currentLevel';
    currentLevelSelect.style.cssText = `
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    `;
    
    for (let i = 1; i <= 9; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}단계 - ${FISHING_LEVEL_NAMES[i]}`;
      currentLevelSelect.appendChild(option);
    }
    
    currentLevelGroup.appendChild(currentLevelLabel);
    currentLevelGroup.appendChild(currentLevelSelect);
    form.appendChild(currentLevelGroup);

    // 목표 등급 입력
    const targetLevelGroup = document.createElement('div');
    targetLevelGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    const targetLevelLabel = document.createElement('label');
    targetLevelLabel.textContent = '목표 등급';
    targetLevelLabel.style.cssText = 'font-weight: bold; color: #333;';
    
    const targetLevelSelect = document.createElement('select');
    targetLevelSelect.id = 'targetLevel';
    targetLevelSelect.style.cssText = `
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    `;
    
    for (let i = 2; i <= 10; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}단계 - ${FISHING_LEVEL_NAMES[i]}`;
      targetLevelSelect.appendChild(option);
    }
    
    targetLevelGroup.appendChild(targetLevelLabel);
    targetLevelGroup.appendChild(targetLevelSelect);
    form.appendChild(targetLevelGroup);

    // 계산 버튼
    const calculateButton = document.createElement('button');
    calculateButton.textContent = '계산하기';
    calculateButton.style.cssText = `
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
    `;
    
    calculateButton.addEventListener('mouseenter', () => {
      calculateButton.style.opacity = '0.8';
    });
    
    calculateButton.addEventListener('mouseleave', () => {
      calculateButton.style.opacity = '1';
    });
    
    calculateButton.addEventListener('click', () => {
      const currentLevel = parseInt(currentLevelSelect.value);
      const targetLevel = parseInt(targetLevelSelect.value);
      onCalculate(currentLevel, targetLevel);
    });
    
    form.appendChild(calculateButton);

    return form;
  }
} 