# NEXT_STEPS.md

## 새 PC Codex 시작 체크리스트
- [ ] `VISION.md`, `STATUS.md`, `MEMORY.md`, `USER.md` 읽고 10줄 요약 작성
- [ ] 활성 개발 경로를 확인하고(예: `WETHUS2/`) 백업 디렉터리 제외 규칙 확정
- [ ] 최근 변경 데이터 파일 2개의 변경 목적/영향을 문서화
- [ ] 오늘 처리할 1순위 태스크 1개를 선택해 실행 계획 수립

## 우선 실행 태스크 (P1~P3)

### P1. 데이터 변경 의도 명문화
- 대상: `WETHUS2/data/opportunity-published.json`, `WETHUS2/data/opportunity-review-queue.json`
- 할 일:
  - 변경 diff 확인
  - 변경 이유, 기대효과, 롤백 기준 작성
- DoD:
  - `docs/change-log/` 또는 동등 문서에 1페이지 기록 완료

### P2. 코드/백업 경계 정리
- 대상: 루트 디렉터리 구조
- 할 일:
  - 백업 산출물 디렉터리 네이밍/보관 정책 정의
  - 개발 대상 디렉터리 명확화
- DoD:
  - `README` 또는 `CONTRIBUTING`에 “활성 경로 vs 백업 경로” 명시

### P3. 다음 기능 사이클 계획
- 할 일:
  - 이번 스프린트에서 사용자 가치가 큰 기능 1개 선정
  - 작업을 0.5~1일 단위로 분해
- DoD:
  - 이슈 3개 이상 생성(분석/구현/검증)

## 새 Codex에 바로 줄 부트 프롬프트

```txt
이 저장소 인수인계를 받는 Codex다.
1) VISION.md
2) STATUS.md
3) NEXT_STEPS.md
4) MEMORY.md
5) USER.md
순서대로 읽고 핵심 요약 10줄 작성.
그 다음 오늘 바로 실행할 P1 태스크를 진행하고,
변경사항·의사결정·남은 리스크를 문서화하라.
```
