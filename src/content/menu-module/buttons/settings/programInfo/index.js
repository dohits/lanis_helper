/*
// 프로그램 정보 모달 (분리 모듈)
export function openProgramInfoModal(version) {
  // 기존 모달 제거
  const existingModal = document.querySelector('.program-info-modal');
  if (existingModal) existingModal.remove();

  showModal(version);

  function showModal(version) {
    const modal = document.createElement('div');
    modal.className = 'program-info-modal user-search-modal';
    const content = document.createElement('div');
    content.className = 'user-search-content';
    // 헤더
    const header = document.createElement('div');
    header.className = 'user-search-header';
    const title = document.createElement('h3');
    title.textContent = '프로그램 정보';
    const closeButton = document.createElement('button');
    closeButton.className = 'user-search-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => modal.remove();
    header.appendChild(title);
    header.appendChild(closeButton);
    // 본문
    const infoDiv = document.createElement('div');
    infoDiv.style.margin = '24px 0 12px 0';
    infoDiv.style.fontSize = '16px';
    infoDiv.style.color = '#374151';
    infoDiv.innerHTML =
      `<b>버전:</b> v${version}<br><br>` +
      `본 프로그램은 <b>유저 비공식 확장</b>입니다.<br><br>` +
      `문의: 인게임 메일 <b>도히님</b>`;
    // 조립
    content.appendChild(header);
    content.appendChild(infoDiv);
    modal.appendChild(content);
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('show'); }, 10);
    // ESC, 외부 클릭 닫기
    const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
    document.addEventListener('keydown', handleEsc);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
}
*/ 