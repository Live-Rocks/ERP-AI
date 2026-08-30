# Autonomous Phase-Loop Rules

## Mission

Drive the product described by `PROJECT.md` through every eligible phase in `ROADMAP.md` until the product-level acceptance criteria are verified. A completed phase is a checkpoint, not a reason to wait for approval.

## Required loop

For every run and after every phase:

1. Always read `PROJECT.md`, `ROADMAP.md`, `STATE.md`, and the validation/control rules needed for the current work. Read the relevant architecture sections, decisions, dependency-phase evidence, and recovery artifacts when they affect the selected phase; do not require a full reread of append-only history when it is not relevant.
2. Select the next eligible phase using the roadmap selection policy.
3. Write or update `plans/phase-XX.md` before editing product code. Explicitly list the stable acceptance-criteria IDs covered by the phase, then include scope, files, test cases, verification commands, and rollback or recovery notes where relevant.
4. Implement only that phase. Prefer small, reversible changes.
5. Run every listed verification command. Diagnose and fix failures, then rerun the affected checks.
6. Write `evidence/phase-XX.md` with the actual changes and unedited command results. Update `STATE.md` and `ROADMAP.md`.
7. Immediately return to step 1 and select the next phase. Do not stop merely because a phase passed.

## Documentation ownership

- `PROJECT.md` is authoritative for product intent and stable acceptance criteria. Change it only when product scope or acceptance criteria change; record any human-approved change in `docs/DECISIONS.md`.
- `ROADMAP.md` is authoritative for planned work, phase ordering, dependencies, and acceptance-criteria coverage. Its status is not proof that a phase completed.
- `STATE.md` is authoritative for the current execution pointer, current mode/status, blockers, and next action. It is an operational view, not verification proof. Update it at every checkpoint. `README.md` must stay a short orientation, never a competing status record.
- `evidence/` is authoritative for actual verification results and phase completion. A phase is completed only when valid passing evidence exists for that phase. If `ROADMAP.md`, `STATE.md`, and evidence conflict, evidence is the highest authority for completion status; repair the stale control files before continuing.
- `docs/ARCHITECTURE.md` describes what is implemented now: system boundary, data ownership, critical flows, and integration contracts. Update it in the same phase as a structural change.
- `docs/DECISIONS.md` is an append-only ADR log. Record decisions that affect architecture, data governance, safety boundaries, evaluation claims, irreversible cost, or later options. Do not rewrite accepted historical rationale; supersede it with a new record.
- `docs/VALIDATION.md` defines the stable cross-phase quality gates. Update it when a new acceptance gate, evaluation protocol, or test category is introduced.
- Create `docs/OPERATIONS.md` only when there is a runtime system to operate. Create data or experiment documents only when the project has data provenance or repeatable experimental claims.

## Pause only for

- the project explicitly reaches `complete`: every product acceptance criterion has concrete passing evidence, required verification has passed, no unresolved blocker remains, and `./check-run-state.sh` passes;
- a decision listed in `PROJECT.md` as requiring human approval;
- conflicting or missing requirements that cannot be resolved from the project contract;
- repeated failure of the same verification after two targeted repair attempts;
- an unavailable dependency, permission, credential, or external state that cannot safely be changed.

When pausing, update `STATE.md` with the exact blocker, evidence, options, and the smallest question needed to continue.

`./check-run-state.sh` validates state consistency only. Its passing result does not itself mean a phase or the product is complete.

## Verification standard

- A phase is not complete because code was written or because `ROADMAP.md` says `completed`; it is complete only when its explicit verification succeeds and valid passing evidence exists in `evidence/phase-XX.md`.
- Never claim a check passed without running it or identifying why it cannot run.
- Add tests with the phase whenever its behaviour can be tested.
- Follow `docs/VALIDATION.md` for all applicable cross-phase gates; phase-local checks supplement rather than replace them.
- Preserve unrelated work. Do not perform destructive, external, paid, credential, production, or publication actions without approval.

## Completion standard

Mark the harness complete only after every `PROJECT.md` acceptance criterion is linked to concrete evidence in `evidence/` and all roadmap phases are completed, superseded with justification, or explicitly out of scope.
