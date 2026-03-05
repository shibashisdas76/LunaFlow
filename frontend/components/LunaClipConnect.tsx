import React, { useState } from 'react';
import { Bluetooth, AlertCircle, CheckCircle2 } from 'lucide-react';

// The exact UUIDs from your Arduino code
const LUNA_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const LUNA_CHAR_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";

const LunaClipConnect = ({ onDataReceived }: { onDataReceived?: (hb: number) => void }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hbValue, setHbValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const connectToDevice = async () => {
    try {
      setStatus('connecting');
      setError(null);

      // 1. Ask the browser to find ANY Bluetooth device (Great for debugging!)
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true, // <-- THE FIX: Show all devices instead of filtering by name
        optionalServices: [LUNA_SERVICE_UUID]
      });

      // 2. Connect to the device
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Could not connect to LunaClip.");

      // 3. Find the specific data channel
      const service = await server.getPrimaryService(LUNA_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(LUNA_CHAR_UUID);

      // 4. Start listening for the Hemoglobin readings
      await characteristic.startNotifications();
      setStatus('connected');

      // 5. When the ESP32 sends data, update the React UI!
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = new TextDecoder().decode(event.target.value);
        // Use parseFloat because Hemoglobin has decimals (e.g., 12.5)
        const currentHb = parseFloat(value); 
        
        if (currentHb > 0) {
            setHbValue(currentHb);
            if (onDataReceived) onDataReceived(currentHb);
        }
      });

      // Handle accidental disconnects
      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setHbValue(0);
      });

    } catch (err: any) {
      console.error(err);
      setStatus('disconnected');
      if (err.message.includes("User cancelled")) {
        setError("Pairing cancelled. Please try again.");
      } else {
        setError("Bluetooth connection failed. Make sure your PC's Bluetooth is ON.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${status === 'connected' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
        <Bluetooth size={32} className={status === 'connecting' ? 'animate-pulse' : ''} />
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-1">LunaClip Hardware</h3>
      <p className="text-xs text-slate-500 mb-6">Live Anemia & Hemoglobin Tracker</p>

      {status === 'connected' ? (
        <div className="flex flex-col items-center animate-in zoom-in duration-200">
          <div className="text-5xl font-black text-rose-500 flex items-end gap-2 mb-2">
            {hbValue} <span className="text-lg text-slate-400 font-medium mb-1">g/dL</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} /> Connected
          </div>
        </div>
      ) : (
        <button 
          onClick={connectToDevice}
          disabled={status === 'connecting'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {status === 'connecting' ? 'Pairing...' : 'Pair Device'}
        </button>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 text-xs text-rose-500 bg-rose-50 p-3 rounded-lg text-left animate-in fade-in">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LunaClipConnect;