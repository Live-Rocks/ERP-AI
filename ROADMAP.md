# Roadmap

The roadmap is an ordered queue, not a manual checklist. A phase becomes eligible when all of its dependencies and entry conditions are satisfied.

| Phase | Goal | Depends on | Covers | Entry conditions | Done when | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

Use a two-digit phase ID such as `01`. `Depends on` is `none` or comma-separated phase IDs. `Covers` is `none` or comma-separated stable acceptance-criteria IDs such as `AC-NNN`.

`Status` tracks planning progress (`planned`, `in_progress`, `completed`, `blocked`, or `superseded`); it is never proof of completion. A `completed` phase requires matching passing evidence in `evidence/phase-XX.md`.

## Selection policy

1. Select the earliest uncompleted phase whose dependencies have passing evidence.
2. If no phase is eligible and the product criteria are not met, diagnose the blocked dependency and repair it when safe.
3. If a missing decision is required, record it in `STATE.md` and ask the user. Do not invent a product requirement.
4. A phase may be split only when its plan shows it cannot be validated as one coherent increment. Update this roadmap before implementation.
