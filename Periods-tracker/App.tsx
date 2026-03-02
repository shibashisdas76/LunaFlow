import React, { useState, useEffect } from 'react';
import { PeriodLog, UserProfile, User } from './types';
import { api } from './services/api'; 
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import AnalysisView from './components/AnalysisView';
import HistoryTable from './components/HistoryTable';
import TutorialsView from './components/TutorialsView'; 
import DoctorsView from './components/DoctorsView'; // ✅ Doctors Feature
import Auth from './components/Auth';
import { Heart, History, ShieldAlert, Plus, LayoutDashboard, LogOut, User as UserIcon, MapPin, Search, Loader2, Trash2, BellRing, CalendarCheck, Video, Stethoscope, Sparkles, ArrowRight, Info, Activity, Zap, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ age: 25, averageCycleLength: 28, location: '' });
  
  //Removed 'account' from the allowed tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analysis' | 'tutorials' | 'doctors'>('dashboard'); 
  
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  //  LOCATION STATES
  const [isLocating, setIsLocating] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  // OVERVIEW & ALERTS
  const [showOverview, setShowOverview] = useState(false);
  const [showCycleAlarm, setShowCycleAlarm] = useState(false);
  const [showMonthlyReminder, setShowMonthlyReminder] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('lunaflow_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
    setIsInitialLoad(false);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const hasSeen = localStorage.getItem(`overview_seen_${user.id}`);
    if (!hasSeen) {
      setTimeout(() => setShowOverview(true), 800);
    }
  };

  const closeOverview = () => {
    if (currentUser) {
      localStorage.setItem(`overview_seen_${currentUser.id}`, 'true');
      setShowOverview(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          const data = await api.getUserData(currentUser.id);
          const formattedLogs = data.logs.map((l: any) => ({ ...l, id: l._id }));
          setLogs(formattedLogs);
          if (data.profile) {
            setProfile(data.profile);
            setLocationInput(data.profile.location || '');
          }
        } catch (error) {
          console.error("Failed to load data", error);
        }
      }
    };
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (logs.length > 0 && profile.averageCycleLength) {
      const lastPeriodDate = new Date(logs[0].startDate);
      const nextPeriodDate = new Date(lastPeriodDate);
      nextPeriodDate.setDate(lastPeriodDate.getDate() + profile.averageCycleLength);
      
      const today = new Date();
      const diffTime = nextPeriodDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays >= 0) {
        if (!showCycleAlarm) { 
            setShowCycleAlarm(true);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5; 
            audio.play().catch(e => console.log("Audio blocked:", e));
        }
      } else {
        setShowCycleAlarm(false);
      }
    }
    const today = new Date();
    if (today.getDate() <= 3) setShowMonthlyReminder(true); else setShowMonthlyReminder(false);
  }, [logs, profile]);

  const handleLogout = () => {
    localStorage.removeItem('lunaflow_session');
    setCurrentUser(null);
    setLogs([]);
    setProfile({ age: 25, averageCycleLength: 28, location: '' });
    setActiveTab('dashboard');
    setShowOverview(false);
  };

  //LOCATION LOGIC
  const detectLocation = () => { 
    if (!currentUser) return; 
    setIsLocating(true); 
    navigator.geolocation.getCurrentPosition( 
      async (position) => { 
        const { latitude, longitude } = position.coords; 
        try { 
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`); 
          const data = await response.json(); 
          const city = data.address.city || data.address.town || data.address.state || 'Unknown'; 
          const country = data.address.country || ''; 
          const locationString = `${city}, ${country}`; 
          setLocationInput(locationString); 
          await updateManualLocation(locationString); 
        } catch (error) { 
          console.error("Geocoding failed", error); 
        } finally { 
          setIsLocating(false); 
        } 
      }, 
      () => { 
        setIsLocating(false); 
        alert("Location access denied."); 
      } 
    ); 
  };

  const updateManualLocation = async (loc?: string) => { 
    if (!currentUser) return; 
    const finalLocation = loc || locationInput; 
    const updatedProfile = { ...profile, location: finalLocation }; 
    setProfile(updatedProfile); 
    try { 
      await api.updateProfile(currentUser.id, updatedProfile); 
      if(!loc) alert("Location updated successfully!"); 
    } catch (err) { 
      console.error(err); 
    } 
  };

  const handleAddLog = async (newLog: Omit<PeriodLog, 'id' | 'cycleLength'>, age: number) => { if (!currentUser) return; try { const response = await api.addLog(currentUser.id, newLog, age); const formattedLogs = response.logs.map((l: any) => ({ ...l, id: l._id })); setLogs(formattedLogs); setProfile(prev => ({ ...prev, ...response.profile })); setIsLogFormOpen(false); } catch (error) { console.error("Failed to save log", error); } };
  const handleDeleteLog = async (logId: string) => { if (!currentUser || !window.confirm("Are you sure?")) return; try { const response = await api.deleteLog(logId, currentUser.id); const formattedLogs = response.logs.map((l: any) => ({ ...l, id: l._id })); setLogs(formattedLogs); setProfile(prev => ({ ...prev, averageCycleLength: response.profile.averageCycleLength })); } catch (error) { console.error("Failed to delete", error); } };
  const handleResetData = async () => { if (!currentUser || !window.confirm("WARNING: All data will be deleted.")) return; try { await api.resetData(currentUser.id); setLogs([]); setProfile({ ...profile, averageCycleLength: 28 }); } catch (error) { console.error("Failed to reset", error); } };

  if (isInitialLoad) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-pulse w-12 h-12 bg-rose-500 rounded-xl" /></div>;
  if (!currentUser) return <Auth onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fff5f5] relative overflow-hidden">
      
      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-200/30 rounded-full blur-[150px] animate-bounce" style={{ animationDuration: '15s' }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute bg-rose-400/10 rounded-full blur-md" style={{ width: `${Math.random() * 150 + 50}px`, height: `${Math.random() * 150 + 50}px`, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `floatAround ${Math.random() * 20 + 10}s infinite linear` }} />
        ))}
      </div>
      <style>{` @keyframes floatAround { 0% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(30px, -50px) rotate(120deg); } 66% { transform: translate(-20px, 20px) rotate(240deg); } 100% { transform: translate(0, 0) rotate(360deg); } } `}</style>

      
      {showOverview && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row border-4 border-white/50">
             
             {/* Left Banner */}
             <div className="w-full md:w-2/5 bg-gradient-to-br from-rose-500 to-orange-400 p-10 flex flex-col justify-between text-white relative">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <h1 className="text-4xl font-black leading-tight mb-4">Welcome to <br/>LunaFlow</h1>
                  <p className="text-rose-100 font-medium text-lg leading-relaxed">
                    WHEN DATA BECOME MORE UNDERSTANDABLE, AWARENESS BECOME MORE POWERFUL
                  </p>
                </div>
                <div className="relative z-10 mt-8">
                  <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-2 rounded-full">
                    <Info size={16} /> Version 2.0.1
                  </div>
                </div>
             </div>


             <div className="w-full md:w-3/5 p-8 md:p-12 bg-white flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <Sparkles className="text-rose-500" size={24}/> Core Features
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                   {/* Feature 1 */}
                   <div className="group p-5 rounded-3xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 hover:shadow-lg transition-all cursor-default">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Activity size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Smart Tracking</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Log periods & track flow intensity.
                      </p>
                   </div>

                   {/* Feature 2 */}
                   <div className="group p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 hover:shadow-lg transition-all cursor-default">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Stethoscope size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Find Doctors</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Locate Specialists within 15km.
                      </p>
                   </div>

                   {/* Feature 3 */}
                   <div className="group p-5 rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 hover:shadow-lg transition-all cursor-default">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-500 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">AI Analysis</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Real-time health status alerts.
                      </p>
                   </div>

                   {/* Feature 4 */}
                   <div className="group p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 hover:shadow-lg transition-all cursor-default">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Tutorials</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Curated health & yoga videos.
                      </p>
                   </div>
                </div>

                <button 
                  onClick={closeOverview} 
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started <ArrowRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <nav className={`relative z-10 w-full lg:w-72 bg-white/60 backdrop-blur-xl border-b lg:border-r border-rose-100 lg:h-screen sticky top-0 p-6 flex flex-col shadow-xl transition-opacity duration-500 ${showOverview ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200"><Heart size={24} fill="white" /></div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">LunaFlow</h1>
        </div>
        <div className="space-y-2 flex-1">
          {/*Colorful Overview Button*/}
          <button 
            onClick={() => setShowOverview(true)} 
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-rose-400 to-orange-400 shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-[1.02] transition-all mb-4"
          >
            <Sparkles size={20} /> App Overview
          </button>

          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-rose-50'}`}><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-rose-50'}`}><History size={20} /> My Records</button>
          <button onClick={() => setActiveTab('analysis')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'analysis' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-rose-50'}`}><ShieldAlert size={20} /> AI Analysis</button>
          <button onClick={() => setActiveTab('doctors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'doctors' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-rose-50'}`}><Stethoscope size={20} /> Find Doctors 🏥</button>
          <button onClick={() => setActiveTab('tutorials')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'tutorials' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-rose-50'}`}><Video size={20} /> Tutorials 📺</button>
        </div>
        
        {/* USER INFO & LOCATION (No Account Link)*/}
        <div className="mt-auto pt-6 border-t border-rose-100 space-y-4">
          <div className="px-4 py-3 bg-white/50 rounded-2xl border border-rose-50 space-y-3 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-500"><UserIcon size={16} /></div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">{profile.age} years old</div>
              </div>
            </div>
            
            {/* Location Section */}
            <div className="space-y-2">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1"><MapPin size={10} /> Location Insights</div>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  placeholder="Enter City" 
                  value={locationInput} 
                  onChange={(e) => setLocationInput(e.target.value)} 
                  className="bg-white border border-rose-100 rounded-lg px-2 py-1 text-[10px] flex-1 focus:ring-1 focus:ring-rose-500 focus:outline-none" 
                />
                <button onClick={() => updateManualLocation()} className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all"><Search size={10} /></button>
              </div>
              <button 
                onClick={detectLocation} 
                disabled={isLocating} 
                className="w-full text-[10px] font-bold text-rose-600 flex items-center justify-center gap-1 py-1.5 border border-rose-200 rounded-lg bg-rose-50 hover:bg-rose-100 transition-all disabled:opacity-50"
              >
                {isLocating ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />}
                {isLocating ? 'Locating...' : 'Detect Auto'}
              </button>
            </div>
          </div>
          
          <button onClick={handleResetData} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={20} /> Reset Data</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <main className={`relative z-10 flex-1 p-4 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full transition-opacity duration-500 ${showOverview ? 'opacity-0' : 'opacity-100'}`}>
      <header className="flex items-center gap-8 mb-10"> 
  <div>
    <h2 className="text-4xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
    <div className="flex items-center gap-2 mt-2">
      <p className="text-slate-500 font-medium">Monitoring health for {currentUser.name.split(' ')[0]}</p>
      {profile.location && (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-rose-100 shadow-sm"><MapPin size={12} /> {profile.location}</span>)}
    </div>
  </div>
  
 <button 
  onClick={() => setIsLogFormOpen(true)} 
  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-8 py-4 rounded-3xl font-bold hover:opacity-90 transition-all shadow-2xl hover:scale-105 active:scale-95"
>
  <Plus size={22} /> Log Period
</button>
</header>

        {/* Alerts */}
        <div className="space-y-4 mb-8">
          {showCycleAlarm && (
            <div className="bg-white/80 backdrop-blur-md border border-rose-200 p-5 rounded-3xl flex items-center gap-5 shadow-xl animate-in slide-in-from-top-4">
              <div className="bg-rose-500 text-white p-3.5 rounded-2xl shadow-lg animate-bounce"><BellRing size={24} /></div>
              <div><h4 className="font-bold text-rose-900">Cycle Warning</h4><p className="text-sm text-rose-600">Predicted start within 72 hours.</p></div>
            </div>
          )}
        </div>

        {/* Content Tabs (No AccountView) */}
        <div className="relative z-20">
          {activeTab === 'dashboard' && <Dashboard logs={logs} profile={profile} />}
          {activeTab === 'history' && <HistoryTable logs={logs} onDelete={handleDeleteLog} />}
          {activeTab === 'analysis' && <AnalysisView logs={logs} profile={profile} />}
          {activeTab === 'tutorials' && <TutorialsView />}
          {activeTab === 'doctors' && <DoctorsView userLocation={profile.location || 'India'} />}
        </div>

        <button onClick={() => setIsLogFormOpen(true)} className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-rose-500 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"><Plus size={36} /></button>
        {isLogFormOpen && <LogForm initialAge={profile.age} onAdd={handleAddLog} onClose={() => setIsLogFormOpen(false)} />}
      </main>
    </div>
  );
};
export default App;