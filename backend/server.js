require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // Added axios for ML API communication

const app = express();
app.use(cors());
app.use(express.json());

// database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- Database Models (Schemas) ---

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  profile: {
    age: { type: Number, default: 25 },
    averageCycleLength: { type: Number, default: 28 },
    location: { type: String, default: '' }
  }
});

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: String,
  endDate: String,
  duration: Number,
  cycleLength: Number,
  flowIntensity: String,
  painLevel: String,
  symptoms: [String],
  isMissed: Boolean,
  notes: String
});

// NEW: Schema to save AI Analysis Records (FIXED TO INCLUDE ML TEXT)
const analysisRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  overallHealthScore: Number,
  summary: String,
  risks: Array, 
  wellnessPlan: Object, 
  disclaimer: String,
  mlPredictionText: String, // FIX: Added this back!
  mlWarning: String         // FIX: Added this back!
});

const User = mongoose.model('User', userSchema);
const PeriodLog = mongoose.model('PeriodLog', logSchema);
const AnalysisRecord = mongoose.model('AnalysisRecord', analysisRecordSchema);

// --- API Routes ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ email, password, name });
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch data
app.get('/api/data/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const logs = await PeriodLog.find({ userId: req.params.userId }).sort({ startDate: -1 });
    res.json({ profile: user.profile, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Adding logs
app.post('/api/logs', async (req, res) => {
  try {
    const { userId, log, age } = req.body;
    const newLog = new PeriodLog({ ...log, userId });
    await newLog.save();

    const logs = await PeriodLog.find({ userId, isMissed: false }).sort({ startDate: -1 });
    let avgCycle = 28;
    if (logs.length > 1) {
       const totalDays = logs.reduce((acc, curr) => acc + (curr.cycleLength || 28), 0);
       avgCycle = Math.round(totalDays / logs.length);
    }

    await User.findByIdAndUpdate(userId, { 
      'profile.age': age,
      'profile.averageCycleLength': avgCycle 
    });

    const allLogs = await PeriodLog.find({ userId }).sort({ startDate: -1 });
    res.json({ logs: allLogs, profile: { age, averageCycleLength: avgCycle } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Profile Update
app.put('/api/profile/:userId', async (req, res) => {
  try {
    const { profile } = req.body;
    await User.findByIdAndUpdate(req.params.userId, { profile });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete the log
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    await PeriodLog.findByIdAndDelete(req.params.id);

    const allLogs = await PeriodLog.find({ userId }).sort({ startDate: -1 });
    
    const validLogs = allLogs.filter(l => !l.isMissed);
    let avgCycle = 28;
    if (validLogs.length > 1) {
       const totalDays = validLogs.reduce((acc, curr) => acc + (curr.cycleLength || 28), 0);
       avgCycle = Math.round(totalDays / validLogs.length);
    }
    
    await User.findByIdAndUpdate(userId, { 'profile.averageCycleLength': avgCycle });

    res.json({ logs: allLogs, profile: { averageCycleLength: avgCycle } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Reset all
app.delete('/api/reset/:userId', async (req, res) => {
  try {
    await PeriodLog.deleteMany({ userId: req.params.userId });
    await User.findByIdAndUpdate(req.params.userId, { 
      'profile.averageCycleLength': 28 
    });
    res.json({ success: true, message: "All records reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. ML Health Prediction Route
app.post('/api/predict', async (req, res) => {
  try {
    const { age, cycleLength, duration, flowIntensity, painLevel, symptoms } = req.body;

    const flowMap = { 'Light': 1, 'Normal': 2, 'Heavy': 3 };
    const painMap = { 'Low': 1, 'Medium': 2, 'High': 3 };

    const mappedFlow = flowMap[flowIntensity] || 2; 
    const mappedPain = painMap[painLevel] || 2;     
    const symptomCount = Array.isArray(symptoms) ? symptoms.length : 0;

    const pythonResponse = await axios.post('http://127.0.0.1:8000/predict_health_risk', {
      age: age || 25,
      menstrual_cycle_length: cycleLength || 28,
      maternal_status: 0, 
      period_duration: duration || 5,
      blood_flow: mappedFlow,
      pain_level: mappedPain,
      symptom_count: symptomCount
    });

    res.json({
      success: true,
      prediction: pythonResponse.data.prediction || pythonResponse.data.predicted_condition,
      vitalityScore: pythonResponse.data.vitalityScore || 80,
      warning: pythonResponse.data.warning
    });
    
  } catch (err) {
    console.error("ML Service Error:", err.message);
    res.status(500).json({ error: "Failed to communicate with ML service." });
  }
});

// --- NEW 9. SAVE ANALYSIS ROUTE (FIXED) ---
app.post('/api/analysis/save', async (req, res) => {
  try {
    const { userId, geminiAnalysis, mlPrediction } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const newRecord = new AnalysisRecord({
      userId: userId,
      overallHealthScore: mlPrediction.score || geminiAnalysis.overallHealthScore,
      summary: geminiAnalysis.summary,
      risks: geminiAnalysis.risks,
      wellnessPlan: geminiAnalysis.wellnessPlan,
      disclaimer: geminiAnalysis.disclaimer,
      mlPredictionText: mlPrediction.prediction, // FIX: Added this back!
      mlWarning: mlPrediction.warning            // FIX: Added this back!
    });

    await newRecord.save();
    res.status(201).json({ message: "Analysis saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NEW 10. GET SAVED ANALYSES ---
app.get('/api/analysis/:userId', async (req, res) => {
  try {
    const records = await AnalysisRecord.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));