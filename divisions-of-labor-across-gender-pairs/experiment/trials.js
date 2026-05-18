export function makeTimeline(
  jsPsych,
  stimuli,
  consentHtml,
  exitSurveyHtml,
  subjectId
) {
  const consent = {
    type: jsPsychInstructions,
    pages: [`<div>${consentHtml}</div>`],
    show_clickable_nav: true,
    show_page_number: true,
  };

  const instructions = {
    type: jsPsychInstructions,
    pages: [
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>In this study we are interested in how we can make inferences about other people's relationships by observing their behavior. We are specifically interested in how people evaluate how hierarchical a relationship is: how different two people are in rank, importance, or influence.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>In this study, you will read 18 scenarios. Each scenario describes two people who regularly interact around two recurring activities or exchanges. You will observe how they divide these between them.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>First, based only on the scenario description, we will ask you to rate how hierarchical you think the relationship is. Then, we will show you how the two people actually divide the activities and then ask you again.</p>
        <p>We are interested in how people use just brief observation to make judgments about the type of relationship from observed social interactions.</p>
        <p>You will receive $3 if you successfully complete this study. Please make sure to read the scenarios carefully! 🙂</p>
        <p>Press next to begin the survey.</p>
      </div>
      `,
    ],
    show_clickable_nav: true,
    show_page_number: true,
  };

  const trials = [];

  function fillNames(template, name1, name2) {
    // Replaces `{name1}` / `{name2}` placeholders in scenario strings.
    return String(template ?? "")
      .replaceAll("{name1}", name1)
      .replaceAll("{name2}", name2);
  }

  stimuli.forEach((stimulus, stimulusIndex) => {

    // Add attention check after the 3rd scenario
    // Choose names based on gender_condition
    let name1 = "";
    let name2 = "";

    if (stimulus.gender_condition === "male_male") {
      name1 = stimulus.name1_m ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_m ?? stimulus.name2 ?? "";
    } else if (stimulus.gender_condition === "female_female") {
      name1 = stimulus.name1_f ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_f ?? stimulus.name2 ?? "";
    } else if (stimulus.gender_condition === "male_female") {
      // Convention used by your counterbalancing script: first is male, second is female.
      name1 = stimulus.name1_m ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_f ?? stimulus.name2 ?? "";
    } else {
      // Fallback if gender_condition isn't present.
      name1 = stimulus.name1 ?? "";
      name2 = stimulus.name2 ?? "";
    }

    const vignetteFilled = fillNames(stimulus.vignette, name1, name2);
    const workTemplate = stimulus[stimulus.work_condition];
    const workFilled = fillNames(workTemplate, name1, name2);

    if (stimulusIndex === 3) {
      trials.push({
        type: jsPsychHtmlSliderResponse,
        labels: [
          "0<br>Completely equal",
          "50",
          "100<br>Extremely hierarchical",
        ],
        slider_width: 670,
        slider_start: 0,
        slider_min: 0,
        slider_max: 100,
        step: 1,
        require_movement: true,
        button_label: "Continue",
        stimulus: `
          <div>
            <p>This is an attention check to make sure you're not a bot and that we can award you your pay for the study.</p>
            <p><strong>Please set the slider to "Completely equal" (all the way to the left).</strong></p>
          </div>
        `,
        data: {
          response_type: "attention_check",
        },
        on_finish: function (data) {
          data.attention_passed = data.response <= 5;
        },
      });
    }

    // Prior elicitation - show vignette and ask about hierarchy before revealing action
    trials.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: `
        <div class="trial-content">
          <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
          <p class="trial-text">${vignetteFilled}</p>
          <p class="trial-text">How hierarchical do you think ${name1} and ${name2}'s relationship is?</p>
        </div> 
      `,
      slider_width: 670,
      slider_start: 0,
      slider_min: 0,
      slider_max: 100,
      step: 1,
      require_movement: true,
      labels: [
        "0<br>Completely equal",
        "50",
        "100<br>Extremely hierarchical",
      ],
      button_label: "Continue",
      data: {
        response_type: "response",
        stage: "prior",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    console.log(stimulus)

    // Posterior elicitation - show vignette + action manipulation, ask about hierarchy again
    trials.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: `
        <div class="trial-content">
          <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
          <p class="trial-text">${vignetteFilled}</p>
          <div class="action-highlight-wrapper"><p class="action-highlight"><strong>${workFilled}</strong></p></div>
          <p class="trial-text">Now that you've seen how they divide the activities or exchanges, how hierarchical do you think their relationship is?</p>
        </div>
      `,
      slider_width: 670,
      slider_start: 0,
      slider_min: 0,
      slider_max: 100,
      step: 1,
      require_movement: true,
      labels: [
        "0<br>Completely equal",
        "50",
        "100<br>Extremely hierarchical",
      ],
      button_label: "Continue",
      data: {
        response_type: "response",
        stage: "posterior",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    // Transition screen between scenarios
    if (stimulusIndex < stimuli.length - 1) {
      trials.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: "Next scenario",
        choices: "NO_KEYS",
        trial_duration: function () {
          return jsPsych.randomization.sampleWithoutReplacement(
            [1500, 1750, 2000, 2300],
            1
          )[0];
        },
      });
    }
  });

  console.log(stimuli)
  console.log(trials)

  const exitSurvey = {
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div>
        <h2>Exit Survey</h2>
        <p>You have reached the end of the survey. To collect your pay, please complete the following questions. Your answer to these questions will not affect your pay or whether your submission is approved for payment, so please answer honestly.</p>
      </div>
    `,
    html: exitSurveyHtml,
    on_finish: function (data) {
      data.attention_passed = jsPsych.data
        .get()
        .filter({ response_type: "attention_check" })
        .select("attention_passed").values[0];
      data.memory_correct_count = jsPsych.data
        .get()
        .filter({ response_type: "memory_check" })
        .select("memory_correct_count")
        .sum();
      data.response_type = "exit_survey";
    },
  };

  const saveData = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "lBm9oW4lLdq3",
    filename: `${subjectId}.json`,
    data_string: () => jsPsych.data.get().json(),
  };

  const thankYou = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Thanks for participating in the experiment!</p>
                  <p><a href="https://app.prolific.com/submissions/complete?cc=C18IH6NU">Click here to return to Prolific and complete the study</a>.</p>
                  <p>It is now safe to close the window. Your pay will be delivered within a few days.</p>
                  `,
    choices: "NO_KEYS",
  };

  let timeline = [];

  timeline.push(consent);
  timeline.push(instructions);
  timeline.push(...trials);
  timeline.push(exitSurvey);
  timeline.push(saveData);
  timeline.push(thankYou);

  return timeline;
}