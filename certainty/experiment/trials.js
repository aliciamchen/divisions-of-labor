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
        <p>In this study, we are interested in how people evaluate relationships by observing everyday behavior. We want to understand how people judge whether a relationship is hierarchical, meaning whether one person appears to have greater rank, authority, influence, or importance than the other. Or whether the relationship is equal, with both people having the same level of rank, authority, influence, and importance.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>You will read 16 short scenarios. Each scenario describes two characters who regularly interact around two recurring activities or exchanges. In each scenario, <strong>assume the two characters have already been dividing these activities this way for a while</strong>, this is their established, ongoing pattern, not something new.</p>
        <p>Please read all of the scenarios carefully. Make sure to pay attention to how the two characters divide the activities, and to anything that changes over the course of the scenario!</p>
      </div>
      `,
      `
    <div class="instructions-container">
  <h2>Instructions</h2>
  <p>Here is how each scenario will work:</p>
  <ol>
    <li style="margin-bottom: 12px;">You will first read a short description of two people, their situation, and how they divide the two activities between them (either alternating or dividing them consistently). Based on this information, you will rate how hierarchical or equal you think the two people would describe their relationship.</li>
    <li style="margin-bottom: 12px;">You will then read one additional sentence about how one of the charachters has begun to perceive the effort and value of the tasks. Based on this new information, we will ask you to rate the relationship again.</li>
  </ol>
  <p>For each rating, you will use a 7-point scale ranging from a <strong>"Completely equal relationship,"</strong> to an <strong>"Extremely hierarchical relationship"</strong>.</p>
  <p>Please read each scenario carefully. The study should take approximately 20 minutes, and you will receive <strong>$6.00</strong> for successfully completing it. 🙂</p>
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

  // Generic certainty statement
  function certaintyStatement(certaintyCondition, name1, name2) {
    if (certaintyCondition === "uncertain") {
      return `After doing this for a while now, ${name1} has started to wonder whether the two tasks are really as equal in effort and value as they originally thought.`;
    }
    return `After doing this for a while now, ${name1} continues to agree that the two tasks are equal in effort and value.`;
  }

  let firstScenarioLabel = "";
  let firstScenarioName1 = "";
  let firstScenarioName2 = "";

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
    const certaintyFilled = certaintyStatement(
      stimulus.certainty_condition,
      name1,
      name2,
    );

    if (stimulusIndex === 0) {
      firstScenarioLabel = stimulus.scenario_label;
      firstScenarioName1 = name1;
      firstScenarioName2 = name2;
    }

    // ATTENTION CHECK 1 (after scenario 3 of 16)
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

    // ATTENTION CHECK 2 (after scenario 8 of 16): memory check about first scenario
    if (stimulusIndex === 8) {
      trials.push({
        type: jsPsychSurveyMultiChoice,
        questions: [
          {
            prompt: `
              <p class="trial-text">This is an attention check about a scenario you already read.</p>
              <p class="trial-text">In the <strong>${firstScenarioLabel}</strong> scenario, what did ${firstScenarioName1} and ${firstScenarioName2} originally agree about the two tasks?</p>
            `,
            name: "memory_check",
            options: [
              "That one task was more important than the other",
              "That the two tasks are equal in effort and value",
              "That they had been working together for a long time",
              "That they preferred different tasks",
            ],
            required: true,
          },
        ],
        data: { response_type: "memory_check", check_number: 2 },
        on_finish: function (data) {
          const response = data.response.memory_check;
          data.memory_correct_count =
            response === "That the two tasks are equal in effort and value"
              ? 1
              : 0;
          data.attention_passed =
            response === "That the two tasks are equal in effort and value";
        },
      });
    }

    // ATTENTION CHECK 3 (after scenario 13 of 16)
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
        data: { response_type: "attention_check", check_number: 3 },
        on_finish: function (data) {
          data.attention_passed = data.response.Q0 === 6;
        },
      });
    }

    // --- PRIOR: vignette + behavior shown together, ask about hierarchy ---
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
        stage: "prior",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        certainty_condition: stimulus.certainty_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    // POSTERIOR: same content + certainty statement, ask again
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
              <div class="certainty-highlight-wrapper">
                <p class="certainty-highlight"><strong>${certaintyFilled}</strong></p>
              </div>
              <p class="trial-text">Now that you know this, how hierarchical do you think their relationship is?</p>
            </div>
          `,
          labels: likertLabels,
          required: true,
        },
      ],
      button_label: "Continue",
      data: {
        response_type: "response",
        stage: "posterior",
        stimulus_index: stimulusIndex,
        scenario_label: stimulus.scenario_label,
        category: stimulus.category,
        work_condition: stimulus.work_condition,
        certainty_condition: stimulus.certainty_condition,
        gender_condition: stimulus.gender_condition,
      },
    });

    // --- TRANSITION between scenarios ---
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

      const memoryCorrect = jsPsych.data
        .get()
        .filter({ response_type: "memory_check" })
        .select("memory_correct_count")
        .sum();

      data.attention_fails = attentionFails;
      data.memory_correct_count = memoryCorrect;
      data.attention_passed = attentionFails <= 1 && memoryCorrect >= 1;
      data.response_type = "exit_survey";
    },
  };

  const saveData = {
    type: jsPsychPipe,
    action: "save",
    // TODO: replace with the jsPsychPipe experiment ID for this new experiment
    experiment_id: "heOAO6K0piLa",
    filename: `${subjectId}.json`,
    data_string: () => jsPsych.data.get().json(),
  };

  const thankYou = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Thanks for participating in the experiment!</p>
      <p><a href="https://app.prolific.com/submissions/complete?cc=C1SM75OA">Click here to return to Prolific and complete the study</a>.</p>
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