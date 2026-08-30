#!/usr/bin/env bash
set -euo pipefail

# Validates the Markdown-first control state. It intentionally checks only the
# small schema documented in PROJECT.md, ROADMAP.md, STATE.md, and templates.

errors=0
temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/harness-run-state.XXXXXX")
trap 'rm -rf "$temp_dir"' EXIT

acs_file="$temp_dir/acs"
phases_file="$temp_dir/phases.tsv"
coverage_file="$temp_dir/coverage.tsv"
evidence_file="$temp_dir/evidence.tsv"
evidence_ac_file="$temp_dir/evidence-ac.tsv"
acceptance_lines_file="$temp_dir/acceptance-lines"
touch "$acs_file" "$phases_file" "$coverage_file" "$evidence_file" "$evidence_ac_file" "$acceptance_lines_file"

error() {
  printf 'ERROR: %s\n' "$1" >&2
  errors=$((errors + 1))
}

trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
}

has_exact_line() {
  local value="$1"
  local file="$2"
  grep -Fqx "$value" "$file"
}

phase_exists() {
  awk -F '\t' -v phase="$1" '$1 == phase { found = 1 } END { exit(found ? 0 : 1) }' "$phases_file"
}

phase_field() {
  local phase="$1"
  local field="$2"
  awk -F '\t' -v phase="$phase" -v field="$field" '$1 == phase { print $field; exit }' "$phases_file"
}

phase_has_passing_evidence() {
  awk -F '\t' -v phase="$1" '$1 == phase && $2 == "passed" { found = 1 } END { exit(found ? 0 : 1) }' "$evidence_file"
}

extract_evidence_acs() {
  awk '
    /^Acceptance criteria satisfied:[[:space:]]*$/ { inside = 1; next }
    inside && /^## / { inside = 0 }
    inside && /^- AC-[0-9][0-9][0-9]([[:space:]]|$)/ {
      value = $2
      sub(/[^A-Z0-9-].*$/, "", value)
      print value
    }
  ' "$1"
}

has_actual_passing_verification() {
  awk '
    /^## Verification[[:space:]]*$/ { in_verification = 1; next }
    in_verification && /^## / { in_verification = 0 }
    in_verification && /^Command:[[:space:]]*/ {
      value = $0
      sub(/^Command:[[:space:]]*/, "", value)
      if (value != "" && value !~ /^<!--/ && value !~ /^```/) command = 1
      next
    }
    in_verification && /^Check:[[:space:]]*/ {
      value = $0
      sub(/^Check:[[:space:]]*/, "", value)
      if (value != "" && value !~ /^<!--/ && value !~ /^```/) check = 1
      next
    }
    in_verification && /^Result:[[:space:]]*/ {
      result = $0
      sub(/^Result:[[:space:]]*/, "", result)
      if (result != "" && result !~ /^<!--/ && result !~ /^```/) {
        result_present = 1
        if (tolower(result) ~ /(pass|success|exit 0)/) result_passed = 1
      }
      next
    }
    in_verification && /^Observed:[[:space:]]*/ {
      observed = $0
      sub(/^Observed:[[:space:]]*/, "", observed)
      if (observed != "" && observed !~ /^<!--/ && observed !~ /^```/) observed_present = 1
      next
    }
    END { exit((command || check) && result_present && result_passed && observed_present ? 0 : 1) }
  ' "$1"
}

extract_project_acceptance_criteria() {
  local inside=0
  local line
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == '## Acceptance criteria' ]]; then
      inside=1
      continue
    fi
    if [[ "$inside" -eq 1 && "$line" == '## '* ]]; then
      inside=0
    fi
    if [[ "$inside" -eq 1 && "$line" == '- ['* ]]; then
      printf '%s\n' "$line" >> "$acceptance_lines_file"
      if [[ "$line" =~ ^-\ \[[[:space:]xX]\]\ (AC-[0-9]{3})([[:space:]]|$) ]]; then
        printf '%s\n' "${BASH_REMATCH[1]}" >> "$acs_file"
      else
        error "PROJECT.md acceptance criterion must start with a stable AC-NNN ID: $line"
      fi
    fi
  done < PROJECT.md
}

extract_roadmap_phases() {
  awk -F '|' '
    function trim(value) {
      gsub(/^[ \t]+|[ \t]+$/, "", value)
      return value
    }
    /^\|/ {
      phase = trim($2)
      if (phase == "Phase" || phase ~ /^-+$/ || phase == "") next
      if (NF < 10) next
      print phase "\t" trim($4) "\t" trim($5) "\t" trim($9)
    }
  ' ROADMAP.md > "$phases_file"
}

extract_project_acceptance_criteria

if [[ -s "$acs_file" ]]; then
  duplicate_acs=$(sort "$acs_file" | uniq -d || true)
  if [[ -n "$duplicate_acs" ]]; then
    while IFS= read -r ac; do
      error "duplicate acceptance criterion ID: $ac"
    done <<< "$duplicate_acs"
  fi
fi

extract_roadmap_phases

