from zipfile import ZipFile
import json
import pandas as pd


zip_path = "osfstorage-archive.zip"
rows = []

with ZipFile(zip_path) as zf:
    for filename in zf.namelist():
        if filename.endswith(".json"):
            data = json.loads(zf.read(filename))

            for trial in data:
                rows.append(dict(trial))

df = pd.DataFrame(rows)

# Replace subject IDs with anonymous labels (P01, P02, ...) in order of appearance
subject_order = df["subject_id"].drop_duplicates().tolist()
anon_map = {sid: f"P{i + 1:02d}" for i, sid in enumerate(subject_order)}
df.insert(0, "anon_id", df["subject_id"].map(anon_map))

# Drop every column that could link a row back to a Prolific account
identifying_columns = ["subject_id", "study_id", "session_id", "url"]
df = df.drop(columns=[c for c in identifying_columns if c in df.columns])

df.to_csv("mit_exp2a_raw_data.csv", index=False)

print("Done!")
print("Rows:", len(df))
print("Participants:", df["anon_id"].nunique())
