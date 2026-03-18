# Requirements Docs

This folder is the canonical requirement layer between raw discussion and approved specs.

## Read Order
- Epic index: `docs/requirements/README.md`
- Epic detail files: `docs/requirements/E-xxx-*.md`
- Approved product spec: `docs/prd.md`
- Approved technical design: `docs/tdd.md`

## Epic Index
- `E-001` [核心產品體驗建立](./E-001-core-product-experience.md)

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
- `E-001-004` 會議記錄生成功能：已定案，可升級進 PRD / TDD

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
