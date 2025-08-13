// 구글 시트 쓰기 API 사용 예시
import { EquipmentSettingAPI } from './equipmentSettingAPI.js';

// 사용 예시
async function exampleUsage() {
  // API 인스턴스 생성
  const equipmentAPI = new EquipmentSettingAPI();
  
  // 시트 ID 설정 (실제 시트 ID로 변경 필요)
  equipmentAPI.setSheetId('YOUR_SHEET_ID_HERE');
  
  try {
    // 1. 시트 초기화 (헤더 생성)
    console.log('시트 초기화 중...');
    const initResult = await equipmentAPI.initializeSheet();
    if (initResult.success) {
      console.log('✅ 시트 초기화 성공:', initResult.data.message);
    } else {
      console.log('❌ 시트 초기화 실패:', initResult.error);
      return;
    }
    
    // 2. 장비 셋팅 데이터 저장
    console.log('\n장비 셋팅 저장 중...');
    const settingData = {
      userId: 'user123',
      userName: '테스트유저',
      job: { name: '전사', icon: '⚔️', color: '#ff6b6b' },
      element: { name: '화염', icon: '🔥', color: '#ff4757' },
      mainAbility: [
        { '어빌리티명': '강화된 힘', '직업': '전사', '효과': '공격력 증가' }
      ],
      jobAbility: [
        { '어빌리티명': '전사의 의지', '직업': '전사', '효과': '방어력 증가' }
      ],
      weapon: [
        { name: '강화된 검', type: '무기/검', power_min: 100, power_max: 150 }
      ],
      armor: [
        { name: '강화된 갑옷', type: '방어구/갑옷', power_min: 50, power_max: 80 }
      ],
      accessory: [
        { name: '힘의 반지', type: '장신구/반지', power_min: 20, power_max: 30 }
      ],
      notes: '테스트용 셋팅입니다.'
    };
    
    const saveResult = await equipmentAPI.saveEquipmentSetting(settingData);
    if (saveResult.success) {
      console.log('✅ 셋팅 저장 성공:', saveResult.data.message);
      console.log('저장된 셋팅 ID:', saveResult.data.settingId);
    } else {
      console.log('❌ 셋팅 저장 실패:', saveResult.error);
    }
    
    // 3. 사용자의 셋팅 목록 조회
    console.log('\n사용자 셋팅 조회 중...');
    const loadResult = await equipmentAPI.getUserSettings('user123');
    if (loadResult.success) {
      console.log('✅ 셋팅 조회 성공:', loadResult.data.message);
      console.log('조회된 셋팅 수:', loadResult.data.settings.length);
      
      loadResult.data.settings.forEach((setting, index) => {
        console.log(`\n--- 셋팅 ${index + 1} ---`);
        console.log('ID:', setting.id);
        console.log('저장 시간:', setting.timestamp);
        console.log('직업:', setting.job);
        console.log('속성:', setting.element);
        console.log('메인 어빌리티:', setting.mainAbility.join(', '));
        console.log('직업 어빌리티:', setting.jobAbility.join(', '));
        console.log('무기:', setting.weapon.join(', '));
        console.log('방어구:', setting.armor.join(', '));
        console.log('장신구:', setting.accessory.join(', '));
        console.log('메모:', setting.notes);
      });
    } else {
      console.log('❌ 셋팅 조회 실패:', loadResult.error);
    }
    
    // 4. 셋팅 업데이트 (첫 번째 셋팅이 있다면)
    if (loadResult.success && loadResult.data.settings.length > 0) {
      console.log('\n셋팅 업데이트 중...');
      const firstSetting = loadResult.data.settings[0];
      const updateData = {
        ...settingData,
        notes: '업데이트된 메모입니다.'
      };
      
      const updateResult = await equipmentAPI.updateSetting(firstSetting.id, updateData);
      if (updateResult.success) {
        console.log('✅ 셋팅 업데이트 성공:', updateResult.data.message);
      } else {
        console.log('❌ 셋팅 업데이트 실패:', updateResult.error);
      }
    }
    
  } catch (error) {
    console.error('❌ 예시 실행 중 오류 발생:', error);
  }
}

// 기본 구글 시트 쓰기 API 사용 예시
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

3. 장비 셋팅 전용 API 사용:
   - saveEquipmentSetting(): 셋팅 저장
   - getUserSettings(): 사용자 셋팅 조회
   - updateSetting(): 셋팅 업데이트
   - deleteSetting(): 셋팅 삭제

4. 에러 처리:
   - 모든 API는 { success: boolean, data/error: string } 형태로 응답
   - 네트워크 오류, 권한 오류 등에 대한 자동 재시도 지원

예시 실행: exampleUsage() 또는 basicExample()
`);

// 전역에서 사용할 수 있도록 export
window.exampleUsage = exampleUsage;
window.basicExample = basicExample;
