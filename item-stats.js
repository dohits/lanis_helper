// 아이템 감정 범위 표기 관리자
class ItemStatsManager {
  constructor() {
    this.rareItemsData = [];
    this.isProcessing = false;
    this.settings = { showItemStats: true };
  }

  async init() {
    this.loadSettings();
    await this.loadRareItemsData();
    this.startDynamicContentDetection();
  }

  // 설정 로드
  loadSettings() {
    chrome.storage.sync.get({
      showItemStats: true
    }, (items) => {
      this.settings = items;
    });
  }

  async loadRareItemsData() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            this.rareItemsData = result.rareItems;
            this.processItemStats();
          } else {
            this.rareItemsData = [];
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('레어 아이템 데이터 로드 실패:', error);
      this.rareItemsData = [];
    }
  }

  processItemStats() {
    if (!this.settings.showItemStats || !this.rareItemsData || this.rareItemsData.length === 0) {
      return;
    }
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      const itemContainers = document.querySelectorAll('.MuiBox-root.css-38zrbw');
      let foundContainers = 0;
      let matchedItems = 0;
      itemContainers.forEach(container => {
        if (container.classList.contains('item-stats-processed')) return;
        const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
        if (!itemNameElement) return;
        const text = itemNameElement.textContent.trim();
        if (!text || text.length < 2 || text.length > 50) return;
        let cleanItemName = text;
        if (text.includes('(')) {
          cleanItemName = text.split('(')[0].trim();
        }
        const itemData = this.rareItemsData.find(item => {
          if (!item.name) return false;
          const itemName = item.name.trim();
          return cleanItemName === itemName;
        });
        if (itemData) {
          matchedItems++;
          this.addRangeInfoToStats(container, itemData);
          container.classList.add('item-stats-processed');
        }
        foundContainers++;
      });
    } catch (error) {
      console.error('아이템 감정 범위 표기 처리 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 아이템의 위력/무게 값에 범위 및 등급 표기 추가
  addRangeInfoToStats(container, itemData) {
    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm');
    let powerGrade = null;
    let weightGrade = null;
    let powerSummary = null;
    let weightSummary = null;
    statContainers.forEach((statContainer) => {
      const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv');
      if (pElements.length === 2) {
        const labelElement = pElements[0];
        const valueElement = pElements[1];
        const label = labelElement.textContent.trim();
        const value = valueElement.textContent.trim();
        // 위력 처리
        if (label === '위력' &&
            itemData.power_min !== null && itemData.power_max !== null &&
            itemData.power_min !== itemData.power_max) {
          if (valueElement.classList.contains('power-range-processed')) return;
          const currentPower = parseInt(value);
          // 미감정 아이템(범위 문자열 ex: 80~122) 처리
          if (!/^-?\d+$/.test(value)) {
            // 범위만 표기, 등급/퍼센트/태그 대신 [위키有] 표기
            const rangeSpan = document.createElement('span');
            rangeSpan.textContent = ` (${itemData.power_min}-${itemData.power_max})`;
            rangeSpan.style.color = '#666';
            rangeSpan.style.fontSize = '0.9em';
            rangeSpan.style.fontStyle = 'italic';
            rangeSpan.classList.add('power-range-info');
            const wikiSpan = document.createElement('span');
            wikiSpan.textContent = ' [위키有]';
            wikiSpan.style.color = '#888';
            wikiSpan.style.fontSize = '0.9em';
            wikiSpan.style.fontStyle = 'italic';
            wikiSpan.classList.add('wiki-info');
            valueElement.appendChild(rangeSpan);
            valueElement.appendChild(wikiSpan);
            valueElement.classList.add('power-range-processed');
            return;
          }
          const { grade, color, percentage, score } = this.calculateGrade(currentPower, itemData.power_min, itemData.power_max);
          const isNarrow = Math.abs(itemData.power_max - itemData.power_min) <= 9;
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.power_min}-${itemData.power_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('power-range-info');
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('power-grade-info');
          gradeSpan.setAttribute('data-grade', grade);
          // 퍼센트/점수 표기 (범위좁음이면 점수 표기 X)
          const percentSpan = document.createElement('span');
          percentSpan.textContent = isNarrow ? ` (${percentage.toFixed(1)}%)` : ` (${percentage.toFixed(1)}%)`;
          percentSpan.style.color = '#666';
          percentSpan.style.fontSize = '0.9em';
          percentSpan.style.fontWeight = 'normal';
          percentSpan.style.fontStyle = 'italic';
          percentSpan.classList.add('power-percent-info');
          // 점수 표기 (등급과 같은 색상)
          let scoreSpan = null;
          if (!isNarrow) {
            scoreSpan = document.createElement('span');
            scoreSpan.textContent = ` (${score}점)`;
            scoreSpan.style.color = color;
            scoreSpan.style.fontSize = '0.9em';
            scoreSpan.style.fontWeight = 'bold';
            scoreSpan.classList.add('power-score-info');
          }
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            narrowSpan = document.createElement('span');
            narrowSpan.textContent = ' (범위 좁음)';
            narrowSpan.style.color = '#666';
            narrowSpan.style.fontSize = '0.9em';
            narrowSpan.style.fontWeight = 'bold';
            narrowSpan.classList.add('narrow-range-info');
          }
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.appendChild(document.createElement('br'));
          let detailRow = document.createElement('span');
          detailRow.className = 'stat-detail-row';
          detailRow.appendChild(percentSpan);
          if (scoreSpan) detailRow.appendChild(scoreSpan);
          if (narrowSpan) detailRow.appendChild(narrowSpan);
          valueElement.appendChild(detailRow);
          valueElement.classList.add('power-range-processed');
          // 퍼센트/점수/색상 저장
          powerSummary = { percent: percentage.toFixed(1), score, color };
        }
        // 무게 처리
        if (label === '무게' &&
            itemData.weight_min !== null && itemData.weight_max !== null &&
            itemData.weight_min !== itemData.weight_max) {
          if (valueElement.classList.contains('weight-range-processed')) return;
          const currentWeight = parseInt(value);
          // 미감정 아이템(범위 문자열 ex: 80~122) 처리
          if (!/^-?\d+$/.test(value)) {
            // 범위만 표기, 등급/퍼센트/태그 대신 [위키有] 표기
            const rangeSpan = document.createElement('span');
            rangeSpan.textContent = ` (${itemData.weight_min}-${itemData.weight_max})`;
            rangeSpan.style.color = '#666';
            rangeSpan.style.fontSize = '0.9em';
            rangeSpan.style.fontStyle = 'italic';
            rangeSpan.classList.add('weight-range-info');
            const wikiSpan = document.createElement('span');
            wikiSpan.textContent = ' [위키有]';
            wikiSpan.style.color = '#888';
            wikiSpan.style.fontSize = '0.9em';
            wikiSpan.style.fontStyle = 'italic';
            wikiSpan.classList.add('wiki-info');
            valueElement.appendChild(rangeSpan);
            valueElement.appendChild(wikiSpan);
            valueElement.classList.add('weight-range-processed');
            return;
          }
          const { grade, color, percentage, score } = this.calculateGrade(currentWeight, itemData.weight_min, itemData.weight_max, true);
          const isNarrow = Math.abs(itemData.weight_max - itemData.weight_min) <= 9;
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.weight_min}-${itemData.weight_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('weight-range-info');
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('weight-grade-info');
          gradeSpan.setAttribute('data-grade', grade);
          // 퍼센트/점수 표기 (범위좁음이면 점수 표기 X)
          const percentSpan = document.createElement('span');
          percentSpan.textContent = isNarrow ? ` (${percentage.toFixed(1)}%)` : ` (${percentage.toFixed(1)}%)`;
          percentSpan.style.color = '#666';
          percentSpan.style.fontSize = '0.9em';
          percentSpan.style.fontWeight = 'normal';
          percentSpan.style.fontStyle = 'italic';
          percentSpan.classList.add('weight-percent-info');
          // 점수 표기 (등급과 같은 색상)
          let scoreSpan = null;
          if (!isNarrow) {
            scoreSpan = document.createElement('span');
            scoreSpan.textContent = ` (${score}점)`;
            scoreSpan.style.color = color;
            scoreSpan.style.fontSize = '0.9em';
            scoreSpan.style.fontWeight = 'bold';
            scoreSpan.classList.add('weight-score-info');
          }
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            narrowSpan = document.createElement('span');
            narrowSpan.textContent = ' (범위 좁음)';
            narrowSpan.style.color = '#666';
            narrowSpan.style.fontSize = '0.9em';
            narrowSpan.style.fontWeight = 'bold';
            narrowSpan.classList.add('narrow-range-info');
          }
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.appendChild(document.createElement('br'));
          let detailRow = document.createElement('span');
          detailRow.className = 'stat-detail-row';
          detailRow.appendChild(percentSpan);
          if (scoreSpan) detailRow.appendChild(scoreSpan);
          if (narrowSpan) detailRow.appendChild(narrowSpan);
          valueElement.appendChild(detailRow);
          valueElement.classList.add('weight-range-processed');
          // 퍼센트/점수/색상 저장
          weightSummary = { percent: percentage.toFixed(1), score, color };
        }
      }
    });
    // 퍼센트/점수 정보 컨테이너에 저장
    // container._statSummary = { power: powerSummary, weight: weightSummary }; // 제거
    // 종결/준종결/완전무결 태그 추가 (점수 기반, 범위좁음 예외, 점수 항상 표기)
    // label이 '위력', '무게'인 statContainer를 반드시 찾아 점수 계산
    let statPower = null, statWeight = null;
    statContainers.forEach(sc => {
      const labelEl = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[0];
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      if (label === '위력') statPower = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[1];
      if (label === '무게') statWeight = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[1];
    });
    let powerInfo = {score: 0, grade: ''};
    let weightInfo = {score: 0, grade: ''};
    // 첫 번째 텍스트 노드만 추출
    const powerText = this.getFirstNumberText(statPower);
    const weightText = this.getFirstNumberText(statWeight);
    if (statPower && powerText.match(/^-?\d+$/)) {
      powerInfo = this.calculateGrade(parseInt(powerText), itemData.power_min, itemData.power_max);
    }
    if (statWeight && weightText.match(/^-?\d+$/)) {
      weightInfo = this.calculateGrade(parseInt(weightText), itemData.weight_min, itemData.weight_max, true);
    }
    const powerScore = powerInfo.score;
    const weightScore = weightInfo.score;
    const powerGradeVal = powerInfo.grade;
    const weightGradeVal = weightInfo.grade;
    const powerNarrow = Math.abs(itemData.power_max - itemData.power_min) <= 9;
    const weightNarrow = Math.abs(itemData.weight_max - itemData.weight_min) <= 9;
    // 미감정(위력/무게 값이 범위 문자열) 체크 (첫 텍스트만 검사)
    const isWikiUnappraised =
      statPower && statWeight &&
      !powerText.match(/^-?\d+$/) &&
      !weightText.match(/^-?\d+$/);
    // addFinalTag는 항상 실행
    this.addFinalTag(container, powerGradeVal, weightGradeVal, powerScore, weightScore, powerNarrow, weightNarrow, isWikiUnappraised);
  }

  // 종결/준종결/완전무결 태그 추가 함수 (점수 기반, 범위좁음 예외, 무결 등급 체크, 점수 항상 표기)
  addFinalTag(container, powerGrade, weightGrade, powerScore, weightScore, powerNarrow, weightNarrow, isWikiUnappraised) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    if (!itemNameElement) {
      console.warn('아이템명 p 태그 탐색 실패', container);
      return;
    }
    if (itemNameElement.querySelector('.final-tag')) {
      console.warn('이미 final-tag가 있음', itemNameElement);
      return;
    }
    if (isWikiUnappraised) {
      console.warn('미감정으로 태그/점수 표기 생략', container);
      return;
    }
    let tagText = '';
    let tagColor = '';
    let tagScore;
    // 점수 계산
    if (powerNarrow && weightNarrow) {
      tagScore = Math.max(powerScore, weightScore);
    } else if (powerNarrow) {
      tagScore = weightScore;
    } else if (weightNarrow) {
      tagScore = powerScore;
    } else {
      tagScore = powerScore + weightScore;
    }
    // 태그 조건
    if (!powerNarrow && !weightNarrow) {
      if (tagScore === 16) {
        tagText = '[완전무결]'; tagColor = '#00FFF0';
      } else if (tagScore >= 12 && tagScore <= 15) {
        tagText = '[종결]'; tagColor = '#FF5555';
      } else if (tagScore === 11) {
        tagText = '[준종결]'; tagColor = '#C770FF';
      }
    } else if (powerNarrow && !weightNarrow) {
      if (tagScore === 8 && weightGrade === '무결') {
        tagText = '[완전무결]'; tagColor = '#00FFF0';
      } else if (tagScore >= 6 && tagScore <= 7) {
        tagText = '[종결]'; tagColor = '#FF5555';
      } else if (tagScore === 5) {
        tagText = '[준종결]'; tagColor = '#C770FF';
      }
    } else if (!powerNarrow && weightNarrow) {
      if (tagScore === 8 && powerGrade === '무결') {
        tagText = '[완전무결]'; tagColor = '#00FFF0';
      } else if (tagScore >= 6 && tagScore <= 7) {
        tagText = '[종결]'; tagColor = '#FF5555';
      } else if (tagScore === 5) {
        tagText = '[준종결]'; tagColor = '#C770FF';
      }
    }
    // 태그/점수 표기 (태그가 없더라도 점수는 항상 표기)
    const tagSpan = document.createElement('span');
    tagSpan.textContent = tagText ? ` ${tagText} (${tagScore}점)` : ` (${tagScore}점)`;
    tagSpan.style.color = tagText ? tagColor : '#666';
    tagSpan.style.fontSize = '0.8rem';
    tagSpan.style.fontWeight = 'bold';
    tagSpan.style.fontStyle = 'italic';
    tagSpan.classList.add('final-tag');
    // 태그 줄(div) 생성/갱신
    let tagRow = container.querySelector('.item-grade-tag-row');
    if (!tagRow) {
      tagRow = document.createElement('div');
      tagRow.className = 'item-grade-tag-row';
      if (itemNameElement.nextSibling) {
        itemNameElement.parentNode.insertBefore(tagRow, itemNameElement.nextSibling);
      } else {
        itemNameElement.parentNode.appendChild(tagRow);
      }
    }
    tagRow.innerHTML = '';
    tagRow.appendChild(tagSpan);
    // stat summary 줄 생성/갱신 - 제거
    // let statRow = container.querySelector('.item-stat-summary-row');
    // if (!statRow) {
    //   statRow = document.createElement('div');
    //   statRow.className = 'item-stat-summary-row';
    //   tagRow.parentNode.insertBefore(statRow, tagRow.nextSibling);
    // }
    // 퍼센트/점수 정보로 한 줄 생성 - 제거
    // const statSummary = container._statSummary || {};
    // let statHtml = '';
    // if (statSummary.power) {
    //   statHtml += `<span style="color:${statSummary.power.color}">위력 [${statSummary.power.percent}%] (${statSummary.power.score}점)</span>`;
    // }
    // if (statSummary.weight) {
    //   if (statHtml) statHtml += ' / ';
    //   statHtml += `<span style="color:${statSummary.weight.color}">무게 [${statSummary.weight.percent}%] (${statSummary.weight.score}점)</span>`;
    // }
    // statRow.innerHTML = statHtml;
  }

  // 등급 계산 함수 (퍼센트, 점수 반환, 오차 방지, 다크모드 색상)
  calculateGrade(currentValue, minValue, maxValue, isWeight = false) {
    // 유효하지 않은 값 처리
    if (currentValue === null || currentValue === undefined || 
        minValue === null || minValue === undefined || 
        maxValue === null || maxValue === undefined) {
      return { grade: '최하', color: '#CCCCCC', percentage: 0, score: 2 };
    }
    // 범위가 0인 경우 (최소값과 최대값이 같은 경우)
    if (minValue === maxValue) {
      if (currentValue === minValue) {
        return { grade: '최상', color: '#FF5555', percentage: 100.0, score: 6 };
      } else {
        return { grade: '최하', color: '#CCCCCC', percentage: 0, score: 2 };
      }
    }
    // 현재값이 범위를 벗어나는 경우
    if (currentValue < minValue || currentValue > maxValue) {
      return { grade: '최하', color: '#CCCCCC', percentage: 0, score: 2 };
    }
    // 퍼센트 계산 (음수 범위도 올바르게 처리)
    let percentage;
    if (minValue === maxValue) {
      percentage = 100.0;
    } else {
      const range = maxValue - minValue;
      percentage = ((currentValue - minValue) / range) * 100;
    }
    if (isWeight) {
      percentage = 100 - percentage;
    }
    // 부동소수점 오차 방지 및 0~100 클램프, 소수점 1자리
    percentage = Math.max(0, Math.min(100, Math.round((percentage + Number.EPSILON) * 10) / 10));
    // 등급 결정 (최소치: 불량, 5% 이하: 폐급, 100%: 무결, 95%~: 완벽)
    let grade, color, score;
    if (currentValue === minValue) {
      grade = '불량'; color = '#888888'; score = 0;
    } else if (percentage <= 5) {
      grade = '폐급'; color = '#BBBBBB'; score = 1;
    } else if (percentage === 100.0) {
      grade = '무결'; color = '#00FFF0'; score = 8;
    } else if (percentage >= 95) {
      grade = '완벽'; color = '#FFE066'; score = 7;
    } else if (percentage >= 90) {
      grade = '최상'; color = '#FF5555'; score = 6;
    } else if (percentage >= 70) {
      grade = '상'; color = '#C770FF'; score = 5;
    } else if (percentage >= 50) {
      grade = '중'; color = '#FFFF66'; score = 4;
    } else if (percentage >= 30) {
      grade = '하'; color = '#66A3FF'; score = 3;
    } else {
      grade = '최하'; color = '#CCCCCC'; score = 2;
    }
    return { grade, color, percentage, score };
  }

  // p 태그의 첫 번째 텍스트 노드(숫자)만 추출하는 유틸 함수 추가
  getFirstNumberText(el) {
    if (!el) return '';
    const node = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    return node ? node.textContent.trim() : '';
  }

  // 동적 감지(아이템 목록 변화 감지)
  startDynamicContentDetection() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcessItems = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && node.querySelector('p.MuiTypography-body2')) {
                shouldProcessItems = true;
              }
            }
          });
        }
      });
      if (shouldProcessItems && this.settings.showItemStats) {
        setTimeout(() => {
          this.processItemStats();
        }, 100);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  removeItemStats() {
    // 기존 감정 범위 표기 요소 제거
    const statsElements = document.querySelectorAll('.item-stats-info');
    statsElements.forEach(element => element.remove());
    const powerRangeElements = document.querySelectorAll('.power-range-info');
    powerRangeElements.forEach(element => element.remove());
    const powerGradeElements = document.querySelectorAll('.power-grade-info');
    powerGradeElements.forEach(element => element.remove());
    const weightRangeElements = document.querySelectorAll('.weight-range-info');
    weightRangeElements.forEach(element => element.remove());
    const weightGradeElements = document.querySelectorAll('.weight-grade-info');
    weightGradeElements.forEach(element => element.remove());
    const finalTagElements = document.querySelectorAll('.final-tag');
    finalTagElements.forEach(element => element.remove());
    const processedElements = document.querySelectorAll('.item-stats-processed, .power-range-processed, .weight-range-processed');
    processedElements.forEach(element => {
      element.classList.remove('item-stats-processed', 'power-range-processed', 'weight-range-processed');
    });
  }

  getRareItemsData() {
    return this.rareItemsData;
  }

  isProcessingStats() {
    return this.isProcessing;
  }
}

// 전역 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.itemStatsManager = new ItemStatsManager();
  });
} else {
  window.itemStatsManager = new ItemStatsManager();
}