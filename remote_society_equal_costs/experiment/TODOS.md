# Todos for remote society (equal costs) experiment

Right now the experiment files are from an old experiment on saliva sharing, I want to change it to a new experiment on remote society where two people are interacting around two recurring activities or exchanges. 

There are six scenarios (six trials in the experiment), the stimuli are all available in stimuli.csv. 

On each trial, this is what participants will do: 
1. Show them the vignette
2. Elicit priors
   - How hierarchical do you think name1 and name2's relationship is, on a scale of 0 to 100? Continuous slider: 0 (Completely equal) - 100 (Extremely hierarchical) 
3. Reveal the action manipulation (condition: either 'both_alternate', 'bundled', or 'one_does_all')
4. Elicit posteriors
   - Now that you've seen how they divide tasks, how hierarchical do you think their relationship is? Continuous slider: 0 (Completely equal) - 100 (Extremely hierarchical)

Each participant will see each scenario in one of the three conditions. So they see each of the conditions twice, across the six scenarios. Also, the assigment of scenario to condition is balanced across participants. 

Here are the TODOs:

- [x] Change the instructions to the participant instructions for the experiment are in the instructions.md file.
- [x] Change the experiment description in the consent form
- [x] Put in the new stimuli from stimuli.csv into the experiment, change variable labels
- [x] Implement counterbalancing logic and test it
- [x] Delete old files (decided to keep all files)

For the datapipe stuff, I need to generate a manual key that I will do later so don't change that. 

## more todos

- [ ] prompt should not be bold
- [ ] make slider a bit narrower 
- [ ] visually highlight the observed action manipulation
- [ ] change the "now you've seen how they divide tasks" to "now you've seen how they divide the activities or exchanges"