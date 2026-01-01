import json
import itertools
import random
from pathlib import Path

random.seed(111)

# 6 scenarios
all_scenarios = [
    "chores",
    "work",
    "costs",
    "gifts",
    "favors",
    "preferences",
]

# 3 conditions, each seen twice per participant (6 scenarios total)
conditions = ["both_alternate", "bundled", "one_does_all"]


def generate_all_balanced_assignments():
    """
    Generate all possible assignments of conditions to scenarios where
    each condition is used exactly twice.

    With 6 scenarios and 3 conditions (each used twice), we need to
    partition the 6 scenarios into 3 groups of 2.
    """
    # Generate all ways to assign conditions such that each appears twice
    # This is equivalent to generating all permutations of [0,0,1,1,2,2]
    base_pattern = [0, 0, 1, 1, 2, 2]  # condition indices

    # Get unique permutations
    unique_assignments = set(itertools.permutations(base_pattern))

    # Convert to list of assignments with scenario labels
    all_assignments = []
    for perm in unique_assignments:
        assignment = []
        for scenario_idx, condition_idx in enumerate(perm):
            assignment.append({
                "scenario_label": all_scenarios[scenario_idx],
                "condition": conditions[condition_idx]
            })
        all_assignments.append(assignment)

    return all_assignments


# Generate all balanced assignments
counterbalancing = generate_all_balanced_assignments()

# Shuffle to randomize order
random.shuffle(counterbalancing)

print(f"Generated {len(counterbalancing)} counterbalanced sequences")
print(f"Each sequence has {len(counterbalancing[0])} trials")

# Verify balance
print("\nVerifying balance for first few sequences:")
for i, seq in enumerate(counterbalancing[:3]):
    condition_counts = {}
    for trial in seq:
        cond = trial["condition"]
        condition_counts[cond] = condition_counts.get(cond, 0) + 1
    print(f"  Sequence {i}: {condition_counts}")

# Save to JSON file
output_path = Path(__file__).parent.parent / "json" / "full_counterbalancing.json"

with open(output_path, "w") as f:
    json.dump(counterbalancing, f, indent=2)

print(f"\nSaved to {output_path}")
