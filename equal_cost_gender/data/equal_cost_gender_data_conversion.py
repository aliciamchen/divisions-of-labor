from zipfile import ZipFile
import hashlib
import json
import pandas as pd


def hash_id(raw):
    if pd.isna(raw) or raw == "":
        return raw
    return hashlib.sha256(str(raw).encode()).hexdigest()[:24]


zip_path = "osfstorage-archive.zip"
rows = []

with ZipFile(zip_path) as zf:
    for filename in zf.namelist():
        if filename.endswith(".json"):
            data = json.loads(zf.read(filename))

            for trial in data:
                trial = dict(trial)
                trial["source_file"] = filename
                rows.append(trial)

df = pd.DataFrame(rows)

df["subject_id"] = df["subject_id"].apply(hash_id)
df["study_id"] = df["study_id"].apply(hash_id)
df["session_id"] = df["session_id"].apply(hash_id)
df["source_file"] = df["source_file"].apply(
    lambda f: hash_id(f.replace(".json", "")) + ".json" if isinstance(f, str) else f
)
if "url" in df.columns:
    df = df.drop(columns=["url"])

df.to_csv("mit_exp2a_raw_data.csv", index=False)

print("Done!")
print("Rows:", len(df))
print("Participants:", df["subject_id"].nunique())