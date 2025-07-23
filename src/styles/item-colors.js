// 아이템 등급별 색상 관리
// 점수 색상을 기준으로 등급 색상도 통일

const ITEM_COLORS = {
  // 등급별 색상 (점수 색상과 동일)
  grades: {
    '무결': '#00FFF0',  // 청록색
    '완벽': '#FFE066',  // 노란색
    '최상': '#FF5555',  // 빨간색
    '상': '#C770FF',    // 보라색 (5점)
    '중': '#FFFF66',    // 노란색
    '하': '#66A3FF',    // 파란색 (3점)
    '최하': '#CCCCCC',  // 회색
    '불량': '#BBBBBB',  // 연회색
    '폐급': '#888888',  // 진회색
    '누락': '#FF8888'   // 연빨간색
  },

  // 공통 색상
  common: {
    range: '#666666',      // 범위 정보 (회색)
    percent: '#666666',    // 퍼센트 정보 (회색)
    wiki: '#888888',       // 위키 정보 (연회색)
    narrow: '#666666',     // 범위 좁음 정보 (회색)
    finalScore: '#666666'  // 최종 점수 (회색)
  },

  // 등급별 점수 색상 가져오기
  getGradeColor: function(grade) {
    return this.grades[grade] || '#666666';
  },

  // 점수별 색상 가져오기 (등급과 동일)
  getScoreColor: function(score) {
    const scoreToGrade = {
      8: '무결',
      7: '완벽', 
      6: '최상',
      5: '상',
      4: '중',
      3: '하',
      2: '최하',
      1: '불량',
      0: '폐급'
    };
    const grade = scoreToGrade[score];
    return grade ? this.grades[grade] : '#666666';
  }
};

// ES6 모듈로 export
export default ITEM_COLORS; 