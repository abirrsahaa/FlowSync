# FlowSync — Development Readiness Checklist

> Fourth companion, but chronologically the **first** thing to run through. This is the "Day 0" pre-flight — verified against your actual machine, not assumed — to clear before starting Phase 0, Day 1 of `build_roadmap.md`.
>
> Everything below was checked directly (tool versions, daemon status, credentials, doc consistency) rather than assumed. Re-run the version/status commands yourself before Day 1 if any time has passed — tool state drifts.

---

## 1. Environment Status (verified 2026-07-17)

| Tool | Status | Needed by |
|---|---|---|
| Docker Engine (CLI) | ✅ installed (v29.1.3) | Phase 0, Day 1 |
| **Docker daemon / Desktop** | ❌ **not running** — CLI present but `docker info` fails to reach the daemon | Phase 0, Day 1 — blocking |
| Docker Compose | ✅ v2.40.3 | Phase 0, Day 1 |
| Node.js / npm | ✅ v22.18.0 / 10.9.3 | Phase 1 (frontend) |
| Java (OpenJDK) | ⚠️ v24.0.2 installed — spec targets JDK 21 (Loom + ZGC) | Phase 2 |
| Maven | ✅ v3.9.16 | Phase 2 — **now the confirmed build tool** for `java-realtime` |
| Gradle | not installed | not needed — Maven chosen |
| Go | ❌ not installed | Phase 7 (~Day 25) — not blocking now |
| Python 3 | ✅ v3.14.6 | Phase 0 (ai-reviewer service is Python/FastAPI now — nothing to install) |
| uv | ✅ v0.11.25 | Phase 0/4 — modern package manager for the ai-reviewer service, already present |
| kubectl | ✅ v1.36.2 | Phase 8 (~Day 27) |
| Helm | ✅ v3.19.4 | Phase 8 |
| Terraform | ❌ not installed | Phase 8 — not blocking now |
| k6 | ❌ not installed | Phase 2 drills (~Day 10) — install this week |
| ArgoCD CLI | ❌ not installed | Phase 8, optional (GitOps works via git + UI without it) |
| AWS CLI | ✅ v2.35.11, **credentials valid and authenticated** | Phase 8 |
| Homebrew | ✅ present | used for everything below |
| git repository | ❌ not initialized in this directory | Phase 0, Day 1 |
| `ANTHROPIC_API_KEY` | ❌ not set in this shell | Phase 3 (bootstrapping real eval cases) / Phase 4 (blocking — reviewers call the real API) |

---

## 2. Blocking — resolve before Day 1

1. **Start Docker Desktop.** The engine CLI is installed but the daemon isn't running (`docker info` currently errors with "no such file or directory" on the daemon socket). Phase 0's entire deliverable is `docker compose up` — nothing in Phase 0 works until this is running.
2. **Initialize git** (your call on timing, since you're doing your own repo setup — per your earlier answer I'm not scaffolding this myself):
   ```
   git init
   ```
   Do this before writing anything else so Phase 2's "earn your infrastructure" commit narrative (`development_system.md` Section 2) starts from commit #1, not retroactively.

> `protoc` is no longer needed anywhere in this project — the ai-reviewer service moved to Python/FastAPI + Kafka-consumer invocation (`sytem_design.md` Section 14), which eliminated gRPC from the system entirely. One less Day-1 blocker than the previous version of this checklist.

---

## 3. Needed this week — not blocking Day 1, but don't leave it to the last minute

