import React, { useState } from 'react';
import { PeriodLog, FlowIntensity, PainLevel } from '../types';
import { X, Check, AlertCircle, Baby } from 'lucide-react';

interface Props {
  initialAge: number;
  onAdd: (log: Omit<PeriodLog, 'id' | 'cycleLength'>, age: number) => void;
  onClose: () => void;
}

const SYMPTOMS = ['Fatigue', 'Cramps', 'Headache', 'Mood Swings', 'Acne', 'Weight Change', 'Nausea'];

const LogForm: React.FC<Props> = ({ initialAge, onAdd, onClose }) => {
  const [age, setAge] = useState(initialAge);
  
  // Get today's date string for validation (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [intensity, setIntensity] = useState<FlowIntensity>('Normal');
  const [pain, setPain] = useState<PainLevel>('Low');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isMissed, setIsMissed] = useState(false);
  
  const [isPregnant, setIsPregnant] = useState(false); 
  const [notes, setNotes] = useState('');

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    //  VALIDATION: CHECK FUTURE DATE
    if (new Date(startDate) > new Date() || new Date(endDate) > new Date()) {
        alert("⚠️ You cannot log a period for a future date.");
        return;
    }

    const duration = (isMissed || isPregnant) ? 0 : Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    onAdd({
      startDate,
      endDate: (isMissed || isPregnant) ? startDate : endDate,
      duration,
      flowIntensity: (isMissed || isPregnant) ? ('None' as any) : intensity, 
      painLevel: (isMissed || isPregnant) ? ('None' as any) : pain,
      symptoms: selectedSymptoms,
      isMissed,
      // @ts-ignore 
      isPregnant, 
      notes
    }, age);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Log Period Cycle</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Pregnancy Status Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pregnancy Status</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setIsPregnant(true); setIsMissed(true); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${
                  isPregnant 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Baby size={18} /> Pregnant
              </button>
              <button
                type="button"
                onClick={() => setIsPregnant(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${
                  !isPregnant 
                  ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Non-Pregnant
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Current Age</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
                placeholder="Years"
              />
            </div>
            <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={isPregnant} 
                  onClick={() => setIsMissed(!isMissed)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${
                    isMissed 
                    ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500/10' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  } ${isPregnant ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <AlertCircle size={16} />
                  {isMissed ? 'Missed Cycle' : 'Normal Cycle'}
                </button>
            </div>
          </div>

          {/* Dates - Added max={today} to prevent future dates */}
          <div className={`grid grid-cols-2 gap-4 transition-all ${(isMissed || isPregnant) ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                max={today} // Blocks future dates in UI
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">End Date</label>
              <input 
                type="date" 
                max={today} // Blocks future dates in UI
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" 
              />
            </div>
          </div>

          {!(isMissed || isPregnant) && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Flow Intensity</label>
                <div className="flex gap-2">
                  {(['Light', 'Normal', 'Heavy'] as FlowIntensity[]).map((level) => (
                    <button key={level} type="button" onClick={() => setIntensity(level)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${intensity === level ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Pain Level</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as PainLevel[]).map((level) => (
                    <button key={level} type="button" onClick={() => setPain(level)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${pain === level ? 'bg-orange-50 border-orange-200 text-orange-600 ring-2 ring-orange-500/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Symptoms Observed</label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSymptom(s)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${selectedSymptoms.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isPregnant ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' :
                isMissed ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
              }`}
            >
              <Check size={20} />
              {isPregnant ? 'Log Pregnancy Status' : (isMissed ? 'Record Missed Period' : 'Save Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogForm;