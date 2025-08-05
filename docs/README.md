# Lanis Helper 개발자 문서 (v1.7.2)

이 폴더는 Lanis Helper Chrome Extension의 개발자용 문서들을 포함합니다.

## 📚 문서 목록

### 🏗️ 프로젝트 구조 및 아키텍처
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**  
  프로젝트 전체 구조, 모듈 설명, 개발 가이드라인

### 🚀 마이그레이션 및 기술 문서
- **[VITE_MIGRATION_PLAN.md](./VITE_MIGRATION_PLAN.md)**  
  Vite 마이그레이션 계획 및 완료 현황 (v1.5.2)

### 🤖 AI 어시스턴트 필수 규칙
- **[AI_ASSISTANT_MUST_READ.md](./AI_ASSISTANT_MUST_READ.md)**  
  CURSOR AI 등 AI 어시스턴트가 반드시 읽고 따라야 할 프로젝트 규칙

## 🎯 문서별 용도

| 문서 | 대상 | 내용 |
|------|------|------|
| **PROJECT_OVERVIEW.md** | 개발자 | 프로젝트 구조, 모듈 설명, 색상 시스템, 개발 가이드라인 |
| **VITE_MIGRATION_PLAN.md** | 개발자 | Vite 마이그레이션 과정, 기술적 세부사항, 빌드 시스템, 아이템 스카우터 문제 해결 |
| **AI_ASSISTANT_MUST_READ.md** | AI 어시스턴트 | AI가 반드시 지켜야 할 프로젝트 규칙, 커밋 메시지, 보안 등 |

## 📖 사용자용 문서

사용자용 문서는 프로젝트 루트의 [README.md](../README.md)를 참조하세요.

## 🔧 빠른 링크

- **프로젝트 루트**: [../README.md](../README.md)
- **소스 코드**: [../src/](../src/)
- **빌드 결과**: [../dist/](../dist/)
- **정적 리소스**: [../public/](../public/)

## 🆕 최신 업데이트 (v1.7.2)

### 배포용 코드 정리
- 모든 `console.log` 문 제거 (배포용 프로그램 최적화)
- 디버그 로그 제거로 성능 향상 및 보안 강화
- 개발용 로그는 유지하되 배포용에서는 제거
- API 요청 로그, 초기화 로그, 처리 완료 로그 등 모든 console.log 제거

### 확장 프로그램 컨텍스트 오류 처리 개선
- `Extension context invalidated` 오류에 대한 안전한 처리 로직 추가
- Chrome Storage 접근 시 확장 프로그램 컨텍스트 유효성 검사
- 오류 발생 시 기본 설정으로 대체하여 기능 중단 방지
- 모든 설정 관련 모듈에서 일관된 오류 처리 적용
- 사용자 경험 개선을 위한 graceful degradation 구현

### 아이템 수집 기능 메뉴 모듈 통합
- 아이템 수집 기능을 popup에서 메뉴 모듈의 settings로 이동
- `src/content/menu-module/modal/settings/item-collection-modal.js` 생성
- 메뉴 설정에 "아이템 수집" 항목 추가 (📦 아이콘)
- popup에서 아이템 수집 관련 코드 및 UI 제거

### 메뉴 모듈 구조 개선
- MenuManager에 ItemCollectionModal 인스턴스 추가
- MenuActionHandler에 itemCollection 액션 처리 추가
- 모달 시스템과 일관된 UI/UX 제공
- 아이템 개수 실시간 업데이트 기능

### 코드 정리 및 모듈화
- popup/index.js에서 아이템 수집 관련 함수들 제거
- popup/popup.html에서 아이템 수집 UI 요소 제거
- 메뉴 모듈을 통한 중앙화된 기능 관리
- 기존 기능은 그대로 유지하면서 구조 개선

### 사용자 경험 개선
- 메뉴를 통한 일관된 기능 접근
- 모달 기반의 직관적인 인터페이스
- 실시간 아이템 개수 표시
- 기존 popup의 복잡성 감소

## 🆕 이전 업데이트 (v1.7.2)

