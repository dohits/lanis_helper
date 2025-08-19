import { GuildAccordion } from './guild-accordion.js';
import WarLogCollector from '../../../../../dom-modules/war-log-collector/WarLogCollector.js';

class WarLogTab {
  constructor() {
    try {
      this.accordion = new GuildAccordion();
    } catch (error) {
      console.error('[WarLogTab] GuildAccordion 초기화 실패:', error);
      this.accordion = null;
    }
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

    // 수집 버튼 섹션
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

    const collectButton = document.createElement('button');
    collectButton.textContent = '로그 수집';
    collectButton.style.cssText = `
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

    collectButton.addEventListener('mouseenter', () => {
      collectButton.style.background = '#0056b3';
    });

    collectButton.addEventListener('mouseleave', () => {
      collectButton.style.background = '#007bff';
    });

    collectButton.addEventListener('click', () => {
      this.handleWarLogCollection(collectButton, contentArea);
    });

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
      this.handleWarLogDeletion(deleteButton, contentArea);
    });

    buttonSection.appendChild(collectButton);
    buttonSection.appendChild(deleteButton);
    content.appendChild(buttonSection);

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
      font-size: 14px;
    `;
    loadingDiv.textContent = '전쟁 로그를 불러오는 중...';
    content.appendChild(loadingDiv);

    contentArea.appendChild(content);

    try {
      const warLogs = this.getSavedWarLogs();
      if (warLogs.length > 0) {
        content.removeChild(loadingDiv);
        
        // 날짜별로 로그 그룹화
        const logsByDate = this.groupLogsByDate(warLogs);
        
        // 날짜별 아코디언 생성
        Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
          const dateAccordion = this.createDateAccordion(date, logsByDate[date]);
          content.appendChild(dateAccordion);
        });

        // 데이터 개수 표시
        const countInfo = document.createElement('div');
        countInfo.style.cssText = `
          text-align: center;
          padding: 16px 12px;
          color: #6b7280;
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
          margin-top: 16px;
          background: #f9fafb;
          border-radius: 0 0 8px 8px;
        `;
        countInfo.textContent = `총 ${warLogs.length}개의 전쟁 로그`;
        content.appendChild(countInfo);

      } else {
        loadingDiv.innerHTML = `
          <div style="text-align: center; line-height: 1.6;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚔️</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">저장된 전쟁 로그가 없습니다</div>
            <div style="font-size: 14px; color: #6b7280;">전쟁 로그 페이지에서 수집 버튼을 눌러주세요</div>
          </div>
        `;
        loadingDiv.style.padding = '60px 20px';
      }
    } catch (error) {
      console.error('[WarLogTab] 전쟁 로그 로드 중 오류:', error);
      loadingDiv.innerHTML = `
        <div style="text-align: center; line-height: 1.6;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #dc2626;">전쟁 로그를 불러오는 중 오류가 발생했습니다</div>
          <div style="font-size: 14px; color: #6b7280;">잠시 후 다시 시도해주세요</div>
        </div>
      `;
      loadingDiv.style.padding = '60px 20px';
    }
  }

  // 전쟁 로그 수집 처리
  async handleWarLogCollection(button, contentArea) {
    const originalText = button.textContent;
    button.textContent = '수집 중...';
    button.style.background = '#6b7280';
    button.disabled = true;

    try {
      const collector = new WarLogCollector();
      const result = collector.manualCollectWarLogs();
      
      if (result.success) {
        this.show(contentArea);
        this.showNotification(result.message, 'success');
      } else {
        this.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('[WarLogTab] 전쟁 로그 수집 중 오류:', error);
      this.showNotification('전쟁 로그 수집 중 오류가 발생했습니다.', 'error');
    } finally {
      button.textContent = originalText;
      button.style.background = '#007bff';
      button.disabled = false;
    }
  }

  // 전쟁 로그 전체 삭제 처리
  async handleWarLogDeletion(button, contentArea) {
    const originalText = button.textContent;
    button.textContent = '삭제 중...';
    button.style.background = '#6b7280';
    button.disabled = true;

    try {
      localStorage.removeItem('lanis_war_logs');
      this.show(contentArea);
      this.showNotification('전체 전쟁 로그가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('[WarLogTab] 전쟁 로그 전체 삭제 중 오류:', error);
      this.showNotification('전체 전쟁 로그 삭제 중 오류가 발생했습니다.', 'error');
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

  // 날짜별 로그 그룹화
  groupLogsByDate(logs) {
    const grouped = {};
    
    logs.forEach(log => {
      const date = this.extractDateFromTimestamp(log.timestamp);
      if (date) {
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(log);
      }
    });
    
    return grouped;
  }

  // 날짜별 아코디언 생성
  createDateAccordion(date, logs) {
    const headerTitle = this.formatDateForDisplay(date);
    
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
    `;

    logs.forEach(log => {
      const logItem = this.createLogItem(log);
      content.appendChild(logItem);
    });

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
        <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">${headerTitle}</div>
        <div style="color: #6b7280; font-size: 14px;">전쟁 로그를 표시할 수 없습니다</div>
      `;
      return fallbackDiv;
    }

    // this.accordion이 존재할 때만 createAccordion 호출
    try {
      return this.accordion.createAccordion(headerTitle, content, false);
    } catch (error) {
      console.error('[WarLogTab] 아코디언 생성 실패:', error);
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
        <div style="color: #6b7280; font-size: 14px;">전쟁 로그를 표시할 수 없습니다</div>
      `;
      return fallbackDiv;
    }
  }

  // 개별 로그 아이템 생성 (새로운 데이터 구조 적용)
  createLogItem(log) {
    const logItem = document.createElement('div');
    logItem.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 4px solid ${this.getLogTypeColor(log.type)};
      font-size: 13px;
      color: #1f2937;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    `;

    const typeBadge = document.createElement('span');
    typeBadge.style.cssText = `
      background: ${this.getLogTypeColor(log.type)};
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    `;
    typeBadge.textContent = log.type;

    const timeText = document.createElement('span');
    timeText.style.cssText = `
      color: #6b7280;
      font-size: 11px;
    `;
    timeText.textContent = this.extractTimeFromTimestamp(log.timestamp);

    header.appendChild(typeBadge);
    header.appendChild(timeText);
    logItem.appendChild(header);

    // 새로운 데이터 구조에 맞는 내용 표시
    const content = document.createElement('div');
    content.style.cssText = `
      color: #374151;
      font-size: 12px;
      line-height: 1.4;
    `;
    content.textContent = log.description;
    logItem.appendChild(content);

    // 상세 정보 표시 (새로운 구조)
    if (log.player || log.village || log.target || log.action) {
      const details = document.createElement('div');
      details.style.cssText = `
        margin-top: 8px;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
        font-size: 11px;
      `;

      // 플레이어 정보 (길드 정보 포함)
      if (log.player) {
        const playerInfo = document.createElement('div');
        playerInfo.style.cssText = `
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 2px;
        `;
        const guildText = log.playerguild ? ` [${log.playerguild}]` : '';
        playerInfo.textContent = `플레이어: ${log.player}${guildText}`;
        details.appendChild(playerInfo);
      }

      // 마을 정보
      if (log.village) {
        const villageInfo = document.createElement('div');
        villageInfo.style.cssText = `
          color: #2563eb;
          font-weight: 600;
          margin-bottom: 2px;
        `;
        villageInfo.textContent = `마을: ${log.village}`;
        details.appendChild(villageInfo);
      }

      // 대상 정보 (길드 정보 포함)
      if (log.target) {
        const targetInfo = document.createElement('div');
        targetInfo.style.cssText = `
          color: #7c3aed;
          font-weight: 600;
          margin-bottom: 2px;
        `;
        const guildText = log.targetguild ? ` [${log.targetguild}]` : '';
        targetInfo.textContent = `대상: ${log.target}${guildText}`;
        details.appendChild(targetInfo);
      }

      // 행동 정보
      if (log.action) {
        const actionInfo = document.createElement('div');
        actionInfo.style.cssText = `
          color: #059669;
          font-weight: 600;
          margin-bottom: 2px;
        `;
        actionInfo.textContent = `행동: ${log.action}`;
        details.appendChild(actionInfo);
      }

      // 결과 정보
      if (log.result) {
        const resultInfo = document.createElement('div');
        resultInfo.style.cssText = `
          color: ${this.getResultColor(log.result)};
          font-weight: 600;
        `;
        resultInfo.textContent = `결과: ${log.result === 'success' ? '성공' : '실패'}`;
        details.appendChild(resultInfo);
      }

      logItem.appendChild(details);
    }

    return logItem;
  }

  getLogTypeColor(type) {
    const colors = {
      '공격 (승리)': '#dc2626',
      '공격 (패배)': '#dc2626',
      '마을 점령': '#059669',
      '요새 개발': '#7c3aed',
      '요새 파괴': '#7c3aed',
      '길드전': '#ea580c',
      '기타': '#6b7280'
    };
    
    // 타입에 '공격'이 포함되어 있으면 공격 색상 사용
    if (type && type.includes('공격')) {
      return colors['공격 (승리)'];
    }
    
    return colors[type] || colors['기타'];
  }

  getResultColor(result) {
    const colors = {
      'success': '#059669',
      'defeat': '#dc2626',
      '승리': '#059669',
      '패배': '#dc2626',
      '무승부': '#f59e0b',
      '점령': '#059669',
      '실패': '#dc2626',
      '파괴': '#7c3aed',
      '철수': '#6b7280'
    };
    return colors[result] || '#6b7280';
  }

  extractDateFromTimestamp(timestamp) {
    try {
      const match = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return null;
    } catch (error) {
      console.error('날짜 추출 실패:', error);
      return null;
    }
  }

  extractTimeFromTimestamp(timestamp) {
    try {
      const timeMatch = timestamp.match(/(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const period = timeMatch[1];
        const hour = parseInt(timeMatch[2]);
        const minute = timeMatch[3];
        const second = timeMatch[4];
        
        let adjustedHour = hour;
        if (period === '오후' && hour !== 12) {
          adjustedHour = hour + 12;
        } else if (period === '오전' && hour === 12) {
          adjustedHour = 0;
        }
        
        return `${adjustedHour.toString().padStart(2, '0')}:${minute}:${second}`;
      }
      return '';
    } catch (error) {
      console.error('시간 추출 실패:', error);
      return '';
    }
  }

  formatDateForDisplay(dateString) {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return '오늘';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '어제';
      } else {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
      }
    } catch (error) {
      return dateString;
    }
  }

  getSavedWarLogs() {
    try {
      // 새로운 데이터 처리기를 사용하여 길드 정보가 포함된 전쟁로그 데이터 반환
      const warLogCollector = new WarLogCollector();
      return warLogCollector.processWarLogsWithGuildInfo();
    } catch (error) {
      console.error('전쟁 로그 조회 실패:', error);
      return [];
    }
  }
}

export { WarLogTab };
