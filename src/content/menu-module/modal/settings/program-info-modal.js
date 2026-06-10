import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';
import { API_ENDPOINTS, LANIS_ME_PATHS, LANIS_ME_PAGE_IDS } from '../../../../shared/constants.js';

// 프로그램 정보 모달
class ProgramInfoModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.programInfo);
  }

  // 모달 열기
  open() {
    super.open();
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    // manifest에서 버전 동적 추출
    let version = 'unknown';
    try {
      const manifest = chrome.runtime.getManifest();
      version = manifest.version || 'unknown';
    } catch (e) {}

    // 기본 정보
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      margin: 24px 0 12px 0;
      font-size: 16px;
      color: #374151;
    `;
    infoDiv.innerHTML =
      `<b>버전:</b> v${version}<br><br>` +
      `본 프로그램은 <b>유저 비공식 확장</b>입니다.<br><br>` +
      `문의: 인게임 메일 <b>도히님</b>` +
      `<hr style='margin:18px 0 10px 0; border:0; border-top:1.5px solid #e5e7eb;'>`;

    // 기여자 목록 표 추가
    const contributorTable = this.createContributorTable();

    // 3단행 꾸밈줄
    const decoDiv = this.createDecorationDiv();

    // 콘텐츠 조립
    this.body.appendChild(infoDiv);
    this.body.appendChild(decoDiv);
    this.body.appendChild(contributorTable);
  }

  // 기여자 테이블 생성
  createContributorTable() {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      margin-top: 24px;
      border-collapse: collapse;
      font-size: 14px;
    `;

    // 헤더
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['항목', '닉네임', 'url'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = `
        padding: 6px 2px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #222;
      `;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // 본문
    const tbody = document.createElement('tbody');
    const contributors = [
      { role: '어빌리티', nick: '먹물', url: `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.BOARD_VIEW}/${LANIS_ME_PAGE_IDS.ABILITY_GUIDE}`, urlinfo: '어빌리티 게시글' },
      { role: '위키운영', nick: '크루즈', url: `${API_ENDPOINTS.LANIS_WIKI.replace('/api.php', '/')}`, urlinfo: '위키 바로가기' }
    ];

    contributors.forEach(row => {
      const tr = document.createElement('tr');
      [row.role, row.nick, row.url].forEach((v, i) => {
        const td = document.createElement('td');
        if (i === 1) { // 닉네임
          const a = document.createElement('a');
          a.href = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(v)}`;
          a.textContent = v;
          a.style.color = '#3366cc';
          td.appendChild(a);
        } else if (i === 2) { // url
          const a = document.createElement('a');
          a.href = v;
          a.textContent = row.urlinfo || '바로가기';
          a.style.color = '#3366cc';
          a.style.textDecoration = 'underline';
          td.appendChild(a);
        } else {
          td.textContent = v;
        }
        td.style.cssText = `
          padding: 5px 2px;
          border: 1px solid #eee;
          text-align: center;
          word-break: break-all;
          color: #222;
          max-width: 120px;
        `;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  // 꾸밈줄 생성
  createDecorationDiv() {
    const decoDiv = document.createElement('div');
    decoDiv.style.cssText = `
      text-align: center;
      margin: 16px 0 8px 0;
      font-weight: bold;
      letter-spacing: 2px;
    `;
    decoDiv.innerHTML = `
      <span style="background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;">〰 〰 〰 〰 〰 〰 〰 〰 〰</span><br>
      <span style="background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;">〰 〰</span>
      <span style="font-size:18px;">👑</span>
      <span style="font-size:15px;vertical-align:middle;color:#222;">기여자</span>
      <span style="font-size:18px;">👑</span>
      <span style="background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;">〰 〰</span><br>
      <span style="background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;">〰 〰 〰 〰 〰 〰 〰 〰 〰</span>
    `;
    return decoDiv;
  }
}

export default ProgramInfoModal; 