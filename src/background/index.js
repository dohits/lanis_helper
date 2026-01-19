// Lanis Helper 백그라운드 서비스 워커

// 도메인 설정 (Service Worker 호환성을 위해 직접 정의)
const DOMAINS = {
  LANIS_ME: 'lanis.me'
};

// 기본 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 구글 시트 쓰기 처리
  if (message.type === 'WRITE_TO_SHEET') {
    handleSheetWrite(message, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 구글 시트 행 업데이트 처리
  if (message.type === 'UPDATE_SHEET_ROW') {
    handleSheetRowUpdate(message, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 추천 셋팅 처리
  if (message.type === 'RECOMMEND_SETTING') {
    handleRecommendSetting(message, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 추천인 정보 가져오기 처리
  if (message.type === 'GET_RECOMMENDERS') {
    handleGetRecommenders(message, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 이미지 업로드 처리
  if (message.type === 'UPLOAD_IMAGE') {
    handleImageUpload(message, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 기본 응답
  sendResponse({ success: false, error: '지원하지 않는 메시지 타입입니다.' });
  return false;
});

// 구글 시트 행 업데이트 처리
async function handleSheetRowUpdate(message, sendResponse) {
  try {
    const { url, data } = message;
    
    // URL 파라미터로 데이터 전송
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      sendResponse({
        success: true,
        message: result.message,
        updatedRow: result.updatedRow
      });
    } else {
      sendResponse({
        success: false,
        error: result.error || '알 수 없는 오류'
      });
    }
    
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: `구글 시트 행 업데이트 실패: ${error.message}` 
    });
  }
}

// 구글 시트 쓰기 처리
async function handleSheetWrite(message, sendResponse) {
  try {
    const { url, data } = message;
    
    // URL 파라미터로 데이터 전송
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      sendResponse({
        success: true,
        message: result.message,
        rowsAdded: result.rowsAdded
      });
    } else {
      sendResponse({
        success: false,
        error: result.error || '알 수 없는 오류'
      });
    }
    
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: `구글 시트 쓰기 실패: ${error.message}` 
    });
  }
} 

// 추천 셋팅 처리
async function handleRecommendSetting(message, sendResponse) {
  try {
    const { url, data } = message;
    
    // URL 파라미터로 데이터 전송
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      sendResponse({
        success: true,
        message: result.message,
        recommenders: result.recommenders,
        updatedCells: result.updatedCells
      });
    } else {
      sendResponse({
        success: false,
        error: result.error || '추천 업데이트에 실패했습니다.'
      });
    }
    
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: `추천 실패: ${error.message}` 
    });
  }
}

// 추천인 정보 가져오기 처리
async function handleGetRecommenders(message, sendResponse) {
  try {
    const { url, data } = message;
    
    // URL 파라미터로 데이터 전송
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      sendResponse({
        success: true,
        recommenders: result.recommenders || ''
      });
    } else {
      sendResponse({
        success: false,
        error: result.error || '추천인 정보 가져오기에 실패했습니다.'
      });
    }
    
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: `추천인 정보 가져오기 실패: ${error.message}` 
    });
  }
}

// 이미지 업로드 처리
async function handleImageUpload(message, sendResponse) {
  try {
    const { fileData } = message;
    
    // ArrayBuffer를 Blob으로 변환
    const blob = new Blob([new Uint8Array(fileData.data)], { type: fileData.type });
    const file = new File([blob], fileData.name, { type: fileData.type });
    
    // FormData 생성
    const formData = new FormData();
    formData.append('image', file);
    
    // API 호출 (background script는 CORS 제한 없음)
    const response = await fetch('https://image.my/api/upload.php', {
      method: 'POST',
      headers: {
        'X-API-SOURCE': 'lanis_helper'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('IMAGE.MY API 응답:', result);
    
    if (result.success && result.data) {
      sendResponse({
        success: true,
        data: result.data
      });
    } else {
      // 에러 응답 처리
      const errorMessage = result.error?.message || result.error || '업로드 실패';
      console.error('IMAGE.MY API 에러:', errorMessage, result);
      sendResponse({
        success: false,
        error: errorMessage
      });
    }
    
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: `이미지 업로드 실패: ${error.message}` 
    });
  }
} 
