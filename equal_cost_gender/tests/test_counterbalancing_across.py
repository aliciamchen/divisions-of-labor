"""
test_counterbalancing_across.py

Tests that conditions are balanced *across* participants — meaning that no
scenario is over- or under-represented in any condition
when looking at the full pool of sequences.

Run from the repo root with:

    python3 tests/test_counterbalancing_across.py
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

COUNTERBALANCING_PATH = Path(__file__).parent.parent / "experiment" / "json" / "full_counterbalancing.json"
SCENARIOS_PATH = Path(__file__).parent.parent / "experiment" / "json" / "18scenarios.json"

WORK_CONDITIONS   = ["both_alternate", "division_of_labor", "one_does_all"]
GENDER_CONDITIONS = ["male_male", "female_female", "male_female"]

# How much imbalance is acceptable across sequences (as a proportion of the mean).
# 0.10 = within 10% of the mean count is fine.
BALANCE_TOLERANCE = 0.10


def load_data():
    with open(COUNTERBALANCING_PATH) as f:
        cb = json.load(f)
    with open(SCENARIOS_PATH) as f:
        scenarios = json.load(f)
    all_labels = [s["scenario_label"] for s in scenarios]
    return cb, all_labels


def test_every_combo_covered(cb, all_labels):
    """Every (scenario × work × gender) combo must appear in at least one sequence."""
    failures = []
    seen = defaultdict(set)
    for seq in cb:
        for trial in seq:
            seen[trial["scenario_label"]].add(
                (trial["work_condition"], trial["gender_condition"])
            )
    for scenario in all_labels:
        for wc in WORK_CONDITIONS:
            for gc in GENDER_CONDITIONS:
                if (wc, gc) not in seen[scenario]:
                    failures.append(
                        f"'{scenario}' never assigned combo ({wc}, {gc})"
                    )
    return failures


def test_scenario_work_balance(cb, all_labels):
    """
    Each scenario should appear in each work condition an equal number of times
    across all sequences (within tolerance).
    """
    failures = []
    for scenario in all_labels:
        counts = Counter()
        for seq in cb:
            for trial in seq:
                if trial["scenario_label"] == scenario:
                    counts[trial["work_condition"]] += 1
        values = [counts[wc] for wc in WORK_CONDITIONS]
        mean = sum(values) / len(values)
        for wc, v in zip(WORK_CONDITIONS, values):
            if mean > 0 and abs(v - mean) / mean > BALANCE_TOLERANCE:
                failures.append(
                    f"'{scenario}': work_condition '{wc}' = {v} "
                    f"(mean={mean:.1f}, deviation={(v-mean)/mean*100:.1f}%)"
                )
    return failures


def test_scenario_gender_balance(cb, all_labels):
    """Each scenario should appear in each gender condition an equal number of times."""
    failures = []
    for scenario in all_labels:
        counts = Counter()
        for seq in cb:
            for trial in seq:
                if trial["scenario_label"] == scenario:
                    counts[trial["gender_condition"]] += 1
        values = [counts[gc] for gc in GENDER_CONDITIONS]
        mean = sum(values) / len(values)
        for gc, v in zip(GENDER_CONDITIONS, values):
            if mean > 0 and abs(v - mean) / mean > BALANCE_TOLERANCE:
                failures.append(
                    f"'{scenario}': gender_condition '{gc}' = {v} "
                    f"(mean={mean:.1f}, deviation={(v-mean)/mean*100:.1f}%)"
                )
    return failures


def test_global_condition_totals(cb):
    """
    Across all sequences, each work condition and each gender condition
    should appear the same total number of times.
    """
    failures = []
    total_work = Counter()
    total_gender = Counter()
    for seq in cb:
        for trial in seq:
            total_work[trial["work_condition"]] += 1
            total_gender[trial["gender_condition"]] += 1

    work_values = [total_work[wc] for wc in WORK_CONDITIONS]
    if len(set(work_values)) != 1:
        failures.append(f"Work condition totals unequal: { {wc: total_work[wc] for wc in WORK_CONDITIONS} }")

    gender_values = [total_gender[gc] for gc in GENDER_CONDITIONS]
    if len(set(gender_values)) != 1:
        failures.append(f"Gender condition totals unequal: { {gc: total_gender[gc] for gc in GENDER_CONDITIONS} }")

    return failures


def print_distribution_table(cb, all_labels):
    """Print a human-readable table of scenario × work condition counts."""
    print("\n  Distribution: scenario × work condition (count across all sequences)")
    print(f"  {'Scenario':<30} {'both_alt':>10} {'div_labor':>10} {'one_all':>10}")
    for scenario in all_labels:
        counts = Counter()
        for seq in cb:
            for trial in seq:
                if trial["scenario_label"] == scenario:
                    counts[trial["work_condition"]] += 1
        ba = counts["both_alternate"]
        dl = counts["division_of_labor"]
        od = counts["one_does_all"]
        flag = "  ← unbalanced" if max(ba, dl, od) - min(ba, dl, od) > 20 else ""
        print(f"  {scenario:<30} {ba:>10} {dl:>10} {od:>10}{flag}")


def run_all_tests():
    cb, all_labels = load_data()
    print(f"Loaded {len(cb)} sequences from {COUNTERBALANCING_PATH.name}\n")

    tests = [
        ("Every combo covered",               test_every_combo_covered(cb, all_labels)),
        ("Scenario × work balance",           test_scenario_work_balance(cb, all_labels)),
        ("Scenario × gender balance",         test_scenario_gender_balance(cb, all_labels)),
        ("Global condition totals equal",     test_global_condition_totals(cb)),
    ]

    total_failures = 0
    for name, failures in tests:
        status = "PASS" if not failures else f"FAIL ({len(failures)} issues)"
        print(f"  [{status}] {name}")
        for f in failures[:5]:
            print(f"         {f}")
        if len(failures) > 5:
            print(f"         ... and {len(failures) - 5} more")
        total_failures += len(failures)

    print_distribution_table(cb, all_labels)

    print(f"\n{'='*50}")
    if total_failures == 0:
        print("All across-participant tests passed.")
    else:
        print(f"{total_failures} total failures.")
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
