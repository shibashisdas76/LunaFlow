import React from 'react';
import { PeriodLog, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Calendar, Activity, AlertCircle, TrendingUp, Droplet, ArrowRight } from 'lucide-react';

interface Props {
  logs: PeriodLog[];
  profile: UserProfile;
}

const Dashboard: React.FC<Props> = ({ logs, profile }) => {
  // 1. Sort logs by date (Newest First) for calculations
  const sortedLogsDesc = [...logs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  // 2. Sort logs by date (Oldest First) for charts
  const sortedLogsAsc = [...logs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const lastLog = sortedLogsDesc[0];

  //  LOGIC 1: CALCULATE REAL AVERAGE CYCLE LENGTH
  const getAverageCycle = () => {
    if (sortedLogsDesc.length < 2) return profile.averageCycleLength || 28;
    
    // Calculate difference between the newest and oldest log, divided by number of cycles
    const newest = new Date(sortedLogsDesc[0].startDate).getTime();
    const oldest = new Date(sortedLogsDesc[sortedLogsDesc.length - 1].startDate).getTime();
    const cycleCount = sortedLogsDesc.length - 1;
    
    const diffDays = (newest - oldest) / (1000 * 60 * 60 * 24);
    return Math.round(diffDays / cycleCount);
  };

  const calculatedAvgCycle = getAverageCycle();

  //  LOGIC 2: NEXT PERIOD PREDICTION 
  const getNextPeriodStatus = () => {
    if (!lastLog) return { text: 'No data yet', subtext: 'Log your first period' };
    
    const lastDate = new Date(lastLog.startDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + calculatedAvgCycle); // Use calculated average
    
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Expected Today', subtext: 'Get ready!' };
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days late`, subtext: 'Cycle might be irregular' };
    return { text: `In ${diffDays} days`, subtext: `Predicted: ${nextDate.toLocaleDateString()}` };
  };

  const status = getNextPeriodStatus();

  //  LOGIC 3: TYPICAL FLOW LEVEL (MODE) 
  const getTypicalFlow = () => {
    if (logs.length === 0) return 'None';
    
    const counts: Record<string, number> = { Light: 0, Normal: 0, Heavy: 0 };
    logs.forEach(l => {
      if (l.flowIntensity && counts[l.flowIntensity] !== undefined) {
        counts[l.flowIntensity]++;
      }
    });

    // Find the flow with the highest count
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) || 'Normal';
  };

  // LOGIC 4: HEALTH STATUS CALCULATION 
  const getHealthStatus = () => {
    if (logs.length === 0) return { status: 'No Data', msg: 'Start logging to track' };
    
    // Check 1: Is the current period significantly late? (>7 days)
    if (status.text.includes('late') && parseInt(status.text) > 7) {
      return { status: 'Check-up', msg: 'Cycle is significantly late' };
    }

    // Check 2: Was the last period extremely painful?
    if (lastLog?.painLevel === 'High') {
      return { status: 'Monitor', msg: 'High pain reported recently' };
    }

    // Check 3: Variation in recent cycle lengths (Irregularity)
    if (sortedLogsDesc.length >= 3) {
        const c1 = (new Date(sortedLogsDesc[0].startDate).getTime() - new Date(sortedLogsDesc[1].startDate).getTime()) / (86400000);
        const c2 = (new Date(sortedLogsDesc[1].startDate).getTime() - new Date(sortedLogsDesc[2].startDate).getTime()) / (86400000);
        if (Math.abs(c1 - c2) > 5) {
            return { status: 'Irregular', msg: 'High variation in cycles' };
        }
    }

    return { status: 'Stable', msg: 'Cycle appears healthy' };
  };

  const health = getHealthStatus();

  // CHART DATA PREPARATION
  const chartData = sortedLogsAsc.map((log, index) => {
    let currentCycle = 0;
    if (index > 0) {
        const prevDate = new Date(sortedLogsAsc[index - 1].startDate);
        const currDate = new Date(log.startDate);
        currentCycle = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return {
      date: new Date(log.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cycle: currentCycle || calculatedAvgCycle, // Fallback to avg if it's the first log
      duration: log.duration
    };
  });

  // Filter out missed periods for Flow Chart
  const flowData = [
    { name: 'Light', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Light').length },
    { name: 'Normal', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Normal').length },
    { name: 'Heavy', value: logs.filter(l => !l.isMissed && l.flowIntensity === 'Heavy').length },
  ];

  const COLORS = ['#FDE68A', '#F97316', '#DC2626'];

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default Dashboard;