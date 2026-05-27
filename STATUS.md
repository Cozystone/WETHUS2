# STATUS.md

## 현재 상태 요약
- 현재 제품 트랙은 WETHUS: 학생 창업의 초반 탐색, 아이디어 검증, 팀/프로젝트 출발을 돕는 실행형 플랫폼이다.
- 신뢰 가능한 기준선은 `main` / `origin/main`의 `0a0254a ci: run production smoke on main pushes`이다.
- GitHub 기준 `main`은 원격과 동기화되어 있고, Static checks와 Production smoke가 성공한 상태로 확인되었다.
- 운영 사이트 `https://wethus.co.kr`은 랜딩, 탐색, 공고 열람, 로그인/관리자 진입, 프로젝트 시작 화면의 기본 브라우저 점검을 통과했다.
- 보안 긴급 작업은 1차로 완료했다: 클라이언트 비밀키 제거, 로컬 인증 평문 저장 제거, 백엔드 인증 강화, XSS 렌더링 하드닝, 배포 루트 백업 산출물 제거.

## 완료된 주요 작업
- `WETHUS2/docs/change-log/2026-05-27-opportunity-data-rationale.md`에 공고 데이터 변경 이유, 기대효과, 리스크, 롤백 기준을 기록했다.
- `WETHUS2/backend/server.js`에서 강한 `JWT_SECRET`/관리자 부트스트랩 비밀번호 요구, PBKDF2 해시, 레거시 해시 마이그레이션, HTTPS 쿠키 설정을 반영했다.
- `WETHUS2/app.js`의 클라이언트 노출 API 키를 제거하고 서버/로컬 LLM 기반 검열 흐름의 실패 시 수동검증 전환을 명확히 했다.
- `founder.html` 제출 흐름은 AI가 허용한 경우 `approved`, 검토 필요 또는 AI 실패 시 `manual_review`로 저장하도록 수정했다.
- `admin.html`, `explore.html`, `profile.html`, `project-hub.html`, `dm.html`, `notifications.html`, `mentor.html`, `opportunities.html`, `index.html`, `member.html` 등 주요 정적 화면의 HTML 삽입 지점을 escape 처리했다.
- 정적 검증 스크립트와 GitHub Actions를 보강했고, production smoke가 `main` push에서도 실행되도록 설정했다.

## 운영 기준선
- 로컬 브랜치: `main`
- 원격 기준: `origin/main`
- 기준 커밋: `0a0254a`
- 핵심 검증: `node scripts/validate-static.js`, `node scripts/smoke-production.js`, GitHub Static checks, GitHub Production smoke
- 보호 백업 브랜치 예시: `backup/pre-handoff-doc-refresh-20260527-171500` 및 이전 `backup/pre-*` 브랜치들

## 남은 리스크
- 운영 관리자 계정은 약한 비밀번호 `0904`로 만들 수 없게 막아둔 상태다. Render 환경변수에 강한 `ADMIN_BOOTSTRAP_PASSWORD`를 1회 설정해 관리자 계정을 만든 뒤 즉시 회전/제거해야 한다.
- 프로젝트 제출부터 관리자 수동검증 노출까지의 완전한 E2E는 실제 관리자 계정이 준비된 뒤 다시 브라우저로 확인해야 한다.
- 현재 정적/JSON 기반 상태 저장은 MVP에는 유효하지만, 운영 신뢰성을 위해 DB 기반 프로젝트/리뷰/세션 저장소로 옮겨야 한다.
- CSP, 보안 헤더, rate limit, 감사 로그는 아직 별도 보강 여지가 있다.
- Node 런타임에서 일부 의존성의 `punycode` deprecation warning이 관찰되었으나 즉시 장애로 보이지는 않는다.

## 작업 원칙
- `WETHUS_backup_project_platform_*` 디렉터리는 기본 수정 금지, 참고만 한다.
- 파일 수정 전에는 `backup/pre-*` 브랜치를 만든다.
- 불확실한 운영 상태는 추측하지 않고 Assumption 또는 확인 필요로 남긴다.
- 보안/운영 변경은 코드, 문서, 검증, 커밋까지 한 묶음으로 남긴다.
