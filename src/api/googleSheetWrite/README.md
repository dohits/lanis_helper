# 구글 시트 쓰기 API

익명 쓰기 권한이 부여된 공개 구글 시트에 데이터를 쓰기 위한 API 모듈입니다.

## 📋 목차

- [설치 및 설정](#설치-및-설정)
- [기본 API 사용법](#기본-api-사용법)
- [장비 셋팅 전용 API](#장비-셋팅-전용-api)
- [에러 처리](#에러-처리)
- [예시 코드](#예시-코드)

## 🔧 설치 및 설정

### 1. 구글 시트 설정

1. **구글 시트 생성**
   - Google Sheets에서 새 시트를 생성합니다.

2. **공개 설정**
   - 시트 우상단의 "공유" 버튼 클릭
   - "링크가 있는 모든 사용자" 선택
   - 권한을 "편집자"로 설정
   - "완료" 클릭

3. **시트 ID 복사**
   - URL에서 시트 ID를 복사합니다.
   - 예: `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`

### 2. API 설정

```javascript
import { EquipmentSettingAPI } from './src/api/googleSheetWrite/equipmentSettingAPI.js';

const api = new EquipmentSettingAPI();
api.setSheetId('YOUR_SHEET_ID_HERE');
```

## 📚 기본 API 사용법

### GoogleSheetWriteAPI 클래스

```javascript
import GoogleSheetWriteAPI from './src/api/googleSheetWrite/index.js';

const api = new GoogleSheetWriteAPI();
```

#### 주요 메서드

##### `appendData(sheetId, sheetName, data, options)`
새로운 데이터를 시트에 추가합니다.

```javascript
const data = [
  ['2024-01-01', 'User1', 'Data1'],
  ['2024-01-02', 'User2', 'Data2']
];

const result = await api.appendData(sheetId, 'Sheet1', data);
if (result.success) {
  console.log('데이터 추가 성공:', result.data.message);
} else {
  console.log('오류:', result.error);
}
```

##### `updateRow(sheetId, sheetName, rowNumber, data, options)`
특정 행을 업데이트합니다.

```javascript
const newData = ['2024-01-01', 'User1', 'Updated Data'];
const result = await api.updateRow(sheetId, 'Sheet1', 2, newData);
```

##### `findAndUpdate(sheetId, sheetName, searchColumnIndex, searchValue, newData, options)`
조건에 맞는 행을 찾아 업데이트합니다.

```javascript
const result = await api.findAndUpdate(
  sheetId, 
  'Sheet1', 
  1, // 검색할 컬럼 인덱스 (0부터 시작)
  'User1', // 검색할 값
  ['2024-01-01', 'User1', 'Found and Updated'] // 새로운 데이터
);
```

## 🎮 장비 셋팅 전용 API

### EquipmentSettingAPI 클래스

장비 셋팅 시뮬레이션에 특화된 API입니다.

```javascript
import { EquipmentSettingAPI } from './src/api/googleSheetWrite/equipmentSettingAPI.js';

const equipmentAPI = new EquipmentSettingAPI();
equipmentAPI.setSheetId('YOUR_SHEET_ID_HERE');
```

#### 주요 메서드

##### `initializeSheet(options)`
시트를 초기화하고 헤더를 생성합니다.

```javascript
const result = await equipmentAPI.initializeSheet();
if (result.success) {
  console.log('시트 초기화 완료');
}
```

##### `saveEquipmentSetting(settingData, options)`
장비 셋팅을 저장합니다.

```javascript
const settingData = {
  userId: 'user123',
  userName: '테스트유저',
  job: { name: '전사', icon: '⚔️' },
  element: { name: '화염', icon: '🔥' },
  mainAbility: [{ '어빌리티명': '강화된 힘', '직업': '전사' }],
  jobAbility: [{ '어빌리티명': '전사의 의지', '직업': '전사' }],
  weapon: [{ name: '강화된 검', type: '무기/검' }],
  armor: [{ name: '강화된 갑옷', type: '방어구/갑옷' }],
  accessory: [{ name: '힘의 반지', type: '장신구/반지' }],
  notes: '테스트용 셋팅'
};

const result = await equipmentAPI.saveEquipmentSetting(settingData);
if (result.success) {
  console.log('셋팅 저장 완료, ID:', result.data.settingId);
}
```

##### `getUserSettings(userId, options)`
사용자의 셋팅 목록을 조회합니다.

```javascript
const result = await equipmentAPI.getUserSettings('user123');
if (result.success) {
  console.log('조회된 셋팅 수:', result.data.settings.length);
  result.data.settings.forEach(setting => {
    console.log('셋팅 ID:', setting.id);
    console.log('직업:', setting.job);
    console.log('저장 시간:', setting.timestamp);
  });
}
```

##### `updateSetting(settingId, settingData, options)`
특정 셋팅을 업데이트합니다.

```javascript
const updateData = {
  ...originalSettingData,
  notes: '업데이트된 메모'
};

const result = await equipmentAPI.updateSetting(1, updateData);
```

##### `deleteSetting(settingId, options)`
특정 셋팅을 삭제합니다.

```javascript
const result = await equipmentAPI.deleteSetting(1);
```

## ⚠️ 에러 처리

모든 API 메서드는 일관된 응답 형식을 반환합니다:

### 성공 응답
```javascript
{
  success: true,
  data: {
    message: '작업이 성공적으로 완료되었습니다.',
    // 기타 데이터...
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### 실패 응답
```javascript
{
  success: false,
  error: '오류 메시지',
  details: '상세 오류 정보',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### 자동 재시도
- 네트워크 오류 시 자동으로 3회 재시도
- 재시도 간격은 점진적으로 증가 (1초 → 2초 → 3초)
- 타임아웃은 15초로 설정

## 💡 예시 코드

### 완전한 예시

```javascript
import { EquipmentSettingAPI } from './src/api/googleSheetWrite/equipmentSettingAPI.js';

async function completeExample() {
  const api = new EquipmentSettingAPI();
  api.setSheetId('YOUR_SHEET_ID_HERE');
  
  try {
    // 1. 시트 초기화
    const initResult = await api.initializeSheet();
    if (!initResult.success) {
      console.error('시트 초기화 실패:', initResult.error);
      return;
    }
    
    // 2. 셋팅 저장
    const settingData = {
      userId: 'user123',
      userName: '테스트유저',
      job: { name: '전사' },
      element: { name: '화염' },
      mainAbility: [{ '어빌리티명': '강화된 힘' }],
      weapon: [{ name: '강화된 검' }],
      notes: '테스트 셋팅'
    };
    
    const saveResult = await api.saveEquipmentSetting(settingData);
    if (saveResult.success) {
      console.log('저장 완료, ID:', saveResult.data.settingId);
      
      // 3. 저장된 셋팅 조회
      const loadResult = await api.getUserSettings('user123');
      if (loadResult.success) {
        console.log('조회된 셋팅:', loadResult.data.settings);
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

completeExample();
```

## 🔒 보안 고려사항

1. **익명 쓰기 권한**: 이 API는 익명 쓰기 권한이 있는 공개 시트를 대상으로 합니다.
2. **데이터 검증**: 클라이언트 측에서 데이터 유효성을 검증하세요.
3. **사용량 제한**: 구글 시트 API에는 사용량 제한이 있을 수 있습니다.
4. **백업**: 중요한 데이터는 별도로 백업하세요.

## 🐛 문제 해결

### 일반적인 문제들

1. **"시트 ID가 설정되지 않았습니다"**
   - `setSheetId()` 메서드로 시트 ID를 설정했는지 확인

2. **"HTTP error! status: 403"**
   - 시트의 공개 설정과 권한을 확인
   - 익명 쓰기 권한이 부여되었는지 확인

3. **"시트가 이미 초기화되어 있습니다"**
   - 정상적인 응답입니다. 기존 헤더가 있다는 의미

4. **네트워크 타임아웃**
   - 자동 재시도가 실행됩니다
   - 인터넷 연결 상태를 확인

### 디버깅

```javascript
// 상세한 로그 확인
const result = await api.saveEquipmentSetting(data);
console.log('전체 응답:', JSON.stringify(result, null, 2));

// 네트워크 요청 확인 (브라우저 개발자 도구)
// Network 탭에서 요청/응답을 확인할 수 있습니다.
```
