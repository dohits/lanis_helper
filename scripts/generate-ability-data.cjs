// 어빌리티 정보 시트를 fetch 해 src/shared/ability-data.json 을 생성하는 1회성 유틸.
// 재생성: `node scripts/generate-ability-data.cjs`
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const OUT = path.join(__dirname, '..', 'src', 'shared', 'ability-data.json');

// src/api/googleSheetLoad/index.js 의 parseCSV 와 동일한 파서
function parseCSV(csv) {
  const rows = [];
  let row = [];
  let val = '';
  let inQuotes = false;
  let i = 0;
  while (i < csv.length) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"') {
        if (csv[i + 1] === '"') { val += '"'; i++; }
        else { inQuotes = false; }
      } else { val += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(val); val = ''; }
      else if (c === '\n' || c === '\r') {
        if (val !== '' || row.length > 0) {
          row.push(val); rows.push(row); row = []; val = '';
        }
        if (c === '\r' && csv[i + 1] === '\n') i++;
      } else { val += c; }
    }
    i++;
  }
  if (val !== '' || row.length > 0) { row.push(val); rows.push(row); }
  return rows;
}

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const rows = parseCSV(csv);
  if (!rows || rows.length < 2) throw new Error('데이터가 충분하지 않습니다.');

  // fetchAbilityInfo 와 동일: 헤더 trim, 셀 trim, (직업 && 어빌리티명 && 효과) 필터
  const header = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((cols) => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
    return obj;
  }).filter((r) => r['직업'] && r['어빌리티명'] && r['효과']);

  // 내장 검증
  if (data.length === 0) throw new Error('필터 후 데이터가 0건입니다.');
  const required = ['직업', '전직', '어빌리티명', '효과', '무기 타입 효과', '숙련도'];
  for (const key of required) {
    if (!(key in data[0])) throw new Error(`헤더 누락: ${key}`);
  }
  const badRow = data.find((r) => !r['효과']);
  if (badRow) throw new Error('효과가 빈 행이 포함됨 (필터 오류)');

  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`생성 완료: ${OUT} (${data.length}건)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
