# Start an autonomous run

After `PROJECT.md` and `ROADMAP.md` describe a real product, paste and customize this command in Codex:

```text
/goal Build the product defined in PROJECT.md by autonomously executing every eligible phase in ROADMAP.md.

Read and follow AGENTS.md and the `docs/` control documents. Treat ROADMAP.md as a dependency-aware work queue: every phase must declare which stable `AC-NNN` IDs it covers. After each phase passes its verification, write evidence with the phase ID, the satisfied AC IDs, executed verification, and revisions; then update roadmap, state, and any affected architecture/decision/validation documentation, and immediately plan and execute the next eligible phase. Do not pause for ordinary phase approval, but pause and ask when AGENTS.md, PROJECT.md, or ROADMAP.md requires a human approval; this includes Phase 08 OT endpoints, read-only credentials, point mappings, network segmentation, and change windows.

`./check-run-state.sh` only proves the current control state is valid and internally consistent. It does not prove that a phase or the product is complete.

Stop only when either:

1. `STATE.md` explicitly declares the project `complete`, every acceptance criterion in `PROJECT.md` has concrete passing evidence, all required verification has passed, no unresolved blocker remains, **and** `./check-run-state.sh` passes; or
2. a pause condition in `AGENTS.md` is met.

Do not broaden product scope. Run all phase verification commands and report compact checkpoint updates: current phase, verified evidence, next phase, and blockers.
```

## First-run discovery variant

If you have only a rough idea, begin with a normal conversation:

```text
Turn my idea into a complete PROJECT.md and a dependency-aware ROADMAP.md for a first release. Give each acceptance criterion a unique stable `AC-NNN` ID and make every roadmap phase declare its covered IDs. Ask questions only when the answer materially changes scope, acceptance criteria, or a human-approval decision. Do not implement yet.
```

Once those two files are reviewed, use the autonomous run command above.
