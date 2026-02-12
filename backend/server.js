require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Database model (Schema)
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

const User = mongoose.model('User', userSchema);
const PeriodLog = mongoose.model('PeriodLog', logSchema);

// API routes

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

// 6. Delete the log (DELETE)
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    await PeriodLog.findByIdAndDelete(req.params.id);

    // Update the list again after deleting
    const allLogs = await PeriodLog.find({ userId }).sort({ startDate: -1 });
    
    // Find the new average cycle
    const validLogs = allLogs.filter(l => !l.isMissed);
    let avgCycle = 28;
    if (validLogs.length > 1) {
       const totalDays = validLogs.reduce((acc, curr) => acc + (curr.cycleLength || 28), 0);
       avgCycle = Math.round(totalDays / validLogs.length);
    }
    
   // Update user profile
    await User.findByIdAndUpdate(userId, { 'profile.averageCycleLength': avgCycle });

    res.json({ logs: allLogs, profile: { averageCycleLength: avgCycle } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Reset all (RESET)
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

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));