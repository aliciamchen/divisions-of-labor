#!/usr/bin/env python3
"""
Convert raw jsPsych JSON data to CSV format.
"""

import json
import csv
import os
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
OUTPUT_DIR = SCRIPT_DIR

def load_json_files(data_folder):
    """Load all JSON files from a data folder."""
    all_trials = []
    json_files = list(data_folder.glob("*.json"))

    for json_file in json_files:
        with open(json_file, 'r') as f:
            trials = json.load(f)
            all_trials.extend(trials)

    return all_trials

def extract_response_trials(trials):
    response_data = []
    survey_data = []

    for trial in trials:
        response_type = trial.get('response_type')

        if response_type == 'response' and trial.get('trial_type') == 'html-slider-response':
            row = {
                'subject_id': trial.get('subject_id'),
                'stimulus_index': trial.get('stimulus_index'),
                'scenario_label': trial.get('scenario_label'),
                'condition': trial.get('condition'),
                'stage': trial.get('stage'),
                'response': trial.get('response'),
            }
            response_data.append(row)


        # Extract exit survey (separate)
        elif response_type == 'exit_survey':
            survey_response = trial.get('response', {})
            row = {
                'subject_id': trial.get('subject_id'),
                'gender': survey_response.get('gender'),
                'age': survey_response.get('age'),
                'understood': survey_response.get('understood'),
                'comments': survey_response.get('comments'),
                'attention_passed': trial.get('attention_passed'),
                'memory_correct_count': trial.get('memory_correct_count'),
            }
            survey_data.append(row)

    return response_data, survey_data

def anonymize_subject_ids(data):
    unique_subjects = sorted(set(row['subject_id'] for row in data))
    id_map = {sid: f"P{i+1:03d}" for i, sid in enumerate(unique_subjects)}

    for row in data:
        row['subject_id'] = id_map[row['subject_id']]

    return data, id_map

def write_csv(data, output_path, fieldnames):
    """Write data to CSV file."""
    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def main():
    # Find the most recent data folder
    data_folders = sorted(DATA_DIR.glob("*_pilot_raw"))

    if not data_folders:
        print("No data folders found!")
        return

    latest_folder = data_folders[-1]
    print(f"Processing data from: {latest_folder}")

    # Load and process data
    trials = load_json_files(latest_folder)
    print(f"Loaded {len(trials)} total trials")

    response_data, survey_data = extract_response_trials(trials)
    print(f"Extracted {len(response_data)} response trials")
    print(f"Extracted {len(survey_data)} exit surveys")

    # Get all unique subjects from both datasets for consistent anonymization
    all_subjects = sorted(set(
        [row['subject_id'] for row in response_data] +
        [row['subject_id'] for row in survey_data]
    ))
    id_map = {sid: f"P{i+1:03d}" for i, sid in enumerate(all_subjects)}

    # Anonymize both datasets
    for row in response_data:
        row['subject_id'] = id_map[row['subject_id']]
    for row in survey_data:
        row['subject_id'] = id_map[row['subject_id']]
    print(f"Anonymized {len(id_map)} subject IDs")

    # Define fieldnames for response CSV
    response_fieldnames = [
        'subject_id', 'stimulus_index', 'scenario_label', 'condition', 'stage',
        'response'
    ]

    # Define fieldnames for survey CSV
    survey_fieldnames = [
        'subject_id', 'gender', 'age', 'understood', 'comments',
        'attention_passed', 'memory_correct_count'
    ]

    folder_name = latest_folder.name.replace("_raw", "")
    response_path = OUTPUT_DIR / f"{folder_name}_data.csv"
    write_csv(response_data, response_path, response_fieldnames)
    print(f"Saved response data to: {response_path}")

    survey_path = OUTPUT_DIR / f"{folder_name}_exit-survey.csv"
    write_csv(survey_data, survey_path, survey_fieldnames)
    print(f"Saved survey data to: {survey_path}")

    print(f"\nSummary:")
    print(f"  Subjects: {len(id_map)}")
    print(f"  Response rows: {len(response_data)}")
    print(f"  Survey rows: {len(survey_data)}")

if __name__ == "__main__":
    main()
