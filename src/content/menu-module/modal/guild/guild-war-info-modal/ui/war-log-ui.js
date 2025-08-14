// 전쟁 로그 UI 컴포넌트
export class WarLogUI {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  // 전쟁 로그 헤더 생성
  createWarLogHeader(onCollect, onDeleteAll) {
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      padding: 0;
    `;

    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = `
      display: flex;
      gap: 2px;
      justify-content: center;
    `;

    // 수집 버튼
    const collectButton = document.createElement('button');
    collectButton.textContent = '📥 수집';
    collectButton.id = 'collect-war-logs-btn';
    collectButton.style.cssText = `
      padding: 6px 8px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      flex: 1;
      max-width: 80px;
    `;
    collectButton.addEventListener('click', onCollect);

    // 삭제 버튼
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️ 삭제';
    deleteButton.id = 'delete-all-war-logs-btn';
    deleteButton.style.cssText = `
      padding: 6px 8px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      flex: 1;
      max-width: 80px;
    `;
    deleteButton.addEventListener('click', onDeleteAll);

    actionButtons.appendChild(collectButton);
    actionButtons.appendChild(deleteButton);
    headerSection.appendChild(actionButtons);

    return headerSection;
  }

  // 전쟁 로그 목록 생성
  createWarLogList(warLogs, onDeleteLog) {
    const logContainer = document.createElement('div');
    logContainer.className = 'war-logs-container';
    logContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 60vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      width: 100%;
    `;

    if (warLogs.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 20px 8px;
        color: #666;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
        margin: 8px 0;
      `;
      emptyState.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">⚔️</div>
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">전쟁 로그가 없습니다</div>
        <div style="font-size: 11px; color: #666;">수집 버튼을 클릭하여 전쟁 로그를 수집해보세요</div>
      `;
      logContainer.appendChild(emptyState);
      return logContainer;
    }

    // 날짜별로 그룹화
    const groupedLogs = this.groupLogsByDate(warLogs);

    Object.keys(groupedLogs).forEach(date => {
      const dateGroup = this.createDateGroup(date, groupedLogs[date], onDeleteLog);
      logContainer.appendChild(dateGroup);
    });

    return logContainer;
  }

