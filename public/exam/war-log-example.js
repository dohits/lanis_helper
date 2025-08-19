// war-log-example.js

/**
 * [파일 목적]
 * 전쟁로그 데이터를 파싱하고 활용하는 예시.
 * DOM에서 전쟁로그 정보를 추출하여 구조화된 데이터로 변환.
 *
 * [데이터 형식]
 * [
 *   { 
 *     timestamp: "2025. 8. 19. 오전 5:11:38",
 *     type: "요새 개발",
 *     result: "success",
 *     player: "히츠기",
 *     village: "세레나",
 *     target: "요새",
 *     action: "방어력 600 증가",
 *     description: "유령협동조합 길드 히츠기는 세레나 요새 방어력을 600 증가시켰다."
 *   },
 *   ...
 * ]
 *
 * [출력 예시]
 * (아래 export된 데이터 참고)
 * 
 * [참고]
 * 길드 정보는 guild-info-collector.js에서 별도로 수집되므로,
 * 플레이어명을 통해 길드 정보와 매칭하여 활용
 */

// DOM에서 전쟁로그 데이터를 파싱하는 함수
export function parseWarLogFromDOM(container) {
  const warLogs = [];
  
  // 전쟁로그 항목들을 찾기
  const logItems = container.querySelectorAll('.MuiBox-root.css-0');
  
  logItems.forEach(item => {
    // 시간 정보 추출
    const timeElement = item.querySelector('.MuiTypography-body2');
    if (!timeElement) return;
    
    const timestamp = timeElement.textContent.trim();
    
    // 타입과 결과 추출 (Chip 요소)
    const chipElement = item.querySelector('.MuiChip-root');
    if (!chipElement) return;
    
    const typeText = chipElement.textContent.trim();
    const isSuccess = chipElement.classList.contains('MuiChip-colorSuccess');
    const result = isSuccess ? 'success' : 'defeat';
    
    // 설명 텍스트 추출
    const descriptionElement = item.querySelector('.MuiTypography-body1');
    if (!descriptionElement) return;
    
    const description = descriptionElement.textContent.trim();
    
    // 설명에서 세부 정보 파싱
    const parsed = parseWarLogDescription(description, typeText);
    
    if (parsed) {
      warLogs.push({
        timestamp,
        type: typeText,
        result,
        player: parsed.player,
        village: parsed.village,
        target: parsed.target,
        action: parsed.action,
        description
      });
    }
  });
  
  return warLogs;
}

// 전쟁로그 설명 텍스트를 파싱하는 함수
function parseWarLogDescription(description, type) {
  // 공격 (승리/패배) 패턴 - 조사 고려
  if (type.includes('공격')) {
    // 패턴 1: "길드명 길드 플레이어명은/는 마을명 마을의 대상플레이어을/를 공격하여 결과했다!"
    const attackMatch1 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을의 (.+?)(?:을|를) 공격하여 (.+?)했다!?\.?$/);
    if (attackMatch1) {
      const [, guild, player, villageName, targetPlayer, result] = attackMatch1;
      return {
        player,
        village: villageName,
        target: targetPlayer,
        action: `공격 (${result})`
      };
    }
    
    // 패턴 2: "길드명 길드 플레이어명은/는 마을명 요새을/를 공격하여 결과했다."
    const attackMatch2 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새(?:을|를) 공격하여 (.+?)했다\.$/);
    if (attackMatch2) {
      const [, guild, player, villageName, result] = attackMatch2;
      return {
        player,
        village: villageName,
        target: '요새',
        action: `공격 (${result})`
      };
    }
    
    // 패턴 3: "길드명 길드 플레이어명은/는 마을명 마을의 대상플레이어을/를 공격하여 결과했다."
    const attackMatch3 = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을의 (.+?)(?:을|를) 공격하여 (.+?)했다\.$/);
    if (attackMatch3) {
      const [, guild, player, villageName, targetPlayer, result] = attackMatch3;
      return {
        player,
        village: villageName,
        target: targetPlayer,
        action: `공격 (${result})`
      };
    }
  }
  
  // 요새 개발 패턴 - 조사 고려
  if (type.includes('요새 개발')) {
    const developmentMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새 (.+?)(?:을|를) (\d+) (.+?)시켰다\.$/);
    if (developmentMatch) {
      const [, guild, player, villageName, stat, amount, action] = developmentMatch;
      return {
        player,
        village: villageName,
        target: '요새',
        action: `${stat} ${amount} ${action}`
      };
    }
  }
  
  // 요새 파괴 패턴 - 조사 고려
  if (type.includes('요새 파괴')) {
    const destructionMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 요새 (.+?)(?:을|를) (\d+) (.+?)시켰다\.$/);
    if (destructionMatch) {
      const [, guild, player, villageName, stat, amount, action] = destructionMatch;
      return {
        player,
        village: villageName,
        target: '요새',
        action: `${stat} ${amount} ${action}`
      };
    }
  }
  
  // 마을 점령 패턴 - 조사 고려
  if (type.includes('마을 점령')) {
    const occupationMatch = description.match(/^(.+?) 길드 (.+?)(?:은|는) (.+?) 마을(?:을|를) 점령했다!$/);
    if (occupationMatch) {
      const [, guild, player, villageName] = occupationMatch;
      return {
        player,
        village: villageName,
        target: '마을',
        action: '점령'
      };
    }
  }
  
  // 디버깅을 위한 로그 (매칭되지 않는 경우)
  console.warn('전쟁로그 파싱 실패:', { description, type });
  
  return null;
}

