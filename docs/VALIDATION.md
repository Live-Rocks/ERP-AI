# Verification Contract

This document holds stable quality gates that apply across more than one phase. A phase plan must reference every applicable gate and may add its own narrower checks.

## Claim levels

| Label | Meaning | Required evidence |
| --- | --- | --- |
| implemented | Code/configuration exists | focused test or static check |
| verified | Behaviour passed its planned automated checks | command output or artifact in `evidence/` |
| system-verified | A real integrated environment was exercised | reproducible integration evidence |
| user-verified | The intended user flow was manually completed | recorded scenario and result |

Never promote a claim to a higher level without its required evidence.

Passing static checks, unit tests, type checks, or builds does not automatically mean a user-visible acceptance criterion is user-verified. For user-observable behaviour, evidence should include a suitable observed user or integrated-system scenario whenever feasible; select the method based on the requirement rather than requiring browser automation for every phase.

## State validity is not completion

`./check-run-state.sh` checks that the recorded control state is internally consistent. A passing result does **not** prove a phase passed or that the product is complete. Product completion additionally requires an explicit `complete` state, concrete passing evidence for every acceptance criterion, all required verification, and no unresolved blocker.

## Baseline gates

| Gate | When it applies | Command or artifact | Passing condition |
| --- | --- | --- | --- |
| Formatting/lint | when configured | <!-- command --> | exits 0 |
| Unit tests | changed logic | <!-- command --> | exits 0 |
| Build/type check | compiled projects | <!-- command --> | exits 0 |
| Integration/smoke | changed system boundary | <!-- command or scenario --> | expected path completes |
| Product acceptance | release candidate | `PROJECT.md` criteria + evidence | every criterion is linked to evidence |

## Evaluation protocol

<!-- For AI/data/model work: define frozen datasets, splits, thresholds, scoring, comparisons, and what claims the evidence does not support. Keep repeatable experiment history in docs/EXPERIMENTS.md when needed. -->

## Evidence rules

- Preserve failures and negative results; do not replace them with a later success without a link.
- A new threshold, dataset split, baseline, or test fixture requires a recorded decision when it changes the claim being made.
- Verification should fail closed: a failed gate must exit non-zero or be visibly marked failed in its evidence.
- A passed evidence record must contain one non-empty `Command:` or `Check:` line, a non-empty `Result:` line that records a passing outcome, and a non-empty `Observed:` line. Empty Markdown fences and Markdown syntax are not verification evidence.
