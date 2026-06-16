"""
test_counterbalancing_within.py

Tests that each individual sequence (= one participant's trial order) is
correctly counterbalanced. Run from the repo root with:

    python3 tests/test_counterbalancing_within.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

COUNTERBALANCING_PATH = Path(__file__).parent.parent / "experiment" / "json" / "full_counterbalancing.json"
SCENARIOS_PATH = Path(__file__).parent.parent / "experiment" / "json" / "18scenarios.json"

WORK_CONDITIONS   = {"both_alternate", "division_of_labor", "one_does_all"}
GENDER_CONDITIONS = {"male_male", "female_female", "male_female"}
TRIALS_PER_SEQUENCE = 18
EXPECTED_PER_CONDITION = 6   # 18 trials / 3 conditions
EXPECTED_PER_COMBO = 2       # 9 unique (work x gender) combos × 2 = 18


def load_data():
    with open(COUNTERBALANCING_PATH) as f:
        cb = json.load(f)
    with open(SCENARIOS_PATH) as f:
        scenarios = json.load(f)
    all_labels = {s["scenario_label"] for s in scenarios}
    return cb, all_labels


def test_sequence_length(cb):
    failures = []
    for i, seq in enumerate(cb):
        if len(seq) != TRIALS_PER_SEQUENCE:
            failures.append(f"Sequence {i}: length {len(seq)}, expected {TRIALS_PER_SEQUENCE}")
    return failures


def test_all_scenarios_present(cb, all_labels):
    failures = []
    for i, seq in enumerate(cb):
        seen = {t["scenario_label"] for t in seq}
        missing = all_labels - seen
        extra = seen - all_labels
        if missing:
            failures.append(f"Sequence {i}: missing scenarios {missing}")
        if extra:
            failures.append(f"Sequence {i}: unknown scenarios {extra}")
    return failures


def test_work_condition_balance(cb):
    failures = []
    for i, seq in enumerate(cb):
        counts = Counter(t["work_condition"] for t in seq)
        for cond in WORK_CONDITIONS:
            if counts[cond] != EXPECTED_PER_CONDITION:
                failures.append(
                    f"Sequence {i}: work_condition '{cond}' = {counts[cond]}x "
                    f"(expected {EXPECTED_PER_CONDITION})"
                )
    return failures


def test_gender_condition_balance(cb):
    failures = []
    for i, seq in enumerate(cb):
        counts = Counter(t["gender_condition"] for t in seq)
        for cond in GENDER_CONDITIONS:
            if counts[cond] != EXPECTED_PER_CONDITION:
                failures.append(
                    f"Sequence {i}: gender_condition '{cond}' = {counts[cond]}x "
                    f"(expected {EXPECTED_PER_CONDITION})"
                )
    return failures


def test_work_gender_combo_balance(cb):
    failures = []
    for i, seq in enumerate(cb):
        combos = Counter(
            (t["work_condition"], t["gender_condition"]) for t in seq
        )
        for combo, count in combos.items():
            if count != EXPECTED_PER_COMBO:
                failures.append(
                    f"Sequence {i}: combo {combo} = {count}x "
                    f"(expected {EXPECTED_PER_COMBO})"
                )
    return failures


def test_no_unknown_values(cb):
    failures = []
    for i, seq in enumerate(cb):
        for trial in seq:
            if trial["work_condition"] not in WORK_CONDITIONS:
                failures.append(f"Sequence {i}: unknown work_condition '{trial['work_condition']}'")
            if trial["gender_condition"] not in GENDER_CONDITIONS:
                failures.append(f"Sequence {i}: unknown gender_condition '{trial['gender_condition']}'")
    return failures


def run_all_tests():
    cb, all_labels = load_data()
    print(f"Loaded {len(cb)} sequences from {COUNTERBALANCING_PATH.name}\n")

    tests = [
        ("Sequence length",             test_sequence_length(cb)),
        ("All scenarios present",       test_all_scenarios_present(cb, all_labels)),
        ("Work condition balance",      test_work_condition_balance(cb)),
        ("Gender condition balance",    test_gender_condition_balance(cb)),
        ("Work × gender combo balance", test_work_gender_combo_balance(cb)),
        ("No unknown values",           test_no_unknown_values(cb)),
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

    print(f"\n{'='*50}")
    if total_failures == 0:
        print("All within-participant tests passed.")
    else:
        print(f"{total_failures} total failures.")
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