// 시간 문자열을 Date 객체로 변환하는 헬퍼 함수
export function parseWarLogTime(timeStr) {
  if (!timeStr) return new Date(0);
  
  const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const [, year, month, day, ampm, hour, minute, second] = timeMatch;
    let hour24 = parseInt(hour, 10);
    if (ampm === '오후' && hour24 !== 12) hour24 += 12;
    if (ampm === '오전' && hour24 === 12) hour24 = 0;
    
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // 월은 0부터 시작
      parseInt(day, 10),
      hour24,
      parseInt(minute, 10),
      parseInt(second, 10)
    );
  }
  return new Date(0);
}

// 실제 DOM에서 파싱한 전쟁로그 데이터 예시
export const warLogExample = [
  {
    timestamp: "2025. 8. 19. 오전 5:11:38",
    type: "요새 개발",
    result: "success",
    player: "히츠기",
    village: "세레나",
    target: "요새",
    action: "방어력 600 증가",
    description: "유령협동조합 길드 히츠기는 세레나 요새 방어력을 600 증가시켰다."
  },
  {
    timestamp: "2025. 8. 19. 오전 5:11:32",
    type: "요새 개발",
    result: "success",
    player: "히츠기",
    village: "세레나",
    target: "요새",
    action: "공격력 600 증가",
    description: "유령협동조합 길드 히츠기는 세레나 요새 공격력을 600 증가시켰다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:58",
    type: "공격 (승리)",
    result: "success",
    player: "수고하세요",
    village: "포트스미스",
    target: "잠곰",
    action: "공격 (승리)",
    description: "라니스 길드 수고하세요는 포트스미스 마을의 잠곰을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:57",
    type: "공격 (승리)",
    result: "success",
    player: "삼이",
    village: "포트스미스",
    target: "땅콩",
    action: "공격 (승리)",
    description: "라니스 길드 삼이는 포트스미스 마을의 땅콩을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:55",
    type: "공격 (승리)",
    result: "success",
    player: "하루",
    village: "포트스미스",
    target: "연애혁명",
    action: "공격 (승리)",
    description: "라니스 길드 하루는 포트스미스 마을의 연애혁명을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:49",
    type: "공격 (승리)",
    result: "success",
    player: "개복치",
    village: "포트스미스",
    target: "놀러와써요",
    action: "공격 (승리)",
    description: "라니스 길드 개복치는 포트스미스 마을의 놀러와써요를 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:47",
    type: "공격 (패배)",
    result: "defeat",
    player: "아루루",
    village: "세레나",
    target: "히츠기",
    action: "공격 (패배)",
    description: "침묵 길드 아루루는 세레나 마을의 히츠기를 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:45",
    type: "공격 (패배)",
    result: "defeat",
    player: "리치",
    village: "윈디아",
    target: "요새",
    action: "공격 (패배)",
    description: "로켓단 길드 리치는 윈디아 요새를 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:37",
    type: "공격 (승리)",
    result: "success",
    player: "비밀",
    village: "윈디아",
    target: "이훈",
    action: "공격 (승리)",
    description: "비밀 길드 비밀은 윈디아 마을의 이훈을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:35",
    type: "공격 (패배)",
    result: "defeat",
    player: "도히님",
    village: "페스타",
    target: "하스키",
    action: "공격 (패배)",
    description: "제국 길드 도히님은 페스타 마을의 하스키를 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:32",
    type: "공격 (승리)",
    result: "success",
    player: "tgl",
    village: "페스타",
    target: "무컁",
    action: "공격 (승리)",
    description: "로켓단 길드 tgl는 페스타 마을의 무컁을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:27",
    type: "공격 (패배)",
    result: "defeat",
    player: "유딩",
    village: "윈디아",
    target: "이훈",
    action: "공격 (패배)",
    description: "비밀 길드 유딩은 윈디아 마을의 이훈을 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:27",
    type: "공격 (승리)",
    result: "success",
    player: "연애혁명",
    village: "무지르",
    target: "어둠의설",
    action: "공격 (승리)",
    description: "위버멘시 길드 연애혁명은 무지르 마을의 어둠의설을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:21",
    type: "공격 (패배)",
    result: "defeat",
    player: "포프",
    village: "윈디아",
    target: "이훈",
    action: "공격 (패배)",
    description: "로켓단 길드 포프는 윈디아 마을의 이훈을 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:19",
    type: "공격 (패배)",
    result: "defeat",
    player: "하츠바쿄",
    village: "무지르",
    target: "어둠의설",
    action: "공격 (패배)",
    description: "유령협동조합 길드 하츠바쿄는 무지르 마을의 어둠의설을 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:59:15",
    type: "공격 (패배)",
    result: "defeat",
    player: "쮸니",
    village: "윈디아",
    target: "이훈",
    action: "공격 (패배)",
    description: "이클립스 길드 쮸니는 윈디아 마을의 이훈을 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:58:54",
    type: "공격 (승리)",
    result: "success",
    player: "너마늘생강캐",
    village: "무지르",
    target: "우당탕",
    action: "공격 (승리)",
    description: "유령협동조합 길드 너마늘생강캐는 무지르 마을의 우당탕을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:58:52",
    type: "공격 (패배)",
    result: "defeat",
    player: "요괴",
    village: "페스타",
    target: "무컁",
    action: "공격 (패배)",
    description: "로켓단 길드 요괴는 페스타 마을의 무컁을 공격하여 패배했다."
  },
  {
    timestamp: "2025. 8. 18. 오후 9:58:34",
    type: "공격 (승리)",
    result: "success",
    player: "강산애",
    village: "윈디아",
    target: "깡통",
    action: "공격 (승리)",
    description: "로켓단 길드 강산애는 윈디아 마을의 깡통을 공격하여 승리했다!"
  },
  {
    timestamp: "2025. 8. 18. 오후 9:58:20",
    type: "공격 (승리)",
    result: "success",
    player: "시농",
    village: "무지르",
    target: "삼이",
    action: "공격 (승리)",
    description: "유령협동조합 길드 시농은 무지르 마을의 삼이를 공격하여 승리했다!"
  }
];

