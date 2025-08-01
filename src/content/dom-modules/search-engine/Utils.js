// 검색 엔진 유틸리티 모듈

// 정규식 이스케이프
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 비동기 지연
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 문자열 검색 유틸리티
export function searchInText(text, query) {
  if (!text || !query) return false;
  
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  return normalizedText.includes(normalizedQuery);
}

// 배열 필터링 유틸리티
export function filterItems(items, query, fields = ['name']) {
  if (!query || query.trim() === '') return items;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (!value) return false;
      
      return value.toLowerCase().includes(normalizedQuery);
    });
  });
}

// 정렬 유틸리티
export function sortItems(items, sortBy = 'name', sortOrder = 'asc') {
  return [...items].sort((a, b) => {
    const aValue = a[sortBy] || '';
    const bValue = b[sortBy] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
} 