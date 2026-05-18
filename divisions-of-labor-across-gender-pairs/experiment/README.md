# Remote Society (Equal Costs) Experiment

This experiment examines how people infer hierarchy from observing how two people divide recurring activities or exchanges.

## Experiment Structure

- 18 scenarios featuring read-world names.
- one factor is division of labor: `both_alternate`, `bundled`, `one_does_all`
- another factor is the gender relationship: `male-male`, `female-female`, or `male-female`
- The condition `category` is an additional condition, irrelveent to the main analysis but used to explore to see if there are variations within subcategories.   
- Each participant sees each scenario in one condition
- Each condition is seen exactly twice per participant

## Deployment to Athena MIT Server

```bash
ssh marlocy@athena.dialup.mit.edu "mkdir -p ~/www/divisions-of-labor"
```

```bash
cd divisions-of-labor-across-gender-pairs
rsync -av --delete experiment/ aliciach@athena.dialup.mit.edu:~/www/divisions-of-labor/remote-society-equal-costs ????
```

URL: 

## Running Locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000/remote_society_equal_costs/experiment/

## Generating Counterbalancing

```bash
conda activate divisions-of-labor
cd remote_society_equal_costs/experiment
python python/generate_counterbalancing.py
```