// 데이터 구조 설명
export const dataStructureInfo = {
  columns: {
    timestamp: "전쟁로그 발생 시간 (2025. 8. 19. 오전 5:11:38 형식)",
    type: "전쟁로그 타입 (공격 (승리), 공격 (패배), 요새 개발, 요새 파괴, 마을 점령 등)",
    result: "결과 (success/defeat)",
    player: "플레이어명 (길드 정보는 guild-info-collector.js에서 매칭)",
    village: "마을명 (포트스미스, 윈디아, 세레나, 페스타, 무지르 등)",
    target: "대상 (요새, 마을, 플레이어명)",
    action: "행동 내용",
    description: "원본 설명 텍스트"
  },
  note: "DOM에서 파싱한 전쟁로그 데이터 구조 - 길드 정보는 별도 수집된 데이터와 플레이어명으로 매칭",
  source: "Lanis 게임 내 전쟁로그 페이지"
};

// 전쟁로그 타입별 분류 함수
export function categorizeWarLogs(warLogs) {
  const categories = {
    attack: { success: [], defeat: [] },
    fortress: { development: [], destruction: [] },
    occupation: []
  };
  
  warLogs.forEach(log => {
    if (log.type.includes('공격')) {
      if (log.result === 'success') {
        categories.attack.success.push(log);
      } else {
        categories.attack.defeat.push(log);
      }
    } else if (log.type.includes('요새')) {
      categories.fortress.development.push(log);
    } else if (log.type.includes('요새 파괴')) {
      categories.fortress.destruction.push(log);
    } else if (log.type.includes('마을 점령')) {
      categories.occupation.push(log);
    }
  });
  
  return categories;
}

