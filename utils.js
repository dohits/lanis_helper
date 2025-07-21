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

// 확장 프로그램 컨텍스트 검사
const isValidExtensionContext = () => {
  return !!(chrome && chrome.runtime && chrome.runtime.id);
};

// Chrome Storage 설정 관리자
class SettingsManager {
  static async getSettings(defaultSettings = {}) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(defaultSettings, resolve);
    });
  }
  
  static async setSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, resolve);
    });
  }
  
  static async removeSettings(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(keys, resolve);
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

// 전역 객체에 유틸리티 추가 (기존 코드와의 호환성을 위해)
if (typeof window !== 'undefined') {
  window.utils = utils;
}

// 모듈 시스템 지원
if (typeof module !== 'undefined' && module.exports) {
  module.exports = utils;
} 