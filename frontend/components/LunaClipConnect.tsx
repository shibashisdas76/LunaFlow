import React, { useState } from 'react';
import { Usb, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const LunaClipConnect = ({ onDataReceived }: { onDataReceived?: (hb: number) => void }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hbValue, setHbValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hardwareLog, setHardwareLog] = useState<string>("Ready to connect via USB");

  const connectToDevice = async () => {
    try {
      setStatus('connecting');
      setError(null);
      setHardwareLog("Waiting for user to select port...");

      // 1. Request the USB port from the browser
      // @ts-ignore - Ignoring TS warning for experimental Serial API
      const port = await navigator.serial.requestPort();
      
      // 2. Open the port at 9600 baud rate (must match Arduino code)
      await port.open({ baudRate: 9600 });
      setStatus('connected');
      setHardwareLog("Connected! Please place your finger on the sensor.");

      // 3. Set up the decoder to translate raw bytes into readable text
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      // 4. Continuously listen to the stream coming over the USB cable
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        
        buffer += value;
        const lines = buffer.split('\n');
        
        // Keep the last incomplete chunk in the buffer for the next loop
        buffer = lines.pop() || ""; 

        // 5. Parse every complete line printed by the ESP32
        for (const line of lines) {
          const cleanLine = line.trim();
          
          // A. Look for our specific final Hemoglobin data signature
          if (cleanLine.startsWith("HB_RESULT:")) {
            const parsedHb = parseFloat(cleanLine.split(":")[1]);
            if (!isNaN(parsedHb)) {
              setHbValue(parsedHb);
              if (onDataReceived) onDataReceived(parsedHb);
              setHardwareLog("✅ Reading Complete! You can remove your finger.");
            }
          } 
          // B. Capture hardware status updates (loading, errors, etc)
          else if (cleanLine.includes("✅") || cleanLine.includes("❌") || cleanLine.includes("⏳") || cleanLine.includes("⚠️")) {
            setHardwareLog(cleanLine);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('disconnected');
      if (err.message.includes("No port selected") || err.message.includes("User cancelled")) {
        setError("Connection cancelled. Please select the USB port.");
      } else if (err.message.includes("Failed to open serial port")) {
        setError("Port is busy! Please close the Arduino Serial Monitor and try again.");
      } else {
        setError("USB connection failed. Ensure the device is plugged in.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center h-full justify-center space-y-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${status === 'connected' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'}`}>
        <Usb size={32} className={status === 'connecting' ? 'animate-pulse' : ''} />
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">LunaClip Hardware</h3>
        <p className="text-xs text-slate-500 mb-2">Live Anemia & Hemoglobin Tracker</p>
        
        {/* Dynamic Hardware Console Log */}
        <div className="bg-slate-50 text-[10px] font-mono text-slate-500 p-2 rounded-lg border border-slate-100 min-h-[36px] flex items-center justify-center max-w-[220px] mx-auto leading-tight">
          {hardwareLog}
        </div>
      </div>

      {status === 'connected' ? (
        <div className="flex flex-col items-center animate-in zoom-in duration-200 mt-2">
          <div className="text-5xl font-black text-rose-500 flex items-end gap-2 mb-2">
            {hbValue > 0 ? hbValue : '--.-'} <span className="text-lg text-slate-400 font-medium mb-1">g/dL</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Secure USB Link Active
          </div>
        </div>
      ) : (
        <button 
          onClick={connectToDevice}
          disabled={status === 'connecting'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 mt-2"
        >
          <Usb size={18} /> {status === 'connecting' ? 'Connecting...' : 'Connect via USB'}
        </button>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-rose-500 bg-rose-50 p-3 rounded-lg text-left animate-in fade-in max-w-[250px]">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LunaClipConnect;