if [[ -s "$phases_file" ]]; then
  duplicate_phases=$(cut -f1 "$phases_file" | sort | uniq -d || true)
  if [[ -n "$duplicate_phases" ]]; then
    while IFS= read -r phase; do
      error "duplicate phase ID: $phase"
    done <<< "$duplicate_phases"
  fi
fi

while IFS=$'\t' read -r phase dependencies covers status; do
  [[ -n "$phase" ]] || continue

  if [[ ! "$phase" =~ ^[0-9]{2}$ ]]; then
    error "phase ID must use two digits (for example 01): $phase"
  fi
  if [[ ! "$status" =~ ^(planned|in_progress|completed|blocked|superseded)$ ]]; then
    error "Phase $phase has invalid status '$status'"
  fi

  if [[ "$dependencies" != 'none' && -n "$dependencies" ]]; then
    while IFS= read -r dependency; do
      dependency=$(trim "$dependency")
      [[ -n "$dependency" ]] || continue
      if [[ "$dependency" == "$phase" ]]; then
        error "Phase $phase depends on itself"
      elif ! phase_exists "$dependency"; then
        error "Phase $phase depends on unknown Phase $dependency"
      fi
    done < <(tr ',' '\n' <<< "$dependencies")
  fi

  if [[ "$covers" != 'none' && -n "$covers" ]]; then
    while IFS= read -r ac; do
      ac=$(trim "$ac")
      [[ -n "$ac" ]] || continue
      if [[ ! "$ac" =~ ^AC-[0-9]{3}$ ]]; then
        error "Phase $phase has invalid acceptance-criteria reference '$ac'"
      elif ! has_exact_line "$ac" "$acs_file"; then
        error "Phase $phase covers unknown acceptance criterion $ac"
      else
        printf '%s\t%s\n' "$phase" "$ac" >> "$coverage_file"
      fi
    done < <(tr ',' '\n' <<< "$covers")
  fi
done < "$phases_file"

while IFS= read -r ac; do
  [[ -n "$ac" ]] || continue
  if ! awk -F '\t' -v ac="$ac" '$2 == ac { found = 1 } END { exit(found ? 0 : 1) }' "$coverage_file"; then
    error "$ac has no roadmap coverage"
  fi
done < "$acs_file"

# Detect dependency cycles with depth-first search. Phase IDs cannot contain
# whitespace, so the comma-delimited stack is safe and portable to macOS Bash.
visit_phase() {
  local phase="$1"
  local stack="$2"
  local dependencies
  local dependency

  case ",$stack," in
    *",$phase,"*)
      error "dependency cycle detected: $stack,$phase"
      return
      ;;
  esac

  dependencies=$(phase_field "$phase" 2)
  [[ "$dependencies" != 'none' && -n "$dependencies" ]] || return 0
  while IFS= read -r dependency; do
    dependency=$(trim "$dependency")
    [[ -n "$dependency" ]] || continue
    phase_exists "$dependency" || continue
    visit_phase "$dependency" "$stack,$phase"
  done < <(tr ',' '\n' <<< "$dependencies")
}

while IFS=$'\t' read -r phase _; do
  [[ -n "$phase" ]] || continue
  visit_phase "$phase" ''
done < "$phases_file"

for evidence in evidence/phase-*.md; do
  [[ -e "$evidence" ]] || continue
  filename=$(basename "$evidence")
  if [[ ! "$filename" =~ ^phase-([0-9]{2})\.md$ ]]; then
    error "evidence filename must use evidence/phase-XX.md: $evidence"
    continue
  fi

  phase="${BASH_REMATCH[1]}"
  declared_phase=$(sed -n 's/^Phase:[[:space:]]*//p' "$evidence" | head -n 1 | tr -d '`')
  status=$(sed -n 's/^Status:[[:space:]]*//p' "$evidence" | head -n 1 | tr -d '`')
  base_revision=$(sed -n 's/^Base revision:[[:space:]]*//p' "$evidence" | head -n 1)
  result_revision=$(sed -n 's/^Result revision:[[:space:]]*//p' "$evidence" | head -n 1)

  if ! head -n 1 "$evidence" | grep -Eq "^# Phase $phase Evidence( — .+)?$"; then
    error "$evidence must start with '# Phase $phase Evidence' or '# Phase $phase Evidence — name'"
  fi
  if [[ "$declared_phase" != "$phase" ]]; then
    error "$evidence declares Phase '$declared_phase' but filename identifies Phase $phase"
  fi
  if [[ ! "$status" =~ ^(passed|failed|blocked)$ ]]; then
    error "$evidence has invalid Status '$status'"
  fi
  if ! phase_exists "$phase"; then
    error "$evidence exists for unknown Phase $phase"
  fi
  if ! grep -Fqx 'Acceptance criteria satisfied:' "$evidence"; then
    error "$evidence must include 'Acceptance criteria satisfied:'"
  fi
  if [[ "$status" == 'passed' ]]; then
    if [[ -z "$base_revision" || -z "$result_revision" ]]; then
      error "$evidence is passed but is missing Base revision or Result revision"
    fi
    if ! has_actual_passing_verification "$evidence"; then
      error "$evidence is passed but must include non-empty Command: or Check:, Result: passed, and Observed: details"
    fi
  fi

  printf '%s\t%s\t%s\n' "$phase" "$status" "$evidence" >> "$evidence_file"
  while IFS= read -r ac; do
    [[ -n "$ac" ]] || continue
    if ! has_exact_line "$ac" "$acs_file"; then
      error "$evidence claims unknown acceptance criterion $ac"
      continue
    fi
    if ! awk -F '\t' -v phase="$phase" -v ac="$ac" '$1 == phase && $2 == ac { found = 1 } END { exit(found ? 0 : 1) }' "$coverage_file"; then
      error "$evidence claims $ac, but Phase $phase does not cover it in ROADMAP.md"
    fi
    printf '%s\t%s\t%s\n' "$phase" "$status" "$ac" >> "$evidence_ac_file"
  done < <(extract_evidence_acs "$evidence")
