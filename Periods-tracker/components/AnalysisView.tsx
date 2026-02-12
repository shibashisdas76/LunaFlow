import React, { useState } from 'react';
import { PeriodLog, AnalysisResult, UserProfile } from '../types';
import { analyzeHealthRisks } from '../services/gemini';
import { Sparkles, AlertTriangle, ShieldCheck, Utensils, Zap, Loader2, Flower2, Apple, CheckCircle2, MapPin, Brain } from 'lucide-react'; // Brain আইকন যোগ করা হয়েছে

interface Props {
  logs: PeriodLog[];
  profile: UserProfile;
}

const AnalysisView: React.FC<Props> = ({ logs, profile }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //New condition: Check at least two records
  const isAnalysisGranted = logs.length >= 2;

  const performAnalysis = async () => {
    if (logs.length < 2) {
      setError("Please add at least 2 period logs for a pattern analysis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeHealthRisks(logs, profile.age, profile.location);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze health data. Please check your API connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Moderate': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-teal-600 bg-teal-50 border-teal-100';
    }
  };

 // 1. If there are less than 2 records, this screen will be displayed 
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

  //2. If there are 2 or more records, the previous code below will work
  return (
    <div className="space-y-8 pb-10">
      {!analysis && !loading && (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500">
            <Sparkles size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Holistic Health Analysis</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            Our AI generates a complete wellness profile based on your cycle, symptoms, and location for a truly personalized experience.
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
          <h2 className="text-xl font-bold mb-2">Crafting your plan...</h2>
          <p className="text-slate-400">Personalizing diet & yoga routines based on your {profile.location ? 'regional' : 'health'} data</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Score Card */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                <circle cx="64" cy="64" r="58" stroke="white" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * analysis.overallHealthScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute text-3xl font-bold">{analysis.overallHealthScore}%</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">Cycle Vitality Score</h2>
              <p className="text-indigo-50 leading-relaxed text-lg opacity-90">{analysis.summary}</p>
              {profile.location && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-white/70 text-sm">
                  <MapPin size={14} />
                  Based on diet availability in {profile.location}
                </div>
              )}
            </div>
            <button onClick={() => setAnalysis(null)} className="text-white bg-white/10 hover:bg-white/20 text-sm font-bold border border-white/20 rounded-xl px-6 py-2.5 transition-all">
              Update Data
            </button>
          </div>

          {/* Risks and Alerts Section */}
          <section>
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 px-2">
              <ShieldCheck className="text-indigo-500" /> Health Risk Awareness
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Utensils className="text-orange-500" /> Regional Diet Chart
                  </h3>
                  {profile.location && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{profile.location} Focus</span>}
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
                  Tip: These suggestions take into account locally available ingredients common in your region.
                </div>
              </div>
            </div>
          </section>

          {/* Footer Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4 text-amber-800 text-sm shadow-sm shadow-amber-100">
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