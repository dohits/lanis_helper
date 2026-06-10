import {
  scrollItemName,
  formatGold,
  isNoData,
  priceLines
} from '../src/content/dom-modules/scroll-price/scroll-price-utils.js';

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

check('scrollItemName', scrollItemName('과부하'), '제작 스크롤:과부하');
check('formatGold comma', formatGold(1234567), '1,234,567 Gold');
check('formatGold round', formatGold(1000000.6), '1,000,001 Gold');
check('formatGold zero', formatGold(0), '0 Gold');

check('isNoData null', isNoData(null), true);
check('isNoData zeros', isNoData({ recent: 0, average: 0 }), true);
check('isNoData hasRecent', isNoData({ recent: 5, average: 0 }), false);

check('priceLines data', priceLines({ hasData: true, recent: 1234567, average: 1000000 }),
  ['최근 거래가: 1,234,567 Gold', '30일 평균: 1,000,000 Gold']);
check('priceLines empty', priceLines({ hasData: false, recent: 0, average: 0 }),
  ['최근 거래 내역 없음']);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
