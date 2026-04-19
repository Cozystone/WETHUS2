# WETHUS 대회/공모전 수집 파이프라인 (MVP)

## 목표
- 자동 게시 ❌
- 자동 수집 + 정규화 + 중복제거 + 검토큐 적재 ✅

## 파일 구조
- `data/opportunity-sources.json` : 수집 소스 목록
- `data/opportunity-review-queue.json` : 검토 대기 큐
- `data/opportunity-published.json` : 승인/게시본

## 운영 방식
1. 크론이 하루 3회 수집 실행
2. 웹 검색/페이지 요약으로 후보 수집
3. 아래 스키마로 정규화
4. `dedupe_key = title|organizer|deadline` 기반 중복 제거
5. review queue에 append
6. 운영자가 검토 후 published로 이동

## 최소 스키마
```json
{
  "id": "opp-...",
  "title": "",
  "organizer": "",
  "type": "공모전|창업대회|지원사업|해커톤|프로그램/행사",
  "summary": "",
  "description": "",
  "eligibility": ["고등학생 가능", "대학생 가능", "개인 가능"],
  "teamRequirement": "individual|team|either",
  "deadline": "YYYY-MM-DD",
  "tags": ["AI/IT", "교육"],
  "benefits": "",
  "official_url": "https://...",
  "source_name": "",
  "source_url": "https://...",
  "status": "open|closed|unknown",
  "created_at": "ISO",
  "updated_at": "ISO",
  "dedupe_key": "title|organizer|deadline"
}
```

## 추천 스케줄
- 09:00 / 14:00 / 20:00 (KST)

## 노트
- Contest Korea 등은 구조 변경 가능성이 있어 검색+요약 방식이 안전함
- 반드시 사람 검토 후 게시 (허위/마감/중복 방지)
