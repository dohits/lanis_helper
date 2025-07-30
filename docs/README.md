# Lanis Helper 개발자 문서 (v1.7.1)

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

## 🆕 최신 업데이트 (v1.7.1)

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

**마지막 업데이트**: 2025년 7월 29일 (v1.7.0) 