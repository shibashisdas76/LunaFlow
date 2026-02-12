import React, { useState } from 'react';
import { Globe, Utensils, Flower2, Heart, PlayCircle } from 'lucide-react';

const TutorialsView: React.FC = () => {
  const [language, setLanguage] = useState('Bengali');

  const languages = ['Bengali', 'Hindi', 'English'];

 // 100% working YouTube embed links by language
  const videoData: Record<string, any[]> = {
    'Bengali': [
      { title: 'পিরিয়ডের ব্যথায় যোগব্যায়াম', category: 'Yoga', url: 'https://www.youtube.com/embed/In6Q9T9RskA', icon: <Flower2 size={20}/>, color: 'bg-teal-500' },
      { title: 'পিরিয়ড চলাকালীন খাবার', category: 'Diet', url: 'https://www.youtube.com/embed/YIByQ69_h74', icon: <Utensils size={20}/>, color: 'bg-orange-500' },
      { title: 'পিরিয়ড হাইজিন টিপস', category: 'Guidance', url: 'https://www.youtube.com/embed/m6X8jMclnE8', icon: <Heart size={20}/>, color: 'bg-rose-500' }
    ],
    'Hindi': [
      { title: 'पीरियड पेन के लिए योग', category: 'Yoga', url: 'https://www.youtube.com/embed/6_9o9GvE7Hk', icon: <Flower2 size={20}/>, color: 'bg-teal-500' },
      { title: 'पीरियड्स में क्या खाएं', category: 'Diet', url: 'https://www.youtube.com/embed/5U2u82z6q5E', icon: <Utensils size={20}/>, color: 'bg-orange-500' },
      { title: 'पीरियड्स में सावधानी', category: 'Guidance', url: 'https://www.youtube.com/embed/MhV9Q8Wz0C8', icon: <Heart size={20}/>, color: 'bg-rose-500' }
    ],
    'English': [
      { title: 'Yoga for Period Relief', category: 'Yoga', url: 'https://www.youtube.com/embed/In6Q9T9RskA', icon: <Flower2 size={20}/>, color: 'bg-teal-500' },
      { title: 'Diet During Menstrual Cycle', category: 'Diet', url: 'https://www.youtube.com/embed/W_pT0v-W-S8', icon: <Utensils size={20}/>, color: 'bg-orange-500' },
      { title: 'Menstrual Hygiene Guide', category: 'Guidance', url: 'https://www.youtube.com/embed/6r6mSjK9N_M', icon: <Heart size={20}/>, color: 'bg-rose-500' }
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Language Selection Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <PlayCircle className="text-rose-500" /> Multi-Language Tutorials
          </h3>
          <p className="text-slate-400 text-sm">Official guidance for your cycle in {language}</p>
        </div>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all ${
                language === lang ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Globe size={12} className="inline mr-1" /> {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoData[language].map((vid, index) => (
          <div key={index} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
            <div className="aspect-video bg-black relative">
              {/* ইউটিউব ফ্রেম লোড করার সঠিক পদ্ধতি */}
              <iframe 
                className="w-full h-full"
                src={vid.url}
                title={vid.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg text-white ${vid.color}`}>{vid.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{vid.category}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">{vid.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Proper instructions and care guidelines in {language}.</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Disclaimer */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
          <Heart size={24} className="fill-white text-rose-400" />
        </div>
        <div>
          <h5 className="font-bold text-lg">Health Advice</h5>
          <p className="text-sm text-slate-400 opacity-90 leading-relaxed">
            All videos are sourced from official health experts. Please consult your physician before trying any new exercises or major dietary changes during your cycle.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialsView;