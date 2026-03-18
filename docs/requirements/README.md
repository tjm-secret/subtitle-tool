# Requirements Docs

This folder is the canonical requirement layer between raw discussion and approved specs.

## Read Order
- Epic index: `docs/requirements/README.md`
- Epic detail files: `docs/requirements/E-xxx-*.md`
- Approved product spec: `docs/prd.md`
- Approved technical design: `docs/tdd.md`

## Epic Index
- `E-001` [核心產品體驗建立](./E-001-core-product-experience.md)
- `E-002` [開發工作流一致性](./E-002-development-workflow-consistency.md)

## Structure
- `E-xxx-*.md`
  - One file per large theme / Epic.
  - Each Epic file is the source of truth for its child requirements.
  - Requirement IDs use the format `E-001-001`.

## Rules
- Every new discussion starts in meeting notes or direct discussion, then gets folded into the appropriate Epic file.
- Every Requirement belongs to exactly one Epic.
- Requirements are tracked inside the Epic file, not in a separate tracker table.
- Only Requirement entries can be promoted into PRD.
- Epics never go directly into PRD or TDD.
- PRD sections should state which Epic and requirement titles they cover.
- TDD sections should state which Epic and requirement titles they implement.

## Promotion Flow
1. Discussion or meeting note
2. Epic file refinement
3. `docs/prd.md`
4. `docs/tdd.md`
5. `docs/plans/`
6. Implementation

## Current Promotion Snapshot
- `E-001-001` 核心主流程可用：已定案，已同步進 PRD / TDD
- `E-001-003` 第一版範圍邊界清楚：已定案，已在 PRD 定義 MVP scope
- `E-002-001` JavaScript 套件管理統一使用 npm：已定案，已同步進 PRD / TDD

## Epic File Contract
Each Epic file should contain:
- Background and problem
- Goals and non-goals
- Current decisions
- Phase 1
- Phase 2
- Phase 3
- Requirement list
- Open questions
- PRD promotion gate
