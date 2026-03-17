# WETHUS 아키텍처 초안 (MVP)

## 제품 포지션
- 프로젝트 중심 플랫폼 (사람/프로필 중심 X)
- 실행 중심 팀 결성 + 필요 시 멘토 요청
- 운영자(큐레이터) 승인 기반

## 기술 스택
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js Route Handler (또는 Node API)
- DB: PostgreSQL
- Auth: 이메일/소셜(추후), MVP는 이메일 기반 권장

## 핵심 도메인 모델
- User
- FounderApplication
- Project
- JoinApplication
- TeamMember
- Mentor
- MentorRequest
- OperatorReviewLog

## MVP 플로우
1. Founder 신청서 제출
2. 운영자 검수/승인
3. 프로젝트 공개
4. 참여자 합류 신청
5. 팀원 확정
6. 팀 진행 업데이트
7. 멘토 요청

## API 초안
- POST /api/founder-applications
- GET /api/founder-applications/:id
- POST /api/projects/:id/approve (operator)
- GET /api/projects
- POST /api/projects/:id/join-applications
- POST /api/projects/:id/team-members/confirm
- POST /api/projects/:id/progress
- POST /api/projects/:id/mentor-requests

## 권한
- Founder: 본인 신청/프로젝트 편집
- Participant: 탐색/합류 신청
- Mentor: 요청 수락/피드백
- Operator: 승인/거절/신고 처리/멘토 검증

## AI 필터링
- FounderApplication, JoinApplication 접수 시 AI pre-check score 생성
- 위험/스팸/모호성 점수 + 사유 반환
- 최종 의사결정은 Operator가 수행
