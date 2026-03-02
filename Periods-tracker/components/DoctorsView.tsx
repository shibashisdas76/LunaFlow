import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Hospital, Stethoscope, AlertCircle, Phone } from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  address: string;
  type: string;
}

const DoctorsView: React.FC<{ userLocation: string }> = ({ userLocation }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
     // 1. Extract Lat/Long from Location
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${userLocation || 'India'}&limit=1`);
      const geoData = await geoRes.json();

      if (geoData && geoData.length > 0) {
        const { lat, lon } = geoData[0];

        
        const query = `
          [out:json];
          (
            node["healthcare:speciality"~"gynecology|obstetrics"](around:10000,${lat},${lon});
            node["name"~"Maternity|Women|Nursing Home|Hospital|Clinic",i](around:10000,${lat},${lon});
            node["amenity"="hospital"](around:5000,${lat},${lon});
          );
          out body 10;
        `;
        
        const docRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const docData = await docRes.json();

        // 3. Removing duplicates and sorting data
        const uniqueDocs = new Map();
        docData.elements.forEach((el: any) => {
          if (!uniqueDocs.has(el.id)) {
            let type = 'General Hospital';
            const name = el.tags.name || '';
            
            if (name.match(/Maternity|Women/i) || el.tags['healthcare:speciality'] === 'gynecology') {
              type = 'Gynecology & Maternity';
            } else if (el.tags.amenity === 'clinic') {
              type = 'Clinic';
            }

            uniqueDocs.set(el.id, {
              id: el.id,
              name: el.tags.name || "Medical Health Center",
              address: el.tags["addr:full"] || el.tags["addr:city"] || "Tap 'View Map' for location",
              type: type
            });
          }
        });

        setDoctors(Array.from(uniqueDocs.values()).slice(0, 9)); // সর্বোচ্চ ৯টি রেজাল্ট
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [userLocation]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Nearby Medical Centers</h3>
          <p className="text-slate-400 text-sm flex items-center gap-1">
            <MapPin size={12} /> Finding care near {userLocation || "your location"}
          </p>
        </div>
        <button onClick={fetchDoctors} className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all text-sm shadow-lg shadow-rose-200">
          Scan Area Again
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-3xl border border-dashed border-rose-200">
          <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
          <p className="text-slate-500 font-medium">Locating nearest specialists...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle size={32} />
          </div>
          <h4 className="font-bold text-slate-700">No Online Records Found Nearby</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">OpenStreetMap data might be limited in this specific area.</p>
          
          <a 
            href={`https://www.google.com/maps/search/gynecologist+near+${encodeURIComponent(userLocation)}`} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
          >
            <Navigation size={16} /> Search Directly on Google Maps
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-rose-400">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  {doc.type.includes('Hospital') ? <Hospital size={24} /> : <Stethoscope size={24} />}
                </div>
                {doc.type.includes('Gynecology') && (
                  <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg uppercase tracking-wider">Recommended</span>
                )}
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1 truncate">{doc.name}</h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-3">{doc.type}</p>
              
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.name + " " + userLocation)}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all w-full shadow-md"
              >
                <Navigation size={14} /> View on Map
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="bg-indigo-900 text-white p-6 rounded-3xl flex items-center gap-4 shadow-xl">
         <div className="p-3 bg-white/10 rounded-2xl">
            <Phone size={24} className="text-rose-400" />
         </div>
         <div>
            <h4 className="font-bold text-lg">Medical Emergency?</h4>
            <p className="text-xs text-indigo-200 mt-1">If you are in pain or need urgent help, dial 102 (Ambulance) or 108 immediately.</p>
         </div>
      </div>
    </div>
  );
};

export default DoctorsView;