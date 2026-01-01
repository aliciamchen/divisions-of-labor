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
        <p>Imagine that you are traveling very far away, and you meet a new group of people you know nothing about. You are trying to learn about the people, the society, and the language, all at the same time.</p>
        <p>In this study, you will read 6 scenarios. Each scenario describes two people who regularly interact around two recurring activities or exchanges. You will observe how they divide these between them.</p>
      </div>
      `,
      `
      <div class="instructions-container">
        <h2>Instructions</h2>
        <p>First, based only on the scenario description, we will ask you to estimate how hierarchical the relationship might be. Then, we will show you how the two people actually divide the activities or exchanges, and ask you again.</p>
        <p>We are interested in how people use just brief observation to make judgments about the type of relationship from observed social interactions.</p>
        <p>You will receive $3 if you successfully complete this study.</p>
        <p>Press next to begin the survey.</p>
      </div>
      `,
    ],
    show_clickable_nav: true,
    show_page_number: true,
  };

  const trials = [];

  stimuli.forEach((stimulus, stimulusIndex) => {
    // Add attention check after the 3rd scenario
    if (stimulusIndex === 3) {
      trials.push({
        type: jsPsychHtmlSliderResponse,
        labels: [
          "0<br>Completely equal",
          "50",
          "100<br>Extremely hierarchical",
        ],
        slider_width: 900,
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
        <div>
          <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
          <p>${stimulus.vignette}</p>
          <p><strong>How hierarchical do you think ${stimulus.name1} and ${stimulus.name2}'s relationship is?</strong></p>
        </div>
      `,
      slider_width: 900,
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
        condition: stimulus.condition,
      },
    });

    // Posterior elicitation - show vignette + action manipulation, ask about hierarchy again
    trials.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: `
        <div>
          <h2>Scenario ${stimulusIndex + 1} of ${stimuli.length}</h2>
          <p>${stimulus.vignette}</p>
          <p><em>${stimulus[stimulus.condition]}</em></p>
          <p><strong>Now that you've seen how they divide tasks, how hierarchical do you think their relationship is?</strong></p>
        </div>
      `,
      slider_width: 900,
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
        condition: stimulus.condition,
      },
    });

    // Memory check for the "work" scenario (Tavi and Boku)
    if (stimulus.scenario_label === "work") {
      trials.push({
        type: jsPsychSurveyMultiChoice,
        preamble: `
          <div>
            <h3>Memory Check</h3>
            <p>This is a memory check to make sure you're not a bot and that we can incorporate your responses into our study. Your responses on the memory check will not affect your pay or whether your submission is approved for payment.</p>
            <p>Please answer the following questions about the previous scenario.</p>
          </div>
        `,
        questions: [
          {
            prompt: "What were the names of the people in the scenario?",
            name: "names",
            options: [
              "Tavi and Boku",
              "Paji and Tudo",
              "Soji and Kemi",
              "Nira and Boku",
            ],
            required: true,
          },
          {
            prompt: "What tasks needed to be done?",
            name: "tasks",
            options: [
              "Organizing the shelbs and restocking the frints",
              "Taking out the jats and feeding the feps",
              "Paying for the kulms and covering the cost of shared preves",
              "Giving gifts of vorts and giving gifts of melps",
            ],
            required: true,
          },
        ],
        button_label: "Continue",
        on_finish: function (data) {
          const responses = data.response || {};
          const correctNames = responses.names === "Tavi and Boku" ? 1 : 0;
          const correctTasks =
            responses.tasks === "Organizing the shelbs and restocking the frints" ? 1 : 0;
          const totalCorrect = correctNames + correctTasks;
          data.response_type = "memory_check";
          data.memory_correct_count = totalCorrect;
          data.memory_correct_names = correctNames;
          data.memory_correct_tasks = correctTasks;
        },
      });
    }

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
    experiment_id: "CC2eJ7iDg1TG",
    filename: `${subjectId}.json`,
    data_string: () => jsPsych.data.get().json(),
  };

  const thankYou = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Thanks for participating in the experiment!</p>
                  <p><a href="https://app.prolific.com/submissions/complete?cc=C1A889GX">Click here to return to Prolific and complete the study</a>.</p>
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
