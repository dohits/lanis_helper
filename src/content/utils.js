/**
 * Lanis Helper - 유틸리티 함수 모음
 * 리팩토링을 위한 공통 헬퍼 함수들
 */

// DOM 요소 생성 헬퍼
const createElement = (tag, className, text, attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

// 안전한 함수 실행
const safeExecute = (fn, errorMessage) => {
  try {
    return fn();
  } catch (error) {
    console.warn(errorMessage, error);
  }
};

// 비동기 함수를 위한 안전한 실행
const safeExecuteAsync = async (fn, errorMessage) => {
  try {
    return await fn();
  } catch (error) {
    console.warn(errorMessage, error);
  }
};

// 확장 프로그램 컨텍스트 검사 (개선된 버전)
const isValidExtensionContext = () => {
  try {
    // 기본 확장 프로그램 컨텍스트 확인
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      return false;
    }
    
    // 페이지 상태 확인
    if (document.readyState === 'loading') {
      return false;
    }
    
    // DOM 접근 가능성 확인
    if (!document.body) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('확장 프로그램 컨텍스트 검사 중 오류:', error);
    return false;
  }
};

// Chrome Storage 설정 관리자
class SettingsManager {
  static async getSettings(defaultSettings = {}) {
    return new Promise((resolve) => {
      try {
        // 확장 프로그램 컨텍스트 유효성 검사
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
          console.warn('확장 프로그램 컨텍스트가 유효하지 않습니다. 기본 설정을 반환합니다.');
          resolve(defaultSettings);
          return;
        }
        
        chrome.storage.sync.get(defaultSettings, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Chrome Storage 접근 오류:', chrome.runtime.lastError);
            resolve(defaultSettings);
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        console.warn('설정 가져오기 중 오류:', error);
        resolve(defaultSettings);
      }
    });
  }
  
  static async setSettings(settings) {
    return new Promise((resolve) => {
      try {
        // 확장 프로그램 컨텍스트 유효성 검사
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
          console.warn('확장 프로그램 컨텍스트가 유효하지 않습니다. 설정 저장을 건너뜁니다.');
          resolve();
          return;
        }
        
        chrome.storage.sync.set(settings, () => {
          if (chrome.runtime.lastError) {
            console.warn('Chrome Storage 저장 오류:', chrome.runtime.lastError);
          }
          resolve();
        });
      } catch (error) {
        console.warn('설정 저장 중 오류:', error);
        resolve();
      }
    });
  }
  
  static async removeSettings(keys) {
    return new Promise((resolve) => {
      try {
        // 확장 프로그램 컨텍스트 유효성 검사
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
          console.warn('확장 프로그램 컨텍스트가 유효하지 않습니다. 설정 제거를 건너뜁니다.');
          resolve();
          return;
        }
        
        chrome.storage.sync.remove(keys, () => {
          if (chrome.runtime.lastError) {
            console.warn('Chrome Storage 제거 오류:', chrome.runtime.lastError);
          }
          resolve();
        });
      } catch (error) {
        console.warn('설정 제거 중 오류:', error);
        resolve();
      }
    });
  }
}

// 이벤트 리스너 헬퍼
const addEventListenerSafe = (element, event, handler, options = {}) => {
  if (element && typeof element.addEventListener === 'function') {
    element.addEventListener(event, handler, options);
    return true;
  }
  console.warn('이벤트 리스너 추가 실패: 유효하지 않은 요소', element);
  return false;
};

// DOM 요소 존재 여부 확인
const elementExists = (selector) => {
  return document.querySelector(selector) !== null;
};

// 스타일 속성 설정 헬퍼
const setElementStyles = (element, styles = {}) => {
  if (!element || !element.style) return false;
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property] = value;
  });
  return true;
};

// 클래스 조작 헬퍼
const toggleClass = (element, className, force = null) => {
  if (!element || !element.classList) return false;
  
  if (force === null) {
    element.classList.toggle(className);
  } else {
    element.classList.toggle(className, force);
  }
  return true;
};

// 텍스트 내용 설정 헬퍼
const setTextContent = (element, text) => {
  if (!element) return false;
  element.textContent = text;
  return true;
};

// 속성 설정 헬퍼
const setAttributes = (element, attributes = {}) => {
  if (!element) return false;
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return true;
};

// 유틸리티 객체로 내보내기
const utils = {
  createElement,
  safeExecute,
  safeExecuteAsync,
  isValidExtensionContext,
  SettingsManager,
  addEventListenerSafe,
  elementExists,
  setElementStyles,
  toggleClass,
  setTextContent,
  setAttributes
};

// ES6 모듈로 export
export default utils; 