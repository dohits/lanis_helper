// 버전 정보 표시
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
}); 