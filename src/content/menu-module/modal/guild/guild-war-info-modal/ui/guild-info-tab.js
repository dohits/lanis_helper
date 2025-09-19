import { GuildAccordion } from './guild-accordion.js';
import AttackDefenseCalculator from '../data/attack-defense-calculator.js';
import WarLogCollector from '../../../../../dom-modules/war-log-collector/WarLogCollector.js';

class GuildInfoTab {
  constructor() {
    try {
      this.accordion = new GuildAccordion();
    } catch (error) {
      console.error('[GuildInfoTab] GuildAccordion 초기화 실패:', error);
      this.accordion = null;
    }
    this.isOrderMode = false;
    this.orderButton = null;
    this.currentContentArea = null;
    
    // 공격권/수비권 계산기 초기화
    this.calculator = new AttackDefenseCalculator();
    this.warLogCollector = new WarLogCollector();
  }

  show(contentArea) {
    // 이전 콘텐츠 제거 (중복 렌더링 방지)
    if (contentArea) contentArea.innerHTML = '';

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 4px;
    `;

    // 버튼 섹션
    const buttonSection = document.createElement('div');
    buttonSection.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    `;

    const orderButton = document.createElement('button');
    orderButton.textContent = '순서 변경';
    orderButton.style.cssText = `
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;

    orderButton.addEventListener('mouseenter', () => {
      orderButton.style.background = '#0056b3';
    });

    orderButton.addEventListener('mouseleave', () => {
      orderButton.style.background = '#007bff';
    });

    orderButton.addEventListener('click', () => {
      this.handleOrderChange(orderButton, contentArea);
    });

    // orderButton을 클래스 속성으로 저장
    this.orderButton = orderButton;
    this.currentContentArea = contentArea;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '전체 삭제';
    deleteButton.style.cssText = `
      padding: 10px 20px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;

    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.background = '#b91c1c';
    });

    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.background = '#dc2626';
    });

    deleteButton.addEventListener('click', () => {
      this.handleGuildInfoDeletion(deleteButton, contentArea);
    });

    buttonSection.appendChild(orderButton);
    buttonSection.appendChild(deleteButton);
    content.appendChild(buttonSection);

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    loadingDiv.textContent = '길드 정보를 불러오는 중...';
    content.appendChild(loadingDiv);

    contentArea.appendChild(content);

    try {
      const savedGuilds = this.getSavedGuildList();
      if (savedGuilds.length > 0) {
        content.removeChild(loadingDiv);
        const list = document.createElement('div');
        list.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 4px;
        `;

        savedGuilds.forEach(guild => {
          const accordion = this.createGuildAccordion(guild);
          list.appendChild(accordion);
        });

        content.appendChild(list);
      } else {
        loadingDiv.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 48px; margin-bottom: 16px;">🏰</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">저장된 길드 정보가 없습니다</div>
            <div style="font-size: 14px; color: #6b7280;">길드 페이지를 방문하면 자동으로 정보가 수집됩니다</div>
          </div>
        `;
        loadingDiv.style.padding = '60px 20px';
      }
    } catch (error) {
      console.error('[GuildInfoTab] 길드 정보 로드 중 오류:', error);
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc2626;">길드 정보를 불러오는 중 오류가 발생했습니다</div>
          <div style="font-size: 14px; color: #6b7280;">잠시 후 다시 시도해주세요</div>
        </div>
      `;
      loadingDiv.style.padding = '60px 20px';
    }
  }

  createGuildAccordion(guild) {
    // accordion이 없으면 기본 div로 대체
    if (!this.accordion) {
      const fallbackDiv = document.createElement('div');
      fallbackDiv.style.cssText = `
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 12px;
        background: white;
        padding: 12px 16px;
      `;
      fallbackDiv.innerHTML = `
        <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">${guild.name}</div>
        <div style="color: #6b7280; font-size: 14px;">길드 정보를 표시할 수 없습니다</div>
      `;
      return fallbackDiv;
    }

    const headerTitle = guild.name;
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
    `;

    if (guild.info.members && guild.info.members.length > 0) {
      const membersList = document.createElement('div');
      membersList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
        font-size: 13px;
        color: #1f2937;
      `;

      guild.info.members.forEach(member => {
        const memberSector = document.createElement('div');
        memberSector.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        `;

        const memberName = document.createElement('div');
        memberName.style.cssText = `
          font-weight: 600;
          color: #374151;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s ease;
        `;
        memberName.textContent = `👤 ${member.nickname}`;
        
        // 길드원 이름 클릭 이벤트 추가
        memberName.addEventListener('click', () => {
          this.showUserWarLogs(member.nickname);
        });
        
        memberName.addEventListener('mouseenter', () => {
          memberName.style.color = '#3b82f6';
        });
        
        memberName.addEventListener('mouseleave', () => {
          memberName.style.color = '#374151';
        });
        
        memberSector.appendChild(memberName);

        const memberInfo = document.createElement('div');
        memberInfo.style.cssText = `
          color: #6b7280;
          font-size: 11px;
          line-height: 1.3;
          min-height: 16px;
        `;
        memberInfo.textContent = member.position || '길드원';
        memberSector.appendChild(memberInfo);

        // 공격권/수비권 잔여량 표시
        const rightsInfo = this.getMemberRightsInfo(member.nickname);
        if (rightsInfo) {
          const rightsElement = document.createElement('div');
          rightsElement.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 4px;
            font-size: 10px;
          `;

          const attackRights = document.createElement('span');
          attackRights.style.cssText = `
            color: #dc2626;
            font-weight: 600;
          `;
          attackRights.textContent = `⚔️ ${rightsInfo.attackRights}`;
          rightsElement.appendChild(attackRights);

          const defenseRights = document.createElement('span');
          defenseRights.style.cssText = `
            color: #059669;
            font-weight: 600;
          `;
          defenseRights.textContent = `🛡️ ${rightsInfo.defenseRights}`;
          rightsElement.appendChild(defenseRights);

          memberSector.appendChild(rightsElement);
        }

        const memberDescription = document.createElement('div');
        memberDescription.style.cssText = `
          color: #9ca3af;
          font-size: 10px;
          font-style: italic;
          min-height: 12px;
        `;
        memberDescription.textContent = '';
        memberSector.appendChild(memberDescription);

        membersList.appendChild(memberSector);
      });

      content.appendChild(membersList);
    }

    // this.accordion이 존재할 때만 createAccordion 호출
    try {
      const accordion = this.accordion.createAccordion(headerTitle, content, false);
      // 길드 이름을 data 속성으로 추가 (순서 변경 기능용)
      accordion.setAttribute('data-guild-name', guild.name);
      return accordion;
    } catch (error) {
      console.error('[GuildInfoTab] 아코디언 생성 실패:', error);
      // 에러 발생 시 fallback div 반환
      const fallbackDiv = document.createElement('div');
      fallbackDiv.style.cssText = `
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 12px;
        background: white;
        padding: 12px 16px;
      `;
      fallbackDiv.innerHTML = `
        <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">${headerTitle}</div>
        <div style="color: #6b7280; font-size: 14px;">길드 정보를 표시할 수 없습니다</div>
      `;
      fallbackDiv.setAttribute('data-guild-name', guild.name);
      return fallbackDiv;
    }
  }

  getSavedGuildList() {
    try {
      const storageKey = 'lanis_guild_info';
      const data = localStorage.getItem(storageKey);
      const allData = data ? JSON.parse(data) : {};
      return Object.keys(allData).map(guildName => ({ name: guildName, info: allData[guildName] }));
    } catch (e) {
      return [];
    }
  }

  // 순서 변경 처리
  async handleOrderChange(button, contentArea) {
    if (!this.isOrderMode) {
      // 순서 변경 모드 시작
      this.isOrderMode = true;
      button.textContent = '순서 저장';
      button.style.background = '#059669';
      
      // 아코디언에 이동 버튼 추가
      this.addOrderButtonsToAccordions();
      
      this.showNotification('순서 변경 모드가 활성화되었습니다. ▲▼ 버튼으로 순서를 변경하세요.', 'info');
    } else {
      // 순서 저장
      const originalText = button.textContent;
      button.textContent = '저장 중...';
      button.style.background = '#6b7280';
      button.disabled = true;

      try {
        this.saveGuildOrder();
        this.isOrderMode = false;
        button.textContent = '순서 변경';
        button.style.background = '#007bff';
        
        // 아코디언에서 이동 버튼 제거
        this.removeOrderButtonsFromAccordions();
        
        this.showNotification('길드 순서가 저장되었습니다.', 'success');
      } catch (error) {
        console.error('[GuildInfoTab] 순서 저장 중 오류:', error);
        this.showNotification('순서 저장 중 오류가 발생했습니다.', 'error');
      } finally {
        button.disabled = false;
      }
    }
  }

  // 길드 정보 전체 삭제 처리
  async handleGuildInfoDeletion(button, contentArea) {
    const originalText = button.textContent;
    button.textContent = '삭제 중...';
    button.style.background = '#6b7280';
    button.disabled = true;

    try {
      localStorage.removeItem('lanis_guild_info');
      this.show(contentArea);
      this.showNotification('전체 길드 정보가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('[GuildInfoTab] 길드 정보 전체 삭제 중 오류:', error);
      this.showNotification('전체 길드 정보 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      button.textContent = originalText;
      button.style.background = '#dc2626';
      button.disabled = false;
    }
  }

  // 알림 메시지 표시
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      z-index: 10025;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: opacity 0.3s ease;
    `;

    if (type === 'success') {
      notification.style.background = '#059669';
    } else if (type === 'error') {
      notification.style.background = '#dc2626';
    } else {
      notification.style.background = '#3b82f6';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 아코디언에 이동 버튼 추가
  addOrderButtonsToAccordions() {
    const accordions = this.currentContentArea.querySelectorAll('[data-guild-name]');
    accordions.forEach((accordion, index) => {
      const header = accordion.querySelector('div[style*="display: flex"]');
      if (header && !header.querySelector('.order-buttons')) {
        // 순서 변경 모드 플래그 설정 및 화살표 숨김
        accordion.setAttribute('data-order-mode', 'true');
        header.style.cursor = 'default';
        header.style.pointerEvents = 'none'; // 헤더 전체 클릭 차단
        const arrowElement = header.children && header.children[1] ? header.children[1] : null;
        if (arrowElement) {
          arrowElement.style.display = 'none';
        }

        const orderButtons = document.createElement('div');
        orderButtons.className = 'order-buttons';
        orderButtons.style.cssText = `
          display: flex;
          gap: 4px;
          margin-left: 8px;
          pointer-events: auto; // 순서 변경 버튼만 클릭 가능
        `;

        // 위로 이동 버튼
        const upButton = document.createElement('button');
        upButton.textContent = '▲';
        upButton.style.cssText = `
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        `;
        upButton.disabled = index === 0;
        if (index === 0) {
          upButton.style.background = '#9ca3af';
          upButton.style.cursor = 'not-allowed';
        }
        upButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.moveGuildUpElement(accordion);
        });
        upButton.addEventListener('mouseenter', () => {
          if (!upButton.disabled) upButton.style.background = '#2563eb';
        });
        upButton.addEventListener('mouseleave', () => {
          if (!upButton.disabled) upButton.style.background = '#3b82f6';
        });

        // 아래로 이동 버튼
        const downButton = document.createElement('button');
        downButton.textContent = '▼';
        downButton.style.cssText = `
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        `;
        downButton.disabled = index === accordions.length - 1;
        if (index === accordions.length - 1) {
          downButton.style.background = '#9ca3af';
          downButton.style.cursor = 'not-allowed';
        }
        downButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.moveGuildDownElement(accordion);
        });
        downButton.addEventListener('mouseenter', () => {
          if (!downButton.disabled) downButton.style.background = '#2563eb';
        });
        downButton.addEventListener('mouseleave', () => {
          if (!downButton.disabled) downButton.style.background = '#3b82f6';
        });

        orderButtons.appendChild(upButton);
        orderButtons.appendChild(downButton);
        header.appendChild(orderButtons);
      }
    });
  }

  // 아코디언에서 이동 버튼 제거
  removeOrderButtonsFromAccordions() {
    const orderButtons = this.currentContentArea.querySelectorAll('.order-buttons');
    orderButtons.forEach(buttons => buttons.remove());
    
    // 아코디언 클릭 다시 활성화 및 화살표 복원
    const accordions = this.currentContentArea.querySelectorAll('[data-guild-name]');
    accordions.forEach(accordion => {
      const header = accordion.querySelector('div[style*="display: flex"]');
      if (header) {
        accordion.removeAttribute('data-order-mode');
        header.style.cursor = 'pointer';
        header.style.pointerEvents = 'auto'; // 헤더 클릭 다시 활성화
        const arrowElement = header.children && header.children[1] ? header.children[1] : null;
        if (arrowElement) {
          arrowElement.style.display = '';
        }
      }
    });
  }

  // 현재 엘리먼트 기준 위로 이동
  moveGuildUpElement(accordionEl) {
    const accordions = Array.from(this.currentContentArea.querySelectorAll('[data-guild-name]'));
    const index = accordions.indexOf(accordionEl);
    if (index <= 0) return;
    const prev = accordions[index - 1];
    accordionEl.parentNode.insertBefore(accordionEl, prev);
    this.updateOrderButtons();
  }

  // 현재 엘리먼트 기준 아래로 이동
  moveGuildDownElement(accordionEl) {
    const accordions = Array.from(this.currentContentArea.querySelectorAll('[data-guild-name]'));
    const index = accordions.indexOf(accordionEl);
    if (index === -1 || index >= accordions.length - 1) return;
    const next = accordions[index + 1];
    // current를 next 다음으로 이동
    accordionEl.parentNode.insertBefore(accordionEl, next.nextSibling);
    this.updateOrderButtons();
  }

  // 이동 버튼 상태 업데이트
  updateOrderButtons() {
    const accordions = Array.from(this.currentContentArea.querySelectorAll('[data-guild-name]'));
    accordions.forEach((accordion, index) => {
      const orderButtons = accordion.querySelector('.order-buttons');
      if (orderButtons) {
        const upButton = orderButtons.querySelector('button:first-child');
        const downButton = orderButtons.querySelector('button:last-child');

        // 위로 이동 버튼 상태
        const isFirst = index === 0;
        upButton.disabled = isFirst;
        if (isFirst) {
          upButton.style.background = '#9ca3af';
          upButton.style.cursor = 'not-allowed';
        } else {
          upButton.style.background = '#3b82f6';
          upButton.style.cursor = 'pointer';
        }

        // 아래로 이동 버튼 상태
        const isLast = index === accordions.length - 1;
        downButton.disabled = isLast;
        if (isLast) {
          downButton.style.background = '#9ca3af';
          downButton.style.cursor = 'not-allowed';
        } else {
          downButton.style.background = '#3b82f6';
          downButton.style.cursor = 'pointer';
        }
      }
    });
  }

  // 길드 순서 저장
  saveGuildOrder() {
    const accordions = this.currentContentArea.querySelectorAll('[data-guild-name]');
    const newOrder = [];
    
    accordions.forEach(accordion => {
      const guildName = accordion.getAttribute('data-guild-name');
      if (guildName) {
        newOrder.push(guildName);
      }
    });
    
    // localStorage에서 기존 데이터 가져오기
    const storageKey = 'lanis_guild_info';
    const existingData = localStorage.getItem(storageKey);
    const allData = existingData ? JSON.parse(existingData) : {};
    
    // 새로운 순서로 데이터 재구성
    const reorderedData = {};
    newOrder.forEach(guildName => {
      if (allData[guildName]) {
        reorderedData[guildName] = allData[guildName];
      }
    });
    
    // 저장
    localStorage.setItem(storageKey, JSON.stringify(reorderedData));
  }

  // 길드원의 공격권/수비권 잔여량 정보 가져오기 (가공된 데이터 사용)
  getMemberRightsInfo(memberName) {
    try {
      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0];
      
      // 가공된 전쟁 로그 데이터 가져오기
      const processedWarLogs = this.warLogCollector.processWarLogsWithGuildInfo();
      if (!Array.isArray(processedWarLogs) || processedWarLogs.length === 0) {
        return {
          attackRights: this.calculator.DAILY_ATTACK_LIMIT,
          defenseRights: this.calculator.DAILY_DEFENSE_LIMIT
        };
      }

      // 길드원 목록 가져오기 (현재 길드의 길드원들)
      const guildInfoData = localStorage.getItem('lanis_guild_info');
      if (!guildInfoData) {
        return {
          attackRights: this.calculator.DAILY_ATTACK_LIMIT,
          defenseRights: this.calculator.DAILY_DEFENSE_LIMIT
        };
      }

      const guildInfo = JSON.parse(guildInfoData);
      const allMembers = [];
      
      // 모든 길드의 길드원들을 하나의 배열로 합치기
      Object.values(guildInfo).forEach(guild => {
        if (guild.members && Array.isArray(guild.members)) {
          allMembers.push(...guild.members);
        }
      });

      // 계산 수행 (가공된 데이터 사용)
      const result = this.calculator.safeCalculate(processedWarLogs, allMembers, today);
      
      if (result.success) {
        return {
          attackRights: result.remainingAttacks[memberName] !== undefined ? result.remainingAttacks[memberName] : this.calculator.DAILY_ATTACK_LIMIT,
          defenseRights: result.remainingDefenses[memberName] !== undefined ? result.remainingDefenses[memberName] : this.calculator.DAILY_DEFENSE_LIMIT
        };
      } else {
        return {
          attackRights: this.calculator.DAILY_ATTACK_LIMIT,
          defenseRights: this.calculator.DAILY_DEFENSE_LIMIT
        };
      }
    } catch (error) {
      console.error('[GuildInfoTab] 권한 정보 계산 실패:', error);
      return {
        attackRights: this.calculator.DAILY_ATTACK_LIMIT,
        defenseRights: this.calculator.DAILY_DEFENSE_LIMIT
      };
    }
  }

  // 길드원의 전쟁 로그를 팝업으로 표시
  showUserWarLogs(memberName) {
    try {
      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0];
      
      // 가공된 전쟁 로그 데이터 가져오기
      const processedWarLogs = this.warLogCollector.processWarLogsWithGuildInfo();
      if (!Array.isArray(processedWarLogs) || processedWarLogs.length === 0) {
        this.showNotification('전쟁 로그 데이터를 불러올 수 없습니다.', 'error');
        return;
      }
      
      // 해당 유저와 관련된 오늘 로그 필터링
      const userLogs = processedWarLogs.filter(log => {
        const logDate = this.calculator.extractDateFromTimestamp(log.timestamp);
        if (logDate !== today) return false;
        
        // 공격자 또는 수비자로 참여한 로그
        const normalizedLog = this.calculator.normalizeLog(log);
        if (!normalizedLog) return false;
        
        return normalizedLog.attackerName === memberName || normalizedLog.defenderName === memberName;
      });

      if (userLogs.length === 0) {
        this.showNotification(`${memberName}님의 오늘 전쟁 로그가 없습니다.`, 'info');
        return;
      }

      // 팝업 생성
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10025;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      // 헤더
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 12px 12px 0 0;
      `;
      
      const title = document.createElement('h3');
      title.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      `;
      title.textContent = `${memberName}님의 오늘 전쟁 로그 (${userLogs.length}건)`;
      
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 24px;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      `;
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => popup.remove());
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = '#f3f4f6';
      });
      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'transparent';
      });
      
      header.appendChild(title);
      header.appendChild(closeButton);
      popup.appendChild(header);

      // 로그 목록 컨테이너
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      `;

      // 로그들을 시간순으로 정렬
      userLogs.sort((a, b) => this.getLogDateMs(b) - this.getLogDateMs(a));

      // 각 로그를 아코디언 형태로 표시
      userLogs.forEach((log, index) => {
        const normalizedLog = this.calculator.normalizeLog(log);
        if (!normalizedLog) return;

        const logAccordion = this.createLogAccordion(log, normalizedLog, memberName, index);
        contentContainer.appendChild(logAccordion);
      });

      popup.appendChild(contentContainer);
      document.body.appendChild(popup);

      // 팝업 외부 클릭 시 닫기
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 10024;
      `;
      overlay.addEventListener('click', () => {
        overlay.remove();
        popup.remove();
      });
      document.body.appendChild(overlay);

    } catch (error) {
      console.error('[GuildInfoTab] 사용자 전쟁 로그 표시 실패:', error);
      this.showNotification('전쟁 로그를 표시하는 중 오류가 발생했습니다.', 'error');
    }
  }

  // 개별 로그 아코디언 생성
  createLogAccordion(log, normalizedLog, memberName, index) {
    const accordion = document.createElement('div');
    accordion.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 8px;
      background: white;
      overflow: hidden;
    `;

    // 헤더
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;
    `;

    // 로그 요약 정보
    const summary = document.createElement('div');
    summary.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    `;

    const isAttacker = normalizedLog.attackerName === memberName;
    const headerDate = this.getLogDate(log);
    const time = headerDate ? headerDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

    // 로그 타입에 따라 다른 표시 방식 적용
    let displayText = '';
    let displayColor = '#374151';

    if (log.type.includes('공격')) {
      const role = isAttacker ? '공격' : '수비';
      const victoryForGuild = isAttacker ? (log.result === 'success') : (log.result === 'defeat');
      displayText = `[${time}] ${role} - ${victoryForGuild ? '승리' : '패배'}`;
      displayColor = victoryForGuild ? '#059669' : '#dc2626';
    } else if (log.type.includes('요새 개발')) {
      displayText = `[${time}] 요새 개발 - ${log.action || '개발'}`;
      displayColor = '#7c3aed';
    } else if (log.type.includes('요새 파괴')) {
      displayText = `[${time}] 요새 파괴 - ${log.action || '파괴'}`;
      displayColor = '#ea580c';
    } else if (log.type.includes('마을 점령')) {
      displayText = `[${time}] 마을 점령 - ${log.village || '점령'}`;
      displayColor = '#059669';
    } else {
      displayText = `[${time}] ${log.type} - ${log.result === 'success' ? '성공' : '실패'}`;
      displayColor = log.result === 'success' ? '#059669' : '#dc2626';
    }

    summary.textContent = displayText;
    summary.style.color = displayColor;

    // 화살표
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      transition: transform 0.2s ease;
    `;
    arrow.textContent = '▼';

    header.appendChild(summary);
    header.appendChild(arrow);
    accordion.appendChild(header);

    // 상세 내용
    const content = document.createElement('div');
    content.style.cssText = `
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      background: white;
    `;

    const contentInner = document.createElement('div');
    contentInner.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      line-height: 1.5;
      color: #374151;
    `;

    // 상세 정보 구성 (normalizedLog 기반)
    const details = [];
    
    // 플레이어 정보 (길드 정보 포함)
    if (normalizedLog.attackerName) {
      const guildText = normalizedLog.attackerGuild ? ` (${normalizedLog.attackerGuild})` : '';
      details.push(`플레이어: ${normalizedLog.attackerName}${guildText}`);
    }
    
    // 마을 정보 (원본에서 가져오기)
    if (log.village) {
      details.push(`마을: ${log.village}`);
    }
    
    // 대상 정보 (길드 정보 포함)
    if (normalizedLog.defenderName) {
      const guildText = log.targetguild ? ` (${log.targetguild})` : '';
      details.push(`대상: ${normalizedLog.defenderName}${guildText}`);
    } else if (log.target) {
      details.push(`대상: ${log.target}`);
    }
    
    // 행동 정보 (원본에서 가져오기)
    if (log.action) {
      details.push(`행동: ${log.action}`);
    }
    
    // 유형 정보 (원본에서 가져오기)
    details.push(`유형: ${log.type}`);
    
    // 결과 정보
    details.push(`결과: ${normalizedLog.isVictory ? '성공' : '실패'}`);
    
    // 시간 정보
    const detailDate = this.getLogDate(log);
    details.push(`시간: ${detailDate ? detailDate.toLocaleString('ko-KR') : '-'}`);

    contentInner.innerHTML = details.map(detail => `<div style="margin-bottom: 4px;">• ${detail}</div>`).join('');
    content.appendChild(contentInner);
    accordion.appendChild(content);

    // 클릭 이벤트
    header.addEventListener('click', () => {
      const isOpen = content.style.maxHeight !== '0px';
      if (isOpen) {
        content.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
        header.style.background = '#f9fafb';
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
        header.style.background = '#f3f4f6';
      }
    });

    return accordion;
  }
}

