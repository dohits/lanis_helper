// enchant-info-accessory-example.js

/**
 * [파일 목적]
 * 구글 시트(장비해방(장신구) 탭)에서 등급별 장신구 인챈트 정보를 fetch로 불러와 활용하는 예시.
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
 * https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit?gid=567672096#gid=567672096
 */

// fetch를 이용한 구글 시트 csv 데이터 불러오기 예시
// (실제 사용시 서버 또는 브라우저 환경에 맞게 fetch 사용)
export async function fetchAccessoryEnchantInfo() {
  const sheetId = '15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng';
  const gid = '567672096'; // 장비해방(장신구) 시트 GID
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
export const ACCESSORY_ENCHANT_INFO_EXAMPLE = [
  { type: "지력", bronze: "1~2.9%", silver: "3~4.9%", gold: "5~7.4%", rainbow: "7.5~10%" },
  { type: "생명", bronze: "1~1.9%", silver: "2~3%", gold: "", rainbow: "" },
  { type: "속도", bronze: "1~4.9%", silver: "5~?", gold: "", rainbow: "" },
  { type: "행운", bronze: "1~4.9%", silver: "5~9.9%", gold: "10~12.5%", rainbow: "12.5~?" },
  { type: "받는 피해량 감소", bronze: "1~2%", silver: "", gold: "", rainbow: "" },
  { type: "행운", bronze: "1~3.9%", silver: "4~?%", gold: "", rainbow: "" },
  { type: "생명", bronze: "1~1.9%", silver: "2~?%", gold: "", rainbow: "" },
  { type: "받는 피해량 감소", bronze: "1~10%", silver: "", gold: "", rainbow: "" },
  { type: "회피치", bronze: "1~1.9%", silver: "2~3%", gold: "", rainbow: "" },
  { type: "적중치", bronze: "1~2.3%", silver: "", gold: "", rainbow: "" },
  { type: "받는 피해량 감소", bronze: "1~1.9%", silver: "", gold: "", rainbow: "" },
  { type: "회복력 증가", bronze: "1~5.1%", silver: "", gold: "", rainbow: "" },
  { type: "적중치", bronze: "1~2.6%", silver: "", gold: "", rainbow: "" },
  { type: "받는 피해량 감소", bronze: "1~1%", silver: "", gold: "", rainbow: "" },
  { type: "치명타 확률", bronze: "1~1.4%", silver: "", gold: "", rainbow: "" },
  { type: "적중치", bronze: "1~2.8%", silver: "", gold: "", rainbow: "" },
  { type: "정신", bronze: "1~1.5%", silver: "", gold: "", rainbow: "" }
];

// 사용 예시
export function displayAccessoryEnchantInfo() {
  const container = document.createElement('div');
  container.innerHTML = `
    <h3>장신구 해방 정보</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">스텟</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">동 등급</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">은 등급</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">금 등급</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">칠색 등급</th>
        </tr>
      </thead>
      <tbody>
        ${ACCESSORY_ENCHANT_INFO_EXAMPLE.map(item => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.type}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.bronze || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.silver || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.gold || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.rainbow || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  return container;
} 