import BaseModal from '../base/base-modal.js';
import { MODAL_CONFIGS } from '../shared/modal-constants.js';

// 이미지 업로드 모달
class ImageUploadModal extends BaseModal {
  constructor() {
    super(MODAL_CONFIGS.imageUpload);
    this.selectedFile = null;
    this.uploadState = 'idle'; // idle, uploading, success, error
  }

  // 모달 열기
  open() {
    super.open();
    this.selectedFile = null;
    this.uploadState = 'idle';
    this.createContent();
  }

  // 모달 닫기 (오버라이드)
  close() {
    // 상태 초기화
    this.selectedFile = null;
    this.uploadState = 'idle';
    super.close();
  }

  // 콘텐츠 생성
  createContent() {
    this.body.innerHTML = '';
    
    // 컨테이너
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 0;
    `;

    // 안내 문구
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      padding: 12px 16px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      font-size: 13px;
      color: #0369a1;
      line-height: 1.5;
    `;
    infoDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">📷 이미지 호스팅 서비스</div>
      <div>본 기능은 <a href="https://image.my/" target="_blank" style="color: #0284c7; text-decoration: underline;">IMAGE.MY</a>를 이용하여 이미지를 호스팅합니다.</div>
      <div style="margin-top: 4px; font-size: 12px; color: #075985;">
        • 업로드 시 이미지 가로길이는 320px로 자동 조정됩니다<br>
        • 이미지 삭제가 필요한 경우 <a href="https://image.my/" target="_blank" style="color: #0284c7; text-decoration: underline;">IMAGE.MY</a> 사이트에 직접 접속하여 삭제 요청을 해주세요
      </div>
    `;
    container.appendChild(infoDiv);

    // 파일 선택 영역
    const fileSelectArea = this.createFileSelectArea();
    container.appendChild(fileSelectArea);

    // 미리보기 영역
    const previewArea = this.createPreviewArea();
    container.appendChild(previewArea);

    // 업로드 버튼 영역
    const uploadArea = this.createUploadArea();
    container.appendChild(uploadArea);

    // 결과 영역
    const resultArea = this.createResultArea();
    container.appendChild(resultArea);

    this.body.appendChild(container);
  }

  // 파일 선택 영역 생성
  createFileSelectArea() {
    const area = document.createElement('div');
    area.className = 'file-select-area';
    area.style.cssText = `
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f9fafb;
    `;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png';
    input.style.display = 'none';
    input.addEventListener('change', (e) => this.handleFileSelect(e));

    const label = document.createElement('label');
    label.style.cssText = `
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    `;

    const icon = document.createElement('div');
    icon.textContent = '📤';
    icon.style.cssText = `
      font-size: 48px;
    `;

    const text = document.createElement('div');
    text.innerHTML = `
      <div style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 4px;">
        이미지 선택
      </div>
      <div style="font-size: 14px; color: #6b7280;">
        JPG, PNG만 가능 (최대 2MB)
      </div>
    `;

    label.appendChild(icon);
    label.appendChild(text);
    label.appendChild(input);

    // 드래그 앤 드롭 이벤트
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.style.borderColor = '#667eea';
      area.style.background = '#f0f4ff';
    });

    area.addEventListener('dragleave', () => {
      area.style.borderColor = '#d1d5db';
      area.style.background = '#f9fafb';
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.style.borderColor = '#d1d5db';
      area.style.background = '#f9fafb';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        input.files = files;
        this.handleFileSelect({ target: input });
      }
    });

    // 클릭 이벤트는 label을 통해 처리되므로 area의 클릭은 제거
    // area.addEventListener('click', () => input.click()); // 제거

    area.appendChild(label);

    return area;
  }

  // 미리보기 영역 생성
  createPreviewArea() {
    const area = document.createElement('div');
    area.id = 'preview-area';
    area.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 12px;
    `;

    const previewImg = document.createElement('img');
    previewImg.id = 'preview-image';
    previewImg.style.cssText = `
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      object-fit: contain;
    `;

    const info = document.createElement('div');
    info.id = 'preview-info';
    info.style.cssText = `
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    `;

    area.appendChild(previewImg);
    area.appendChild(info);

    return area;
  }