  // 날짜별로 로그 그룹화
  groupLogsByDate(warLogs) {
    const grouped = {};
    
    warLogs.forEach(log => {
      const date = this.extractDateFromTimestamp(log.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });

    // 날짜별로 정렬 (최신순)
    return Object.fromEntries(
      Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]))
    );
  }

  // 타임스탬프에서 날짜 추출
  extractDateFromTimestamp(timestamp) {
    try {
      const match = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return 'Unknown Date';
    } catch (error) {
      console.error('날짜 추출 실패:', error);
      return 'Unknown Date';
    }
  }

  // 날짜 그룹 생성
  createDateGroup(date, logs, onDeleteLog) {
    const dateGroup = document.createElement('div');
    dateGroup.className = 'date-group';
    dateGroup.style.cssText = `
      border: 1px solid #e9ecef;
      border-radius: 6px;
      overflow: hidden;
      background: white;
      margin-bottom: 4px;
    `;

    // 날짜 헤더
    const dateHeader = document.createElement('div');
    dateHeader.style.cssText = `
      background: #6c757d;
      color: white;
      padding: 6px 8px;
      font-weight: 600;
      font-size: 12px;
      text-align: center;
    `;
    dateHeader.textContent = `📅 ${date} (${logs.length}건)`;
    dateGroup.appendChild(dateHeader);

    // 로그 목록
    const logsList = document.createElement('div');
    logsList.style.cssText = `
      display: flex;
      flex-direction: column;
    `;

    logs.forEach((log, index) => {
      const logItem = this.createLogItem(log, onDeleteLog);
      if (index < logs.length - 1) {
        logItem.style.borderBottom = '1px solid #f0f0f0';
      }
      logsList.appendChild(logItem);
    });

    dateGroup.appendChild(logsList);
    return dateGroup;
  }

  // 로그 아이템 생성
  createLogItem(log, onDeleteLog) {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.style.cssText = `
      padding: 6px 8px;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    // 로그 타입과 시간
    const headerRow = document.createElement('div');
    headerRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4px;
    `;

    const typeBadge = document.createElement('span');
    typeBadge.textContent = log.type || '전쟁';
    typeBadge.style.cssText = `
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      color: white;
      background: #6c757d;
      white-space: nowrap;
    `;

    const timeInfo = document.createElement('span');
    timeInfo.style.cssText = `
      color: #666;
      font-size: 10px;
      white-space: nowrap;
    `;
    
    // 시간 추출 및 표시
    const timeMatch = log.timestamp.match(/(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const period = timeMatch[1];
      let hour = parseInt(timeMatch[2]);
      const minute = timeMatch[3];
      const second = timeMatch[4];
      
      if (period === '오후' && hour !== 12) {
        hour += 12;
      } else if (period === '오전' && hour === 12) {
        hour = 0;
      }
      
      timeInfo.textContent = `${hour.toString().padStart(2, '0')}:${minute}:${second}`;
    } else {
      timeInfo.textContent = log.timestamp;
    }

    headerRow.appendChild(typeBadge);
    headerRow.appendChild(timeInfo);

    // 로그 내용 (원본 텍스트 그대로 표시)
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      font-size: 11px;
      line-height: 1.3;
      color: #333;
      word-break: break-word;
      margin: 2px 0;
    `;
    contentDiv.textContent = log.content;

    // 결과 배지와 삭제 버튼
    const resultRow = document.createElement('div');
    resultRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4px;
    `;

    const resultBadge = document.createElement('span');
    resultBadge.style.cssText = `
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    `;

    if (log.result === '승리') {
      resultBadge.style.background = '#28a745';
      resultBadge.textContent = '승리';
    } else if (log.result === '패배') {
      resultBadge.style.background = '#dc3545';
      resultBadge.textContent = '패배';
    } else if (log.result === '점령') {
      resultBadge.style.background = '#007bff';
      resultBadge.textContent = '점령';
    } else {
      resultBadge.style.background = '#ffc107';
      resultBadge.style.color = '#212529';
      resultBadge.textContent = log.result || '기타';
    }

    // 삭제 버튼
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-log-btn';
    deleteButton.textContent = '🗑️';
    deleteButton.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      min-width: 24px;
    `;
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('이 전쟁 로그를 삭제하시겠습니까?')) {
        onDeleteLog(log.id);
      }
    });

    resultRow.appendChild(resultBadge);
    resultRow.appendChild(deleteButton);

    // 모든 요소를 로그 아이템에 추가
    logItem.appendChild(headerRow);
    logItem.appendChild(contentDiv);
    logItem.appendChild(resultRow);

    return logItem;
  }

  // 로딩 상태 표시
  createLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      padding: 20px 8px;
      color: #666;
    `;
    loadingDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
      <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">전쟁 로그 수집 중...</div>
      <div style="font-size: 10px; color: #666;">잠시만 기다려주세요</div>
    `;
    return loadingDiv;
  }

  // 성공 메시지 표시
  createSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      text-align: center;
      padding: 12px 8px;
      color: #155724;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      margin-bottom: 8px;
    `;
    successDiv.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 4px;">✅</div>
      <div style="font-size: 11px; font-weight: 600;">${message}</div>
    `;
    return successDiv;
  }

  // 에러 메시지 표시
  createErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      text-align: center;
      padding: 12px 8px;
      color: #721c24;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      margin-bottom: 8px;
    `;
    errorDiv.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 4px;">❌</div>
      <div style="font-size: 11px; font-weight: 600;">${message}</div>
    `;
    return errorDiv;
  }

  // 정보 메시지 표시
  createInfoMessage(message) {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      text-align: center;
      padding: 12px 8px;
      color: #0c5460;
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 6px;
      margin-bottom: 8px;
    `;
    infoDiv.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 4px;">ℹ️</div>
      <div style="font-size: 11px; font-weight: 600;">${message}</div>
    `;
    return infoDiv;
  }
}
