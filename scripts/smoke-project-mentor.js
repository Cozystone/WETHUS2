const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'WETHUS2', 'backend');
const port = Number(process.env.WETHUS_PROJECT_MENTOR_SMOKE_PORT || 8897);
const baseUrl = `http://127.0.0.1:${port}`;
const errors = [];

function fail(message) {
  errors.push(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

async function waitForServer(child, logs) {
  for (let i = 0; i < 40; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`backend did not start on ${baseUrl}\n${logs.text}`);
}

function expectList(name, value, maxLength) {
  if (!Array.isArray(value)) {
    fail(`${name} should be an array`);
    return;
  }
  if (value.length > maxLength) {
    fail(`${name} should contain at most ${maxLength} items, got ${value.length}`);
  }
  if (value.some((item) => !String(item || '').trim())) {
    fail(`${name} should not contain empty items`);
  }
}

(async () => {
  const logs = { text: '' };
  const smokeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wethus-project-mentor-smoke-'));
  let child;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        WETHUS_DATA_DIR: smokeDataDir,
        RATE_LIMIT_DISABLED: 'true',
        AI_PROVIDER: 'local'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => {
      logs.text += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      logs.text += chunk.toString();
    });

    await waitForServer(child, logs);

    const response = await fetch(`${baseUrl}/ai/project-mentor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        trigger: 'smoke',
        userPrompt: '배포 우선순위와 다음 실행 단계를 정리해줘.',
        project: {
          title: 'WETHUS Commerce Hub',
          category: 'StartupBusiness',
          status: '진행 중',
          summary: '학생 창업 플랫폼의 배포 안정화와 사용자 흐름 고도화 작업'
        },
        hub: {
          goal: '좋아요, 댓글, 지원서, AI 멘토 흐름을 상용 수준으로 안정화한다.',
          weeklyTodos: ['배포 이슈 재현', '핵심 흐름 회귀 테스트', '멘토 답변 품질 개선'],
          recentActivities: [{ text: 'Google Docs 연동 상태를 점검했다.' }],
          teamChat: [{ from: 'Leader', text: '배포 전 좋아요와 댓글이 실제로 반영되는지 다시 보자.' }],
          materials: [{ name: 'launch-checklist.md' }],
          tools: [{ name: 'Google Docs', connected: true, desc: '운영 체크리스트' }]
        },
        insights: [
          { resourceName: 'launch-checklist.md', snippet: '좋아요, 댓글, 지원서, OAuth, 탐색 반영을 출시 전 확인한다.' }
        ],
        events: [
          { event_type: 'integration_synced', source_type: 'google_docs', source_item_name: '운영 체크리스트', occurred_at: new Date().toISOString() }
        ],
        statusSnapshot: {
          current_stage: '진행 중',
          recent_activity_summary: '운영 체크리스트 기준 회귀 점검 중',
          suggested_next_action: '좋아요와 댓글 흐름 재검증'
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      fail(`/ai/project-mentor should return 200, got ${response.status}`);
    }
    if (!payload?.ok) {
      fail('/ai/project-mentor should return ok=true');
    }
    if (!String(payload?.summary || '').trim()) {
      fail('project mentor response should include a summary');
    }
    if (!String(payload?.priority || '').trim()) {
      fail('project mentor response should include a priority');
    }
    if (!String(payload?.mentorMode || '').trim()) {
      fail('project mentor response should include mentorMode');
    }
    if (!String(payload?.reviewedAt || '').trim()) {
      fail('project mentor response should include reviewedAt');
    }
    expectList('nextActions', payload?.nextActions, 3);
    expectList('questions', payload?.questions, 2);
    expectList('toolActions', payload?.toolActions, 2);
    expectList('grounding', payload?.grounding, 4);
  } catch (error) {
    fail(error.message || String(error));
  } finally {
    await stopChild(child);
    fs.rmSync(smokeDataDir, { recursive: true, force: true });
  }

  if (errors.length) {
    console.error('Project mentor smoke failures:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Project mentor smoke passed.');
})();
