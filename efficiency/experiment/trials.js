export function makeTimeline(
  jsPsych,
  stimuli,
  consentHtml,
  exitSurveyHtml,
  subjectId,
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
        <p>In this study, we are interested in how people evaluate relationships by observing everyday behavior, and how information about efficiency shapes those judgments.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>You will read 16 short scenarios. Each scenario describes two characters who regularly interact around two recurring activities or exchanges, along with information about how much time or effort their current arrangement saves them.</p>
        <p>Please read all of the scenarios carefully.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>For each scenario, you will rate how hierarchical or equal you think the two people would describe their relationship, using a 7-point scale ranging from a <strong>"Completely equal relationship"</strong> to an <strong>"Extremely hierarchical relationship"</strong>.</p>
        <p>You will also be asked whether you think the pair will continue with their current arrangement or switch to a different one.</p>
        <p>This is the end of the instructions. Press next to begin the survey.</p>
      </div>
      `,
    ],
    show_clickable_nav: true,
    show_page_number: true,
  };

  const likertLabels = [
    "Completely equal relationship",
    "Mostly equal relationship",
    "Somewhat equal relationship",
    "Neither equal nor hierarchical",
    "Somewhat hierarchical relationship",
    "Mostly hierarchical relationship",
    "Extremely hierarchical relationship",
  ];

  const trials = [];

  function fillNames(template, name1, name2) {
    return String(template ?? "")
      .replaceAll("{name1}", name1)
      .replaceAll("{name2}", name2);
  }

  //  efficiency-benefit statement,
  function efficiencyStatement(efficiencyCondition, name1, name2) {
    if (efficiencyCondition === "low") {
      return `This current arrangement saves ${name1} and ${name2} very little time or effort compared to the alternative.`;
    }
    return `This current arrangement saves ${name1} and ${name2} significant time and effort compared to the alternative.`;
  }

  // ---preference question options, phrased relative to the pair's current work_condition ---
  function preferenceOptions(workCondition) {
    if (workCondition === "division_of_labor") {
      return [
        "Continue dividing tasks the way they currently do",
        "Switch to alternating tasks equally",
      ];
    }
    return [
      "Continue alternating tasks equally",
      "Switch to dividing tasks by specialization",
    ];
  }

  stimuli.forEach((stimulus, stimulusIndex) => {
    let name1 = "";
    let name2 = "";

    if (stimulus.gender_condition === "male_male") {
      name1 = stimulus.name1_m ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_m ?? stimulus.name2 ?? "";
    } else if (stimulus.gender_condition === "female_female") {
      name1 = stimulus.name1_f ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_f ?? stimulus.name2 ?? "";
    } else if (stimulus.gender_condition === "male_female") {
      name1 = stimulus.name1_m ?? stimulus.name1 ?? "";
      name2 = stimulus.name2_f ?? stimulus.name2 ?? "";
    } else {
      name1 = stimulus.name1 ?? "";
      name2 = stimulus.name2 ?? "";
    }

    const vignetteFilled = fillNames(stimulus.vignette, name1, name2);
    const workTemplate = stimulus[stimulus.work_condition];
    const workFilled = fillNames(workTemplate, name1, name2);
    const efficiencyFilled = efficiencyStatement(
      stimulus.efficiency_condition,
      name1,
      name2,
    );

    // --- ATTENTION CHECKS
    if (stimulusIndex === 3) {
      trials.push({
        type: jsPsychSurveyLikert,
        questions: [
          {
            prompt: `
              <div class="trial-content">
                <p>This is an attention check. Please select <strong>"Completely equal relationship"</strong> to continue.</p>
              </div>
            `,
            labels: likertLabels,
            required: true,
          },
        ],
        button_label: "Continue",
        data: { response_type: "attention_check", check_number: 1 },
        on_finish: function (data) {
          data.attention_passed = data.response.Q0 === 0;
        },
      });
    }

    if (stimulusIndex === 13) {
      trials.push({
        type: jsPsychSurveyLikert,
        questions: [
          {
            prompt: `
              <div class="trial-content">
                <p>This is an attention check. Please select <strong>"Extremely hierarchical relationship"</strong> to continue.</p>
              </div>
            `,
            labels: likertLabels,
            required: true,
          },
        ],
        button_label: "Continue",
        data: { response_type: "attention_check", check_number: 2 },
        on_finish: function (data) {
          data.attention_passed = data.response.Q0 === 6;
        },
      });
    }

    // --- SINGLE RATING TRIAL: vignette + behavior + efficiency shown together, one hierarchy rating
    trials.push({
      type: jsPsychSurveyLikert,
      questions: [
        {
          prompt: `
            <div class="trial-content">
              <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
              <p class="trial-text">${vignetteFilled}</p>
              <div class="action-highlight-wrapper">
                <p class="action-highlight"><strong>${workFilled}</strong></p>
              </div>
              <div class="efficiency-highlight-wrapper">
                <p class="efficiency-highlight"><strong>${efficiencyFilled}</strong></p>
              </div>
              <p class="trial-text">How hierarchical do you think ${name1} and ${name2}'s relationship is?</p>
            </div>
          `,
          labels: likertLabels,
          required: true,
        },
      ],
      button_label: "Continue",
      data: {
        response_type: "response",
        stage: "rating",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        efficiency_condition: stimulus.efficiency_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    // preference question, immediately after the rating for the same scenario ---
    trials.push({
      type: jsPsychSurveyMultiChoice,
      questions: [
        {
          prompt: `
            <p class="trial-text">Given what you know about ${name1} and ${name2}, and how much their current arrangement saves them, do you think they will...</p>
          `,
          name: "preference",
          options: preferenceOptions(stimulus.work_condition),
          required: true,
        },
      ],
      data: {
        response_type: "preference",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        work_condition: stimulus.work_condition,
        efficiency_condition: stimulus.efficiency_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    // TRANSITION between scenarios
    if (stimulusIndex < stimuli.length - 1) {
      trials.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus:
          "<div style='display:flex; justify-content:center; align-items:center; height:80vh;'><p style='font-size:20px;'>Next scenario</p></div>",
        choices: "NO_KEYS",
        trial_duration: function () {
          return jsPsych.randomization.sampleWithoutReplacement(
            [1500, 1750, 2000, 2300],
            1,
          )[0];
        },
      });
    }
  });

  const exitSurvey = {
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div>
        <h2>Exit Survey</h2>
        <p>You have reached the end of the survey. To collect your pay, please complete the following questions. Your answers will not affect your pay or whether your submission is approved.</p>
      </div>
    `,
    html: exitSurveyHtml,
    on_finish: function (data) {
      const attentionChecks = jsPsych.data
        .get()
        .filter({ response_type: "attention_check" })
        .values();
      const attentionFails = attentionChecks.filter(
        (d) => d.attention_passed === false,
      ).length;

      data.attention_fails = attentionFails;
      data.attention_passed = attentionFails <= 1;
      data.response_type = "exit_survey";
    },
  };

  const saveData = {
    type: jsPsychPipe,
    action: "save",
    // TODO: replace with the jsPsychPipe experiment ID for this new experiment
    experiment_id: "REPLACE_WITH_NEW_JSPSYCH_PIPE_ID",
    filename: `${subjectId}.json`,
    data_string: () => jsPsych.data.get().json(),
  };

  const thankYou = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Thanks for participating in the experiment!</p>
      <p><a href="https://app.prolific.com/submissions/complete?cc=REPLACE_WITH_PROLIFIC_CODE">Click here to return to Prolific and complete the study</a>.</p>
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