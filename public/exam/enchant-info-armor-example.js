// enchant-info-armor-example.js

/**
 * [파일 목적]
 * 구글 시트(장비해방(방어구) 탭)에서 등급별 방어구 인챈트 정보를 fetch로 불러와 활용하는 예시.
 * (공개 시트이므로 인증 불필요)
 *
 * [데이터 형식]
 * [
 *   { type: "스텟", bronze: "1~2.9%", silver: "3~4.9%", gold: "5~7.4%", rainbow: "7.5~10%" },
 *   ...
 * ]
 *
 * [출력 예시]
 * (아래 export된 데이터 참고)
 *
 * [구글 시트 원본]
 * https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit#gid=468768394
 */

// fetch를 이용한 구글 시트 csv 데이터 불러오기 예시
// (실제 사용시 서버 또는 브라우저 환경에 맞게 fetch 사용)
export async function fetchArmorEnchantInfo() {
  const sheetId = '15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng';
  const gid = '468768394'; // 장비해방(방어구) 시트 GID
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const response = await fetch(url);
  const csv = await response.text();
  // csv 파싱(간단 예시)
  const lines = csv.split('\n').filter(Boolean);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      type: cols[0],
      bronze: cols[1],
      silver: cols[2],
      gold: cols[3],
      rainbow: cols[4],
    };
  });
}

// 실제 구글 시트에서 획득한 데이터 (2025년 1월 기준)
// 참고: 구글 시트 구조 - F열(스텟명), G열(동등급), H열(은등급), I열(금등급), J열(칠색등급)
export const armorEnchantInfoExample = [
  { type: "스텟", bronze: "1~2.9%", silver: "3~4.9%", gold: "5~7.4%", rainbow: "7.5~10%" },
  { type: "회피치", bronze: "1~1.9%", silver: "2~3%", gold: "", rainbow: "" },
  { type: "회복력 증가", bronze: "5~%", silver: "", gold: "", rainbow: "" },
  { type: "상태이상 저항", bronze: "1~4.9%", silver: "5~9.9%", gold: "10~12.5%", rainbow: "12.5~%" },
  { type: "상대 스킬 확률 -", bronze: "1~2%", silver: "", gold: "", rainbow: "" },
  { type: "방어구 위력", bronze: "1~3.9%", silver: "4~%", gold: "", rainbow: "" },
  { type: "받는 피해량 감소", bronze: "1~1.9%", silver: "2~%", gold: "", rainbow: "" },
  { type: "받는 스킬 피해량 감소", bronze: "1~10%", silver: "", gold: "", rainbow: "" },
];

// 데이터 구조 설명
export const dataStructureInfo = {
  columns: {
    type: "B열 - 스텟명 (회피치, 상태이상 저항 등)",
    bronze: "C열 - 동 등급 수치 범위",
    silver: "D열 - 은 등급 수치 범위", 
    gold: "E열 - 금 등급 수치 범위",
    rainbow: "F열 - 칠색 등급 수치 범위"
  },
  note: "A열은 빈칸이므로 파싱 시 cols[1]부터 시작해야 함",
  source: "https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit#gid=468768394"
}; 