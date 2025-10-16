import { DOMAINS, TIME_CONSTANTS } from '../../../shared/constants.js';

// 시간 게이지바 매니저
class TimeGaugeManager {
  constructor() {
    this.gaugeElement = null;
    this.progressElement = null;
    this.timeTextElement = null;
    this.updateInterval = null;
    this.isInitialized = false;
    this.fishingStartTime = null;
    this.observer = null;
  }

  async init() {
    // lanis.me 도메인에서만 작동
    if (!window.location.hostname.includes(DOMAINS.LANIS_ME)) {

      return;
    }

    if (this.isInitialized) {
      // 이미 초기화되어 있으면 위치만 업데이트
      this.updateGaugePosition();
      return;
    }
    
    try {
      // 스토리지에서 통발 설치 시작 시간 로드
      await this.loadFishingStartTime();
      
      this.createTimeGauge();
      this.startUpdateTimer();
      this.startFishingButtonObserver();
      this.isInitialized = true;
  
    } catch (error) {
      console.error('시간 게이지바 초기화 중 오류:', error);
    }
  }

  createTimeGauge() {
    // 기존 게이지바 제거
    this.removeTimeGauge();

    // 헤더 찾기
    const header = document.querySelector('header');
    if (!header) {
      // 헤더를 찾을 수 없으면 조용히 처리 (로그인 페이지 등)
      return;
    }

    // 게이지바 컨테이너 생성
    this.gaugeElement = document.createElement('div');
    this.gaugeElement.className = 'time-gauge-container';
    // 헤더 높이에 따라 위치 조정
    this.gaugeElement.style.top = `${header.offsetHeight + 8}px`;

    // 게이지 배경
    const gaugeBackground = document.createElement('div');
    gaugeBackground.className = 'time-gauge-background';

    // 게이지 진행바
    this.progressElement = document.createElement('div');
    this.progressElement.className = 'time-gauge-progress';

    // 시간 텍스트
    this.timeTextElement = document.createElement('div');
    this.timeTextElement.className = 'time-gauge-text';

    // 요소들 조립
    gaugeBackground.appendChild(this.progressElement);
    this.gaugeElement.appendChild(gaugeBackground);
    this.gaugeElement.appendChild(this.timeTextElement);

    // 툴팁 추가
    this.gaugeElement.title = '하루 시간 경과';
    this.gaugeElement.style.cursor = 'help';

    // DOM에 추가
    document.body.appendChild(this.gaugeElement);

    // 초기 업데이트
    this.updateTimeGauge().catch(error => {
      console.error('초기 게이지 업데이트 중 오류:', error);
    });
  }

