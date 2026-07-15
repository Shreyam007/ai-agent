# AI DevOps Agent — Full Build Spec

**Autonomous CI/CD failure diagnosis and remediation system**
Monitors → Detects → Diagnoses → Fixes/Alerts → Learns

---

## 0. The One-Line Pitch (for your LinkedIn/resume later)

> "An agentic system that watches GitHub Actions pipelines, diagnoses failures using an LLM with structured tool use, and autonomously retries, comments fixes on PRs, or escalates to Slack — with a real-time observability dashboard."

This is genuinely a strong portfolio project *if* you avoid the naive version. The naive version (poll → GPT call → post comment) is a weekend toy. The version below is what makes a hiring manager stop scrolling. The difference is entirely in how you handle the failure modes in Section 4 — that's the actual engineering.

---

## 1. Architecture (Corrected)

Your flowchart has one structural flaw I'm fixing immediately: **polling every 60s is the wrong primary trigger.** Here's the corrected architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (any repo, any org you install the App on)   │
└───────────────┬────────────────────────────┬─────────────────┘
                 │ webhook (workflow_run)      │ fallback poll (5 min,
                 │ event: completed             │ reconciliation only)
                 ▼                              ▼
        ┌────────────────────────────────────────────┐
        │   Ingestion Layer (FastAPI + Redis Queue)    │
        │   - Verifies webhook HMAC signature          │
        │   - Dedup via Redis SETNX(run_id + attempt)  │
        │   - Pushes job to queue (not sync processing)│
        └───────────────┬──────────────────────────────┘
                         ▼
        ┌────────────────────────────────────────────┐
        │   Worker (Celery / arq / BackgroundTasks)   │
        │   1. Fetch failed job logs (GitHub API)     │
        │   2. Strip ANSI codes, truncate intelligently│
        │   3. Fetch git diff of the triggering commit │
        │   4. Redact secrets (regex + entropy scan)   │
        └───────────────┬──────────────────────────────┘
                         ▼
        ┌────────────────────────────────────────────┐
        │   LLM Diagnosis Layer (Claude API)          │
        │   - Tool use: classify_failure_type          │
        │   - Tool use: extract_root_cause              │
        │   - Tool use: propose_fix                      │
        │   - Structured JSON output (Pydantic-validated)│
        │   - Confidence score (0-1, calibrated, not     │
        │     self-reported by the LLM — see 4.6)        │
        └───────────────┬──────────────────────────────┘
                         ▼
        ┌────────────────────────────────────────────┐
        │   Decision Engine (deterministic, NOT LLM)   │
        │   - Failure category → action mapping table  │
        │   - Rate limits & circuit breakers            │
        │   - Retry budget per PR/branch                 │
        └──────┬───────────────┬────────────────┬───────┘
               ▼                ▼                ▼
        ┌───────────┐   ┌──────────────┐  ┌──────────────┐
        │ Auto-retry │   │ PR comment   │  │ Slack alert  │
        │ (bounded)  │   │ (idempotent) │  │ (rich blocks)│
        └───────────┘   └──────────────┘  └──────────────┘
                         ▼
        ┌────────────────────────────────────────────┐
        │  Postgres (state, history, cost tracking)    │
        │  + WebSocket push to React dashboard          │
        └────────────────────────────────────────────┘
