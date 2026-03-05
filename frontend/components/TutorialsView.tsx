// export default TutorialsView;
import React, { useState } from 'react';
import { PlayCircle, HeartPulse, Apple, Sparkles, BookOpen, Globe } from 'lucide-react';

// Categories for our filtering tabs
type Category = 'All' | 'Pain Relief' | 'Diet & Nutrition' | 'Hygiene';
// NEW: Languages for our filtering
type Language = 'English' | 'Bengali' | 'Hindi';

// Curated list of educational videos (Updated with Languages)
const TUTORIAL_VIDEOS = [
  // --- ENGLISH VIDEOS (Your Original Videos) ---
  {
    id: '1',
    title: '5 Yoga Poses for Severe Menstrual Cramps',
    category: 'Pain Relief',
    embedId: 'v7AYKMP6rOE', 
    duration: '23mins 45sec',
    description: 'Gentle stretches to relieve lower back pain and pelvic cramps.',
    language: 'English'
  },
  {
    id: '2',
    title: 'Foods to Eat & Avoid During Your Period',
    category: 'Diet & Nutrition',
    embedId: 'E-8gvJlkY8c',
    duration: '2mins 32sec',
    description: 'Learn which nutrients help reduce bloating and mood swings.',
    language: 'English'
  },
  {
    id: '3',
    title: 'Complete Guide to Menstrual Hygiene',
    category: 'Hygiene', // Fixed the typo here
    embedId: 'QXK6l9RSJ80',
    duration: '15 mins',
    description: 'Best practices for using pads, tampons, and menstrual cups safely.',
    language: 'English'
  },
  {
    id: '4',
    title: 'Home Remedies for Period Pain',
    category: 'Pain Relief',
    embedId: 'LIsYbDCMfDc',
    duration: '2mins 32sec',
    description: 'Natural ways to soothe cramps using heat pads and herbal teas.',
    language: 'English'
  },

  // --- BENGALI VIDEOS (New) ---
  {
    id: '5',
    title: 'পিরিয়ডের ব্যথা কমানোর সহজ যোগব্যায়াম',
    category: 'Pain Relief',
    embedId: 'v7AYKMP6rOE', // Using same ID for demo, you can change later
    duration: '10 mins',
    description: 'মাসিকের প্রচণ্ড ব্যথা এবং কোমর ব্যথা থেকে মুক্তি পেতে কিছু সহজ যোগব্যায়াম।',
    language: 'Bengali'
  },
  {
    id: '6',
    title: 'পিরিয়ড চলাকালীন সঠিক খাবার ও পুষ্টি',
    category: 'Diet & Nutrition',
    embedId: 'E-8gvJlkY8c',
    duration: '5 mins',
    description: 'এই সময়ে কী খাবেন এবং কী এড়িয়ে চলবেন তার বিস্তারিত গাইড।',
    language: 'Bengali'
  },
  {
    id: '7',
    title: 'মেন্সট্রুয়াল হাইজিন এবং প্যাড ব্যবহারের সঠিক নিয়ম',
    category: 'Hygiene',
    embedId: 'j8eB-tI_D9c',
    duration: '8 mins',
    description: 'ইনফেকশন থেকে বাঁচতে সঠিক পরিচ্ছন্নতা বজায় রাখার গুরুত্বপূর্ণ টিপস।',
    language: 'Bengali'
  },

  // --- HINDI VIDEOS (New) ---
  {
    id: '8',
    title: 'पीरियड्स के दर्द से राहत के लिए 5 योगासन',
    category: 'Pain Relief',
    embedId: 'v7AYKMP6rOE',
    duration: '12 mins',
    description: 'मासिक धर्म के दर्द और ऐंठन को कम करने के लिए आसान योगासन।',
    language: 'Hindi'
  },
  {
    id: '9',
    title: 'पीरियड्स के दौरान क्या खाएं और क्या नहीं',
    category: 'Diet & Nutrition',
    embedId: 'E-8gvJlkY8c',
    duration: '6 mins',
    description: 'स्वस्थ रहने के लिए सही आहार और पोषण की जानकारी।',
    language: 'Hindi'
  }
];

const TutorialsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>('All');
  const [activeLanguage, setActiveLanguage] = useState<Language>('English'); // NEW: State for Language

  // Filter videos based on BOTH the selected tab AND the selected language
  const filteredVideos = TUTORIAL_VIDEOS.filter(video => 
    (activeTab === 'All' ? true : video.category === activeTab) && 
    (video.language === activeLanguage)
  );

  const tabs: { name: Category; icon: React.ReactNode }[] = [
    { name: 'All', icon: <BookOpen size={16} /> },
    { name: 'Pain Relief', icon: <HeartPulse size={16} /> },
    { name: 'Diet & Nutrition', icon: <Apple size={16} /> },
    { name: 'Hygiene', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[75vh] flex flex-col animate-in fade-in zoom-in duration-300">
      
      {/* Header Section */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
        
        {/* Title and Language Selector Flexbox */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <PlayCircle className="text-indigo-500" size={28} />
            Wellness Hub
          </h2>

          {/* NEW: Language Selector */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <Globe size={16} className="text-slate-400 ml-2 mr-1" />
            {(['English', 'Bengali', 'Hindi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeLanguage === lang
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <p className="text-slate-500">Curated video guides for your menstrual health and daily comfort.</p>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === tab.name 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-8 flex-1 bg-slate-50/30 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              
              {/* YouTube iFrame Embed */}
              <div className="aspect-video w-full bg-slate-900 relative">
                <iframe
                  src={`https://www.youtube.com/embed/${video.embedId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full border-0"
                ></iframe>
              </div>

              {/* Video Details */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                    {video.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {video.duration}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p className="font-medium">No videos found for this category and language.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialsView;