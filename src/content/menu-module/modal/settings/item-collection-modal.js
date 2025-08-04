import BaseModal from '../base/base-modal.js';

class ItemCollectionModal extends BaseModal {
  constructor() {
    super({
      id: 'itemCollectionModal',
      title: '아이템 수집 관리',
      className: 'item-collection-modal',
      contentClassName: 'item-collection-modal-content',
      maxWidth: '600px',
      maxHeight: '500px',
      closeOnOutsideClick: true,
      closeOnEsc: true
    });
    
    this.init();
  }

  init() {
    // 초기화 시에는 콘텐츠를 생성하지 않음
    // open() 메서드에서 필요할 때 생성
    
    // 프로그레스바 이벤트 리스너 등록
    this.progressListener = (event) => {
      const { current, total, batch, totalBatches } = event.detail;
      this.updateProgress(current, total, batch, totalBatches);
    };
    
    window.addEventListener('itemCollectionProgress', this.progressListener);
  }

  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 24px;
    `;

    // 수집 섹션
    const collectionSection = this.createCollectionSection();
    content.appendChild(collectionSection);

    // 마지막 수집시간 섹션
    const lastCollectionSection = this.createLastCollectionSection();
    content.appendChild(lastCollectionSection);

    this.setContent(content);
  }

  createCollectionSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    const title = document.createElement('h4');
    title.textContent = '레어 아이템 데이터 수집';
    title.style.cssText = `
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #374151;
    `;

    const description = document.createElement('p');
    description.textContent = 'Lanis 위키에서 레어 아이템 정보를 수집합니다.';
    description.style.cssText = `
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    `;

    const crawlButton = this.createButton('레어 아이템 데이터 수집', 'primary', () => this.startCrawling());
    crawlButton.id = 'crawlButton';

    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      min-height: 20px;
    `;

    // 프로그레스바 컨테이너
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progressContainer';
    progressContainer.style.cssText = `
      display: none;
      margin-top: 12px;
    `;

    // 프로그레스바
    const progressBar = document.createElement('div');
    progressBar.id = 'progressBar';
    progressBar.style.cssText = `
      width: 100%;
      height: 8px;
      background-color: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'progressFill';
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: #3b82f6;
      border-radius: 4px;
      transition: width 0.3s ease;
    `;

    // 진행률 텍스트
    const progressText = document.createElement('div');
    progressText.id = 'progressText';
    progressText.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      text-align: right;
    `;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(crawlButton);
    section.appendChild(statusDiv);
    section.appendChild(progressContainer);

    return section;
  }

  createLastCollectionSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    const title = document.createElement('h4');
    title.textContent = '수집 정보';
    title.style.cssText = `
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #374151;
    `;

    const lastCollectionDiv = document.createElement('div');
    lastCollectionDiv.id = 'lastCollection';
    lastCollectionDiv.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      min-height: 20px;
    `;

    // 마지막 수집시간 표시
    this.updateLastCollectionTime();

    section.appendChild(title);
    section.appendChild(lastCollectionDiv);