### 구글 시트 API 모듈화
- 구글 시트 호출 로직을 공통 API 모듈로 분리
- `src/api/googleSheetLoad/` 폴더에 API 모듈 생성
  - `index.js`: 기본 구글 시트 API 클래스
  - `priceDataAPI.js`: 시세 데이터 전용 API
  - `enchantInfoAPI.js`: 해방 정보 전용 API
  - `abilityInfoAPI.js`: 어빌리티 정보 전용 API

### 공통 API 기능
- 재시도 로직 및 타임아웃 처리
- CSV 파싱 및 데이터 유효성 검사
- 에러 처리 및 응답 표준화
- 헤더 인덱스 자동 추출

### 기존 코드 리팩토링
- `price-fetcher.js`: API 모듈 사용으로 간소화
- `background/index.js`: 해방/어빌리티 정보 API 사용
- 중복 코드 제거 및 모듈 간 의존성 정리
- 기존 기능은 그대로 유지하면서 코드 구조 개선

### 코드 품질 향상
- 공통 로직 중앙화로 유지보수성 향상
- 에러 처리 및 로깅 개선
- 타입 안정성 및 문서화 강화
- 모듈 간 결합도 감소

## 🆕 이전 업데이트 (v1.7.2)

### 기댓값 계산기 모달 리팩토링
- ExpectedValueUIManager를 ExpectedValueModal로 완전 리팩토링
- BaseModal 상속을 통한 일관된 모달 구조 구현
- UI 스타일링 통일 및 개선 (색상, 폰트, 간격 등)
- 토글 버튼 상태 관리 개선 및 호버 효과 추가
- 스켈레톤 애니메이션을 BaseModal에 통합
- 분해 아이템 입력 필드 생성 로직 개선

### 모듈 구조 개선
- ExpectedValueUIManager.js 파일 삭제
- MenuManager에서 ExpectedValueModal 직접 사용
- MenuActionHandler에서 메뉴 매니저의 모달 인스턴스 사용
- 모듈 간 의존성 정리 및 중복 코드 제거

### UI/UX 개선사항
- BaseModal의 공통 스타일 시스템 활용
- 일관된 색상 팔레트 적용 (#667eea, #10b981, #ef4444 등)
- 포커스 효과 및 호버 애니메이션 추가
- 반응형 디자인 개선 (maxWidth: 600px)
- 스켈레톤 로딩 애니메이션 개선

### 코드 품질 향상
- BaseModal의 createButton, createInput, createLabel 메서드 활용
- 인라인 스타일 대신 BaseModal 스타일 시스템 사용
- 이벤트 처리 로직 개선 및 에러 핸들링 강화
- 분해 아이템 데이터 처리 로직 개선

## 🆕 이전 업데이트 (v1.7.1)

### 시세 검색 로직 개선
- 정확한 아이템명 매칭으로 변경 (부분 문자열 검색에서 완전 일치 검색으로)
- "붉은" 검색 시 "붉은 구슬", "붉은 검" 등이 아닌 정확히 "붉은"만 검색되도록 수정
- 새로운 형식과 기존 형식 데이터 모두에 정확한 매칭 로직 적용
- PriceFetcher와 ItemPriceModal에서 일관된 검색 로직 구현

### 기댓값 계산기 시스템 추가
- 아이템 조합/분해의 기댓값 계산 기능 구현
- 8개 조합 아이템 지원 (활력의 포션, 봉인의 열쇠, 푸른 결정, 붉은 결정, 고급 가죽끈, 가죽끈, 낡은 가죽끈, 쇠망치)
- 5개 분해 아이템 UI 준비 (흰색/파랑/노랑/보라/빨강 등급 장비)
- 최적 조합 자동 계산 및 재료별 개별 시세 표시

### 모듈화 및 UI/UX 개선
- ExpectedValueCalculator, ExpectedValueUIManager, PriceFetcher 모듈로 분리
- 로딩 상태 표시 (스켈레톤 UI 및 버튼 상태 변경)
- 모달 외부 클릭 시 닫기 기능
- 드롭다운에 [조합]/[분해] 카테고리 태그 추가

### 데이터 소스 통합
- 평균 거래가, 최근 거래가, 직접 입력 토글 버튼
- 기존 시세 차트와 동일한 구글 시트 데이터 활용
- PriceFetcher 모듈로 중앙화된 시세 데이터 관리

---

**마지막 업데이트**: 2025년 7월 29일 (v1.7.2) 