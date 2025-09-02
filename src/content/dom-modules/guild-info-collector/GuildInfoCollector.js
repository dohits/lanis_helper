/**
 * 길드 정보 수집기
 * 
 * Lanis 길드 페이지에서 길드 정보와 길드원 목록을 수집합니다.
 * 수집된 데이터는 브라우저 저장소에 저장되어 브라우저를 재시작해도 유지됩니다.
 */

class GuildInfoCollector {
  constructor() {
    this.storageKey = 'lanis_guild_info';
    this.currentGuildUrl = null;
    this.observer = null;
    this.isCollecting = false;
    this.lastCollectedUrl = null;
  }

  /**
   * 초기화 메서드
   */
  init() {

    this.setupObserver();
    this.setupEventListeners();
  }

  /**
   * 현재 페이지가 길드 페이지인지 확인
   */
  isGuildPage() {
    return window.location.href.includes('lanis.me/guild/');
  }

  /**
   * 현재 길드 이름 추출
   */
  getCurrentGuildName() {
    const url = window.location.href;
    const match = url.match(/lanis\.me\/guild\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  /**
   * DOM 변경 감지를 위한 Observer 설정
   */
  setupObserver() {
    // 기존 observer 제거
    if (this.observer) {
      this.observer.disconnect();
    }

    // MutationObserver 설정
    this.observer = new MutationObserver((mutations) => {
      let shouldCollect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 길드 정보 관련 요소가 추가되었는지 확인
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 길드 이름 요소 확인
              if (node.querySelector && node.querySelector('h5.MuiTypography-root.MuiTypography-h5')) {
                shouldCollect = true;
              }
              // 길드 정보 섹션 확인
              if (node.querySelector && node.querySelector('div.MuiBox-root.css-16cle9o')) {
                shouldCollect = true;
              }
              // 길드원 테이블 확인
              if (node.querySelector && node.querySelector('tbody.MuiTableBody-root')) {
                shouldCollect = true;
              }
            }
          });
        }
      });

      if (shouldCollect && this.isGuildPage()) {
  
        this.collectNewGuildInfo();
      }
    });

    // 전체 문서 감시 (SPA 동적 로딩을 위해)
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 이벤트 리스너 설정 (URL 변경 감지)
   */
  setupEventListeners() {
    // URL 변경 감지 (SPA 네비게이션)
    let currentUrl = window.location.href;
    
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (this.isGuildPage()) {
    
          setTimeout(() => {
            this.collectNewGuildInfo();
          }, 2000); // 2초 후 수집 (DOM 로딩 대기)
        }
      }
    };

    // 주기적으로 URL 변경 확인
    setInterval(checkUrlChange, 1000);
  }



  /**
   * 새로운 길드 정보만 수집
   */
  collectNewGuildInfo() {
    if (this.isCollecting) return;
    this.isCollecting = true;

    try {
      const currentUrl = window.location.href;
      const guildName = this.getCurrentGuildName();
      
      if (!guildName) {
        return;
      }

      // 기존 데이터 확인
      const existingInfo = this.loadGuildInfo(guildName);
      if (existingInfo && existingInfo.url === currentUrl) {

        return;
      }


      const guildInfo = this.collectGuildInfo();
      
      if (guildInfo) {
        this.saveGuildInfo(guildInfo);
        this.lastCollectedUrl = currentUrl;

      }
    } catch (error) {
      console.error('새로운 길드 정보 수집 중 오류:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * 길드 기본 정보 수집
   */
  collectGuildBasicInfo() {
    try {
      // 길드 이름
      const guildNameElement = document.querySelector('h5.MuiTypography-root.MuiTypography-h5');
      const guildName = guildNameElement ? guildNameElement.textContent.trim() : '';

      // 길드 정보 섹션에서 정보 수집
      const guildInfoSection = document.querySelector('div.MuiBox-root.css-16cle9o');
      if (!guildInfoSection) return null;

      const infoParagraphs = guildInfoSection.querySelectorAll('p.MuiTypography-root.MuiTypography-body2');
      let guildMaster = '';
      let guildLevel = '';
      let memberCount = '';

      infoParagraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text.includes('길드장')) {
          const masterElement = p.querySelector('span[style*="color: rgb(255, 215, 0)"]');
          guildMaster = masterElement ? masterElement.textContent.trim() : '';
        } else if (text.includes('길드 레벨')) {
          const levelElement = p.querySelector('span[style*="color: rgb(255, 215, 0)"]');
          guildLevel = levelElement ? levelElement.textContent.trim() : '';
        } else if (text.includes('길드원 수')) {
          const countElement = p.querySelector('span[style*="color: rgb(255, 215, 0)"]');
          memberCount = countElement ? countElement.textContent.trim() : '';
        }
      });

      // 길드 설명
      const descriptionElement = document.querySelector('div.MuiBox-root.css-7u2oev p.MuiTypography-root.MuiTypography-body1');
      const description = descriptionElement ? descriptionElement.textContent.trim() : '';

      return {
        guildName,
        guildMaster,
        guildLevel: parseInt(guildLevel) || 0,
        memberCount,
        description
      };
    } catch (error) {
      console.error('길드 기본 정보 수집 실패:', error);
      return null;
    }
  }

  /**
   * 길드원 목록 수집
   */
  collectGuildMembers() {
    try {
      const memberRows = document.querySelectorAll('tbody.MuiTableBody-root tr.MuiTableRow-root');
      const members = [];

      memberRows.forEach(row => {
        const cells = row.querySelectorAll('td.MuiTableCell-root');
        if (cells.length >= 3) {
          const nicknameElement = cells[0].querySelector('span.MuiTypography-root');
          const reputationElement = cells[1];
          const positionElement = cells[2].querySelector('p.MuiTypography-root');

          const nickname = nicknameElement ? nicknameElement.textContent.trim() : '';
          const reputation = reputationElement ? parseInt(reputationElement.textContent.trim()) || 0 : 0;
          const position = positionElement ? positionElement.textContent.trim() : '';

          if (nickname) {
            members.push({
              nickname,
              reputation,
              position
            });
          }
        }
      });

      return members;
    } catch (error) {
      console.error('길드원 목록 수집 실패:', error);
      return [];
    }
  }

  /**
   * 전체 길드 정보 수집
   */
  collectGuildInfo() {
    if (!this.isGuildPage()) {
      console.log('현재 페이지가 길드 페이지가 아닙니다.');
      return null;
    }

    const guildName = this.getCurrentGuildName();
    if (!guildName) {
      return null;
    }

    const basicInfo = this.collectGuildBasicInfo();
    if (!basicInfo) {

      return null;
    }

    const members = this.collectGuildMembers();
    
    const guildInfo = {
      ...basicInfo,
      members,
      collectedAt: new Date().toISOString(),
      url: window.location.href
    };

    return guildInfo;
  }

  /**
   * 길드 정보 저장
   */
  saveGuildInfo(guildInfo) {
    if (!guildInfo) return false;

    try {
      const guildName = guildInfo.guildName;
      const storageData = this.loadAllGuildInfo();
      
      // 기존 데이터에 새 데이터 추가/업데이트
      storageData[guildName] = guildInfo;
      
      // 브라우저 저장소에 저장
      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      

      return true;
    } catch (error) {
      console.error('길드 정보 저장 실패:', error);
      return false;
    }
  }

  /**
   * 모든 길드 정보 로드
   */
  loadAllGuildInfo() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('길드 정보 로드 실패:', error);
      return {};
    }
  }

  /**
   * 특정 길드 정보 로드
   */
  loadGuildInfo(guildName) {
    const allData = this.loadAllGuildInfo();
    return allData[guildName] || null;
  }

  /**
   * 길드 정보 삭제
   */
  deleteGuildInfo(guildName) {
    try {
      const storageData = this.loadAllGuildInfo();
      delete storageData[guildName];
      localStorage.setItem(this.storageKey, JSON.stringify(storageData));

      return true;
    } catch (error) {
      console.error('길드 정보 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 모든 길드 정보 삭제
   */
  clearAllGuildInfo() {
    try {
      localStorage.removeItem(this.storageKey);

      return true;
    } catch (error) {
      console.error('길드 정보 전체 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 현재 페이지에서 길드 정보 수집 및 저장
   */
  collectAndSave() {
    const guildInfo = this.collectGuildInfo();
    if (guildInfo) {
      const result = this.saveGuildInfo(guildInfo);
      return result;
    } else {
      return false;
    }
  }

  /**
   * 페이지 로드 시 자동 수집
   */
  autoCollect() {
    if (this.isGuildPage()) {
      // 페이지 로드 완료 후 수집
      setTimeout(() => {
        this.collectNewGuildInfo();
      }, 2000); // 2초 후 수집 (DOM 로딩 대기)
    }
  }

  /**
   * 저장된 길드 목록 조회
   */
  getSavedGuildList() {
    const allData = this.loadAllGuildInfo();
    return Object.keys(allData).map(guildName => ({
      name: guildName,
      info: allData[guildName]
    }));
  }

  /**
   * 정리 메서드
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export default GuildInfoCollector;