export { GuildInfoTab };

// ----- 클래스 하단에 유틸 메서드 추가 -----
GuildInfoTab.prototype.getLogDate = function (log) {
	try {
		if (!log) return null;
		const ts = log.timestamp;
		const ca = log.collectedAt;
		let d = null;
		if (ts != null) {
			if (typeof ts === 'number') {
				d = new Date(ts);
			} else if (typeof ts === 'string') {
				const tryNative = new Date(ts);
				if (!isNaN(tryNative.getTime())) return tryNative;
				d = this.parseKoreanTimestamp(ts);
			}
		}
		if (!d && ca) {
			const d2 = new Date(ca);
			if (!isNaN(d2.getTime())) return d2;
		}
		return d;
	} catch (_) {
		return null;
	}
};

GuildInfoTab.prototype.getLogDateMs = function (log) {
	const d = this.getLogDate(log);
	return d ? d.getTime() : 0;
};

GuildInfoTab.prototype.parseKoreanTimestamp = function (s) {
	try {
		if (typeof s !== 'string') return null;
		// 예: 2025. 8. 6. 오후 9:59:59
		const reAmPm = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/;
		const m1 = s.match(reAmPm);
		if (m1) {
			const year = parseInt(m1[1], 10);
			const month = parseInt(m1[2], 10) - 1;
			const day = parseInt(m1[3], 10);
			const ap = m1[4];
			let hour = parseInt(m1[5], 10);
			const minute = parseInt(m1[6], 10);
			const second = m1[7] ? parseInt(m1[7], 10) : 0;
			if (ap === '오후' && hour < 12) hour += 12;
			if (ap === '오전' && hour === 12) hour = 0;
			const d = new Date(year, month, day, hour, minute, second);
			return isNaN(d.getTime()) ? null : d;
		}
		// 예: 2025. 8. 6 21:59:59 또는 2025-08-06 21:59:59
		const re24 = /(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/;
		const m2 = s.match(re24);
		if (m2) {
			const year = parseInt(m2[1], 10);
			const month = parseInt(m2[2], 10) - 1;
			const day = parseInt(m2[3], 10);
			const hour = parseInt(m2[4], 10);
			const minute = parseInt(m2[5], 10);
			const second = m2[6] ? parseInt(m2[6], 10) : 0;
			const d = new Date(year, month, day, hour, minute, second);
			return isNaN(d.getTime()) ? null : d;
		}
		return null;
	} catch (_) {
		return null;
	}
};

// 가공된 데이터를 사용하므로 더 이상 필요하지 않은 메서드
// buildNicknameToGuildMap은 제거됨 - 길드 정보는 log.playerguild와 log.targetguild에서 직접 가져옴
