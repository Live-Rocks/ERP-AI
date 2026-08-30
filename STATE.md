# Harness State

## Run status

- State: `ready` <!-- ready | planning | implementing | verifying | blocked | complete -->
- Current phase: `none`
- Last verified phase: `none`
- Next action: Fill PROJECT.md and ROADMAP.md, then start the autonomous goal.

## Product-level acceptance

- [ ] PROJECT.md acceptance criteria are all covered and evidenced.

`STATE.md` is an operational view, not completion proof. `evidence/phase-XX.md` is the highest authority for whether a phase passed validation. A passing `check-run-state.sh` result only means the control state is internally consistent; it does not set this state to `complete` or prove product completion.

## Open blockers requiring a human decision

- None.

## Latest handoff

<!-- After every phase, record: what changed, commands run and their results, remaining risk, and the selected next phase. -->
