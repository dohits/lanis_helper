// ability-info-example.js

/**
 * [파일 목적]
 * 구글 시트(어빌리티 정보)에서 어빌리티 데이터를 fetch로 불러와 활용하는 예시.
 * (공개 시트이므로 인증 불필요)
 *
 * [데이터 형식]
 * [
 *   { job: "직업명", name: "어빌리티명", effect: "효과" },
 *   ...
 * ]
 *
 * [출력 예시]
 * (아래 export된 데이터 참고)
 *
 * [구글 시트 원본]
 * https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/edit#gid=0
 */

// fetch를 이용한 구글 시트 csv 데이터 불러오기 예시
// (실제 사용시 서버 또는 브라우저 환경에 맞게 fetch 사용)
export async function fetchAbilityInfo() {
  const sheetId = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
  const gid = '0'; // 어빌리티 정보 시트 GID
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const response = await fetch(url);
  const csv = await response.text();
  // robust CSV 파싱 (쉼표, 줄바꿈, 따옴표 모두 처리)
  function parseCSV(str) {
    const rows = [];
    let row = [];
    let val = '';
    let inQuotes = false;
    let i = 0;
    while (i < str.length) {
      const c = str[i];
      if (inQuotes) {
        if (c === '"') {
          if (str[i+1] === '"') { val += '"'; i++; }
          else inQuotes = false;
        } else {
          val += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(val); val = ''; }
        else if (c === '\n' || c === '\r') {
          if (val !== '' || row.length > 0) { row.push(val); rows.push(row); row = []; val = ''; }
          if (c === '\r' && str[i+1] === '\n') i++;
        } else {
          val += c;
        }
      }
      i++;
    }
    if (val !== '' || row.length > 0) { row.push(val); rows.push(row); }
    return rows;
  }
  const rows = parseCSV(csv);
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(cols => {
    const obj = {};
    header.forEach((h, i) => obj[h] = (cols[i]||'').trim());
    return obj;
  }).filter(row => row['직업'] && row['어빌리티명'] && row['효과']);
}

// 실제 구글 시트에서 획득한 데이터 예시 (2025년 1월 기준)
// 참고: 구글 시트 구조 - A열(직업), B열(어빌리티명), C열(효과)
export const abilityInfoExample = [
  { job: "검술", name: "블록", effect: "적의 공격을 5% 확률로 무효화" },
  { job: "검술", name: "블로킹", effect: "적의 공격을 10% 확률로 무효화" },
  { job: "검술", name: "퍼펙트 블로킹", effect: "적의 공격을 15% 확률로 무효화" },
  { job: "검술", name: "엔드 블로킹", effect: "적의 공격을 20% 확률로 무효화" },
  { job: "검술", name: "샤프스", effect: "물리 공격력 15% 상승" },
  { job: "검술", name: "하이 샤프니스", effect: "물리 공격력 20% 상승" },
  { job: "검술", name: "액스 샤프니스", effect: "물리 공격력 25% 상승" },
  { job: "검술", name: "맥스 샤프니스", effect: "물리 공격력 35% 상승" },
  { job: "체술", name: "분노의 일격", effect: "치명타 데미지 15% 상승" },
  { job: "체술", name: "혼신의 일격", effect: "치명타 데미지 30% 상승" },
  { job: "체술", name: "일격 필살", effect: "치명타 데미지 50% 상승" },
  { job: "체술", name: "체득", effect: "취득 경험치 5% 증가, 50% 확률로 숙련도 1 증가" },
  { job: "체술", name: "카운터", effect: "적이 공격했을 때, 15% 확률로 반격 (반격 데미지는 50% 방어를 관통, 회피 가능)" },
  { job: "체술", name: "크로스 카운터", effect: "적이 공격했을 때, 30%확률로 반격 (반격 데미지는 50% 방어를 관통, 회피 가능)" },
  { job: "신술", name: "재생 LV1", effect: "매 턴마다 HP 최대치 일부 회복 (회복력 비례, 최대 2%)" },
  { job: "신술", name: "재생 LV2", effect: "매 턴마다 HP 최대치 일부 회복 (회복력 비례, 최대 4%)" },
  { job: "신술", name: "재생 LV3", effect: "매 턴마다 HP 최대치 일부 회복 (회복력 비례, 최대 6%)" },
  { job: "신술", name: "재생 LV4", effect: "매 턴마다 HP 최대치 일부 회복 (회복력 비례, 최대 9%)" },
  { job: "신술", name: "재생 LV5", effect: "매 턴마다 HP 최대치 일부 회복 (회복력 비례, 최대 12%)" },
  { job: "신술", name: "프로텍션", effect: "물리 스킬 데미지 10% 경감" },
  { job: "신술", name: "하이 프로텍션", effect: "물리 스킬 데미지 15% 경감" },
  { job: "신술", name: "엑스 프로텍션", effect: "물리 스킬 데미지 20% 경감" },
  { job: "신술", name: "맥스 프로텍션", effect: "물리 스킬 데미지 30% 경감" },
  { job: "신술", name: "매직 바리어", effect: "마법 스킬 데미지 10% 경감" },
  { job: "신술", name: "매직 아우라", effect: "마법 스킬 데미지 15% 경감" },
  { job: "신술", name: "매직 프로텍트", effect: "마법 스킬 데미지 20% 경감" },
  { job: "신술", name: "매직 디스펠", effect: "마법 스킬 데미지 30% 경감" },
  { job: "신술", name: "봉인", effect: "매 공격마다 2% 확률로 상대의 어빌리티 1개 봉인" }
  // ... 이하 생략
];

// 데이터 구조 설명
export const dataStructureInfo = {
  columns: {
    job: "A열 - 직업명 (검술, 체술, 신술 등)",
    name: "B열 - 어빌리티명",
    effect: "C열 - 효과 설명"
  },
  note: "A열~C열만 파싱, D열 이후는 무시됨",
  source: "https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/edit#gid=0"
}; 