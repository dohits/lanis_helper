// 어빌리티 이름 클릭 → 효과 팝오버 매니저
import AbilityInfoDataManager from '../ability-info/AbilityInfoDataManager.js';
import { findAbilityEffect } from '../item-stats/scroll-ability-utils.js';
import AbilityPopoverView from './AbilityPopoverView.js';
import { fetchScrollPrice } from '../scroll-price/ScrollPriceService.js';
import { priceLines } from '../scroll-price/scroll-price-utils.js';

const CLICKABLE_CLASS = 'lh-ability-clickable';

class AbilityClickPopoverManager {
  constructor() {
    this.dataManager = new AbilityInfoDataManager();
    this.abilityList = [];
    this.enabled = true;
    this.observer = null;
    this.view = new AbilityPopoverView();
    // 이벤트 핸들러 바인딩 (제거 가능하도록 안정 참조 유지)
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async init() {
    // 어빌 데이터 로드 (실패 시 번들 폴백)
    try {
      this.abilityList = await this.dataManager.load();
    } catch (error) {
      console.warn('[AbilityClickPopover] 어빌 데이터 로드 실패, 번들 데이터 사용:', error);
      this.abilityList = this.dataManager.getAbilityDataFromFile();
    }

    // 초기 활성 상태를 설정에서 읽음 (showItemStats 연동)
    this.enabled = await this.loadEnabledSetting();

    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
    this.startObserver();

    if (this.enabled) this.scan();
  }

  // itemStatsSettings.showItemStats 읽기 (기본 true)
  loadEnabledSetting() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['itemStatsSettings'], (result) => {
          const s = result && result.itemStatsSettings;
          resolve(s ? s.showItemStats !== false : true);
        });
      } catch (error) {
        resolve(true);
      }
    });
  }

  // 외부(라이프사이클)에서 활성/비활성 전환
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.scan();
    } else {
      this.view.close();
      this.unmarkAll();
    }
  }

  startObserver() {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        setTimeout(() => {
          if (this.enabled) this.scan();
        }, 100);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // 어빌명 후보 탐색 및 클릭 가능 마킹
  scan() {
    try {
      const candidates = document.querySelectorAll('p.MuiTypography-root.MuiTypography-body2');
      candidates.forEach((p) => {
        if (p.classList.contains(CLICKABLE_CLASS)) return;
        if (!this.isAbilityNameElement(p)) return;
        const text = p.textContent.trim();
        const effect = findAbilityEffect(this.abilityList, text);
        if (!effect) return; // 데이터에 없는 이름은 비활성
        this.markClickable(p, text);
      });
    } catch (error) {
      console.warn('[AbilityClickPopover] 스캔 오류:', error);
    }
  }

  // 등급 span 형제를 가진 어빌명 p '구조'인지만 판정 (해시 비의존).
  // 실제 어빌리티 식별(데이터 매칭) 게이트는 scan()의 findAbilityEffect가 담당한다.
  isAbilityNameElement(p) {
    const prev = p.previousElementSibling;
    if (!prev || prev.tagName !== 'SPAN') return false;
    const gradeText = prev.textContent.trim();
    // 등급 라벨은 짧다(보통 1~2자). 비거나 너무 길면 어빌 행이 아님.
    if (gradeText.length < 1 || gradeText.length > 3) return false;
    return true;
  }

  markClickable(p, abilityName) {
    p.classList.add(CLICKABLE_CLASS);
    p.dataset.lhAbility = abilityName;
    p.style.cursor = 'pointer';
    p.style.textDecoration = 'underline dotted';
    p.style.textUnderlineOffset = '2px';
  }

  unmarkAll() {
    document.querySelectorAll('.' + CLICKABLE_CLASS).forEach((p) => {
      p.classList.remove(CLICKABLE_CLASS);
      delete p.dataset.lhAbility;
      p.style.cursor = '';
      p.style.textDecoration = '';
      p.style.textUnderlineOffset = '';
    });
  }

  onDocumentClick(event) {
    const target = event.target.closest
      ? event.target.closest('.' + CLICKABLE_CLASS)
      : null;

    if (target && this.enabled) {
      event.preventDefault();
      event.stopPropagation();
      // 같은 요소 재클릭 → 토글로 닫기
      if (this.view.isOpenFor(target)) {
        this.view.close();
        return;
      }
      this.openFor(target);
      return;
    }

    // 팝오버 바깥 클릭 → 닫기 (내부 클릭은 무시)
    if (this.view.isOpen() && !this.view.contains(event.target)) {
      this.view.close();
    }
  }

  onKeyDown(event) {
    if (event.key === 'Escape' && this.view.isOpen()) this.view.close();
  }

  openFor(anchor) {
    const abilityName = anchor.dataset.lhAbility;
    const effect = findAbilityEffect(this.abilityList, abilityName);
    if (!effect) return;
    const gradeEl = anchor.previousElementSibling;
    const grade = gradeEl ? gradeEl.textContent.trim() : '';
    this.view.open(anchor, { abilityName, grade, effect });
    this.loadPrice(anchor, abilityName);
  }

  // 비동기 시세 로드 후 가격 섹션 갱신 (같은 앵커 팝오버가 열려 있을 때만)
  async loadPrice(anchor, abilityName) {
    try {
      const result = await fetchScrollPrice(abilityName);
      if (!this.view.isOpenFor(anchor)) return;
      this.view.setPriceLines(priceLines(result));
    } catch (error) {
      console.warn('[AbilityClickPopover] 시세 표시 오류:', error);
    }
  }

  destroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.view.close();
    this.unmarkAll();
  }
}

export default AbilityClickPopoverManager;
