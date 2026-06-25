## 2026-06-26 - Project Hub webhook test event

- Added a leader-only `테스트 이벤트 보내기` action inside the project hub webhook modal.
- The test action records a sample `webhook_event` through the authenticated `/activity-events` API so operators can verify activity-log ingestion without setting up an external relay first.
- The modal now explains whether the current user can run the test and updates its status text after success or failure.
- This improves launch readiness by turning "webhook URL issued" into "event ingestion verified from the hub UI".
