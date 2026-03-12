import React, { useState } from 'react';
import { PeriodLog, AnalysisResult, UserProfile } from '../types';
import { analyzeHealthRisks } from '../services/gemini';
import { api } from '../services/api'; 
import { Sparkles, AlertTriangle, ShieldCheck, Utensils, Zap, Loader2, Flower2, Apple, CheckCircle2, MapPin, Brain, Activity, Save } from 'lucide-react';

interface Props {
  logs: PeriodLog[];
  profile: UserProfile;
}

const AnalysisView: React.FC<Props> = ({ logs, profile }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  // ML Prediction state updated to include 'score'
  const [mlPrediction, setMlPrediction] = useState<{ prediction: string, warning: string, score: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Saving Analysis
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isAnalysisGranted = logs.length >= 2;

  const performAnalysis = async () => {
    if (logs.length < 2) {
      setError("Please add at least 2 period logs for a pattern analysis.");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const latestLog = logs[0]; 
      
      // 1. ML MODEL RUNS FIRST (Primary Diagnosis & Vitality Score)
      const mlResult = await api.predictHealthRisk({
         age: profile.age,
         cycleLength: latestLog.cycleLength || profile.averageCycleLength,
         duration: latestLog.duration,
         flowIntensity: latestLog.flowIntensity,
         painLevel: latestLog.painLevel,
         symptoms: latestLog.symptoms || []
      });

      setMlPrediction({
          prediction: mlResult.prediction,
          warning: mlResult.warning,
          score: mlResult.vitalityScore || 0 // Ensuring score is captured
      });

      // 2. PASS ML RESULTS TO GEMINI (Secondary indicators, Diet & Yoga)
      const geminiResult = await analyzeHealthRisks(
          logs, 
          profile.age, 
          profile.location,
          mlResult.prediction,   // Pass ML prediction to Gemini
          mlResult.vitalityScore // Pass ML score to Gemini
      );
      
      setAnalysis(geminiResult);

    } catch (err: any) {
      setError(err.message || "Failed to analyze health data. Please check your API connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- SMART Save Analysis Function ---
  const handleSaveAnalysis = async () => {
    if (!analysis || !mlPrediction) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      let userId = null;

      // 1. Check if it's stored as an object named 'user'
      const userStr = localStorage.getItem('user');
      if (userStr) {
          try {
              const userObj = JSON.parse(userStr);
              userId = userObj._id || userObj.id;
          } catch (e) {}
      }
      
      // 2. Check if it's stored directly as 'userId'
      if (!userId) {
          userId = localStorage.getItem('userId');
      }

      // 3. Fallback: Take the userId directly from the Period logs! (Guaranteed to work)
      if (!userId && logs.length > 0) {
          // @ts-ignore
          userId = logs[0].userId;
      }

      if (!userId) {
          throw new Error("User ID not found. Please log out and log in again.");
      }

      // Call the API to save
      await api.saveAnalysis(userId as string, analysis, mlPrediction);
      
      // Show success message
      setSaveMessage({ type: 'success', text: 'Analysis saved successfully!' });
      
      // Remove success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save analysis.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Moderate': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-teal-600 bg-teal-50 border-teal-100';
    }
  };

  // 1. If there are less than 2 records
  if (!isAnalysisGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-8 shadow-inner">
          <Brain size={48} className="animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">AI Analysis Locked</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed text-lg">
          To provide accurate health insights and detect patterns, our AI requires **at least two menstrual records**.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
            <Zap size={16} className="fill-slate-400" /> 
            Records Found: <span className="text-rose-500">{logs.length}</span> / 2 Required
          </div>
          <p className="text-sm text-rose-400 italic font-medium">Please log more cycles in "My Records" to unlock.</p>
        </div>
      </div>
    );
  }

  // Determine the display score (prefer ML score, fallback to Gemini score)
  const displayScore = mlPrediction?.score ?? analysis?.overallHealthScore ?? 0;

  // 2. If there are 2 or more records
  return (
    <div className="space-y-8 pb-10">
      {!analysis && !loading && (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500">
            <Sparkles size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Health Analysis</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            Our ML Model diagnoses your patterns, while AI generates a personalized wellness plan based on your cycle, symptoms, and location.
          </p>
          
          {profile.location && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-slate-500 text-sm mb-8 border border-slate-100">
              <MapPin size={14} className="text-rose-400" />
              Location: <span className="font-bold text-slate-700">{profile.location}</span>
            </div>
          )}

          <button 
            onClick={performAnalysis}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-rose-100 transition-all flex items-center gap-2 group"
          >
            Generate My Wellness Plan
            <Zap size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium max-w-md">
              <p className="font-bold mb-1">Error detected:</p>
              {error}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto">
          <Loader2 size={48} className="animate-spin text-rose-500 mb-6" />
          <h2 className="text-xl font-bold mb-2">Analyzing your patterns...</h2>
          <p className="text-slate-400">ML Model is calculating your score while Gemini crafts your diet & yoga routine...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Row: Score Card & ML Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Cycle Vitality Score (Now uses ML Score) */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-3xl p-8 text-white shadow-xl flex flex-col items-center md:items-start text-center md:text-left h-full">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full mb-4">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
                        <circle cx="48" cy="48" r="42" stroke="white" strokeWidth="6" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * displayScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute text-2xl font-bold">{displayScore}%</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-1 uppercase tracking-tight">Cycle Vitality Score</h2>
                        {profile.location && (
                            <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1 text-white/70 text-xs">
                            <MapPin size={12} /> {profile.location} Region
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-indigo-50 leading-relaxed text-sm opacity-90 flex-grow">{analysis.summary}</p>
                
                {/* Update Data & Save Analysis Buttons Container */}
                <div className="flex flex-col gap-2 mt-4 self-center md:self-start">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAnalysis(null)} className="text-white bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/20 rounded-xl px-4 py-2 transition-all">
                        Update Data
                    </button>
                    
                    <button 
                      onClick={handleSaveAnalysis} 
                      disabled={isSaving}
                      className="flex items-center gap-1.5 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-bold rounded-xl px-4 py-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {isSaving ? 'Saving...' : 'Save Analysis'}
                    </button>
                  </div>
                  
                  {saveMessage && (
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${saveMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-50' : 'bg-rose-500/20 text-rose-50'}`}>
                      {saveMessage.text}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ML Pattern Prediction Box */}
              {mlPrediction && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center h-full">
                      <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl ${mlPrediction.prediction === 'None' || mlPrediction.prediction === 'Normal' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                              <Activity size={24} />
                          </div>
                          <div>
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ML Pattern Assessment</h3>
                              <p className={`text-2xl font-black ${mlPrediction.prediction === 'None' || mlPrediction.prediction === 'Normal' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {mlPrediction.prediction === 'None' ? 'No Risk Detected' : mlPrediction.prediction}
                              </p>
                          </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-600 text-sm flex gap-3 items-start mt-auto">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-slate-400" />
                          <p className="leading-relaxed text-xs">{mlPrediction.warning}</p>
                      </div>
                  </div>
              )}
          </div>

          {/* Risks and Alerts Section */}
          <section>
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 px-2">
              <ShieldCheck className="text-indigo-500" /> Secondary Health Indicators
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.risks.map((risk, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">{risk.condition}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{risk.reasoning}</p>
                  <div className="space-y-2">
                    {risk.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Wellness Plan: Diet and Habits */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Utensils className="text-orange-500" /> Regional Diet Chart
                  </h3>
                  {profile.location && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">{profile.location} Focus</span>}
                </div>
                <div className="space-y-4">
                  {analysis.wellnessPlan.dietChart.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-orange-50/30 border border-orange-100">
                      <div className="w-full md:w-32 font-black text-orange-600 uppercase text-xs tracking-widest pt-1">{item.meal}</div>
                      <div className="text-slate-700 text-sm leading-relaxed">{item.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Flower2 className="text-teal-500" /> Recommended Yoga Routine
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.wellnessPlan.yogaPoses.map((pose, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100">
                      <div className="font-bold text-teal-700 mb-1">{pose.name}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">{pose.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-full">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Apple className="text-rose-500" /> Healthy Food Habits
                </h3>
                <ul className="space-y-4">
                  {analysis.wellnessPlan.foodHabits.map((habit, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 font-bold text-xs">{idx + 1}</div>
                      <span className="leading-relaxed">{habit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-slate-50 italic text-[11px] text-slate-400">
                  Tip: These suggestions take into account locally available ingredients common in the {profile.location || 'your'} region.
                </div>
              </div>
            </div>
          </section>

          {/* Footer Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col sm:flex-row gap-4 text-amber-800 text-sm shadow-sm shadow-amber-100 items-start">
            <AlertTriangle size={24} className="shrink-0 text-amber-500" />
            <div>
              <p className="font-black mb-1 uppercase tracking-wider text-[11px]">Important Health Disclaimer</p>
              <p className="leading-relaxed opacity-90">{analysis.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;