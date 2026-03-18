# Adoption Brief

## Current Stage
這份內容目前是中間整理稿。
請先看看這份內容，確認有沒有正確反映原始需求和目前狀態。
確認沒問題後，可以請 AI 繼續整理成正式 Epic。

## Existing Markdown Files
- `.pytest_cache/README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `api/.pytest_cache/README.md`
- `api/TEST_README.md`
- `frontend/README.md`

## Authoritative Docs
No authoritative docs recognized.

## Promotion Candidates
### `CLAUDE.md`
- Document status: `candidate`
- Source role: `technical-design-source`
- Recommended action: promote-to-tdd
- Why: content keyword match
- Summary: CLAUDE.md: This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### `README.md`
- Document status: `candidate`
- Source role: `project-overview`
- Recommended action: promote-to-epic
- Why: README path hint
- Summary: Subtitles Tool Monorepo（字幕工具）: 這是一個語音轉文字的字幕工具 monorepo，整合：

## Reference Only Docs
### `.pytest_cache/README.md`
- Document status: `reference`
- Source role: `template-or-scaffold`
- Recommended action: ignore-for-promotion
- Why: content keyword match
- Summary: pytest cache directory #: This directory contains data from the pytest's cache plugin,

### `AGENTS.md`
- Document status: `reference`
- Source role: `process-rule`
- Recommended action: reference-only
- Why: AGENTS path hint
- Summary: Agent Handbook: Use this quick reference to keep coding agents aligned with the current repository state.

### `api/.pytest_cache/README.md`
- Document status: `reference`
- Source role: `template-or-scaffold`
- Recommended action: ignore-for-promotion
- Why: content keyword match
- Summary: pytest cache directory #: This directory contains data from the pytest's cache plugin,

### `api/TEST_README.md`
- Document status: `reference`
- Source role: `execution-plan`
- Recommended action: reference-only
- Why: content keyword match
- Summary: 字幕转录API测试文档: 这是一个结构化的测试套件，采用Python测试最佳实践，为字幕转录API提供全面的单元测试覆盖。

### `frontend/README.md`
- Document status: `reference`
- Source role: `template-or-scaffold`
- Recommended action: ignore-for-promotion
- Why: content keyword match
- Summary: or: This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Recommended Next Step
1. Review files under `Authoritative Docs` first and keep them as the current docs-first source of truth.
2. Promote files marked `promote-to-epic` into `docs/requirements/E-xxx-*.md` when the requirement is stable.
3. Promote files marked `promote-to-prd` or `promote-to-tdd` only after confirming they add information not already covered by the authoritative docs.
4. Keep files marked `reference-only` as context and ignore files marked `ignore-for-promotion`.
