// 어빌리티 효과 팝오버(단일 카드) 뷰 — 생성/위치/열기/닫기만 담당
const POPOVER_ID = 'lh-ability-popover';

class AbilityPopoverView {
  constructor() {
    this.el = null;      // 현재 팝오버 엘리먼트
    this.anchor = null;  // 팝오버를 띄운 기준 요소
    this.priceEl = null; // 가격 섹션 엘리먼트
  }

  // anchor에 대해 이미 열려 있는가 (토글 판정용)
  isOpenFor(anchor) {
    return this.el !== null && this.anchor === anchor;
  }

  isOpen() {
    return this.el !== null;
  }

  // 주어진 노드가 팝오버 내부인가 (바깥 클릭 판정용)
  contains(node) {
    return this.el ? this.el.contains(node) : false;
  }

  // 팝오버 열기 ({ abilityName, grade, effect })
  open(anchor, data) {
    this.close();
    const card = this.buildCard(data);
    document.body.appendChild(card);
    this.el = card;
    this.anchor = anchor;
    this.priceEl = card.querySelector('.lh-ability-price');
    this.position(card, anchor);
  }

  close() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this.anchor = null;
    this.priceEl = null;
  }

  // 다크 카드 DOM 생성 (textContent만 사용 — XSS 안전)
  buildCard({ abilityName, grade, effect }) {
    const card = document.createElement('div');
    card.id = POPOVER_ID;
    card.style.cssText = [
      'position: fixed',
      'z-index: 99999',
      'max-width: 280px',
      'background: #2b2b2b',
      'color: #eee',
      'border: 1px solid rgba(255,255,255,0.15)',
      'border-radius: 8px',
      'box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      'padding: 10px 12px',
      'font-size: 0.85rem',
      'line-height: 1.45'
    ].join(';');

    // 헤더: 어빌명 + (등급) + 타입 라벨
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px;';

    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-weight: bold; color: #fff;';
    nameSpan.textContent = abilityName;
    header.appendChild(nameSpan);

    if (grade) {
      const gradeSpan = document.createElement('span');
      gradeSpan.style.cssText = 'color: #aaa; font-size: 0.8rem;';
      gradeSpan.textContent = `(${grade})`;
      header.appendChild(gradeSpan);
    }

    const typeSpan = document.createElement('span');
    typeSpan.style.cssText = 'margin-left: auto; color: #888; font-size: 0.75rem;';
    typeSpan.textContent = '어빌리티';
    header.appendChild(typeSpan);

    // 구분선
    const divider = document.createElement('div');
    divider.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.12); margin: 0 0 6px 0;';

    // 본문: 효과
    const body = document.createElement('p');
    body.style.cssText = 'margin: 0; color: #ddd;';
    body.textContent = effect;

    // 가격 섹션(placeholder) — 매니저가 비동기로 채운다
    const price = document.createElement('div');
    price.className = 'lh-ability-price';
    price.style.cssText = 'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.12); color: #bbb; font-size: 0.8rem; line-height: 1.4;';
    price.textContent = '거래가 불러오는 중…';

    card.appendChild(header);
    card.appendChild(divider);
    card.appendChild(body);
    card.appendChild(price);
    return card;
  }

  // 가격 섹션 갱신 (현재 카드가 열려 있고 섹션이 연결돼 있을 때만)
  setPriceLines(lines) {
    if (!this.priceEl || !this.priceEl.isConnected) return;
    this.priceEl.textContent = '';
    lines.forEach((line) => {
      const p = document.createElement('p');
      p.style.cssText = 'margin: 0;';
      p.textContent = line;
      this.priceEl.appendChild(p);
    });
  }

  // 기준 요소 아래에 앵커하고 뷰포트 경계를 보정 (position: fixed — 뷰포트 좌표)
  position(card, anchor) {
    const rect = anchor.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 6;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    // 경계 보정 (배치 후 실제 크기로 계산)
    const popRect = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (popRect.right > vw - 8) {
      left = Math.max(8, vw - popRect.width - 8);
      card.style.left = `${left}px`;
    }
    if (popRect.bottom > vh - 8) {
      // 아래 공간 부족 → 기준 요소 위로
      top = rect.top - popRect.height - 6;
      card.style.top = `${Math.max(8, top)}px`;
    }
  }
}

export default AbilityPopoverView;