// 길드별 전쟁로그 통계 함수 (길드 정보와 매칭 필요)
export function getGuildWarStats(warLogs, guildInfo) {
  const stats = {};
  
  warLogs.forEach(log => {
    // 길드 정보에서 플레이어의 길드 찾기
    const playerGuild = findPlayerGuild(log.player, guildInfo);
    if (!playerGuild) return; // 길드 정보가 없으면 스킵
    
    if (!stats[playerGuild]) {
      stats[playerGuild] = {
        total: 0,
        success: 0,
        defeat: 0,
        attacks: 0,
        fortressActions: 0,
        occupations: 0
      };
    }
    
    stats[playerGuild].total++;
    
    if (log.type.includes('공격')) {
      stats[playerGuild].attacks++;
      if (log.result === 'success') {
        stats[playerGuild].success++;
      } else {
        stats[playerGuild].defeat++;
      }
    } else if (log.type.includes('요새')) {
      stats[playerGuild].fortressActions++;
    } else if (log.type.includes('마을 점령')) {
      stats[playerGuild].occupations++;
    }
  });
  
  return stats;
}

// 플레이어의 길드를 찾는 헬퍼 함수
function findPlayerGuild(playerName, guildInfo) {
  if (!guildInfo || !guildInfo.guilds) return null;
  
  for (const guild of guildInfo.guilds) {
    if (guild.members && guild.members.some(member => member.name === playerName)) {
      return guild.name;
    }
  }
  
  return null;
}

// 테스트용 함수
export function testWarLogParsing() {
  console.log('전쟁로그 파싱 테스트');
  console.log('예시 데이터:', warLogExample);
  
  // 실제 DOM 데이터에서 제공된 예시들로 파싱 테스트
  const testDescriptions = [
    "유령협동조합 길드 히츠기는 세레나 요새 방어력을 600 증가시켰다.",
    "유령협동조합 길드 히츠기는 세레나 요새 공격력을 600 증가시켰다.",
    "라니스 길드 수고하세요는 포트스미스 마을의 잠곰을 공격하여 승리했다!",
    "라니스 길드 삼이는 포트스미스 마을의 땅콩을 공격하여 승리했다!",
    "라니스 길드 하루는 포트스미스 마을의 연애혁명을 공격하여 승리했다!",
    "라니스 길드 개복치는 포트스미스 마을의 놀러와써요를 공격하여 승리했다!",
    "침묵 길드 아루루는 세레나 마을의 히츠기를 공격하여 패배했다.",
    "로켓단 길드 리치는 윈디아 요새를 공격하여 패배했다.",
    "비밀 길드 비밀은 윈디아 마을의 이훈을 공격하여 승리했다!",
    "제국 길드 도히님은 페스타 마을의 하스키를 공격하여 패배했다.",
    "로켓단 길드 tgl는 페스타 마을의 무컁을 공격하여 승리했다!",
    "비밀 길드 유딩은 윈디아 마을의 이훈을 공격하여 패배했다.",
    "위버멘시 길드 연애혁명은 무지르 마을의 어둠의설을 공격하여 승리했다!",
    "로켓단 길드 포프는 윈디아 마을의 이훈을 공격하여 패배했다.",
    "유령협동조합 길드 하츠바쿄는 무지르 마을의 어둠의설을 공격하여 패배했다.",
    "이클립스 길드 쮸니는 윈디아 마을의 이훈을 공격하여 패배했다.",
    "유령협동조합 길드 너마늘생강캐는 무지르 마을의 우당탕을 공격하여 승리했다!",
    "로켓단 길드 요괴는 페스타 마을의 무컁을 공격하여 패배했다.",
    "로켓단 길드 강산애는 윈디아 마을의 깡통을 공격하여 승리했다!",
    "유령협동조합 길드 시농은 무지르 마을의 삼이를 공격하여 승리했다!"
  ];
  
  console.log('=== 파싱 테스트 ===');
  testDescriptions.forEach((desc, index) => {
    let type = '';
    if (desc.includes('공격하여')) {
      type = desc.includes('승리') ? '공격 (승리)' : '공격 (패배)';
    } else if (desc.includes('증가시켰다')) {
      type = '요새 개발';
    }
    
    const result = parseWarLogDescription(desc, type);
    console.log(`${index + 1}. ${desc}`);
    console.log(`   타입: ${type}`);
    console.log(`   파싱 결과:`, result);
    console.log('---');
  });
  
  const categories = categorizeWarLogs(warLogExample);
  console.log('카테고리별 분류:', categories);
  
  // 길드 정보가 없으므로 길드별 통계는 생략
  console.log('길드별 통계: 길드 정보와 매칭 필요');
}

// 전역에서 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  window.warLogExample = warLogExample;
  window.testWarLogParsing = testWarLogParsing;
  window.parseWarLogFromDOM = parseWarLogFromDOM;
  window.categorizeWarLogs = categorizeWarLogs;
  window.getGuildWarStats = getGuildWarStats;
}
