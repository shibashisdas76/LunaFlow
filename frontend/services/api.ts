import { User, PeriodLog, UserProfile } from '../types';

const API_URL = 'http://localhost:5000/api';

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  register: async (user: User) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  getUserData: async (userId: string) => {
    const res = await fetch(`${API_URL}/data/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  },

  addLog: async (userId: string, log: any, age: number) => {
    const res = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, log, age }),
    });
    if (!res.ok) throw new Error('Failed to add log');
    return res.json();
  },

  updateProfile: async (userId: string, profile: UserProfile) => {
    const res = await fetch(`${API_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // DELETE FUNCTION 
  deleteLog: async (logId: string, userId: string) => {
    const res = await fetch(`${API_URL}/logs/${logId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to delete log');
    return res.json();
  },

  // --- RESET FUNCTION ---
  resetData: async (userId: string) => {
    const res = await fetch(`${API_URL}/reset/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to reset data');
    return res.json();
  },

  // --- ML Health Prediction Function (FIXED) ---
  predictHealthRisk: async (cycleData: any) => {
    // 1. Format the data to match EXACTLY what Python FastAPI expects
    const formattedData = {
      age: cycleData.age || 25,
      menstrual_cycle_length: cycleData.cycleLength || 28,
      maternal_status: 0, // Defaulting to 0 (Single)
      period_duration: cycleData.duration || 5,
      // Convert String levels to Integers for the ML Model
      blood_flow: cycleData.flowIntensity === 'Heavy' || cycleData.flowIntensity === 'High' ? 3 : (cycleData.flowIntensity === 'Medium' || cycleData.flowIntensity === 'Normal' ? 2 : 1),
      pain_level: cycleData.painLevel === 'Severe' || cycleData.painLevel === 'High' ? 3 : (cycleData.painLevel === 'Medium' ? 2 : 1),
      symptom_count: cycleData.symptoms ? cycleData.symptoms.length : 0
    };

    try {
      // 2. Call the Python FastAPI Server directly!
      const res = await fetch('http://127.0.0.1:8000/predict_health_risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (!res.ok) throw new Error('Prediction request failed');
      const result = await res.json();

      // 3. Return the exact keys that AnalysisView.tsx is looking for
      return {
        prediction: result.prediction || 'None',
        vitalityScore: result.vitalityScore || 80,
        warning: result.warning || 'Patterns look normal.'
      };
    } catch (error) {
      console.error("ML Prediction API failed:", error);
      // Fallback response to prevent UI crash if Python server is down
      return {
        prediction: 'None',
        vitalityScore: 80,
        warning: 'Could not connect to ML Server. Ensure Python FastAPI is running.'
      };
    }
  },

  // --- NEW: Save Analysis Function (UPDATED FOR DEBUGGING) ---
  saveAnalysis: async (userId: string, geminiAnalysis: any, mlPrediction: any) => {
    const res = await fetch(`${API_URL}/analysis/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, geminiAnalysis, mlPrediction }),
    });
    
    // 🔥 THE FIX: Capture the exact error from the backend instead of a generic message
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }
    
    return res.json();
  },

  // --- NEW: Fetch Saved Analysis Function ---
  getSavedAnalyses: async (userId: string) => {
    const res = await fetch(`${API_URL}/analysis/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch saved analyses');
    return res.json();
  }
};