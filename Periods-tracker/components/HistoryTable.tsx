import React from 'react';
import { PeriodLog } from '../types';
import { Droplet, Thermometer, Info, AlertCircle, Trash2 } from 'lucide-react'; // Trash2 Added

interface Props {
  logs: PeriodLog[];
  onDelete: (id: string) => void; // Added onDelete prop
}

const HistoryTable: React.FC<Props> = ({ logs, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Menstrual Cycle History</h2>
        <div className="text-sm text-slate-400">{logs.length} entries total</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Cycle Length</th>
              <th className="px-6 py-4">Flow</th>
              <th className="px-6 py-4">Pain</th>
              <th className="px-6 py-4">Symptoms</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No cycles recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className={`hover:bg-slate-50 transition-colors group ${log.isMissed ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{new Date(log.startDate).toLocaleDateString()}</div>
                    {log.isMissed ? (
                      <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-tight">
                        <AlertCircle size={10} /> Missed Period
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">Duration: {log.duration} days</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold">{log.cycleLength} days</span>
                  </td>
                  <td className="px-6 py-4">
                    {!log.isMissed ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.flowIntensity === 'Heavy' ? 'bg-red-50 text-red-600' :
                        log.flowIntensity === 'Normal' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        <Droplet size={12} />
                        {log.flowIntensity}
                      </span>
                    ) : ( <span className="text-slate-300">—</span> )}
                  </td>
                  <td className="px-6 py-4">
                    {!log.isMissed ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.painLevel === 'High' ? 'bg-purple-50 text-purple-600' :
                        log.painLevel === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'
                      }`}>
                        <Thermometer size={12} />
                        {log.painLevel}
                      </span>
                    ) : ( <span className="text-slate-300">—</span> )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {log.symptoms.length > 0 ? (
                        <>
                          {log.symptoms.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">{s}</span>
                          ))}
                          {log.symptoms.length > 3 && <span className="text-[10px] text-slate-400">+{log.symptoms.length - 3}</span>}
                        </>
                      ) : (
                        <span className="text-slate-300 text-xs">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                      <Info size={18} />
                    </button>
                    
                    <button 
                      onClick={() => onDelete(log.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;