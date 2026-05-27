# NEXT_STEPS.md

## 새 Codex 시작 체크리스트
- [ ] `VISION.md`, `STATUS.md`, `NEXT_STEPS.md`, `MEMORY.md`, `USER.md`를 읽고 10줄 요약을 작성한다.
- [ ] `git status --short --branch`, `git log --oneline -8`, `git fetch origin`으로 로컬/원격 기준선을 확인한다.
- [ ] 수정 전 `backup/pre-<task>-YYYYMMDD-HHMMSS` 브랜치를 만든다.
- [ ] `WETHUS_backup_project_platform_*`는 참고만 하고 수정하지 않는다.
- [ ] 작업 후 `node scripts/validate-static.js`와 필요한 smoke/build를 실행한다.

## P1. 관리자 부트스트랩 및 수동검증 E2E
- 목표: 프로젝트 시작하기에서 검열 실패 또는 수동검증 필요 제출이 관리자 화면에 확실히 뜨는지 운영 기준으로 확인한다.
- 할 일:
  - Render 운영 환경에 강한 `ADMIN_BOOTSTRAP_PASSWORD`와 `ADMIN_EMAIL` 설정 여부 확인.
  - 관리자 1회 로그인 후 부트스트랩 비밀번호 회전 또는 제거.
  - disposable 사용자로 프로젝트 제출, AI allow/manual/fallback 케이스를 브라우저에서 검증.
  - 관리자 화면에서 review queue 노출, 승인/반려 동작 확인.
- DoD:
  - 관리자 계정 생성 절차와 검증 결과가 `docs/change-log/`에 기록된다.
  - 운영 브라우저 테스트에서 제출 상태가 `approved` 또는 `manual_review`로 의도대로 분기된다.

## P2. 학생 창업 추천 UX 고도화
- 목표: 회원가입 관심분야, 탐색탭 추천, 아이디어 제출 후 유사 아이템 분석이 한 흐름처럼 느껴지도록 만든다.
- 할 일:
  - 관심분야 선택 데이터 구조를 사용자 프로필에 안정적으로 저장.
  - 탐색탭에서 관심분야 기반 아이디어/공고 추천 점수식을 명시하고 UI에 반영.
  - 제출 아이디어와 플랫폼 내 유사 아이디어 비교 UI를 프로젝트 시작 완료 화면에 연결.
  - 브라우저 조사 기반 유사 아이템 분석은 서버 API 또는 별도 agent workflow로 설계한다.
- DoD:
  - 신규 사용자가 가입 후 관심분야를 선택하고 탐색 추천을 즉시 확인할 수 있다.
  - 프로젝트 시작 후 유사 플랫폼 내 아이디어와 AI 조사 결과가 같은 톤의 UI로 표시된다.

## P3. 운영 저장소/보안 보강
- 목표: MVP의 정적 JSON/localStorage 중심 구조를 운영 가능한 저장소와 보안 경계로 단계적으로 옮긴다.
- 할 일:
  - 프로젝트, 리뷰 큐, 사용자 프로필, 세션의 DB 전환 후보와 마이그레이션 순서 결정.
  - CSP, 보안 헤더, rate limit, 감사 로그를 백엔드에 추가.
  - 로컬 LLM 검열 실패/타임아웃/재시도 정책을 서버 로그로 남긴다.
  - 의존성 deprecation warning과 Node/Vercel/Render 런타임 차이를 정리.
- DoD:
  - 저장소 전환 ADR 또는 change-log 문서가 생긴다.
  - 최소 보안 헤더와 rate limit가 운영 API에 적용된다.

## 즉시 참고할 기준선
- 기준 커밋: `0a0254a`
- 최근 성공 검증: GitHub Static checks, GitHub Production smoke
- 운영 사이트: `https://wethus.co.kr`
- 운영 API: `https://wethus-api.onrender.com/health`
- 주요 문서: `WETHUS2/docs/change-log/2026-05-27-opportunity-data-rationale.md`, `WETHUS2/docs/change-log/2026-05-27-admin-bootstrap-operational-check.md`
