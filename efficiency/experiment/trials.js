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
        <p>You will read 16 short scenarios. Each scenario describes two characters who regularly interact around two recurring tasks, along with information about how much time or effort could be saved by dividing those tasks rather than taking turns doing each one.</p>
        <p>Please read all of the scenarios carefully.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>For each scenario, you will rate how hierarchical or equal you think the two people would describe their relationship, using a 7-point scale ranging from a <strong>"Completely equal relationship"</strong> to an <strong>"Extremely hierarchical relationship"</strong>.</p>
        <p>You will also be asked whether you expect the pair to keep their current arrangement going forward, or for it to change.</p>
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

  function magnitudeForScenario(scenarioLabel, efficiencyCondition) {
    const isHigh = efficiencyCondition !== "low";
    return isHigh
      ? "a great deal of time and effort"
      : "just a little bit of time and effort";
  }

  // Efficiency statement
  function efficiencyStatement(workCondition, efficiencyCondition, name1, name2, scenarioLabel) {
    const magnitude = magnitudeForScenario(scenarioLabel, efficiencyCondition);

    if (workCondition === "division_of_labor") {
      return `By dividing these tasks the way they do, ${name1} and ${name2} save ${magnitude} compared to if they took turns doing each task.`;
    }

    // both_alternate
    return `If ${name1} and ${name2} divided these tasks instead of taking turns doing each task, they would save ${magnitude}.`;
  }

  // whether the pair's observed behavior matches what pure efficiency would predict
  function matchesEfficiencyDefault(workCondition, efficiencyCondition) {
    if (workCondition === "division_of_labor") {
      return efficiencyCondition === "high";
    }
    return efficiencyCondition === "low";
  }

  // preference options
  function preferenceOptions() {
    return [
      "I expect them to keep this arrangement",
      "I expect this arrangement to change",
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
      stimulus.work_condition,
      stimulus.efficiency_condition,
      name1,
      name2,
      stimulus.scenario_label,
    );
    const matchesDefault = matchesEfficiencyDefault(
      stimulus.work_condition,
      stimulus.efficiency_condition,
    );

    // AaTTENTION CHECKS
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

    // Combined trial: hierarchy rating AND preference question on the same page.
    const likertRadios = likertLabels
      .map(
        (label, i) => `
          <div class="likert-option">
            <input type="radio" name="hierarchy_rating" id="hierarchy_${i}" value="${i}" required>
            <label for="hierarchy_${i}">${label}</label>
          </div>
        `,
      )
      .join("");

    const preferenceRadios = preferenceOptions()
      .map(
        (label, i) => `
          <div class="preference-option">
            <input type="radio" name="preference" id="preference_${i}" value="${label}" required>
            <label for="preference_${i}">${label}</label>
          </div>
        `,
      )
      .join("");

    trials.push({
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <div class="trial-content">
          <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
          <p class="trial-text">${vignetteFilled}</p>
          <div class="action-highlight-wrapper">
            <p class="action-highlight"><strong>${workFilled}</strong></p>
          </div>
          <div class="efficiency-highlight-wrapper">
            <p class="efficiency-highlight"><strong>${efficiencyFilled}</strong></p>
          </div>
        </div>
      `,
      html: `
        <div class="trial-content">
          <p class="trial-text">How hierarchical do you think ${name1} and ${name2}'s relationship is?</p>
          <div class="likert-group">${likertRadios}</div>

          <p class="trial-text">Based on everything you've read about ${name1} and ${name2}, do you expect them to keep this arrangement, or do you expect it to change?</p>
          <div class="preference-group">${preferenceRadios}</div>
        </div>
      `,
      button_label: "Continue",
      data: {
        response_type: "response",
        stage: "rating",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        efficiency_condition: stimulus.efficiency_condition,
        matches_default: matchesDefault,
        gender_condition: stimulus.gender_condition,
      },
      on_finish: function (data) {
        // survey-html-form collects named inputs into data.response
        data.hierarchy_rating = Number(data.response.hierarchy_rating);
        data.preference = data.response.preference;
      },
    });

    // Transition between scenarios
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