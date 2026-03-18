# Plans Index

This folder stores design docs and implementation plans for work that is too large to keep only in chat.

## When To Add A Plan
- The task spans multiple files
- The task changes both behavior and documentation
- The task introduces a new workflow or interaction
- The task needs explicit execution steps or review checkpoints

## Naming Convention
- Design doc: `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Implementation plan: `docs/plans/YYYY-MM-DD-<topic>.md`

## Minimum Plan Contract
Each plan should state:
- the goal
- the architectural approach
- the exact files to create or modify
- the verification steps

## Execution Order
1. Confirm the requirement exists in meeting notes or an Epic
2. Update `docs/prd.md` if the requirement is approved
3. Update `docs/tdd.md` if technical design is needed
4. Add a plan in `docs/plans/`
5. Implement
