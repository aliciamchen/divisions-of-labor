# Divisions of Labor Across Gender Pairs Experiment

This experiment examines how people infer hierarchy from observing how two people divide recurring activities or exchanges.

## Experiment Structure

- 18 scenarios featuring read-world names.
- one factor is division of labor: `both_alternate`, `bundled`, `one_does_all`
- another factor is the gender relationship: `male-male`, `female-female`, or `male-female`
- The factor `category` is an additional condition that is irrelveent to the main analysis. It was added to explore if variations exist between different types of relationships, loosely based on the manner of the relationship: through work, through friendship, or  through cohabitation. The conditions are respectively `work`, `friends`, and `cohabitation`. As each participant saw each scenario, and each of these conditions appeared an equal number of times through the 18 scenarios (6 total, 2 per gender condition), these conditions were counterbalanced. 
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


## Running Locally (from the divisions-of-labor node)

```bash
python3 -m http.server 8000 #???? should i write python3 ?
```
Then open http://localhost:8000/divisions-of-labor-across-gender-pairs/experiment/


## Generating Counterbalancing (from the experiment node)

```bash
conda activate divisions-of-labor ##ask what conda means neccesary ???
cd divisions-of-labor-across-gender-pairs/experiment
python3 python/generate_counterbalancing.py #??? here as well
```


## Workflow
- I first wrote the scenarios/conditions on google sheets, then converted it to the .csv called 18scenarios.csv.
- I ammended the trials.js and experiment.js simultaneously from the remote society pilot to be suitable for this version. The main difference was figuring out how to counterbalance for 18 scenarios instead of 6, and for three genders insetad of two (and within the mixed gender pairing, alternating the order of the names to counterbalance which m/f goes first).
- Then I hosted it on a local server to assure the experiment was working. The port button on cursor does the same as the directions above, which go into the terminal.
- I edited the attention checks and pushed to the MIT server using the links above.
- Go to scripts.mit.edu if you need help at all or are confused on how to put the survey on the MIT server. 
- I filled out the survey on my own on my browser and went to here: https://osf.io/dashboard to see the results in a json format. 
- I data wrangled that until i assured I could extract data from people's answers. 
- Then I ran a pilot study on prolific with 5 participants. 