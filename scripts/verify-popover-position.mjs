import { computePaperAdjustment } from '../src/content/dom-modules/item-stats/popover-position.js';

let failed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}: got ${a}, expected ${e}`);
  }
}

const vh = 800; // 뷰포트 높이, margin=20 → 하단 임계 780, maxHeight 임계 760

// 범위 내 → 보정 없음
check('in bounds', computePaperAdjustment({ top: 100, bottom: 300, height: 200 }, vh), {});

// 하단 이탈 (bottom 790 > 780), height 200 → top = 800-200-20 = 580
check('bottom overflow', computePaperAdjustment({ top: 590, bottom: 790, height: 200 }, vh), { top: 580 });

// 상단 이탈 (top 10 < 20) → top = 20
check('top overflow', computePaperAdjustment({ top: 10, bottom: 210, height: 200 }, vh), { top: 20 });

// 긴 내용 (height 900 > 760) + 하단 이탈 → top=max(20,800-900-20)=20, maxHeight=760
check('tall content', computePaperAdjustment({ top: 50, bottom: 950, height: 900 }, vh), { top: 20, maxHeight: 760 });

// 상단·하단 동시: 하단이 top=580 설정 후 상단이 top=20으로 덮어씀
check('both overflow top wins', computePaperAdjustment({ top: 10, bottom: 790, height: 200 }, vh), { top: 20 });

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
