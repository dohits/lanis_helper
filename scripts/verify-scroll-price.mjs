import {
  scrollItemName,
  formatGold,
  formatTransactionDate,
  recentTransactions,
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
function checkTrue(name, cond) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}`);
  }
}

check('scrollItemName', scrollItemName('과부하'), '제작 스크롤:과부하');

check('formatGold comma', formatGold(2000001), '2,000,001골드');
check('formatGold round', formatGold(1000000.6), '1,000,001골드');
check('formatGold zero', formatGold(0), '0골드');

// recentTransactions: 최근순 정렬 + 상위 3건 + { price, completedAt } 매핑 (불필요 필드 제거)
const sample = [
  { price: 10, completedAt: '2026-06-08T00:00:00.000Z', extra: 'x' },
  { price: 30, completedAt: '2026-06-10T00:00:00.000Z' },
  { price: 20, completedAt: '2026-06-09T00:00:00.000Z' },
  { price: 5, completedAt: '2026-06-07T00:00:00.000Z' }
];
check('recentTransactions top3 sorted', recentTransactions(sample, 3), [
  { price: 30, completedAt: '2026-06-10T00:00:00.000Z' },
  { price: 20, completedAt: '2026-06-09T00:00:00.000Z' },
  { price: 10, completedAt: '2026-06-08T00:00:00.000Z' }
]);
check('recentTransactions non-array', recentTransactions(null), []);

// formatTransactionDate: KST 고정. ICU 버전 차이로 전체 문자열은 느슨히 검증.
const dt = formatTransactionDate('2026-06-10T06:13:29.139Z'); // 06:13 UTC + 9h = 15:13 KST
checkTrue('formatTransactionDate has year', typeof dt === 'string' && dt.includes('2026'));
checkTrue('formatTransactionDate KST time', dt.includes('3:13:29'));

// priceLines
check('priceLines empty', priceLines({ hasData: false, transactions: [] }), ['최근 거래 내역 없음']);
check('priceLines null', priceLines(null), ['최근 거래 내역 없음']);
const pl = priceLines({
  hasData: true,
  transactions: [{ price: 2000001, completedAt: '2026-06-10T06:13:29.139Z' }]
});
check('priceLines header', pl[0], '최근 거래 내역');
checkTrue('priceLines entry format', pl.length === 2 && /^- 2,000,001골드 \/ /.test(pl[1]));

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
