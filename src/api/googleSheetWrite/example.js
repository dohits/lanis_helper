// 구글 시트 쓰기 API 사용 예시
import GoogleSheetWriteAPI from './index.js';

async function basicExample() {
  const api = new GoogleSheetWriteAPI();
  
  // 시트 ID 설정
  const sheetId = 'YOUR_SHEET_ID_HERE';
  const sheetName = 'TestSheet';
  
  try {
    // 1. 데이터 추가
    console.log('데이터 추가 중...');
    const dataToAdd = [
      ['2024-01-01', 'User1', 'Test Data 1'],
      ['2024-01-02', 'User2', 'Test Data 2'],
      ['2024-01-03', 'User3', 'Test Data 3']
    ];
    
    const appendResult = await api.appendData(sheetId, sheetName, dataToAdd);
    if (appendResult.success) {
      console.log('✅ 데이터 추가 성공:', appendResult.data.message);
    } else {
      console.log('❌ 데이터 추가 실패:', appendResult.error);
    }
    
    // 2. 특정 행 업데이트
    console.log('\n행 업데이트 중...');
    const updateData = ['2024-01-01', 'User1', 'Updated Test Data 1'];
    const updateResult = await api.updateRow(sheetId, sheetName, 2, updateData); // 2번째 행 업데이트
    
    if (updateResult.success) {
      console.log('✅ 행 업데이트 성공:', updateResult.data.message);
    } else {
      console.log('❌ 행 업데이트 실패:', updateResult.error);
    }
    
    // 3. 조건부 검색 및 업데이트
    console.log('\n조건부 검색 및 업데이트 중...');
    const searchResult = await api.findAndUpdate(
      sheetId, 
      sheetName, 
      1, // User ID 컬럼 (0부터 시작)
      'User2', // 검색할 값
      ['2024-01-02', 'User2', 'Found and Updated Data'] // 새로운 데이터
    );
    
    if (searchResult.success) {
      console.log('✅ 조건부 업데이트 성공:', searchResult.data.message);
    } else {
      console.log('❌ 조건부 업데이트 실패:', searchResult.error);
    }
    
  } catch (error) {
    console.error('❌ 기본 예시 실행 중 오류 발생:', error);
  }
}

// 사용법 안내
console.log(`
구글 시트 쓰기 API 사용법:

1. 시트 설정:
   - 구글 시트를 생성하고 익명 쓰기 권한을 부여
   - 시트 ID를 복사하여 API에 설정

2. 기본 API 사용:
   - appendData(): 데이터 추가
   - updateRow(): 특정 행 업데이트
   - findAndUpdate(): 조건부 검색 및 업데이트

3. 에러 처리:
   - 모든 API는 { success: boolean, data/error: string } 형태로 응답
   - 네트워크 오류, 권한 오류 등에 대한 자동 재시도 지원

예시 실행: basicExample()
`);

// 전역에서 사용할 수 있도록 export
window.basicExample = basicExample;
