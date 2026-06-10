import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  extractScrollAbilityName,
  findAbilityEffect
} from '../src/content/dom-modules/item-stats/scroll-ability-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, '../src/shared/ability-data.json'), 'utf-8')
);

let failed = 0;
function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// 어빌명 추출: 끝의 (금) 같은 괄호부 제거 후 콜론 뒤
check('extract basic', extractScrollAbilityName('제작 스크롤:과부하(금)'), '과부하');
check('extract fullwidth colon', extractScrollAbilityName('제작 스크롤：천운(은)'), '천운');
check('extract no colon -> null', extractScrollAbilityName('고통의 나이프'), null);

// 매칭: 전체 어빌(장비/직업) 대상, 공백 정규화
check('equip ability (과부하)', findAbilityEffect(data, '과부하'), '스킬 데미지가 25% 증가하지만, MP 소비가 30% 증가한다.');
check('spacing normalize (냉기 돌풍 -> 냉기돌풍)', findAbilityEffect(data, '냉기 돌풍'), '매 공격마다 10% 확률로 상대방을 빙결 상태로 만든다.');
check('job ability (블록)', findAbilityEffect(data, '블록'), '적의 공격을 3.5% 확률로 무효화');
check('not found -> null', findAbilityEffect(data, '존재하지않는어빌'), null);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
