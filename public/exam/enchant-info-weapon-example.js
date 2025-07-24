// enchant-info-weapon-example.js

/**
 * [파일 목적]
 * 구글 시트(무기 해방 탭)에서 등급별 무기 해방 정보를 fetch로 불러와 활용하는 예시.
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
 * https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit#gid=337738977
 */

// 실제 구글 시트에서 획득한 데이터 (2025년 1월 기준)
// 참고: 구글 시트 구조 - F열(스텟명), G열(동등급), H열(은등급), I열(금등급), J열(칠색등급)
export const weaponEnchantInfoExample = [
  { type: "스텟", bronze: "1~2.9%", silver: "3~4.9%", gold: "5~7.4%", rainbow: "7.5~10%" },
  { type: "공격력", bronze: "1~1.9%", silver: "2~3%", gold: "", rainbow: "" },
  { type: "크리티컬", bronze: "5~%", silver: "", gold: "", rainbow: "" },
  { type: "명중률", bronze: "1~4.9%", silver: "5~9.9%", gold: "10~12.5%", rainbow: "12.5~%" },
];

// 데이터 구조 설명
export const dataStructureInfo = {
  columns: {
    type: "B열 - 스텟명 (공격력, 크리티컬 등)",
    bronze: "C열 - 동 등급 수치 범위",
    silver: "D열 - 은 등급 수치 범위", 
    gold: "E열 - 금 등급 수치 범위",
    rainbow: "F열 - 칠색 등급 수치 범위"
  },
  note: "A열은 빈칸이므로 파싱 시 cols[1]부터 시작해야 함",
  source: "https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit#gid=무기시트GID"
}; 