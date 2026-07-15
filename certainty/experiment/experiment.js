import { makeTimeline } from "./trials.js";

let stimuli = [];
let consentHtml = "";
let exitSurveyHtml = "";
let counterbalancing = [];

Promise.all([
  fetch("./json/16scenarios.json").then((response) => response.json()),
  fetch("./json/full_counterbalancing_uncertainty.json").then((response) =>
    response.json(),
  ),
  fetch("./html/consent.html").then((response) => response.text()),
  fetch("./html/exit-survey.html").then((response) => response.text()),
])
  .then(
    ([
      stimuliData,
      counterbalancingData,
      consentContent,
      exitSurveyContent,
    ]) => {
      stimuli = stimuliData;
      counterbalancing = counterbalancingData;
      consentHtml = consentContent;
      exitSurveyHtml = exitSurveyContent;
      initExperiment();
    },
  )
  .catch((error) => {
    console.error("Error loading experiment files:", error);
    alert("Error loading experiment data. Please refresh the page.");
  });

async function hashId(raw) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

async function createExperiment() {
  const jsPsych = initJsPsych({
    show_progress_bar: true,
  });

  const prolificPid = jsPsych.data.getURLVariable("PROLIFIC_PID");
  var subject_id =
    prolificPid == undefined
      ? jsPsych.randomization.randomID(12)
      : await hashId(prolificPid);
  const rawStudyId = jsPsych.data.getURLVariable("STUDY_ID");
  var study_id =
    rawStudyId == undefined ? undefined : await hashId(rawStudyId);
  const rawSessionId = jsPsych.data.getURLVariable("SESSION_ID");
  var session_id =
    rawSessionId == undefined ? undefined : await hashId(rawSessionId);

  // TODO: replace with the jsPsychPipe experiment ID for this new experiment
  const condition_assignment = await jsPsychPipe.getCondition(
    "REPLACE_WITH_NEW_JSPSYCH_PIPE_ID",
  );

  const assignedSequence = counterbalancing[condition_assignment];

  jsPsych.data.addProperties({
    study_id: study_id,
    session_id: session_id,
    subject_id: subject_id,
    condition_assignment: condition_assignment,
  });

  const stimuliWithConditions = stimuli.map((stimulus) => {
    const sequenceItem = assignedSequence.find(
      (item) => item.scenario_label === stimulus.scenario_label,
    );

    return {
      ...stimulus,
      work_condition: sequenceItem ? sequenceItem.work_condition : "",
      certainty_condition: sequenceItem
        ? sequenceItem.certainty_condition
        : "",
      gender_condition: sequenceItem ? sequenceItem.gender_condition : "",
    };
  });

  const shuffledStimuli = jsPsych.randomization.shuffle(
    stimuliWithConditions,
  );

  let timeline = makeTimeline(
    jsPsych,
    shuffledStimuli,
    consentHtml,
    exitSurveyHtml,
    subject_id,
  );

  jsPsych.run(timeline);
}

function initExperiment() {
  createExperiment();
}