```

**Why webhook-first instead of pure polling:** polling every 60s means up to 60s detection latency *and* wastes API quota (5000 req/hr GitHub limit) on repos with no activity. Webhooks are near-instant and event-driven. Keep polling only as a **reconciliation job** every 5 min to catch missed webhooks (GitHub webhooks do occasionally drop — this is documented behavior, not paranoia).

---

## 2. Tech Stack (final)

| Layer | Choice | Why |
|---|---|---|
| Ingestion | FastAPI + Redis | Webhook receiver must ack in <10s or GitHub retries/disables it |
| Queue | Celery + Redis, or `arq` (lighter, async-native) | Never do LLM calls in the webhook handler itself |
| LLM | Claude API (Sonnet for diagnosis, Haiku for cheap triage) | Tool use + long context for logs |
| DB | PostgreSQL | You need relational state: runs, retries, costs, feedback |
| Cache/Lock | Redis | Dedup, rate limiting, distributed locks |
| Backend | FastAPI (async) | Matches your learning goals |
| Frontend | React + Vite + shadcn/ui + Recharts | Real-time dashboard |
| Realtime | WebSockets (FastAPI native) or Server-Sent Events | Push pipeline status live |
| Deploy | Docker Compose (dev) → Fly.io / Railway (prod) | Cheap, fast, matches your other projects' deploy pattern |
| Secrets | GitHub App (not PAT) + `.env` via Docker secrets | See 4.9 |
| Observability | Sentry (errors) + simple custom metrics table | You need to monitor the monitor |

---

## 3. Build Phases (do these in order, each is independently demoable)

### Phase 0 — Foundations (Day 1-2)
- GitHub App registration (not a personal access token — see 4.9 for why)
- Webhook endpoint with HMAC signature verification
- Redis + Postgres via Docker Compose
- Health check endpoint

### Phase 1 — Detection (Day 2-4)
- Webhook receiver for `workflow_run` events, filtered to `conclusion=failure`
- Reconciliation poller (every 5 min, not 60s) as backup
- Dedup logic using Redis (`run_id:attempt_number` as idempotency key)
- Store raw event in Postgres

### Phase 2 — Log Fetching & Preprocessing (Day 4-6)
- Download logs via GitHub API (`GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs`)
- Unzip (logs come as zip for full runs)
- Strip ANSI escape codes
- Locate the actual error region (don't send 50k lines to the LLM — see 4.1)
- Fetch git diff for the triggering commit
- Redact secrets before anything touches the LLM (see 4.9)

### Phase 3 — LLM Diagnosis (Day 6-9)
- Design the tool-use schema: `classify_failure`, `extract_root_cause`, `propose_fix`
- Pydantic models to validate LLM output — never trust raw JSON from an LLM
- Prompt engineering with few-shot examples of failure types (test failure, build error, timeout, flaky test, infra/dependency issue, OOM)
- Calibrated confidence (see 4.6)

### Phase 4 — Decision Engine (Day 9-11)
- Deterministic rules layer, NOT another LLM call, deciding the action
- Retry budget enforcement (max N retries per commit SHA, with exponential backoff)
- Circuit breaker (if 3 repos fail diagnosis in a row, pause and alert — don't silently keep burning API credits on a broken pipeline)

### Phase 5 — Actions (Day 11-14)
- Auto-retry via GitHub API re-run endpoint
- PR comment posting — idempotent (update existing comment, don't spam new ones)
- Slack alert via Incoming Webhook, rich Block Kit formatting

### Phase 6 — Dashboard (Day 14-18)
- React dashboard: live pipeline health, failure trends, cost tracker, agent decision log
- WebSocket for real-time updates
- Historical view: "agent accuracy over time" (this is your resume gold — show you tracked whether the AI's fixes actually worked)

### Phase 7 — Hardening (Day 18-21)
- All of Section 4 below, systematically
- Load test the webhook endpoint
- Write a proper README with architecture diagram + demo video/GIF

---

## 4. Every Way This Breaks in Production (and the fix)

This is the part that actually matters. Anyone can build the happy path. This section is what separates a toy from a system.

### 4.1 — Log size blows the context window / costs a fortune
**Failure:** CI logs can be 10-50MB+ for matrix builds. Sending raw logs to Claude is expensive and often exceeds useful context.
**Fix:** Never send full logs. Parse for the error region using heuristics: search backward from the end for lines matching error patterns (`Error:`, `FAILED`, `Traceback`, non-zero exit codes, `##[error]` GitHub Actions markers). Send only ±50 lines around each detected error anchor, deduplicated. Cap total tokens sent (~4-8k tokens of log context is almost always enough). Log the truncation so you can audit missed context later.

### 4.2 — LLM hallucinates a plausible-but-wrong root cause
**Failure:** LLMs are fluent and confident even when wrong. A wrong "fix suggestion" posted publicly on a PR is worse than no suggestion — it erodes trust in the whole system.
**Fix:** Force structured tool-use output with an explicit `evidence` field that must quote the specific log line supporting the diagnosis (validate that the quoted text actually appears in the log you sent — reject the response if it doesn't, that's your hallucination tripwire). Never let the LLM self-report confidence as the sole gate (see 4.6). Add a "human review needed" bucket instead of a binary high/low confidence split.

### 4.3 — Auto-retry creates infinite loops on genuinely broken code
**Failure:** A real bug fails every time. The agent retries, fails, retries again, forever, burning CI minutes and GitHub Actions quota.
**Fix:** Hard retry budget per commit SHA (e.g., max 2 auto-retries). Track retry count in Postgres keyed by SHA. After budget exhausted, downgrade automatically to PR-comment-only, never retry again for that SHA. Distinguish "flaky" (nondeterministic, safe to retry) from "deterministic" failure using the LLM's classification — never auto-retry a classified deterministic failure (e.g., syntax error) even once, that's a wasted CI run by definition.

