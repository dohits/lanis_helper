// 스크롤 시세 조회 서비스 (공유 싱글톤 페처 — 24h 캐시/중복요청 제거 재사용)
import OfficialPriceFetcher from '../../calculator/official-price-fetcher.js';
import { scrollItemName, recentTransactions } from './scroll-price-utils.js';

// 모듈 싱글톤: 두 기능이 공유하여 같은 스크롤은 세션 내 하루 1회만 실제 요청
const fetcher = new OfficialPriceFetcher();

// 어빌명 → { hasData, transactions: [{ price, completedAt }] } (최근순 최대 3건)
export async function fetchScrollPrice(abilityName) {
  try {
    const list = await fetcher.getPriceHistory(scrollItemName(abilityName));
    const transactions = recentTransactions(list, 3);
    return { hasData: transactions.length > 0, transactions };
  } catch (error) {
    console.warn('[ScrollPrice] 시세 조회 실패:', error);
    return { hasData: false, transactions: [] };
  }
}
