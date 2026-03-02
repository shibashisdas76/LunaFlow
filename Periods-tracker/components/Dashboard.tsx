// export default Dashboard;
import React, { useState, useEffect } from 'react';
import { PeriodLog, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Calendar, Activity, AlertCircle, TrendingUp, Droplet, ArrowRight, FileText, Clock, X, ShieldCheck, Utensils, Flower2, Apple, CheckCircle2, Bluetooth } from 'lucide-react';
import { api } from '../services/api'; 
import LunaClipConnect from './LunaClipConnect'; // --- NEW: Imported LunaClip Component ---

interface Props {
  logs: PeriodLog[];
  profile: UserProfile;
}

const Dashboard: React.FC<Props> = ({ logs, profile }) => {
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  // --- NEW: State to manage the Popup (Modal) for full analysis ---
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // --- NEW: State to store live Hemoglobin data from the Bluetooth device ---
  const [liveHb, setLiveHb] = useState<number | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let userId = null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                userId = userObj._id || userObj.id;
            } catch (e) {}
        }
        if (!userId) userId = localStorage.getItem('userId');
        if (!userId && logs.length > 0) {
            // @ts-ignore
            userId = logs[0].userId;
        }

        if (userId) {
          const reports = await api.getSavedAnalyses(userId);
          setSavedReports(reports);
        }
      } catch (error) {
        console.error("Failed to fetch saved reports:", error);
      } finally {
        setLoadingReports(false);
      }
    };
    
    fetchReports();
  }, [logs]);

  const sortedLogsDesc = [...logs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const sortedLogsAsc = [...logs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const lastLog = sortedLogsDesc[0];

  const getAverageCycle = () => {
    if (sortedLogsDesc.length < 2) return profile.averageCycleLength || 28;
    const newest = new Date(sortedLogsDesc[0].startDate).getTime();
    const oldest = new Date(sortedLogsDesc[sortedLogsDesc.length - 1].startDate).getTime();
    const cycleCount = sortedLogsDesc.length - 1;
    const diffDays = (newest - oldest) / (1000 * 60 * 60 * 24);
    return Math.round(diffDays / cycleCount);
  };

  const calculatedAvgCycle = getAverageCycle();

  const getNextPeriodStatus = () => {
    if (!lastLog) return { text: 'No data yet', subtext: 'Log your first period' };
    const lastDate = new Date(lastLog.startDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + calculatedAvgCycle); 
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Expected Today', subtext: 'Get ready!' };
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days late`, subtext: 'Cycle might be irregular' };
    return { text: `In ${diffDays} days`, subtext: `Predicted: ${nextDate.toLocaleDateString()}` };
  };

  const status = getNextPeriodStatus();

  const getTypicalFlow = () => {
    if (logs.length === 0) return 'None';
    const counts: Record<string, number> = { Light: 0, Normal: 0, Heavy: 0 };
    logs.forEach(l => {
      if (l.flowIntensity && counts[l.flowIntensity] !== undefined) counts[l.flowIntensity]++;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) || 'Normal';
  };

  const getHealthStatus = () => {
    if (logs.length === 0) return { status: 'No Data', msg: 'Start logging to track' };
    if (status.text.includes('late') && parseInt(status.text) > 7) return { status: 'Check-up', msg: 'Cycle is significantly late' };
    if (lastLog?.painLevel === 'High') return { status: 'Monitor', msg: 'High pain reported recently' };
    if (sortedLogsDesc.length >= 3) {
        const c1 = (new Date(sortedLogsDesc[0].startDate).getTime() - new Date(sortedLogsDesc[1].startDate).getTime()) / (86400000);
        const c2 = (new Date(sortedLogsDesc[1].startDate).getTime() - new Date(sortedLogsDesc[2].startDate).getTime()) / (86400000);
        if (Math.abs(c1 - c2) > 5) return { status: 'Irregular', msg: 'High variation in cycles' };
    }
    return { status: 'Stable', msg: 'Cycle appears healthy' };
  };

  const health = getHealthStatus();

  const chartData = sortedLogsAsc.map((log, index) => {
    let currentCycle = 0;
    if (index > 0) {
        const prevDate = new Date(sortedLogsAsc[index - 1].startDate);
        const currDate = new Date(log.startDate);
        currentCycle = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return {
      date: new Date(log.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cycle: currentCycle || calculatedAvgCycle,
      duration: log.duration
    };
  });

  const flowData = [
    { name: 'Light', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Light').length },
    { name: 'Normal', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Normal').length },
    { name: 'Heavy', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Heavy').length },
  ];

  const COLORS = ['#FDE68A', '#F97316', '#DC2626'];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Moderate': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-teal-600 bg-teal-50 border-teal-100';
    }
  };

  return (
    <div className="space-y-6 pb-10 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NEXT PERIOD CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 text-rose-500">
            <Calendar size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Next Period</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-2xl font-bold truncate">{status.text}</div>
             {logs.length > 0 && <ArrowRight size={24} className="text-rose-500 group-hover:translate-x-1 transition-transform" />}
          </div>
          <p className="text-slate-400 text-xs mt-1">{status.subtext}</p>
        </div>

        {/* CYCLE LENGTH CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-indigo-500">
            <Activity size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Avg Cycle</span>
          </div>
          <div className="text-2xl font-bold">
            {calculatedAvgCycle} <span className="text-sm font-normal text-slate-500">days</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Based on last {logs.length} cycles</p>
        </div>

        {/* FLOW LEVEL CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-orange-500">
            <Droplet size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Typical Flow</span>
          </div>
          <div className="text-2xl font-bold">{getTypicalFlow()}</div>
          <p className="text-slate-400 text-xs mt-1">Most frequent intensity</p>
        </div>

        {/* HEALTH STATUS CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-teal-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Health Status</span>
          </div>
          <div className={`text-2xl font-bold ${health.status === 'Stable' ? 'text-teal-600' : 'text-rose-600'}`}>
            {health.status}
          </div>
          <p className="text-slate-400 text-xs mt-1">{health.msg}</p>
        </div>
      </div>

      {/* --- NEW: LUNA CLIP HARDWARE SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-1">
          {/* Passing the state setter directly to the Bluetooth component */}
          <LunaClipConnect onDataReceived={(hb) => setLiveHb(hb)} />
        </div>
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 flex flex-col justify-center shadow-sm">
          <h3 className="text-xl font-black text-indigo-900 mb-3 flex items-center gap-2">
            <Bluetooth size={20} className="text-indigo-500" /> Live Blood Vitals Sync
          </h3>
          <p className="text-sm text-indigo-700/80 leading-relaxed mb-6 font-medium max-w-2xl">
            Pair your physical LunaClip device via WebBLE. Once connected, your real-time Hemoglobin (Hb) levels will stream directly to your dashboard. This data is fed into our Machine Learning ensemble to detect hidden Anemia risks instantly.
          </p>
          
          {liveHb ? (
            <div className="flex items-center gap-4">
              <div className="px-5 py-3 bg-white rounded-2xl text-indigo-700 font-black shadow-sm text-lg flex items-center gap-2">
                <Activity size={20} className="text-rose-500" /> 
                {liveHb} <span className="text-sm font-bold text-slate-400">g/dL</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Syncing to ML Model...
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold text-indigo-400 bg-white/60 w-fit px-4 py-2 rounded-full border border-indigo-100/50">
              Waiting for Bluetooth connection...
            </div>
          )}
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-rose-500" /> Cycle Trends
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="cycle" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="duration" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Droplet size={18} className="text-blue-500" /> Flow Distribution
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {flowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SAVED REPORTS SECTION */}
      <div className="mt-8 pt-4">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
          <FileText className="text-indigo-500" /> Saved Health Reports
        </h3>

        {loadingReports ? (
          <p className="text-slate-400 text-sm flex items-center gap-2 animate-pulse">
            Fetching your reports...
          </p>
        ) : savedReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center text-slate-500 text-sm">
            You haven't saved any reports yet. Go to the <b>AI Analysis</b> tab to generate and save your first wellness plan!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedReports.map((report, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedReport(report)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full cursor-pointer transform hover:-translate-y-1"
              >
                
                {/* Date & Prediction Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Clock size={14} />
                    {new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.mlPredictionText === 'None' || report.mlPredictionText === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {report.mlPredictionText === 'None' ? 'No Risk' : report.mlPredictionText}
                  </div>
                </div>

                {/* Score & Summary */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {report.overallHealthScore || 0}%
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium group-hover:text-indigo-900 transition-colors">
                    {report.summary}
                  </p>
                </div>

                {/* Info Text */}
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-indigo-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view full analysis <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- NEW: FULL ANALYSIS MODAL (POPUP) --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <FileText className="text-indigo-500" /> Full Wellness Report
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  Generated on {new Date(selectedReport.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
              
              {/* Top Row: Score & ML */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-3xl p-8 text-white shadow-md flex flex-col justify-center">
                  <div className="flex items-center gap-6 w-full mb-4">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-4 border-white">
                         <span className="text-2xl font-bold">{selectedReport.overallHealthScore || 0}%</span>
                      </div>
                      <div>
                          <h2 className="text-xl font-bold mb-1 uppercase tracking-tight">Cycle Vitality Score</h2>
                      </div>
                  </div>
                  <p className="text-indigo-50 leading-relaxed text-sm opacity-90">{selectedReport.summary}</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl ${selectedReport.mlPredictionText === 'None' || selectedReport.mlPredictionText === 'Normal' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ML Pattern Assessment</h3>
                            <p className={`text-2xl font-black ${selectedReport.mlPredictionText === 'None' || selectedReport.mlPredictionText === 'Normal' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {selectedReport.mlPredictionText === 'None' ? 'No Risk Detected' : selectedReport.mlPredictionText}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-600 text-sm flex gap-3 items-start mt-auto">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-slate-400" />
                        <p className="leading-relaxed text-xs">{selectedReport.mlWarning}</p>
                    </div>
                </div>
              </div>

              {/* Risks Section */}
              {selectedReport.risks?.length > 0 && (
                <section>
                  <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 px-2">
                    <ShieldCheck className="text-indigo-500" /> Secondary Health Indicators
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.risks.map((risk: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-800 text-lg">{risk.condition}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getRiskColor(risk.riskLevel)}`}>
                            {risk.riskLevel}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{risk.reasoning}</p>
                        <div className="space-y-2">
                          {risk.recommendations.map((rec: string, i: number) => (
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
              )}

              {/* Diet, Yoga, and Habits Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Utensils className="text-orange-500" /> Regional Diet Chart
                    </h3>
                    <div className="space-y-4">
                      {selectedReport.wellnessPlan?.dietChart?.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-orange-50/30 border border-orange-100">
                          <div className="w-full md:w-32 font-black text-orange-600 uppercase text-xs tracking-widest pt-1">{item.meal}</div>
                          <div className="text-slate-700 text-sm leading-relaxed">{item.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Flower2 className="text-teal-500" /> Recommended Yoga Routine
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedReport.wellnessPlan?.yogaPoses?.map((pose: any, idx: number) => (
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
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Apple className="text-rose-500" /> Healthy Food Habits
                    </h3>
                    <ul className="space-y-4">
                      {selectedReport.wellnessPlan?.foodHabits?.map((habit: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-700">
                          <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 font-bold text-xs">{idx + 1}</div>
                          <span className="leading-relaxed">{habit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;