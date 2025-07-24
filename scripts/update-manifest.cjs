const fs = require('fs');
const path = require('path');

// dist/assets 디렉토리에서 생성된 파일들을 읽어옴
function getAssetFiles() {
  const assetsDir = path.join(__dirname, '../dist/assets');
  const files = fs.readdirSync(assetsDir);
  
  const assets = {};
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const name = file.split('-')[0]; // 파일명에서 해시 제거
      assets[name] = `assets/${file}`;
    }
  });
  
  return assets;
}

// manifest.json 업데이트
function updateManifest() {
  const manifestPath = path.join(__dirname, '../dist/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const assets = getAssetFiles();
  
  // content_scripts 업데이트
  if (manifest.content_scripts && manifest.content_scripts[0]) {
    manifest.content_scripts[0].js = [
      assets.content
    ].filter(Boolean); // 단일 번들 파일만 사용
  }
  
  // background service worker 업데이트
  if (assets.background) {
    manifest.background.service_worker = assets.background;
  }
  
  // web_accessible_resources 업데이트
  if (manifest.web_accessible_resources && manifest.web_accessible_resources[0]) {
    manifest.web_accessible_resources[0].resources = [
      'assets/*',
      'rare-items.json',
      'menu-config.json',
      'styles.css'
    ];
  }
  
  // 업데이트된 manifest.json 저장
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json 업데이트 완료');
}

// popup.html 복사 및 업데이트
function updatePopup() {
  const srcPopupPath = path.join(__dirname, '../src/popup/popup.html');
  const distPopupPath = path.join(__dirname, '../dist/popup.html');
  
  // src/popup/popup.html을 dist로 복사
  if (fs.existsSync(srcPopupPath)) {
    fs.copyFileSync(srcPopupPath, distPopupPath);
    console.log('✅ popup.html 복사 완료');
  }
  
  // popup.html 내용 업데이트
  if (fs.existsSync(distPopupPath)) {
    const popupContent = fs.readFileSync(distPopupPath, 'utf8');
    
    const assets = getAssetFiles();
    if (assets.popup) {
      const updatedContent = popupContent.replace(
        /src="index\.js"/,
        `src="${assets.popup}"`
      );
      fs.writeFileSync(distPopupPath, updatedContent);
      console.log('✅ popup.html 업데이트 완료');
    }
  }
}

// styles.css 복사
function copyStyles() {
  const srcStylesPath = path.join(__dirname, '../src/styles/global.css');
  const distStylesPath = path.join(__dirname, '../dist/styles.css');
  
  if (fs.existsSync(srcStylesPath)) {
    fs.copyFileSync(srcStylesPath, distStylesPath);
    console.log('✅ styles.css 복사 완료');
  }
}

// menu-config.json 복사
function copyMenuConfig() {
  const srcMenuConfigPath = path.join(__dirname, '../src/content/menu-module/menu-config.json');
  const distMenuConfigPath = path.join(__dirname, '../dist/menu-config.json');
  
  if (fs.existsSync(srcMenuConfigPath)) {
    fs.copyFileSync(srcMenuConfigPath, distMenuConfigPath);
    console.log('✅ menu-config.json 복사 완료');
  }
}

// 메인 실행
try {
  updateManifest();
  updatePopup();
  copyStyles();
  copyMenuConfig();
  console.log('🎉 모든 파일 업데이트 완료!');
} catch (error) {
  console.error('❌ 업데이트 실패:', error.message);
  process.exit(1);
} 