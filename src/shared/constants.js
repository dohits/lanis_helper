// 공통 상수 정의
export const EXTENSION_VERSION = '1.7.3';

// 구글 시트 ID들
export const SHEET_IDS = {
  ENCHANT_INFO: '15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng',  // 해방 정보 시트
  ABILITY_INFO: '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo',  // 어빌리티 정보 시트
  PRICE_DATA: '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo'     // 시세 데이터 시트 (어빌리티와 동일)
};

// 해방 정보 시트 GID 매핑
export const ENCHANT_GID_MAP = {
  'armor': '468768394',     // 장비해방(방어구) 시트 GID
  'weapon': '337738977',    // 장비해방(무기) 시트 GID
  'accessory': '567672096'  // 장비해방(장신구) 시트 GID
};

// 시세 데이터 시트 GID
export const PRICE_DATA_GID = '1489625214';  // 시세 시트 GID

// 시트 이름
export const SHEET_NAMES = {
  PRICE_SHEET: '시세',
  TRADE_SHEET: '거래'
};

// API 엔드포인트
export const API_ENDPOINTS = {
  LANIS_WIKI: 'https://laniswiki.lovestoblog.com/api.php',
  LANIS_ME: 'https://lanis.me'
};

// lanis.me 하위 URL 경로
export const LANIS_ME_PATHS = {
  USERS: '/users',
  BOARD_VIEW: '/board/view',
  FISHING: '/fishing'
};

// lanis.me 특정 페이지 ID
export const LANIS_ME_PAGE_IDS = {
  INSTALL_GUIDE: '686f9f8b419b60b2fd5466c3',  // 설치방법 게시글
  ABILITY_GUIDE: '6841a029abffb8c821c43e85'   // 어빌리티 게시글
};

// 도메인 설정
export const DOMAINS = {
  LANIS_ME: 'lanis.me',
  LANIS_WIKI: 'laniswiki.lovestoblog.com'
};

// 시간 관련 상수
export const TIME_CONSTANTS = {
  FISHING_DURATION_MS: 60 * 60 * 1000,  // 통발 낚시 시간 (1시간)
  UPDATE_INTERVAL_MS: 1000,             // 게이지바 업데이트 간격 (1초)
  DOM_SYNC_DELAY_MS: 100                // DOM 동기화 지연 시간
}; 