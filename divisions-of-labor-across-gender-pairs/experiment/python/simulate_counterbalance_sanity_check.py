"""
Simulate / audit balance: across all sequences in full_counterbalancing.json,
check that each scenario appears with each of the 9 (work, gender) combos evenly.
"""
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
JSON_PATH = HERE.parent / "json" / "full_counterbalancing.json"

WORK = ["both_alternate", "division_of_labor", "one_does_all"]
GENDER = ["male_male", "female_female", "male_female"]
NINE = [(w, g) for w in WORK for g in GENDER]


def main():
    with open(JSON_PATH) as f:
        sequences = json.load(f)

    n_seq = len(sequences)
    if not sequences:
        print("No sequences in file.")
        return

    n_trials = len(sequences[0])
    print(f"Sequences: {n_seq}, trials per sequence: {n_trials}\n")

    # Count (scenario, work, gender) occurrences across all participant sequences
    counts = defaultdict(int)
    scenarios_seen = set()

    for seq in sequences:
        for trial in seq:
            s = trial["scenario_label"]
            w = trial["work_condition"]
            g = trial["gender_condition"]
            scenarios_seen.add(s)
            counts[(s, w, g)] += 1

    # Per scenario: how many times each of the 9 combos?
    per_scenario = {s: {combo: 0 for combo in NINE} for s in scenarios_seen}
    for (s, w, g), c in counts.items():
        per_scenario[s][(w, g)] = c

    # Expected if perfectly uniform: each scenario gets each combo equally often
    total_per_scenario = sum(per_scenario[next(iter(per_scenario))].values()) if per_scenario else 0
    expected = total_per_scenario / 9 if total_per_scenario else 0

    print("Per scenario: min / max count among the 9 (work×gender) cells (higher = more even if close)")
    print(f"  Total assignments per scenario across all sequences: {total_per_scenario}")
    print(f"  Perfectly uniform expectation per cell: {expected:.4f}\n")

    all_mins = []
    all_maxs = []
    all_spreads = []

    for s in sorted(per_scenario.keys()):
        vals = list(per_scenario[s].values())
        mn, mx = min(vals), max(vals)
        spread = mx - mn
        all_mins.append(mn)
        all_maxs.append(mx)
        all_spreads.append(spread)
        if spread > 0:
            print(f"  {s[:50]:<50}  min={mn} max={mx} spread={spread}")

    print()
    print("Summary across all 18 scenarios:")
    print(f"  Global min (among 9 cells): {min(all_mins)}, max: {max(all_maxs)}")
    print(f"  Largest spread (max-min within any scenario): {max(all_spreads)}")

    # Within-sequence: each of 9 combos should appear exactly twice per participant
    bad_within = 0
    for si, seq in enumerate(sequences):
        from collections import Counter

        c = Counter()
        for t in seq:
            c[(t["work_condition"], t["gender_condition"])] += 1
        if any(c[k] != 2 for k in NINE) or len(c) != 9:
            bad_within += 1
            if bad_within <= 3:
                print(f"  Sequence {si} combo counts: {dict(c)}")

    print()
    print(f"Sequences where each of 9 (work,gender) appears exactly twice: {n_seq - bad_within} / {n_seq}")
    if bad_within:
        print(f"  (Mismatched sequences: {bad_within})")


if __name__ == "__main__":
    main()
