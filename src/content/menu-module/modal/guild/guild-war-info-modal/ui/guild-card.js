// 길드 카드 UI 컴포넌트
export class GuildCard {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  // 길드 카드 생성
  createGuildCard(guild, index, onDelete, onToggleEdit) {
    const card = document.createElement('div');
    card.className = 'guild-card';
    card.setAttribute('data-index', index);
    card.style.cssText = `
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      overflow: hidden;
    `;

    const info = guild.info;
    const collectedDate = new Date(info.collectedAt).toLocaleString('ko-KR');

    // 헤더 생성
    const header = this.createCardHeader(info, index, onToggleEdit);
    card.appendChild(header);

    // 상세 내용 생성
    const content = this.createCardContent(guild, onDelete);
    card.appendChild(content);

    // 클릭 이벤트로 접기/펼치기
    header.addEventListener('click', () => {
      this.toggleCardContent(card, content);
    });

    return card;
  }

  // 카드 헤더 생성
  createCardHeader(info, index, onToggleEdit) {
    const header = document.createElement('div');
    header.className = 'guild-card-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      cursor: pointer;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
      transition: background 0.2s ease;
    `;

    header.addEventListener('mouseenter', () => {
      header.style.background = 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
    });

    header.addEventListener('mouseleave', () => {
      header.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    });

    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const guildIcon = document.createElement('div');
    guildIcon.textContent = '🏰';
    guildIcon.style.cssText = `
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    const guildInfo = document.createElement('div');
    guildInfo.innerHTML = `
      <div class="guild-name" style="font-weight: 600; color: #333; font-size: 16px; margin-bottom: 2px;">
        ${info.guildName}
      </div>
      <div style="color: #666; font-size: 12px;">
        👑 ${info.guildMaster} • ⭐ ${info.guildLevel} • 👥 ${info.memberCount}
      </div>
    `;

    const expandIcon = document.createElement('div');
    expandIcon.className = 'expand-icon';
    expandIcon.textContent = '▼';
    expandIcon.style.cssText = `
      font-size: 14px;
      color: #666;
      transition: transform 0.3s ease;
    `;

    headerLeft.appendChild(guildIcon);
    headerLeft.appendChild(guildInfo);
    header.appendChild(headerLeft);
    header.appendChild(expandIcon);

    return header;
  }

  // 카드 내용 생성
  createCardContent(guild, onDelete) {
    const content = document.createElement('div');
    content.className = 'guild-card-content';
    content.style.cssText = `
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      background: white;
    `;

    const info = guild.info;
    const collectedDate = new Date(info.collectedAt).toLocaleString('ko-KR');

    // 길드원 목록
    const membersSection = this.createMembersSection(info.members);
    content.appendChild(membersSection);

    // 수집 정보
    const collectionInfo = document.createElement('div');
    collectionInfo.style.cssText = `
      padding: 12px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    collectionInfo.innerHTML = `
      <span>📅 수집 시간: ${collectedDate}</span>
      <span>👥 총 ${info.members.length}명</span>
    `;

    // 삭제 버튼
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-guild-btn';
    deleteButton.textContent = '🗑️ 삭제';
    deleteButton.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.2s ease;
    `;
    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.background = '#c82333';
    });
    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.background = '#dc3545';
    });
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`"${info.guildName}" 길드 정보를 삭제하시겠습니까?`)) {
        onDelete(info.guildName);
      }
    });

    collectionInfo.appendChild(deleteButton);
    content.appendChild(collectionInfo);

    return content;
  }

  // 길드원 목록 섹션 생성
  createMembersSection(members) {
    const membersSection = document.createElement('div');
    membersSection.style.cssText = `
      padding: 16px;
    `;

    const membersTitle = document.createElement('h4');
    membersTitle.textContent = '👥 길드원 목록';
    membersTitle.style.cssText = `
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    `;
    membersSection.appendChild(membersTitle);

    const membersList = document.createElement('div');
    membersList.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    `;

    members.forEach(member => {
      const memberItem = this.createMemberItem(member);
      membersList.appendChild(memberItem);
    });

    membersSection.appendChild(membersList);
    return membersSection;
  }

  // 길드원 아이템 생성
  createMemberItem(member) {
    const memberItem = document.createElement('div');
    memberItem.style.cssText = `
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const memberInfo = document.createElement('div');
    memberInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;

    const memberName = document.createElement('div');
    memberName.textContent = member.nickname;
    memberName.style.cssText = `
      font-weight: 600;
      color: #333;
    `;

    const memberDetails = document.createElement('div');
    memberDetails.style.cssText = `
      color: #666;
      font-size: 11px;
    `;
    memberDetails.textContent = `Lv.${member.level} • ${member.job || '직업 없음'}`;

    memberInfo.appendChild(memberName);
    memberInfo.appendChild(memberDetails);

    const memberStatus = document.createElement('div');
    memberStatus.style.cssText = `
      font-size: 11px;
      color: #666;
    `;
    memberStatus.textContent = member.status || '온라인';

    memberItem.appendChild(memberInfo);
    memberItem.appendChild(memberStatus);

    return memberItem;
  }

  // 카드 내용 접기/펼치기
  toggleCardContent(card, content) {
    const expandIcon = card.querySelector('.expand-icon');
    const isExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';

    if (isExpanded) {
      content.style.maxHeight = '0';
      expandIcon.style.transform = 'rotate(0deg)';
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
      expandIcon.style.transform = 'rotate(180deg)';
    }
  }
}
