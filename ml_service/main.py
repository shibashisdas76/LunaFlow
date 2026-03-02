from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd  # Imported pandas to fix the feature names warning

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
try:
    model_data = joblib.load('lunaflow_model.pkl')
    if isinstance(model_data, dict):
        model = model_data['model']
        classes = list(model_data['classes'])
    else:
        model = model_data
        classes = getattr(model, 'classes_', ['None']) 
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    classes = []

class PatientData(BaseModel):
    age: int
    menstrual_cycle_length: int 
    maternal_status: int 
    period_duration: int
    blood_flow: int 
    pain_level: int 
    symptom_count: int

@app.post("/predict_health_risk")
def predict(data: PatientData):
    if not model:
        return {"error": "Model not loaded"}

    # --- FIX 1: Convert cycle length (days) into binary 1 or 0 for the ML model ---
    # A typical normal cycle is between 21 and 35 days.
    is_normal_cycle = 1 if 21 <= data.menstrual_cycle_length <= 35 else 0

    # --- FIX 2: Create a Pandas DataFrame with exact column names to remove the warning ---
    feature_names = [
        'AGE', 
        'MENSTRUAL CYCLE', 
        'METERNAL STATUS', 
        'PERIOD_DURATION', 
        'BLOOD FLOW', 
        'PAIN LEVEL', 
        'SYMPTOM_COUNT'
    ]
    
    features_df = pd.DataFrame([[
        data.age, 
        is_normal_cycle,  # Use the calculated 1 or 0 here
        data.maternal_status,
        data.period_duration, 
        data.blood_flow, 
        data.pain_level, 
        data.symptom_count
    ]], columns=feature_names)
    
    # Predict using the DataFrame
    prediction = model.predict(features_df)[0]
    
    # Calculate Cycle Vitality Score
    vitality_score = 80 
    try:
        probabilities = model.predict_proba(features_df)[0]
        
        if 'None' in classes:
            health_index = classes.index('None')
            vitality_score = int(probabilities[health_index] * 100)
            
        if prediction != 'None' and vitality_score > 60:
            vitality_score = max(15, 60 - (data.symptom_count * 5))
            
    except AttributeError:
        vitality_score = 90 if prediction == 'None' else 45

    # Dynamic Warning Message
    if prediction == 'None':
        warning_msg = "Patterns look normal. Keep maintaining a healthy lifestyle."
    else:
        warning_msg = f"ML detected patterns indicating {prediction}. This is for awareness only. Please consult a doctor."

    return {
        "status": "success",
        "prediction": prediction,
        "vitalityScore": vitality_score,
        "warning": warning_msg
    }