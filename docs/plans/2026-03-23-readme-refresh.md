# README Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` so it matches the current product scope, real repo structure, and official developer workflow.

**Architecture:** Keep the formal requirement/spec updates in the main repo docs, then apply the actual README rewrite in the isolated worktree. Treat the README as an operator-facing entry document, not a dump of duplicated config, and verify every referenced command or file against the repo before closing.

**Tech Stack:** Markdown, npm workspace scripts, FastAPI backend, Next.js frontend

---

### Task 1: Formalize the README refresh in the spec layer

**Files:**
- Modify: `docs/requirements/E-002-development-workflow-consistency.md`
- Modify: `docs/requirements/README.md`
- Modify: `docs/prd.md`
- Modify: `docs/tdd.md`

- [x] **Step 1: Add a requirement for README consistency**

Record README as a canonical repo entry point under `E-002` and describe the expected content boundaries.

- [x] **Step 2: Promote the requirement into PRD**

Update product goals, in-scope items, and acceptance so README accuracy is a formal product-maintenance expectation.

- [x] **Step 3: Promote the requirement into TDD**

Document README responsibilities, drift-prevention rules, and manual verification expectations.

- [x] **Step 4: Re-read the updated spec files**

Confirm the new requirement is consistent across Epic, PRD, and TDD before touching implementation docs.

### Task 2: Rewrite the README in the isolated worktree

**Files:**
- Modify: `README.md`

- [x] **Step 1: Build the target structure**

Reshape `README.md` into:
- project overview
- core capabilities
- repo structure
- quick start
- development modes
- production backend
- environment variables
- docs entry points

- [x] **Step 2: Remove drift-prone or incorrect content**

Replace stale file references, avoid unnecessary long `package.json` duplication, and make sure commands reflect current root scripts.

- [x] **Step 3: Preserve valid recent additions**

Carry forward the already-added production backend and mock/real dev mode guidance where it still matches the repo.

### Task 3: Verify document consistency

**Files:**
- Verify: `README.md`
- Verify: `package.json`
- Verify: `docs/prd.md`
- Verify: `docs/tdd.md`

- [x] **Step 1: Run markdown-safe consistency checks**

Run:

```bash
git diff --check
rg -n "CLAUDE\\.md|pnpm run|pnpm install" README.md docs
```

Expected:
- no diff formatting errors
- no stale README references to removed entry files or non-official package-manager commands

- [x] **Step 2: Re-read the final README**

Manually confirm the README tells a new maintainer what the product does, how to run mock vs real development, and where the formal specs live.