- **JDK version mismatch.** You have JDK 24; the spec's Section 19 targets JDK 21 specifically for its Loom (virtual threads) + ZGC story. JDK 24 also has both features, but pin to 21 anyway so your GC-pause numbers in Phase 7 are the same JDK generation the spec's benchmarking narrative assumes — don't let "which JDK produced this GC panel" become a footnote you have to explain away later.
  ```
  brew install openjdk@21
  ```
  Point only this project at it (don't touch your global `java`) — set `JAVA_HOME` in the java-realtime service's local run script/`.mvn/jvm.config`, or use `jenv`/`sdkman` if you prefer a project-local version manager. Confirm with `java -version` inside that shell before Phase 2 begins.

- **Google OAuth Client ID/Secret** (`sytem_design.md` Section 25.2 — auth is Google-login-only). Register an OAuth 2.0 Client ID in Google Cloud Console for this project, with an authorized JavaScript origin and redirect URI for local dev (your Vite dev port). The client ID is safe in frontend config; the client secret is backend-only and must never be committed. Not needed until Phase 4 needs real login working end to end, but the Google Cloud Console app-registration step has occasional approval/verification delays — start it earlier than you think you need to.

- **Anthropic API key.** Not set in this environment at all. Get one from the Anthropic Console, confirm billing/usage limits are enabled (Phase 4's reviewers and Phase 6's large-context final-report calls are real, metered API calls), and set it as `ANTHROPIC_API_KEY` in the ai-reviewer service's local `.env` — never commit it. Load the `claude-api` skill when you get to Phase 3/4 for current model IDs, pricing, and streaming/structured-output specifics.

- **ai-reviewer Python dependencies.** Not a system-tool install — these are `uv`/pip-managed inside `services/ai-reviewer/pyproject.toml`, added when Phase 0/4 actually scaffold that service: `fastapi`, `uvicorn`, `aiokafka`, `pydantic`, `anthropic`, `redis` (async), plus `pytest`, `pytest-asyncio`, `httpx` for testing. Nothing to do now — just don't be surprised there's no system-level checklist item for these, unlike Java/Go's toolchains.

- **k6.**
  ```
  brew install k6
  ```
  First real use is Phase 2's drills (FD-05 backpressure, FD-13 in Phase 7) — install now so it's not a mid-drill scramble.

---

## 4. Needed later — fine to defer

- **Go** (`brew install go`) — Phase 7, ~Day 25. Installing it now costs nothing if you'd rather batch tool installs, but nothing blocks on it before then.
- **Terraform** — Phase 8, ~Day 27.
  ```
  brew tap hashicorp/tap && brew install hashicorp/tap/terraform
  ```
- **ArgoCD CLI** — optional even in Phase 8; the GitOps flow (Section 16) works through `git push` + the ArgoCD UI/server without the CLI. Only install if you want CLI-driven `argocd app sync` during development.
- **GitHub remote repo** — you'll want one before Phase 0's CI job has anywhere to run, and you'll need one no later than Phase 8 since ArgoCD watches a git remote. Fine to create whenever you're ready to push, doesn't block local Phase 0–7 work.
- **AWS budget alert** — your AWS CLI is already authenticated and ready, which is good, but set a billing alert **before** Phase 8 provisions EKS + MSK + RDS + ElastiCache. Leaving those running unattended after a demo recording session is the single most likely accidental-cost surprise in this entire project. This is a 5-minute AWS Budgets setup, worth doing before Day 27, not after.

---

## 5. Decisions resolved across sessions

**Build tool: Maven.** `sytem_design.md` had a real inconsistency — its repo-structure section (Section 16) named the `java-realtime` service as a Gradle project, while its own CI pipeline section two screens later ran `mvn test`. Since Maven is what's actually installed and Gradle isn't, the doc has been corrected to say Maven consistently. If you later prefer Gradle for its multi-module/Kotlin-DSL ergonomics, that's a same-day install (`brew install gradle`) and a one-line doc revert — not a structural decision, just noting it's now Maven by default.

**AI reviewer stack: Python + FastAPI, Kafka-consumer-driven, no gRPC.** The `ai-reviewer` service moved from Java/gRPC to Python/FastAPI. This also resolved a real architectural inconsistency: `sytem_design.md` Section 7 already modeled reviewers as Kafka consumers (and Section 16's KEDA autoscaling was already keyed on `stage.submissions` queue depth), while Section 14 separately described a direct gRPC streaming call. The Kafka-consumer model won — reviewers consume `stage.submissions`/`challenges`/`session.complete` via `aiokafka`, stream tokens through the same Redis pub/sub fanout canvas ops already use, and FastAPI's role is health probes + OpenAPI docs + a local debug endpoint, not the production invocation path. Net effect: gRPC is gone from the entire system (it was never used anywhere else), and `protoc` dropped out of this checklist's Day-1 blockers as a result.

---

## 6. Docker resource sizing — a note for later, not a checkbox

Once Docker Desktop is running, check **Settings → Resources** and make sure at least ~6–8GB RAM / 4 CPUs are allocated before Phase 2. Running Kafka (KRaft mode) + Redis + Postgres + Kafdrop concurrently under-provisioned is a common, genuinely confusing failure mode — Kafka appears to hang or brokers fail health checks for reasons that have nothing to do with your code, and it's easy to burn hours debugging application logic that was never the problem.

---

## 7. Day 1 Go/No-Go

Everything here must be true before you open `build_roadmap.md` Phase 0:

- [ ] `docker info` succeeds (daemon running, not just the CLI installed)
- [ ] Repo is git-initialized
- [ ] Maven confirmed as the `java-realtime` build tool (already fixed in the spec)
- [ ] Docker Desktop resource allocation checked (Section 6 above)

Everything in Sections 3–4 is real but **not** required to start — install those as you approach the phase that actually needs them. Blocking your Day 1 on Terraform or Go would be exactly the kind of premature setup this whole system is designed to avoid.

---

*FlowSync Readiness Checklist — end of document*
