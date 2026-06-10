// 스크롤 팝오버에 어빌리티 효과를 표시하는 모듈
import AbilityInfoDataManager from '../ability-info/AbilityInfoDataManager.js';
import { extractScrollAbilityName, findAbilityEffect } from './scroll-ability-utils.js';
import { fetchScrollPrice } from '../scroll-price/ScrollPriceService.js';
import { priceLines } from '../scroll-price/scroll-price-utils.js';

class ScrollAbilityAdder {
  constructor() {
    this.dataManager = new AbilityInfoDataManager();
    this.abilityList = [];
  }

  // 어빌 데이터 로드 (실패 시 번들 데이터 폴백)
  async init() {
    try {
      this.abilityList = await this.dataManager.load();
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 어빌 데이터 로드 실패, 번들 데이터 사용:', error);
      this.abilityList = this.dataManager.getAbilityDataFromFile();
    }
  }

  // 문서 전체에서 스크롤 팝오버를 찾아 처리
  processScrollPopovers(root = document) {
    try {
      const papers = root.querySelectorAll('.MuiPopover-paper');
      papers.forEach((paper) => this.processScrollPopover(paper));
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 스크롤 팝오버 처리 중 오류:', error);
    }
  }

  // 단일 팝오버 처리
  processScrollPopover(paper) {
    if (!paper || paper.classList.contains('scroll-ability-processed')) return;

    // 아이템명 후보: 팝오버 내 첫 body2 단락
    const nameEl = paper.querySelector('p.MuiTypography-root.MuiTypography-body2');
    if (!nameEl) return;

    const nameText = nameEl.textContent.trim();
    // 스크롤 판정: 이름에 '스크롤' 포함 + 콜론(반각/전각) 존재
    if (!nameText.includes('스크롤') || !/[:：]/.test(nameText)) return;

    const abilityName = extractScrollAbilityName(nameText);
    if (!abilityName) return;

    // 어빌 데이터가 아직 로드 전이면 마킹하지 않고 다음 기회에 재시도
    if (!Array.isArray(this.abilityList) || this.abilityList.length === 0) return;

    const effect = findAbilityEffect(this.abilityList, abilityName);

    // 데이터는 있으나 매칭 실패한 경우도 재처리 방지 위해 마킹
    paper.classList.add('scroll-ability-processed');
    if (!effect) return; // 매칭 실패: 아무것도 표시하지 않음

    // 효과 행을 붙일 박스: 설명 박스(css-1821gv5) 우선,
    // 해시 변경 대비 폴백으로 팝오버 콘텐츠 래퍼(paper 직속 박스)를 사용해 맨 아래에 추가
    const targetBox =
      paper.querySelector('.MuiBox-root.css-1821gv5') ||
      nameEl.closest('.MuiPopover-paper > *') ||
      nameEl.parentElement;
    if (!targetBox) return;

    targetBox.appendChild(this.buildAbilityRow(abilityName, effect));

    // 가격 행(placeholder) 추가 후 비동기 채움
    const priceRow = this.buildPriceRow();
    targetBox.appendChild(priceRow);
    this.loadPrice(priceRow, abilityName);
  }

  // 효과 표시 행 생성
  buildAbilityRow(abilityName, effect) {
    const row = document.createElement('div');
    row.className = 'scroll-ability-info';
    row.style.cssText =
      'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12);';

    const p = document.createElement('p');
    p.className = 'MuiTypography-root MuiTypography-body2';
    p.style.cssText = 'color: #66d9ef; font-size: 0.85rem; line-height: 1.4;';
    p.textContent = `${abilityName}: ${effect}`;

    row.appendChild(p);
    return row;
  }

  // 가격 행(placeholder) 생성
  buildPriceRow() {
    const row = document.createElement('div');
    row.className = 'scroll-price-info';
    row.style.cssText = 'margin-top: 4px;';

    const p = document.createElement('p');
    p.className = 'MuiTypography-root MuiTypography-body2';
    p.style.cssText = 'color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;';
    p.textContent = '거래가 불러오는 중…';

    row.appendChild(p);
    return row;
  }

  // 비동기 시세 로드 후 행 갱신 (팝오버가 닫혔으면 무시)
  async loadPrice(row, abilityName) {
    try {
      const result = await fetchScrollPrice(abilityName);
      if (!row.isConnected) return;
      this.renderPriceLines(row, priceLines(result));
    } catch (error) {
      console.warn('[ScrollAbilityAdder] 시세 표시 오류:', error);
    }
  }

  // 가격 라인들을 행에 렌더 (기존 내용 교체)
  renderPriceLines(row, lines) {
    row.textContent = '';
    lines.forEach((line) => {
      const p = document.createElement('p');
      p.className = 'MuiTypography-root MuiTypography-body2';
      p.style.cssText = 'color: #c0c0c0; font-size: 0.8rem; line-height: 1.4; margin: 0;';
      p.textContent = line;
      row.appendChild(p);
    });
  }

  // 추가 요소 정리 (스카우터 OFF/해제 시)
  cleanup(root = document) {
    root.querySelectorAll('.scroll-ability-info, .scroll-price-info').forEach((el) => el.remove());
    root
      .querySelectorAll('.scroll-ability-processed')
      .forEach((el) => el.classList.remove('scroll-ability-processed'));
  }
}

export default ScrollAbilityAdder;
