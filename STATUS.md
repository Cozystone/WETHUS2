# STATUS.md

## 현재 상태 요약
- 장기 맥락상 현재 핵심 트랙은 **WETHUS 제품 개발**.
- Palantir Foundry 추천 MVP는 레거시 맥락으로 보관.
- 세션 재시작/길이 이슈가 있어 진행사항을 파일 메모리로 남기는 운영 원칙 확립.

## 최근 작업 단서 (repo 기준)
- `WETHUS2/data/opportunity-published.json` 변경됨
- `WETHUS2/data/opportunity-review-queue.json` 변경됨
- 백업 디렉터리/스냅샷 파일 다수 존재 (`WETHUS_backup_project_platform_*` 등)

## 현재 운영 원칙
- 결정사항/진행상황은 메모리 파일에 지속 기록
- 다음 작업자가 즉시 이해 가능한 문서 우선
- 실행 단위는 작게 쪼개고 완료 조건을 명시

## Blockers / Risks
- 대량 백업 파일과 실제 제품 코드의 경계가 혼재되어 있음
- 우선순위가 파일 단위로 명시되지 않으면 인수인계 시 혼선 가능

## 당장 필요한 정리
1. 활성 코드 경로와 백업 경로 분리 원칙 명시
2. 데이터 파일 변경 의도(왜 바꿨는지) 기록
3. 다음 실행 태스크 1~3개를 DoD와 함께 고정