  // 업로드 버튼 영역 생성
  createUploadArea() {
    const area = document.createElement('div');
    area.id = 'upload-area';
    area.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 12px;
    `;

    // 버튼 컨테이너
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const uploadBtn = this.createButton('업로드', 'primary', () => this.handleUpload());
    uploadBtn.id = 'upload-button';
    uploadBtn.style.cssText += `
      flex: 1;
      padding: 12px;
      font-size: 16px;
    `;

    const reselectBtn = this.createButton('다시 선택', 'secondary', () => this.handleReselect());
    reselectBtn.id = 'reselect-button';
    reselectBtn.style.cssText += `
      padding: 12px 20px;
      font-size: 16px;
    `;

    buttonContainer.appendChild(uploadBtn);
    buttonContainer.appendChild(reselectBtn);

    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.cssText = `
      display: none;
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    `;

    progressBar.appendChild(progressFill);

    area.appendChild(buttonContainer);
    area.appendChild(progressBar);

    return area;
  }

  // 다시 선택 처리
  handleReselect() {
    // 파일 선택 영역 다시 표시
    const fileSelectArea = document.querySelector('.file-select-area');
    if (fileSelectArea) {
      fileSelectArea.style.display = 'block';
    }

    // 파일 입력 초기화
    const fileInput = document.querySelector('.file-select-area input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }

    // 선택된 파일 초기화
    this.selectedFile = null;

    // 미리보기 영역 숨기기
    const previewArea = document.getElementById('preview-area');
    if (previewArea) {
      previewArea.style.display = 'none';
    }

    // 업로드 영역 숨기기
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.display = 'none';
    }

    // 결과 영역 숨기기
    const resultArea = document.getElementById('result-area');
    if (resultArea) {
      resultArea.style.display = 'none';
      resultArea.innerHTML = '';
    }
  }

  // 결과 영역 생성
  createResultArea() {
    const area = document.createElement('div');
    area.id = 'result-area';
    area.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: #f9fafb;
    `;

    return area;
  }

  // 파일 선택 처리
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 타입 검증 (MIME 타입 및 확장자)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      this.showError('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일명 검증 (경로 탐색 공격 방지)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      this.showError('유효하지 않은 파일명입니다.');
      return;
    }

