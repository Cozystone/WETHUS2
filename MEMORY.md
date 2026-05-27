# MEMORY.md

## 장기 컨텍스트
- 사용자: 한국어로 작업 선호, 시간대 Asia/Seoul.
- 현재 핵심 프로젝트는 WETHUS이며, 방향은 학생 창업의 초반 탐색, 아이디어 검증, 팀 구성, 프로젝트 시작을 지원하는 플랫폼이다.
- 사용자는 작업 전 백업 브랜치를 항상 남기고, 되돌릴 수 있는 방식으로 일하기를 원한다.
- `WETHUS_backup_project_platform_*`는 기본 수정 금지이며, 필요하면 참고용으로만 본다.
- 불확실한 것은 추측하지 말고 Assumption으로 명시해야 한다.

## 제품 방향 메모
- 회원가입 시 관심분야를 선택하게 하고, 이를 바탕으로 탐색탭에서 아이디어/공고 추천 알고리즘을 제공하는 방향이 중요하다.
- 프로젝트 시작하기에서 제출된 아이디어는 로컬 LLM 또는 서버 검열을 거쳐 즉시 배포 또는 관리자 수동검증으로 분기되어야 한다.
- 제출 후에는 플랫폼 내 유사 아이디어와, AI가 브라우저/외부 조사로 찾은 유사 아이템 분석을 함께 보여주는 경험이 필요하다.
- UI는 현재 WETHUS 톤을 유지하되, 학생 창업자가 다음 행동을 쉽게 판단하도록 UX 밀도를 높이는 것이 목표다.

## 최근 완료된 핵심 작업
- 공고 데이터 변경 사유 문서화 완료: `WETHUS2/docs/change-log/2026-05-27-opportunity-data-rationale.md`.
- 클라이언트 노출 비밀키 제거, 인증/관리자 부트스트랩 강화, 평문 로컬 인증 제거, XSS 렌더링 하드닝을 수행했다.
- 배포 루트의 백업 산출물은 추적 제거했고, 백업/임시 산출물이 다시 커밋되지 않도록 ignore와 정적 검증을 보강했다.
- `founder.html`은 AI allow 시 `approved`, review/fallback 시 `manual_review`가 되도록 수정했다.
- 운영 사이트 기본 브라우저 점검과 GitHub Actions Static/Production smoke가 성공했다.

## 현재 기준선
- repo: `Cozystone/WETHUS2.git`
- branch: `main`
- baseline commit: `0a0254a ci: run production smoke on main pushes`
- production: `https://wethus.co.kr`
- production API: `https://wethus-api.onrender.com/health`

## 남겨진 운영 메모
- `admin@wethus.ai / 0904`는 더 이상 운영 관리자 부트스트랩으로 허용되지 않는다. 약한 비밀번호를 막는 보안 변경이 의도된 상태다.
- 운영 관리자 계정은 강한 `ADMIN_BOOTSTRAP_PASSWORD`를 Render에 잠깐 설정해 생성하고, 생성 직후 회전 또는 제거해야 한다.
- 수동검증 큐가 실제 관리자 화면에 뜨는지는 관리자 계정이 준비된 뒤 disposable 계정으로 E2E 확인해야 한다.
- 장기적으로는 DB 저장소, CSP, rate limit, 감사 로그, AI 검열 로그 보강이 필요하다.
