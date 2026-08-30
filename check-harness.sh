#!/usr/bin/env bash
set -euo pipefail

required=(README.md PROJECT.md ROADMAP.md STATE.md AGENTS.md START_GOAL.md docs/ARCHITECTURE.md docs/DECISIONS.md docs/VALIDATION.md templates/DECISION.md templates/PHASE_PLAN.md templates/PHASE_EVIDENCE.md check-run-state.sh)

for file in "${required[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "missing or empty: $file" >&2
    exit 1
  fi
done

for marker in "## Required loop" "Do not stop merely because a phase passed." "## Documentation ownership" "evidence is the highest authority" "## Pause only for"; do
  if ! grep -Fq "$marker" AGENTS.md; then
    echo "missing harness rule: $marker" >&2
    exit 1
  fi
done

echo "Harness starter is structurally complete."