    // 파일 크기 검증 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.showError('파일 크기는 2MB 이하여야 합니다.');
      return;
    }

    this.selectedFile = file;

    // 파일 선택 영역 숨기기
    const fileSelectArea = document.querySelector('.file-select-area');
    if (fileSelectArea) {
      fileSelectArea.style.display = 'none';
    }

    // 미리보기 표시
    await this.showPreview(file);

    // 업로드 영역 표시
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.display = 'flex';
    }

    // 결과 영역 숨기기
    const resultArea = document.getElementById('result-area');
    if (resultArea) {
      resultArea.style.display = 'none';
      resultArea.innerHTML = '';
    }
  }

  // 미리보기 표시
  async showPreview(file) {
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-image');
    const previewInfo = document.getElementById('preview-info');

    if (!previewArea || !previewImg || !previewInfo) return;

    // FileReader로 이미지 로드
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewInfo.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
      previewArea.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  // 이미지 리사이즈 (가로 320px)
  async resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 가로 320px로 리사이즈 (비율 유지)
          const maxWidth = 320;
          let width = img.width;
          let height = img.height;
          
          // 가로가 320px보다 크면 리사이즈
          if (img.width > maxWidth) {
            const ratio = maxWidth / img.width;
            width = maxWidth;
            height = Math.round(img.height * ratio);
          }

          // Canvas로 리사이즈
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Blob으로 변환
          canvas.toBlob((blob) => {
            if (blob) {
              // 원본 파일명 유지
              const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
              const resizedFile = new File([blob], fileName, { type: 'image/jpeg' });
              resolve(resizedFile);
            } else {
              reject(new Error('이미지 리사이즈 실패'));
            }
          }, 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  }

  // 업로드 처리
  async handleUpload() {
    if (!this.selectedFile) {
      this.showError('파일을 선택해주세요.');
      return;
    }

    const uploadBtn = document.getElementById('upload-button');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const resultArea = document.getElementById('result-area');

    if (!uploadBtn || !progressBar || !progressFill) return;

    try {
      // 업로드 상태 변경
      this.uploadState = 'uploading';
      uploadBtn.disabled = true;
      uploadBtn.textContent = '업로드 중...';
      progressBar.style.display = 'block';
      progressFill.style.width = '30%';

      // 이미지 리사이즈
      progressFill.style.width = '50%';
      const resizedFile = await this.resizeImage(this.selectedFile);

      // FormData 생성
      const formData = new FormData();
      formData.append('image', resizedFile);

      progressFill.style.width = '70%';

      // Background script를 통한 API 호출 (CORS 우회)
      progressFill.style.width = '70%';
      
      const result = await new Promise((resolve, reject) => {
        // File을 ArrayBuffer로 변환
        const reader = new FileReader();
        reader.onload = () => {
          try {
            chrome.runtime.sendMessage({
              type: 'UPLOAD_IMAGE',
              fileData: {
                name: resizedFile.name,
                type: resizedFile.type,
                data: Array.from(new Uint8Array(reader.result))
              }
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              
              console.log('Background script 응답:', response);
              
              if (response && response.success) {
                // response.data가 실제 API 응답의 data 객체
                resolve(response.data);
              } else {
                reject(new Error(response?.error || '업로드 실패'));
              }
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(resizedFile);
      });

      progressFill.style.width = '100%';

      console.log('업로드 결과:', result);

      // result는 API 응답의 data 객체 (id, share_url, image_url 포함)
      // id와 image_url이 있으면 성공으로 처리
      if (result && typeof result === 'object' && result.id && result.image_url) {
        // 성공
        this.uploadState = 'success';
        this.showSuccess(result);
        uploadBtn.disabled = false;
        uploadBtn.textContent = '업로드';
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
        
        // 파일 선택 영역 완전히 숨기기
        const fileSelectArea = document.querySelector('.file-select-area');
        if (fileSelectArea) {
          fileSelectArea.style.display = 'none';
        }
        
        // 업로드 영역 숨기기
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
          uploadArea.style.display = 'none';
        }
      } else {
        // 에러 처리 - 민감한 정보는 콘솔에만 출력
        console.error('응답 형식 오류:', result);
        throw new Error('업로드 실패: 응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      // 에러 처리
      this.uploadState = 'error';
      this.showError(error.message || '업로드 중 오류가 발생했습니다.');
      uploadBtn.disabled = false;
      uploadBtn.textContent = '업로드';
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
      
      // 파일 선택 영역 다시 표시 (재시도 가능하도록)
      const fileSelectArea = document.querySelector('.file-select-area');
      if (fileSelectArea) {
        fileSelectArea.style.display = 'block';
      }
    }
  }

  // 성공 메시지 표시
  showSuccess(data) {
    const resultArea = document.getElementById('result-area');
    if (!resultArea) return;

    resultArea.innerHTML = '';
    resultArea.style.display = 'flex';
    resultArea.style.background = '#f0fdf4';
    resultArea.style.border = '1px solid #86efac';

    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.cssText = `
      font-size: 32px;
      text-align: center;
    `;

    const successText = document.createElement('div');
    successText.textContent = '업로드 성공!';
    successText.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      color: #166534;
      text-align: center;
    `;

    const urlContainer = document.createElement('div');
    urlContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    `;

    // URL 검증 및 sanitize
    const imageUrl = this.sanitizeUrl(data.image_url || data.direct_url);
    const shareUrl = this.sanitizeUrl(data.share_url || data.url);

    if (!imageUrl) {
      this.showError('유효하지 않은 이미지 URL입니다.');
      return;
    }

    // 마크다운 형식 이미지 링크 (image_url 사용)
    const markdownText = `![이미지](${imageUrl})`;
    const markdownDiv = this.createMarkdownDisplay('마크다운', markdownText);
    urlContainer.appendChild(markdownDiv);

    // 직접 링크 (image_url 사용)
    const directUrlDiv = this.createUrlDisplay('직접 링크', imageUrl);
    urlContainer.appendChild(directUrlDiv);

    // 페이지 링크 (share_url 사용)
    if (shareUrl) {
      const pageUrlDiv = this.createUrlDisplay('페이지 링크', shareUrl);
      urlContainer.appendChild(pageUrlDiv);
    }

    // 다시 업로드 버튼
    const retryBtn = this.createButton('다시 업로드', 'secondary', () => {
      this.resetUploadState();
    });
    retryBtn.style.cssText += `
      margin-top: 12px;
      padding: 10px 20px;
      font-size: 14px;
    `;

    resultArea.appendChild(successIcon);
    resultArea.appendChild(successText);
    resultArea.appendChild(urlContainer);
    resultArea.appendChild(retryBtn);
  }

  // 마크다운 표시 생성
  createMarkdownDisplay(label, markdownText) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label + ':';
    labelEl.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    `;

    const markdownContainer = document.createElement('div');
    markdownContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    const markdownInput = document.createElement('input');
    markdownInput.type = 'text';
    markdownInput.value = markdownText;
    markdownInput.readOnly = true;
    markdownInput.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      font-family: monospace;
    `;

    const copyBtn = this.createButton('복사', 'primary', async () => {
      try {
        await navigator.clipboard.writeText(markdownText);
        copyBtn.textContent = '완료!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = '복사';
          copyBtn.style.background = '';
        }, 2000);
      } catch (error) {
        // 클립보드 API 실패 시 fallback
        markdownInput.select();
        document.execCommand('copy');
        copyBtn.textContent = '완료!';
        setTimeout(() => {
          copyBtn.textContent = '복사';
        }, 2000);
      }
    });
    copyBtn.style.cssText += `
      padding: 8px 16px;
      font-size: 14px;
      white-space: nowrap;
    `;

    markdownContainer.appendChild(markdownInput);
    markdownContainer.appendChild(copyBtn);

    container.appendChild(labelEl);
    container.appendChild(markdownContainer);

    return container;
  }

  // 업로드 상태 초기화
  resetUploadState() {
    this.selectedFile = null;
    this.uploadState = 'idle';
    
    // 파일 선택 영역 다시 표시
    const fileSelectArea = document.querySelector('.file-select-area');
    if (fileSelectArea) {
      fileSelectArea.style.display = 'block';
    }
    
    // 미리보기 영역 숨기기
    const previewArea = document.getElementById('preview-area');
    if (previewArea) {
      previewArea.style.display = 'none';
    }
    
    // 업로드 영역 숨기기
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.display = 'none';
    }
    
    // 결과 영역 숨기기
    const resultArea = document.getElementById('result-area');
    if (resultArea) {
      resultArea.style.display = 'none';
      resultArea.innerHTML = '';
    }
    
    // 파일 입력 초기화
    const fileInput = document.querySelector('.file-select-area input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // URL 표시 생성
  createUrlDisplay(label, url) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label + ':';
    labelEl.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    `;

    const urlContainer = document.createElement('div');
    urlContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = url;
    urlInput.readOnly = true;
    urlInput.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      font-family: monospace;
    `;

    const copyBtn = this.createButton('복사', 'secondary', () => {
      urlInput.select();
      document.execCommand('copy');
      copyBtn.textContent = '완료!';
      setTimeout(() => {
        copyBtn.textContent = '복사';
      }, 2000);
    });
    copyBtn.style.cssText += `
      padding: 8px 16px;
      font-size: 14px;
    `;

    urlContainer.appendChild(urlInput);
    urlContainer.appendChild(copyBtn);

    container.appendChild(labelEl);
    container.appendChild(urlContainer);

    return container;
  }

  // 에러 메시지 표시
  showError(message) {
    const resultArea = document.getElementById('result-area');
    if (!resultArea) return;

    resultArea.innerHTML = '';
    resultArea.style.display = 'flex';
    resultArea.style.background = '#fef2f2';
    resultArea.style.border = '1px solid #fca5a5';

    const errorIcon = document.createElement('div');
    errorIcon.textContent = '❌';
    errorIcon.style.cssText = `
      font-size: 32px;
      text-align: center;
    `;

    const errorText = document.createElement('div');
    errorText.textContent = message;
    errorText.style.cssText = `
      font-size: 14px;
      color: #dc2626;
      text-align: center;
      font-weight: 500;
    `;

    resultArea.appendChild(errorIcon);
    resultArea.appendChild(errorText);
  }

  // 파일 크기 포맷팅
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // URL 검증 및 sanitize (XSS 방지)
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    try {
      const urlObj = new URL(url);
      
      // 허용된 도메인만 허용
      const allowedDomains = ['image.my', 'cdn.image.my', 'img.image.my'];
      const hostname = urlObj.hostname.toLowerCase();
      
      if (!allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        console.warn('허용되지 않은 도메인:', hostname);
        return null;
      }
      
      // 허용된 프로토콜만 허용
      if (urlObj.protocol !== 'https:') {
        console.warn('허용되지 않은 프로토콜:', urlObj.protocol);
        return null;
      }
      
      // 위험한 문자 제거
      const sanitized = url
        .replace(/[<>\"'`]/g, '') // 위험한 문자 제거
        .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
        .replace(/data:/gi, '') // data: 프로토콜 제거
        .replace(/vbscript:/gi, ''); // vbscript: 프로토콜 제거
      
      return sanitized;
    } catch (error) {
      console.warn('유효하지 않은 URL:', url);
      return null;
    }
  }
}

export default ImageUploadModal;
