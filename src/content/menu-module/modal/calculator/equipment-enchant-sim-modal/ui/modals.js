// 모달 관련 로직
export class Modals {
  // 성공 모달 표시
  showSuccessModal(equipmentName, power, weight, score) {
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10030;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #10b981; margin: 0 0 16px 0;">등록 성공</h3>
        <div style="margin: 0 0 20px 0; color: #374151; text-align: left;">
          <p style="margin: 0 0 8px 0;"><strong>장비:</strong> ${equipmentName}</p>
          <p style="margin: 0 0 8px 0;"><strong>위력:</strong> ${power}</p>
          <p style="margin: 0 0 8px 0;"><strong>무게:</strong> ${weight}</p>
          <p style="margin: 0;"><strong>점수:</strong> ${score}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 실패 모달 표시
  showErrorModal(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10030;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #dc2626; margin: 0 0 16px 0;">등록 실패</h3>
        <p style="margin: 0 0 20px 0; color: #374151;">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}