done

while IFS=$'\t' read -r phase _ _ status; do
  [[ -n "$phase" ]] || continue
  if [[ "$status" == 'completed' ]] && ! phase_has_passing_evidence "$phase"; then
    error "Phase $phase is marked completed but has no passing evidence"
  fi
  if phase_has_passing_evidence "$phase" && [[ "$status" != 'completed' ]]; then
    error "Phase $phase has passing evidence but ROADMAP.md status is '$status', not completed"
  fi
done < "$phases_file"

state=$(sed -n 's/^- State:[[:space:]]*//p' STATE.md | head -n 1 | sed 's/[[:space:]]*<!--.*$//' | tr -d '`')
current_phase=$(sed -n 's/^- Current phase:[[:space:]]*//p' STATE.md | head -n 1 | sed 's/[[:space:]]*<!--.*$//' | tr -d '`')

if [[ ! "$state" =~ ^(ready|planning|implementing|verifying|blocked|complete)$ ]]; then
  error "STATE.md has invalid State '$state'"
fi
if [[ -z "$current_phase" ]]; then
  error 'STATE.md is missing Current phase'
elif [[ "$current_phase" != 'none' ]]; then
  if ! phase_exists "$current_phase"; then
    error "Current phase $current_phase does not exist in ROADMAP.md"
  else
    dependencies=$(phase_field "$current_phase" 2)
    if [[ "$dependencies" != 'none' && -n "$dependencies" ]]; then
      while IFS= read -r dependency; do
        dependency=$(trim "$dependency")
        [[ -n "$dependency" ]] || continue
        dependency_status=$(phase_field "$dependency" 4)
        if [[ "$dependency_status" != 'completed' ]] || ! phase_has_passing_evidence "$dependency"; then
          error "Current Phase $current_phase depends on incomplete Phase $dependency"
        fi
      done < <(tr ',' '\n' <<< "$dependencies")
    fi
  fi
fi

blockers=$(awk '
  /^## Open blockers requiring a human decision/ { inside = 1; next }
  inside && /^## / { inside = 0 }
  inside && /^- / && $0 !~ /^- None\./ { print }
' STATE.md)

if [[ "$state" == 'complete' ]]; then
  while IFS= read -r ac; do
    [[ -n "$ac" ]] || continue
    if ! awk -F '\t' -v ac="$ac" '$2 == "passed" && $3 == ac { found = 1 } END { exit(found ? 0 : 1) }' "$evidence_ac_file"; then
      error "$ac has no passing evidence, but STATE.md declares the project complete"
    fi
  done < "$acs_file"

  while IFS=$'\t' read -r phase _ _ status; do
    [[ -n "$phase" ]] || continue
    if [[ "$status" != 'completed' && "$status" != 'superseded' ]]; then
      error "Phase $phase is '$status', but STATE.md declares the project complete"
    fi
  done < "$phases_file"

  if [[ -n "$blockers" ]]; then
    error 'STATE.md declares the project complete but unresolved blockers remain'
  fi
fi

ac_total=$(wc -l < "$acs_file" | tr -d ' ')
ac_covered=0
while IFS= read -r ac; do
  [[ -n "$ac" ]] || continue
  if awk -F '\t' -v ac="$ac" '$2 == ac { found = 1 } END { exit(found ? 0 : 1) }' "$coverage_file"; then
    ac_covered=$((ac_covered + 1))
  fi
done < "$acs_file"
passed_phases=$(awk -F '\t' '$2 == "passed" { count++ } END { print count + 0 }' "$evidence_file")

if [[ "$errors" -gt 0 ]]; then
  printf '\nHarness run state is invalid: %s error(s).\n' "$errors" >&2
  exit 1
fi

printf 'Harness run state is valid.\n\n'
printf 'Acceptance criteria: %s/%s covered\n' "$ac_covered" "$ac_total"
printf 'Passed phases: %s\n' "$passed_phases"
printf 'Current phase: %s\n' "${current_phase:-none}"
if [[ -n "$blockers" ]]; then
  printf 'Blockers: present\n'
else
  printf 'Blockers: none\n'
fi
