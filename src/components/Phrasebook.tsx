import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Volume2 } from 'lucide-react';
import { cn, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const Phrasebook = () => {
  const { profile, user, isDemo, setProfile } = useContext(AuthContext);
  const [activeCategory, setActiveCategory] = useState('Greetings');
  const [isAdding, setIsAdding] = useState(false);
  const [newPhrase, setNewPhrase] = useState({ jp: '', ro: '', en: '', category: 'Greetings' });
  const [customCategory, setCustomCategory] = useState('');
  const { play, loading: ttsLoading } = useTTSContext();

  const defaultCategories = {
    'Greetings': [
      { jp: "おはようございます", ro: "Ohayou gozaimasu", en: "Good morning" },
      { jp: "こんにちは", ro: "Konnichiwa", en: "Hello / Good afternoon" },
      { jp: "こんばんは", ro: "Konbanwa", en: "Good evening" },
      { jp: "おやすみなさい", ro: "Oyasumi nasai", en: "Good night" },
      { jp: "お元気ですか？", ro: "O-genki desu ka?", en: "How are you?" },
    ],
    'Travel': [
      { jp: "駅はどこですか？", ro: "Eki wa doko desu ka?", en: "Where is the station?" },
      { jp: "切符を一枚ください", ro: "Kippu o ichimai kudasai", en: "One ticket, please" },
      { jp: "いくらですか？", ro: "Ikura desu ka?", en: "How much is it?" },
      { jp: "助けてください", ro: "Tasukete kudasai", en: "Please help me" },
    ],
    'Food': [
      { jp: "メニューをください", ro: "Menyuu o kudasai", en: "Menu, please" },
      { jp: "これをお願いします", ro: "Kore o onegaishimasu", en: "This one, please" },
      { jp: "お会計をお願いします", ro: "O-kaikei o onegaishimasu", en: "The bill, please" },
      { jp: "いただきます", ro: "Itadakimasu", en: "Let's eat (Before meal)" },
      { jp: "ごちそうさまでした", ro: "Gochisousama deshita", en: "Thank you for the meal" },
    ]
  };

  const customPhrases = profile?.customPhrases || [];
  const categories = { ...defaultCategories };
  
  customPhrases.forEach(p => {
    if (!categories[p.category as keyof typeof categories]) {
      (categories as any)[p.category] = [];
    }
    (categories as any)[p.category].push(p);
  });

  const handleAddPhrase = async () => {
    if (!newPhrase.jp || !newPhrase.en) return;
    
    const category = newPhrase.category === 'Custom' ? customCategory : newPhrase.category;
    if (!category) return;

    // Duplicate check
    const isDuplicate = customPhrases.some(p => p.jp === newPhrase.jp || p.en.toLowerCase() === newPhrase.en.toLowerCase());
    if (isDuplicate) {
      alert("This phrase is already in your custom list!");
      return;
    }

    const phraseToAdd = { ...newPhrase, category };
    const updatedCustomPhrases = [...customPhrases, phraseToAdd];

    try {
      if (isDemo) {
        const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
        const updatedProfile = { ...p, customPhrases: updatedCustomPhrases };
        safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile as any);
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), { customPhrases: updatedCustomPhrases });
      }
      setIsAdding(false);
      setNewPhrase({ jp: '', ro: '', en: '', category: 'Greetings' });
      setCustomCategory('');
      setActiveCategory(category);
    } catch (error) {
      console.error("Error adding phrase:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Essential Phrasebook</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Quick access to common Japanese expressions for daily life.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Phrase
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Japanese</label>
                <input 
                  type="text" 
                  value={newPhrase.jp}
                  onChange={e => setNewPhrase({...newPhrase, jp: e.target.value})}
                  placeholder="こんにちは"
                  className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Romaji</label>
                <input 
                  type="text" 
                  value={newPhrase.ro}
                  onChange={e => setNewPhrase({...newPhrase, ro: e.target.value})}
                  placeholder="Konnichiwa"
                  className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">English</label>
                <input 
                  type="text" 
                  value={newPhrase.en}
                  onChange={e => setNewPhrase({...newPhrase, en: e.target.value})}
                  placeholder="Hello"
                  className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Category</label>
                <select 
                  value={newPhrase.category}
                  onChange={e => setNewPhrase({...newPhrase, category: e.target.value})}
                  className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-900 dark:text-stone-100"
                >
                  {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Custom">+ New Category</option>
                </select>
              </div>
              {newPhrase.category === 'Custom' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Custom Category Name</label>
                  <input 
                    type="text" 
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="e.g. Shopping"
                    className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleAddPhrase}
                className="flex-1 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold shadow-lg"
              >
                Save Phrase
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-8 py-4 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-2xl font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(categories).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-8 py-3 rounded-full font-bold transition-all whitespace-nowrap",
              activeCategory === cat 
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-lg" 
                : "bg-white dark:bg-stone-900 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800 shadow-sm"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories[activeCategory as keyof typeof categories]?.map((phrase: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-sm border border-stone-50 dark:border-stone-800 flex justify-between items-center group hover:border-stone-200 dark:hover:border-stone-700 transition-all"
          >
            <div className="space-y-2">
              <div className="text-2xl font-serif text-stone-900 dark:text-stone-100">{phrase.jp}</div>
              <div className="text-xs font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">{phrase.ro}</div>
              <div className="text-stone-600 dark:text-stone-400 font-editorial italic">{phrase.en}</div>
            </div>
            <button
              onClick={() => play(phrase.jp)}
              disabled={ttsLoading}
              className="p-4 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:bg-stone-100 dark:group-hover:bg-stone-700 transition-all"
            >
              <Volume2 className={cn("w-5 h-5", ttsLoading && "animate-pulse")} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