  async updateTimeGauge() {
    if (!this.progressElement || !this.timeTextElement) return;

    try {
      const now = new Date();
      
      // 통발 설치 시작 시간이 없으면 회색 게이지 표시
      if (!this.fishingStartTime) {
        this.updateInactiveGauge();
        if (this.gaugeElement) {
          this.gaugeElement.classList.remove('fishing-active');
        }
        return;
      }

      // 컴포트팩 설정에 따른 통발게이지 최대치 설정
      const fishingDurationMs = await this.getFishingDuration();
      
      // 통발 설치 시작 시간부터 설정된 시간 계산
      const startTime = new Date(this.fishingStartTime);
      const endTime = new Date(startTime.getTime() + fishingDurationMs);
      const totalFishingMs = fishingDurationMs;
      
      const elapsedMs = now.getTime() - startTime.getTime();
      const progress = Math.min((elapsedMs / totalFishingMs) * 100, 100);

      // 1시간이 지났으면 초과 상태로 표시 (초기화하지 않음)
      const isOverdue = elapsedMs >= totalFishingMs;

      // 진행률 업데이트
      this.progressElement.style.width = `${progress}%`;

      // 시간 텍스트 업데이트
      const currentTime = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const endTimeStr = endTime.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      this.timeTextElement.textContent = `${currentTime} / ${endTimeStr}`;

      // 툴팁 업데이트
      const remainingMs = Math.max(0, totalFishingMs - elapsedMs);
      const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
      const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
      const progressPercent = Math.round(progress * 100) / 100;
      
      if (isOverdue) {
        const overdueMs = elapsedMs - totalFishingMs;
        const overdueMinutes = Math.floor(overdueMs / (60 * 1000));
        const overdueSeconds = Math.floor((overdueMs % (60 * 1000)) / 1000);
        this.gaugeElement.title = `통발 낚시 초과!\n초과 시간: ${overdueMinutes}분 ${overdueSeconds}초\n설치 시작: ${startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      } else {
        this.gaugeElement.title = `통발 낚시 진행률: ${progressPercent}%\n남은 시간: ${remainingMinutes}분 ${remainingSeconds}초`;
      }

      // 통발 설치 시간에 따른 색상 변경 (초과 상태 포함)
      this.updateFishingGaugeColor(progress, isOverdue);
      
      // 통발 설치 중임을 표시하는 CSS 클래스 추가
      if (this.gaugeElement) {
        this.gaugeElement.classList.add('fishing-active');
        if (isOverdue) {
          this.gaugeElement.classList.add('overdue');
        } else {
          this.gaugeElement.classList.remove('overdue');
        }
      }

    } catch (error) {
      console.error('시간 게이지바 업데이트 중 오류:', error);
    }
  }

  updateInactiveGauge() {
    // 진행률을 0%로 설정 (회색 게이지)
    this.progressElement.style.width = '0%';

    // 시간 텍스트 업데이트
    const currentTime = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    this.timeTextElement.textContent = `${currentTime} / 통발 미설치`;

    // 툴팁 업데이트
    this.gaugeElement.title = '통발이 설치되지 않았습니다.\n통발 설치 확인 버튼을 클릭하면 타이머가 시작됩니다.';

    // 회색 색상으로 변경
    this.updateInactiveGaugeColor();
  }

  updateInactiveGaugeColor() {
    if (!this.progressElement) return;

    // 회색 그라데이션
    const gradient = 'linear-gradient(90deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)';
    this.progressElement.style.background = gradient;
  }

  updateFishingGaugeColor(progress, isOverdue = false) {
    if (!this.progressElement) return;

    let gradient;
    if (isOverdue) {
      // 초과 상태: 주황색 (경고)
      gradient = 'linear-gradient(90deg, #f97316 0%, #ea580c 50%, #dc2626 100%)';
    } else {
      // 통발 설치 즉시부터 1시간 동안: 초록색 (낚시 진행 중)
      gradient = 'linear-gradient(90deg, #22c55e 0%, #16a34a 50%, #15803d 100%)';
    }

    this.progressElement.style.background = gradient;
  }

  updateGaugePosition() {
    if (!this.gaugeElement) return;

    const header = document.querySelector('header');
    if (header) {
      this.gaugeElement.style.top = `${header.offsetHeight + 8}px`;
    }
  }

  startUpdateTimer() {
    // 기존 타이머 제거
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // 1초마다 업데이트
    this.updateInterval = setInterval(() => {
      this.updateTimeGauge().catch(error => {
        console.error('게이지 업데이트 중 오류:', error);
      });
    }, TIME_CONSTANTS.UPDATE_INTERVAL_MS);

    // 윈도우 리사이즈 이벤트 리스너 추가
    this.resizeHandler = () => {
      this.updateGaugePosition();
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  startFishingButtonObserver() {
    // 기존 옵저버 제거
    if (this.observer) {
      this.observer.disconnect();
    }

    // 통발 설치 확인 버튼 및 상태 변경 감지
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 통발 설치 확인 다이얼로그 감지
            const dialog = node.querySelector && node.querySelector('.MuiDialog-paper');
            if (dialog && dialog.textContent.includes('통발 설치 확인')) {
              // 확인 버튼 찾기
              const confirmButton = dialog.querySelector('button[type="button"]:last-child');
              if (confirmButton && confirmButton.textContent.includes('확인')) {
                // 확인 버튼 클릭 이벤트 리스너 추가
                confirmButton.addEventListener('click', () => {
                  this.onFishingConfirm();
                });
              }
            }

            // 통발 설치 상태가 변경되었는지 확인
            if (node.textContent && node.textContent.includes('🎣 통발 설치됨')) {
              setTimeout(() => {
                this.checkFishingInstallationTime();
              }, TIME_CONSTANTS.DOM_SYNC_DELAY_MS); // 약간의 지연 후 재확인
            }

            // 통발 수거하기 버튼 감지 (새로 추가된 노드 내에서)
            const collectButton = node.querySelector && node.querySelector('button');
            if (collectButton && collectButton.textContent.includes('🎣 통발 수거하기')) {
              // 수거하기 버튼 클릭 이벤트 리스너 추가
              collectButton.addEventListener('click', () => {
                this.onFishingCollect();
              });
            }

            // 통발 수거하기 버튼 감지 (전체 DOM에서)
            const allCollectButtons = document.querySelectorAll('button');
            allCollectButtons.forEach(button => {
              if (button.textContent.includes('🎣 통발 수거하기') && !button.hasAttribute('data-fishing-collect-listener')) {
                button.setAttribute('data-fishing-collect-listener', 'true');
                button.addEventListener('click', () => {
                  this.onFishingCollect();
                });
              }
            });
          }
        });
      });
    });

    // DOM 변경 감지 시작
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 페이지 로드 시 통발 설치 시간 감지
    this.checkFishingInstallationTime();
    
    // 페이지 로드 시 기존 통발 수거하기 버튼 감지
    this.checkExistingCollectButtons();
  }

  checkFishingInstallationTime() {
    // 통발 설치 상태 감지 - 더 일반적인 선택자 사용
    const fishingStatus = document.querySelector('p[class*="css-gxqi3q"]');
    if (fishingStatus && fishingStatus.textContent.includes('🎣 통발 설치됨')) {
      // 설치 시간 정보 찾기 - 실제 DOM 구조에 맞게 수정
      const timeInfo = document.querySelector('p[class*="css-4vr6hg"]');
      if (timeInfo && timeInfo.textContent.includes('설치 시간:')) {
        this.parseAndUpdateFishingTime(timeInfo.textContent);
      }
    }
  }

  checkExistingCollectButtons() {
    // 기존 통발 수거하기 버튼들 감지
    const allCollectButtons = document.querySelectorAll('button');
    allCollectButtons.forEach(button => {
      if (button.textContent.includes('🎣 통발 수거하기') && !button.hasAttribute('data-fishing-collect-listener')) {
        button.setAttribute('data-fishing-collect-listener', 'true');
        button.addEventListener('click', () => {
          this.onFishingCollect();
        });
  
      }
    });
  }

  parseAndUpdateFishingTime(timeText) {
    try {
      // "설치 시간: N분 전" 형식에서 분 추출
      const match = timeText.match(/설치 시간:\s*(\d+)분\s*전/);
      if (!match) return;

      const minutesAgo = parseInt(match[1]);
      const now = new Date();
      const calculatedStartTime = new Date(now.getTime() - (minutesAgo * 60 * 1000));

      // 저장된 시간과 비교
      if (this.fishingStartTime) {
        const savedStartTime = new Date(this.fishingStartTime);
        const timeDiff = Math.abs(calculatedStartTime.getTime() - savedStartTime.getTime());
        const timeDiffMinutes = timeDiff / (60 * 1000);

        // 1분 이상 차이가 나면 새로운 시간으로 업데이트
        if (timeDiffMinutes > 1) {
  
          this.fishingStartTime = calculatedStartTime.toISOString();
          this.saveFishingStartTime();
          this.updateTimeGauge().catch(error => {
            console.error('게이지 업데이트 중 오류:', error);
          });
        }
      } else {
        // 저장된 시간이 없으면 새로 저장
        this.fishingStartTime = calculatedStartTime.toISOString();
        this.saveFishingStartTime();
        this.updateTimeGauge().catch(error => {
          console.error('게이지 업데이트 중 오류:', error);
        });
      }
    } catch (error) {
      console.error('통발 설치 시간 파싱 중 오류:', error);
    }
  }

  async onFishingConfirm() {
    try {
      const now = new Date();
      this.fishingStartTime = now.toISOString();
      
      // 스토리지에 저장
      await this.saveFishingStartTime();
      
      
      
      // 게이지바 즉시 업데이트
      this.updateTimeGauge().catch(error => {
        console.error('게이지 업데이트 중 오류:', error);
      });
    } catch (error) {
      console.error('통발 설치 시작 시간 저장 중 오류:', error);
    }
  }

  async onFishingCollect() {
    try {
      
      
      // 통발 설치 시간 초기화
      await this.resetFishingTime();
      
      // CSS 클래스 제거
      if (this.gaugeElement) {
        this.gaugeElement.classList.remove('fishing-active', 'overdue');
      }
      
      // 게이지바 즉시 업데이트
      this.updateTimeGauge().catch(error => {
        console.error('게이지 업데이트 중 오류:', error);
      });
    } catch (error) {
      console.error('통발 수거 처리 중 오류:', error);
    }
  }

  async loadFishingStartTime() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.sync) {
        console.warn('Chrome Storage를 사용할 수 없습니다.');
        return;
      }

      const result = await new Promise((resolve) => {
        chrome.storage.sync.get(['fishingStartTime'], (result) => {
          resolve(result);
        });
      });

      if (result.fishingStartTime) {
        this.fishingStartTime = result.fishingStartTime;

      }
    } catch (error) {
      console.error('통발 설치 시작 시간 로드 중 오류:', error);
    }
  }

  async saveFishingStartTime() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.sync) {
        console.warn('Chrome Storage를 사용할 수 없습니다.');
        return;
      }

      await new Promise((resolve) => {
        chrome.storage.sync.set({ fishingStartTime: this.fishingStartTime }, () => {
          resolve();
        });
      });

      
    } catch (error) {
      console.error('통발 설치 시작 시간 저장 중 오류:', error);
    }
  }

  async resetFishingTime() {
    try {
      this.fishingStartTime = null;
      
      // 스토리지에서 제거
      if (chrome && chrome.storage && chrome.storage.sync) {
        await new Promise((resolve) => {
          chrome.storage.sync.remove(['fishingStartTime'], () => {
            resolve();
          });
        });
      }
      
      
    } catch (error) {
      console.error('통발 설치 시간 초기화 중 오류:', error);
    }
  }

  /**
   * 컴포트팩 설정에 따른 통발게이지 최대치 가져오기
   * @returns {Promise<number>} 통발게이지 최대치 (밀리초)
   */
  async getFishingDuration() {
    try {
      if (window.utils && window.utils.SettingsManager) {
        const settings = await window.utils.SettingsManager.getSettings({
          useComfortPack: false
        });
        
        // 컴포트팩 사용 시 2시간, 미사용 시 1시간
        return settings.useComfortPack ? 
          (2 * 60 * 60 * 1000) : // 2시간
          TIME_CONSTANTS.FISHING_DURATION_MS; // 1시간
      }
      
      // 기본값: 1시간
      return TIME_CONSTANTS.FISHING_DURATION_MS;
    } catch (error) {
      console.warn('컴포트팩 설정 확인 실패, 기본값 사용:', error);
      return TIME_CONSTANTS.FISHING_DURATION_MS;
    }
  }

  removeTimeGauge() {
    if (this.gaugeElement && this.gaugeElement.parentNode) {
      this.gaugeElement.parentNode.removeChild(this.gaugeElement);
    }
    this.gaugeElement = null;
    this.progressElement = null;
    this.timeTextElement = null;
  }

  destroy() {
    // lanis.me 도메인에서만 작동
    if (!window.location.hostname.includes(DOMAINS.LANIS_ME)) {
      return;
    }

    this.removeTimeGauge();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

export default TimeGaugeManager;
