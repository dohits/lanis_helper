// 상수 정의 (popup에서는 import가 제한적이므로 직접 정의)
const API_ENDPOINTS = {
  LANIS_ME: 'https://lanis.me',
  LANIS_WIKI: 'https://laniswiki.lovestoblog.com'
};

const LANIS_ME_PATHS = {
  USERS: '/users',
  BOARD_VIEW: '/board/view'
};

const LANIS_ME_PAGE_IDS = {
  ABILITY_GUIDE: '6841a029abffb8c821c43e85'
};

const SHEET_IDS = {
  ENCHANT_INFO: '15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng'
};

const ENCHANT_GID_MAP = {
  'armor': '468768394'
};

// 버전 정보 표시 및 URL 동적 생성
document.addEventListener('DOMContentLoaded', function() {
  // manifest에서 버전 동적 추출
  let version = 'unknown';
  try {
    const manifest = chrome.runtime.getManifest();
    version = manifest.version || 'unknown';
  } catch (e) {
    console.error('버전 정보를 가져올 수 없습니다:', e);
  }
  
  // 버전 정보 업데이트
  const versionElements = document.querySelectorAll('#version, #version2');
  versionElements.forEach(element => {
    element.textContent = version;
  });

  // URL 동적 생성
  updateUrls();
});

// URL 업데이트 함수
function updateUrls() {
  // 사용자 링크들 업데이트
  const userLinks = document.querySelectorAll('a[href*="lanis.me/users/"]');
  userLinks.forEach(link => {
    const username = link.textContent;
    link.href = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.USERS}/${encodeURIComponent(username)}`;
  });

  // 어빌리티 게시글 링크 업데이트
  const abilityLink = document.querySelector('a[href*="lanis.me/board/view/6841a029abffb8c821c43e85"]');
  if (abilityLink) {
    abilityLink.href = `${API_ENDPOINTS.LANIS_ME}${LANIS_ME_PATHS.BOARD_VIEW}/${LANIS_ME_PAGE_IDS.ABILITY_GUIDE}`;
  }

  // 해방정보 시트 링크 업데이트
  const sheetLink = document.querySelector('a[href*="docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng"]');
  if (sheetLink) {
    sheetLink.href = `https://docs.google.com/spreadsheets/d/${SHEET_IDS.ENCHANT_INFO}/edit?gid=${ENCHANT_GID_MAP.armor}#gid=${ENCHANT_GID_MAP.armor}`;
  }
} 