### 4.4 — Duplicate/spam PR comments on every re-poll
**Failure:** If reconciliation polling and webhooks both fire, or the same failure gets reprocessed, you post 5 comments on the same PR — this looks unprofessional in a demo and in real usage.
**Fix:** Idempotency key = `hash(repo + PR number + commit SHA + failure category)`. Before posting, check Postgres/Redis for an existing comment ID for that key; if found, use GitHub's edit-comment API instead of creating a new one. Store the GitHub comment ID after posting.

### 4.5 — Webhook signature not verified → spoofed events
**Failure:** Anyone who discovers your webhook URL can POST fake `workflow_run` payloads and trigger your agent to comment on arbitrary PRs or burn your API budget.
**Fix:** Always verify `X-Hub-Signature-256` HMAC using your webhook secret before processing anything. Reject with 401 on mismatch. This is non-negotiable, not an edge case.

### 4.6 — LLM self-reported "confidence" is meaningless
**Failure:** Asking an LLM "how confident are you, 0-1?" produces a number that's poorly calibrated — models are often overconfident and the number doesn't track actual accuracy.
**Fix:** Build a real confidence signal from *your* system, not the model's self-report:
- Does the LLM's cited evidence actually appear verbatim in the logs? (binary check)
- Does the failure category match a known pattern with high historical accuracy (track this in Postgres per category over time)?
- Is the diff small and localized, or large/sprawling (large diffs = lower confidence, harder to pinpoint)?
Combine these into your own weighted score. Treat the LLM's self-reported number as one weak input, not the answer.

### 4.7 — Rate limits (GitHub API: 5000/hr; Claude API: token & RPM limits)
**Failure:** A burst of failures (e.g., a bad merge to main triggering 20 dependent pipeline failures) exhausts your GitHub API quota or Claude rate limit, and the whole agent stalls or crashes.
**Fix:** Queue-based processing (already in the architecture) naturally rate-limits you. Add: exponential backoff with jitter on 429s, a token-bucket limiter in front of both APIs, and a circuit breaker that pauses new diagnosis jobs (queuing them, not dropping them) when limits are close to exhausted. Cache GitHub API responses (e.g., repo metadata) that don't change often.

### 4.8 — Secrets leak into LLM prompts
**Failure:** CI logs frequently contain API keys, tokens, or credentials in error output (e.g., a failed `curl` command that echoed a header). Sending this straight to a third-party LLM API is a real security incident, not a theoretical one.
**Fix:** Run a redaction pass before any log content leaves your infrastructure: regex patterns for common secret formats (AWS keys, GitHub tokens, JWTs, generic `key=`/`token=`/`password=` patterns) plus a Shannon-entropy check on suspicious-looking tokens. Redact to `[REDACTED]` and log that a redaction occurred (for your own audit, not sent anywhere).

### 4.9 — Using a Personal Access Token instead of a GitHub App
**Failure:** PATs are tied to your personal account, have broad scope, don't scale to multiple repos/orgs cleanly, and if leaked, compromise your whole GitHub account.
**Fix:** Register a GitHub App with narrowly scoped permissions (`actions:read`, `pull_requests:write`, `contents:read` only). Installable per-repo by anyone, including future users if you ever open-source this. Use installation tokens (short-lived, auto-rotated) instead of a long-lived PAT. This alone is worth mentioning in interviews — it shows you understand production auth, not just "getting it working."

### 4.10 — Race condition: same failure processed twice concurrently
**Failure:** Webhook fires, and simultaneously your reconciliation poller picks up the same failed run before the webhook-triggered job finishes — two workers process the same run_id concurrently, potentially double-retrying or double-commenting.
**Fix:** Redis distributed lock (`SET NX EX`) keyed on `run_id` before starting processing. Release on completion or TTL expiry (safety net if a worker crashes mid-processing).

### 4.11 — "Pipeline failed" isn't always a real failure
**Failure:** GitHub Actions reports `conclusion=failure` for things you don't want to auto-diagnose: cancelled runs, skipped runs, runs failed due to GitHub infra outages (not your code), or manually cancelled deploys.
**Fix:** Filter explicitly: only process `conclusion=failure`, explicitly exclude `cancelled`, `skipped`, `neutral`. For infra-outage detection, check if the failure log matches known GitHub-side error signatures (e.g., "This job failed because a runner..." infra messages) and route those to a separate "infra flake" bucket that doesn't get an AI diagnosis wasted on it — just an auto-retry with no LLM call at all (save cost).

### 4.12 — Matrix builds fan out into many "failures" for one root cause
**Failure:** A single bad commit fails 12 matrix jobs (different OS/versions) — without dedup, you get 12 separate diagnoses, 12 PR comments, 12 Slack alerts, for one root cause.
**Fix:** Group by `workflow_run.id` (the parent run), not individual job IDs. Diagnose the first failed job in detail, then check if other failed jobs in the same run share the same error signature (fuzzy match on error message) before running the LLM again — reuse the diagnosis if they match, don't re-call the LLM per job.

