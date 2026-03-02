import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

# 1. Load the dataset
df = pd.read_csv('MENSTRUAL.csv')

# 2. Drop irrelevant columns
df = df.drop(columns=['Name', 'MONTH'])

# --- DATA CLEANING ---
df['AGE'] = df['AGE'].astype(str).str.replace('+', '', regex=False)
df['AGE'] = pd.to_numeric(df['AGE'], errors='coerce')

cycle_map = {'NORMAL CYCLE': 1, 'MISSED CYCLE': 0}
df['MENSTRUAL CYCLE'] = df['MENSTRUAL CYCLE'].astype(str).str.strip().str.upper().map(cycle_map)

df['START DATE'] = pd.to_datetime(df['START DATE'], errors='coerce')
df['END DATE'] = pd.to_datetime(df['END DATE'], errors='coerce')
df['PERIOD_DURATION'] = (df['END DATE'] - df['START DATE']).dt.days
df = df.drop(columns=['START DATE', 'END DATE'])

le_maternal = LabelEncoder()
df['METERNAL STATUS'] = le_maternal.fit_transform(df['METERNAL STATUS'].astype(str))

flow_map = {'Light': 1, 'Low': 1, 'Normal': 2, 'Medium': 2, 'Heavy': 3, 'High': 3}
pain_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Severe': 4}
df['BLOOD FLOW'] = df['BLOOD FLOW'].astype(str).str.strip().str.title().map(flow_map)
df['PAIN LEVEL'] = df['PAIN LEVEL'].astype(str).str.strip().str.title().map(pain_map)

def count_symptoms(x):
    if pd.isnull(x) or str(x).strip().upper() == 'NONE':
        return 0
    return len(str(x).split(','))

df['SYMPTOM_COUNT'] = df['SYMPTOMS'].apply(count_symptoms)
df = df.drop(columns=['SYMPTOMS'])
df = df.fillna(df.median(numeric_only=True))

# 5. Define Features (X) and Target (y)
X = df[['AGE', 'MENSTRUAL CYCLE', 'METERNAL STATUS', 'PERIOD_DURATION', 'BLOOD FLOW', 'PAIN LEVEL', 'SYMPTOM_COUNT']]
y = df['Any disease'].fillna('None') # 'None' means healthy

# 6. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 7. ENSEMBLE AI MODELING ---
# We use 3 different algorithms to create a super-model
rf_model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
lr_model = LogisticRegression(max_iter=1000, class_weight='balanced')

# Combine them using Soft Voting (calculates probability percentages)
ensemble_model = VotingClassifier(
    estimators=[('rf', rf_model), ('gb', gb_model), ('lr', lr_model)],
    voting='soft'
)

# Train the Ensemble
ensemble_model.fit(X_train, y_train)

# 8. Evaluate Accuracy
predictions = ensemble_model.predict(X_test)
print(f"Ensemble Model Accuracy: {accuracy_score(y_test, predictions) * 100:.2f}%")
print("\nDetailed Report:\n", classification_report(y_test, predictions, zero_division=0))

# 9. Save the Model and the Classes (Crucial for scoring)
joblib.dump({'model': ensemble_model, 'classes': ensemble_model.classes_}, 'lunaflow_model.pkl')
print("\n✅ Ensemble Model trained and saved successfully as lunaflow_model.pkl!")