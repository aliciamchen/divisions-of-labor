# Remote Society (Equal Costs) Experiment

This experiment examines how people infer hierarchy from observing how two people divide recurring activities or exchanges.

## Experiment Structure

- 6 scenarios with fictional characters in a "remote society"
- 3 conditions: `both_alternate`, `bundled`, `one_does_all`
- Each participant sees each scenario in one condition
- Each condition is seen exactly twice per participant

## Deployment to Athena MIT Server

```bash
ssh aliciach@athena.dialup.mit.edu "mkdir -p ~/www/divisions-of-labor"
```

```bash
cd remote_society_equal_costs
rsync -av --delete experiment/ aliciach@athena.dialup.mit.edu:~/www/divisions-of-labor/remote-society-equal-costs
```

URL: https://web.mit.edu/aliciach/www/divisions-of-labor/remote-society-equal-costs

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

## todos

- [ ] maybe add label for 50?
- [ ] are priors diff if the anchor point is different? maybe set it to 50? 
- [ ] change timing, seems like experiment takes 7 minutes not 5
- [ ] Change "extremely hierarchical" to "maximally hierarchical"