### 4.13 — Cost runs away silently
**Failure:** You have no visibility into how much this is costing until the bill arrives. This is the single most common way side projects like this quietly become expensive.
**Fix:** Log every LLM call's token count and cost to Postgres immediately. Build a simple daily/monthly cost dashboard widget on the React frontend (you'll want this for the demo anyway — "here's the agent's cost-per-diagnosis" is an impressive number to show). Set a hard daily spend cap that pauses new diagnoses (queues them for next day) if exceeded.

### 4.14 — Dashboard WebSocket doesn't scale / silently disconnects
**Failure:** A single FastAPI WebSocket connection per browser tab is fine at your scale, but naive implementations don't handle reconnection, and if the backend restarts, the frontend just... stops updating with no indication.
**Fix:** Frontend: reconnect-with-backoff logic (a small `useWebSocket` hook that retries on close). Backend: heartbeat/ping every 30s so dead connections get cleaned up. Show a visible "live / reconnecting / disconnected" indicator in the UI — small detail, huge trust signal in a demo.

### 4.15 — No feedback loop — you never learn if the AI was actually right
**Failure:** The agent posts a fix suggestion. Nobody tracks whether it was correct. Six months later you can't answer "how accurate is your AI agent?" — which is the first question anyone technical will ask you about this project.
**Fix:** Add a lightweight feedback mechanism: when a PR with an agent comment gets merged, check if the merge commit's diff resembles the agent's suggested fix (simple diff similarity, doesn't need to be perfect). Store `predicted_fix` vs `actual_fix` and compute a rolling accuracy score per failure category. This single feature is what turns "I used AI to auto-comment on PRs" into "I built a system that's 78% accurate at diagnosing CI failures, measured against actual merged fixes" — that's the sentence that gets you hired.

### 4.16 — Single point of failure: the agent itself crashes silently
**Failure:** Worker process dies, queue backs up, nobody notices until someone asks "why hasn't the bot said anything in 3 days."
**Fix:** Sentry (or similar) for exception tracking. A simple `/health` endpoint checked by an external uptime pinger (even a free one like UptimeRobot). A Slack alert if the queue depth exceeds a threshold for more than N minutes — the monitor needs its own monitor, cheaply.

### 4.17 — Multi-tenancy / scope creep
**Failure:** You build this for one repo, then want to demo it on multiple repos, and discover the whole thing has hardcoded repo names.
**Fix:** From Phase 0, model everything around a `repositories` table with per-repo config (retry budgets, Slack channel, enabled/disabled). Don't hardcode. This costs you almost nothing extra now and saves a rewrite later — and lets you demo it live on someone else's repo in an interview, which is a strong flex.

---

## 5. What Makes This Portfolio-Grade vs Toy-Grade

| Toy version | Your version |
|---|---|
| Poll every 60s | Webhook-driven + reconciliation poll |
| Send full logs to LLM | Intelligent log windowing + redaction |
| Trust LLM confidence blindly | Custom calibrated confidence signal |
| Retry forever | Bounded retry budget with circuit breaker |
| PAT auth | GitHub App with scoped permissions |
| No cost tracking | Real-time cost dashboard, spend caps |
| No feedback loop | Tracks predicted-fix vs actual-merged-fix accuracy |
| New comment every time | Idempotent comment updates |
| No security review | Secret redaction pipeline before LLM calls |

When you write this up (LinkedIn post / resume bullet / README), lead with the accuracy-tracking feature and the security-conscious design (GitHub App + redaction) — those are the two things that signal "this person thinks like an engineer, not a hackathon participant."

---

## 6. Suggested Repo Structure

```
ai-devops-agent/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routes (webhook, health, dashboard API)
│   │   ├── workers/         # Celery/arq tasks
│   │   ├── llm/              # Claude client, prompt templates, tool schemas
│   │   ├── github/           # GitHub App client, log fetching, PR/comment logic
│   │   ├── security/         # redaction, HMAC verification
│   │   ├── decision_engine/  # deterministic action rules
│   │   └── models/           # Pydantic + SQLAlchemy models
│   ├── alembic/               # DB migrations
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # dashboard widgets
│   │   ├── hooks/             # useWebSocket, useAgentStats
│   │   └── pages/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 7. Immediate Next Step

Start with Phase 0 + 1: GitHub App registration and webhook receiver with signature verification. Everything else depends on getting real webhook payloads flowing first — don't build the LLM layer against fake/sample data, use real failing pipelines from day one (deliberately break a test in a throwaway repo to generate real events).

Want me to scaffold the actual FastAPI + webhook + HMAC verification code next, or the GitHub App registration walkthrough first?