    return section;
  }

  open() {
    // 모달을 먼저 열고 콘텐츠 생성
    super.open();
    this.createContent();
    this.updateLastCollectionTime();
  }

  close() {
    // 이벤트 리스너 정리
    if (this.progressListener) {
      window.removeEventListener('itemCollectionProgress', this.progressListener);
    }
    super.close();
  }

  // HTML 이스케이프 함수
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 마지막 수집시간 업데이트
  async updateLastCollectionTime() {
    const lastCollectionElement = this.body?.querySelector('#lastCollection');
    if (!lastCollectionElement) return;

    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        lastCollectionElement.textContent = '페이지 새로고침 후 다시 시도해주세요.';
        return;
      }

      const result = await chrome.storage.local.get(['lastCollectionTime', 'rareItems']);
      const lastTime = result.lastCollectionTime;
      const items = result.rareItems || [];
      
      if (lastTime && items.length > 0) {
        const date = new Date(lastTime);
        const formattedTime = date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        lastCollectionElement.textContent = `마지막 수집시간: ${formattedTime} (${items.length}개 아이템)`;
      } else if (lastTime) {
        const date = new Date(lastTime);
        const formattedTime = date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        lastCollectionElement.textContent = `마지막 수집시간: ${formattedTime} (데이터 없음)`;
      } else {
        lastCollectionElement.textContent = '데이터를 수집해주세요.';
      }
    } catch (error) {
      console.error('마지막 수집시간 업데이트 실패:', error);
      if (error.message.includes('Extension context invalidated')) {
        lastCollectionElement.textContent = '페이지 새로고침 후 다시 시도해주세요.';
      } else {
        lastCollectionElement.textContent = '데이터를 수집해주세요.';
      }
    }
  }

  // 아이템 목록 보기
  showItemsList() {
    // 새 창에서 아이템 목록 표시
    const itemsWindow = window.open('', 'itemsList', 'width=400,height=600,scrollbars=yes,resizable=yes');
    
    // 새 창에 HTML 내용 작성 (안전한 방식)
    const safeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>스캔된 아이템 목록</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
          }
          .items-container {
            max-height: 500px;
            overflow-y: auto;
            background-color: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            background-color: white;
            margin-bottom: 8px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .item-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .item-stats {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
          }
          .item-abilities {
            font-size: 11px;
            color: #888;
          }
          .loading {
            text-align: center;
            color: #666;
            padding: 20px;
          }
          .no-items {
            text-align: center;
            color: #666;
            padding: 20px;
          }
          .count {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>스캔된 아이템 목록</h2>
        </div>
        <div id="itemsContainer" class="items-container">
          <div class="loading">아이템을 로드하는 중...</div>
        </div>
        <div id="count" class="count">총 0개 아이템</div>
      </body>
      </html>
    `;
    
    // document.write 대신 안전한 방식 사용
    itemsWindow.document.open();
    itemsWindow.document.write(safeHtml);
    itemsWindow.document.close();
    
    // chrome.storage.local에서 아이템 데이터 로드
    chrome.storage.local.get(['rareItems'], function(result) {
      const itemsContainer = itemsWindow.document.getElementById('itemsContainer');
      const countElement = itemsWindow.document.getElementById('count');
      
      if (result.rareItems && result.rareItems.length > 0) {
        const items = result.rareItems;
        
        // 아이템을 가나다순으로 정렬
        items.sort((a, b) => {
          const nameA = (a.name || '').trim();
          const nameB = (b.name || '').trim();
          return nameA.localeCompare(nameB, 'ko');
        });
        
        // 아이템 목록 생성 (안전한 방식)
        items.forEach((item, index) => {
          const itemName = this.escapeHtml(item.name || '알 수 없는 아이템');
          const type = this.escapeHtml(item.type || ''); // 반드시 type 필드만 사용
          const typeDisplay = type ? ` (${type})` : '';
          const powerRange = (item.power_min !== null && item.power_min !== undefined && item.power_max !== null && item.power_max !== undefined) ? `${item.power_min}-${item.power_max}` : 'N/A';
          const weightRange = (item.weight_min !== null && item.weight_min !== undefined && item.weight_max !== null && item.weight_max !== undefined) ? `${item.weight_min}-${item.weight_max}` : 'N/A';
          const abilities = item.abilities && item.abilities.length > 0 ? 
            item.abilities.map(ability => this.escapeHtml(ability)).join(', ') : 'N/A';
          // 타입이 있을 때만 괄호로 표시
          const itemDiv = itemsWindow.document.createElement('div');
          itemDiv.className = 'item';
          const nameDiv = itemsWindow.document.createElement('div');
          nameDiv.className = 'item-name';
          nameDiv.textContent = itemName + typeDisplay;
          const statsDiv = itemsWindow.document.createElement('div');
          statsDiv.className = 'item-stats';
          statsDiv.textContent = `위력: ${powerRange} | 무게: ${weightRange}`;
          const abilitiesDiv = itemsWindow.document.createElement('div');
          abilitiesDiv.className = 'item-abilities';
          abilitiesDiv.textContent = `어빌리티: ${abilities}`;
          itemDiv.appendChild(nameDiv);
          itemDiv.appendChild(statsDiv);
          itemDiv.appendChild(abilitiesDiv);
          itemsContainer.appendChild(itemDiv);
        });
        
        countElement.textContent = `총 ${items.length}개 아이템`;
             } else {
         const noItemsDiv = itemsWindow.document.createElement('div');
         noItemsDiv.className = 'no-items';
         noItemsDiv.textContent = '데이터를 수집해주세요.';
         itemsContainer.appendChild(noItemsDiv);
         countElement.textContent = '총 0개 아이템';
       }
    }.bind(this));
  }

  // 현재 content script 파일명 가져오기
  getContentScriptFile() {
    try {
      // manifest.json에서 content script 파일명 동적 가져오기 (동기적)
      const manifest = chrome.runtime.getManifest();
      if (manifest.content_scripts && manifest.content_scripts[0] && manifest.content_scripts[0].js) {
        return Promise.resolve(manifest.content_scripts[0].js[0]);
      } else {
        // fallback: 기본 파일명
        return Promise.resolve('assets/content-CkqkcPsI.js');
      }
    } catch (error) {
      // 오류 시 fallback
      console.warn('manifest 가져오기 실패, 기본 파일명 사용:', error);
      return Promise.resolve('assets/content-CkqkcPsI.js');
    }
  }

  // 프로그레스바 업데이트
  updateProgress(current, total, batch, totalBatches) {
    const progressContainer = this.body?.querySelector('#progressContainer');
    const progressFill = this.body?.querySelector('#progressFill');
    const progressText = this.body?.querySelector('#progressText');
    
    if (progressContainer && progressFill && progressText) {
      const percentage = Math.round((current / total) * 100);
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${current}/${total}개 아이템 (배치 ${batch}/${totalBatches})`;
    }
  }

  // 프로그레스바 표시/숨김
  showProgress() {
    const progressContainer = this.body?.querySelector('#progressContainer');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
  }

  hideProgress() {
    const progressContainer = this.body?.querySelector('#progressContainer');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }

  // API 수집 시작
  startCrawling() {
    const button = this.body?.querySelector('#crawlButton');
    const status = this.body?.querySelector('#status');
    
    try {
      // 확장 프로그램 컨텍스트 유효성 검사
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        status.textContent = '페이지 새로고침 후 다시 시도해주세요.';
        return;
      }
      
      // 버튼 비활성화
      button.disabled = true;
      button.textContent = '수집 중...';
      status.textContent = '레어 아이템 데이터를 수집하고 있습니다...';
      
      // 프로그레스바 표시
      this.showProgress();
      
      // background script에 메시지 전송
      chrome.runtime.sendMessage({
        action: 'startItemCollection'
      }, (response) => {
        try {
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message;
                         if (errorMessage.includes('Extension context invalidated')) {
               status.textContent = '페이지 새로고침 후 다시 시도해주세요.';
             } else {
               status.textContent = '수집 중 오류가 발생했습니다. 다시 시도해주세요.';
             }
            button.disabled = false;
            button.textContent = '레어 아이템 데이터 수집';
            this.hideProgress();
            return;
          }
          
          if (response && response.success) {
            const message = response.message || '수집 완료';
            const count = response.count || 0;
            
            status.textContent = `${message} (${count}개 아이템)`;
            
            // 마지막 수집시간 저장
            const currentTime = new Date().toISOString();
            chrome.storage.local.set({ lastCollectionTime: currentTime }, () => {
              // 마지막 수집시간 업데이트
              this.updateLastCollectionTime();
            });
          } else {
            const errorMessage = response?.message || response?.error || '알 수 없는 오류';
            status.textContent = `수집 실패: ${errorMessage}`;
          }
          
          // 프로그레스바 숨김
          this.hideProgress();
          
          // 버튼 다시 활성화
          button.disabled = false;
          button.textContent = '레어 아이템 데이터 수집';
                 } catch (error) {
           console.error('수집 응답 처리 중 오류:', error);
           if (error.message.includes('Extension context invalidated')) {
             status.textContent = '페이지 새로고침 후 다시 시도해주세요.';
           } else {
             status.textContent = '수집 중 오류가 발생했습니다. 다시 시도해주세요.';
           }
           button.disabled = false;
           button.textContent = '레어 아이템 데이터 수집';
           this.hideProgress();
         }
      });
         } catch (error) {
       console.error('수집 시작 중 오류:', error);
       if (error.message.includes('Extension context invalidated')) {
         status.textContent = '페이지 새로고침 후 다시 시도해주세요.';
       } else {
         status.textContent = '수집 중 오류가 발생했습니다. 다시 시도해주세요.';
       }
       button.disabled = false;
       button.textContent = '레어 아이템 데이터 수집';
       this.hideProgress();
     }
  }
}

export default ItemCollectionModal;