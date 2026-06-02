import json
import itertools
import random
from pathlib import Path

random.seed(111)

# 18 scenarios
all_scenarios = [
   "household chores",
   "mansion renovation",
   "cargo monitoring",
   "finances",
   "carpool",
   "meetup",
   "deep cleans",
   "traveling",
   "patient exams",
   "burger prep",
   "gift giving",
   "paying for outings",
   "lawn work and laundry",
   "neighborly favors",
   "cafe closing",
   "CIA tasks",
   "restaurant preference",
   "ranting",
]

# 3 × 3 work×gender combos; duplicated so each combo appears twice across 18 trials
work_condition = ["both_alternate", "division_of_labor", "one_does_all"]
gender_condition = ["male_male", "female_female", "male_female"]

combos = list(itertools.product(work_condition, gender_condition))  # 9 unique (work, gender) combos
base_pattern = combos * 2  # 18 (work, gender) pairs — one per trial slot

NUM_SCENARIOS = len(all_scenarios)
TARGET_SEQUENCES = 500  # build until we have at least this many rotated scenario orderings


def generate_all_balanced_assignments():
    """
    Build many counterbalanced sequences. Each sequence has NUM_SCENARIOS trials.

    Trial slot ``index`` always uses ``base_pattern[index]`` for (work_condition,
    gender_condition). Which *scenario* appears in that slot varies by sequence:
    each sequence is a cyclic rotation of a shuffled copy of ``all_scenarios``.
    """
    # Collect one list entry per "participant": each entry is a 18 scenario order
    scenarios_list = []
    while len(scenarios_list) < TARGET_SEQUENCES:
        shuffled = all_scenarios[:]  # copy so we do not mutate all_scenarios
        random.shuffle(shuffled)  # randomize which scenario goes where in this batch
        # All cyclic rotations of this shuffle → 18 distinct orderings (same multiset, different order)
        for i in range(NUM_SCENARIOS):
            rotated = shuffled[i:] + shuffled[:i]  # rotate left by i positions
            scenarios_list.append(rotated)

    # Pair each scenario ordering with the fixed base_pattern per slot
    all_assignments = []
    for seq_idx in range(len(scenarios_list)):
        assignment = []
        for index in range(NUM_SCENARIOS):
            work, gender = base_pattern[index]  # trial slot index → fixed (work, gender)
            assignment.append({
                "scenario_label": scenarios_list[seq_idx][index],  # which scenario at this slot for this sequence
                "work_condition": work,
                "gender_condition": gender,
            })
        all_assignments.append(assignment)
    return all_assignments

# --- Main: list of sequences; each sequence = list of trial dicts ---
counterbalancing = generate_all_balanced_assignments()

# Randomize which sequence ID is first in the file (does not change content of each sequence)
random.shuffle(counterbalancing)

print(f"Generated {len(counterbalancing)} counterbalanced sequences")
#print(f"Each sequence has {len(counterbalancing[0])} trials")

# Sanity check: each work_condition should appear 6× per 18-trial sequence (gender not tallied here)
print("\nVerifying balance for first few sequences:")
for i, seq in enumerate(counterbalancing[:3]):
    condition_counts = {}
    for trial in seq:
        cond = trial["work_condition"]
        gender = trial["gender_condition"]
        condition_counts[cond] = condition_counts.get(cond, 0) + 1
    print(f"  Sequence {i}: {condition_counts}")

# Save to JSON file
output_path = Path(__file__).parent.parent / "json" / "full_counterbalancing.json"

with open(output_path, "w") as f:
    json.dump(counterbalancing, f, indent=2)

print(f"\nSaved to {output_path}")
