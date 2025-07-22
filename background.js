// Lanis Helper 백그라운드 서비스 워커

// 구글 시트에서 해방 정보 데이터를 가져오는 함수
// 참고: exam/enchant-info-armor-example.js에서 데이터 구조 및 예시 확인
async function fetchEnchantInfo(type = 'armor') {
  try {
    // 무기/장신구는 현재 시트가 존재하지 않으므로 빈 데이터 반환
    if (type === 'weapon' || type === 'accessory') {
      return { success: true, data: [] };
    }
    
    const sheetId = '15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng';
    
    // 타입별 GID 매핑 (현재는 방어구만 실제 연결)
    const gidMap = {
      'armor': '468768394'  // 장비해방(방어구) 시트 GID
    };
    
    const gid = gidMap[type];
    if (!gid) {
      return { success: true, data: [] };
    }
    
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csv = await response.text();
    const lines = csv.split('\n').filter(line => line.trim());
    
    // CSV 파싱 - exam/enchant-info-armor-example.js 참조
    // 구글 시트 구조: A열(빈칸), B열(스텟명), C열(동등급), D열(은등급), E열(금등급), F열(칠색등급)
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const data = lines.slice(1).map((line, index) => {
      const cols = line.split(',').map(col => col.replace(/"/g, '').trim());
      const item = {
        type: cols[1] || '',      // B열 (스텟명)
        bronze: cols[2] || '',    // C열 (동 등급)
        silver: cols[3] || '',    // D열 (은 등급)
        gold: cols[4] || '',      // E열 (금 등급)
        rainbow: cols[5] || ''    // F열 (칠색 등급)
      };
      return item;
    }).filter(item => item.type && item.type !== '');
    
    return { success: true, data };
  } catch (error) {
    console.error('[Background] 해방 정보 데이터 가져오기 실패:', error);
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_ENCHANT_INFO') {
    const type = message.enchantType || 'armor';
    fetchEnchantInfo(type).then(result => {
      sendResponse(result);
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 기타 메시지 처리
  return false;
}); 
