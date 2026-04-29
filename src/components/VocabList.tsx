import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Volume2, 
  Info,
  X,
  Check,
  Languages,
  BookOpen,
  History,
  Sparkles,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { Vocabulary } from '../types';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { checkAICache, getAI, getSafeModel, getApiKey } from '../lib/ai';

export const VocabList = ({ vocab }: { vocab: Vocabulary[] }) => {
  const { user, isDemo, profile, setProfile, checkUsageLimit, incrementUsage } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<{ word: string, details: string } | null>(null);
  const [aiDetails, setAiDetails] = useState<{ word: string, content: string } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [editJapanese, setEditJapanese] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editRomaji, setEditRomaji] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { play, loading: ttsLoading } = useTTSContext();

  const filteredVocab = vocab.filter(v => 
    v.japanese.includes(search) || 
    v.meaning.toLowerCase().includes(search.toLowerCase()) || 
    (v.romaji && v.romaji.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!id) return;
    setIsDeleting(id);
    try {
      if (isDemo) {
        const localVocab = JSON.parse(safeStorage.getItem('komorebi_vocab') || '[]');
        const updatedVocab = localVocab.filter((v: any) => v.id !== id);
        safeStorage.setItem('komorebi_vocab', JSON.stringify(updatedVocab));
        window.dispatchEvent(new Event('vocab_update'));
      } else if (user) {
        const vocabRef = doc(db, 'users', user.uid, 'vocabularies', id);
        await deleteDoc(vocabRef);
      }
    } catch (error) {
      console.error("Delete Error:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVocab || !editingVocab.id) return;
    
    try {
      if (isDemo) {
        const localVocab = JSON.parse(safeStorage.getItem('komorebi_vocab') || '[]');
        const updatedVocab = localVocab.map((v: any) => 
          v.id === editingVocab.id 
            ? { ...v, japanese: editJapanese, meaning: editMeaning, romaji: editRomaji } 
            : v
        );
        safeStorage.setItem('komorebi_vocab', JSON.stringify(updatedVocab));
        window.dispatchEvent(new Event('vocab_update'));
      } else if (user) {
        const vocabRef = doc(db, 'users', user.uid, 'vocabularies', editingVocab.id);
        await updateDoc(vocabRef, {
          japanese: editJapanese,
          meaning: editMeaning,
          romaji: editRomaji
        });
      }
      setEditingVocab(null);
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const startEdit = (v: Vocabulary) => {
    setEditingVocab(v);
    setEditJapanese(v.japanese);
    setEditMeaning(v.meaning);
    setEditRomaji(v.romaji || '');
  };

  const handleShowAI = async (v: Vocabulary) => {
    // Check cache first
    const cached = checkAICache(profile, `dict_${v.japanese.toLowerCase()}`);
    if (cached) {
      setAiDetails({ word: v.japanese, content: cached });
      return;
    }

    // Not in cache, try to fetch if we have API key
    if (!getApiKey(profile)) {
      alert("Please add an API key in settings to generate AI breakdowns.");
      return;
    }

    if (!checkUsageLimit('dictionary')) return;

    setGenerating(v.id || v.japanese);
    try {
      const ai = getAI(profile, 'translation');
      const response = await ai.models.generateContent({
        model: getSafeModel(getApiKey(profile, 'translation')?.provider),
        contents: [{
          role: 'user',
          parts: [{ text: `Act as a professional Japanese-English dictionary. Provide a concise, structured definition for "${v.japanese}" (${v.meaning}). 
          
          Strictly follow this format for the summary at the top (NO extra text):
          [KANJI]: ${v.japanese}
          [ROMAJI]: ${v.romaji || '...'}
          [MEANING]: ${v.meaning}

          Then provide a detailed breakdown with:
          ### Additional Context
          - Grammar points
          - Example sentences with translations
          - Cultural nuances
          
          Format as clean Markdown.` }]
        }],
      });

      const definition = response.text?.trim() || "";
      if (definition) {
        await incrementUsage('dictionary');
        const newCache = { ...(profile?.aiCache || {}), [`dict_${v.japanese.toLowerCase()}`]: definition };
        if (isDemo) {
          const p = { ...profile!, aiCache: newCache };
          setProfile(p);
          safeStorage.setItem('komorebi_profile', JSON.stringify(p));
        } else if (user) {
          await updateDoc(doc(db, 'users', user.uid), { aiCache: newCache });
        }
        setAiDetails({ word: v.japanese, content: definition });
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f2a93b]">Personal Archive</span>
              <span className="bg-[#f2a93b]/10 text-[#f2a93b] text-[10px] font-bold px-3 py-1 rounded-full">{vocab.length} Total</span>
            </div>
            <h1 className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 tracking-tight">Your Vocabulary</h1>
          </div>

         <div className="relative w-full md:w-80 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-[#f2a93b] transition-colors" />
            <input 
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-stone-900 rounded-[2rem] border-2 border-stone-100 dark:border-stone-800 outline-none focus:border-[#f2a93b] transition-all font-serif italic text-sm placeholder:text-stone-200"
            />
         </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredVocab.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-24 text-center space-y-4"
            >
               <div className="flex justify-center">
                  <BookOpen className="w-12 h-12 text-stone-100" />
               </div>
               <p className="text-stone-400 font-serif italic text-lg">Your library is empty. Start adding words!</p>
            </motion.div>
          )}
          {filteredVocab.map((v, i) => (
            <motion.div 
              key={v.id || v.japanese}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: Math.min(i * 0.05, 0.5) 
              }}
              className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-50 dark:border-stone-800 shadow-xl shadow-stone-100/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2a93b]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                     <Languages className="w-5 h-5 text-stone-400 group-hover:text-[#f2a93b] transition-colors" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Japanese</span>
                     <span className="text-3xl font-japanese text-stone-900 dark:text-stone-100">{v.japanese}</span>
                  </div>
               </div>
               <button 
                 onClick={() => play(v.japanese)}
                 disabled={ttsLoading}
                 className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-[#f2a93b] hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all disabled:opacity-30"
               >
                 <Volume2 className={cn("w-4 h-4", ttsLoading ? "animate-pulse" : "")} />
               </button>
            </div>

            <div className="space-y-4">
               <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">English</span>
                  <p className="text-xl font-editorial italic text-stone-900 dark:text-stone-100 leading-tight">
                    {v.meaning}
                  </p>
               </div>
               
               {v.romaji && (
                 <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Reading</span>
                    <p className="text-xs font-mono text-[#f2a93b] font-bold">{v.romaji}</p>
                 </div>
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center">
               <div className="flex gap-2">
                  <button 
                    onClick={() => startEdit(v)}
                    className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(v.id || '')}
                    disabled={isDeleting === v.id}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleShowAI(v)}
                    disabled={generating === (v.id || v.japanese)}
                    className="p-2 text-stone-400 hover:text-amber-500 transition-colors relative"
                    title="View/Generate AI Breakdown"
                  >
                    {generating === (v.id || v.japanese) ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
               </div>
               {v.details && (
                 <button 
                   onClick={() => setSelectedDetails({ word: v.japanese, details: v.details || '' })}
                   className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#f2a93b] hover:opacity-70 transition-opacity"
                 >
                    <Info className="w-3 h-3" />
                    Details
                 </button>
               )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingVocab && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingVocab(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-[4rem] p-12 overflow-hidden border border-stone-200 dark:border-stone-800"
            >
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100">Refine Word</h2>
                  <p className="text-stone-400 font-serif italic text-sm">Update your dictionary entry</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest px-2">Japanese</label>
                    <input 
                      value={editJapanese}
                      onChange={(e) => setEditJapanese(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 rounded-3xl px-8 py-5 outline-none focus:ring-2 focus:ring-[#f2a93b] font-japanese text-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest px-2">Romaji</label>
                    <input 
                      value={editRomaji}
                      onChange={(e) => setEditRomaji(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 rounded-3xl px-8 py-5 outline-none focus:ring-2 focus:ring-[#f2a93b] font-mono text-sm text-[#f2a93b]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest px-2">English Meaning</label>
                    <input 
                      value={editMeaning}
                      onChange={(e) => setEditMeaning(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800 rounded-3xl px-8 py-5 outline-none focus:ring-2 focus:ring-[#f2a93b] font-editorial italic text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setEditingVocab(null)}
                     className="flex-1 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest bg-stone-50 dark:bg-stone-800 text-stone-400 hover:bg-stone-100"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xl shadow-stone-200 dark:shadow-none hover:opacity-90"
                   >
                     Save Changes
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetails(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-[4rem] p-12 overflow-hidden border border-stone-200 dark:border-stone-800"
            >
              <div className="flex flex-col items-center text-center space-y-10">
                <div className="space-y-4">
                  <span className="text-7xl font-japanese text-[#f2a93b] block">{selectedDetails.word}</span>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-stone-400">Deep Insights</h3>
                </div>
                
                <div className="w-full bg-stone-50 dark:bg-stone-800 rounded-[3rem] p-10 border border-stone-100 dark:border-stone-700 relative">
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white dark:bg-stone-900 rounded-[2.5rem] border-4 border-stone-50 dark:border-stone-800 flex items-center justify-center shadow-xl">
                      <History className="w-8 h-8 text-stone-200" />
                   </div>
                   <p className="text-xl font-serif italic text-stone-600 dark:text-stone-300 leading-relaxed pt-4">
                     {selectedDetails.details}
                   </p>
                </div>

                <button 
                  onClick={() => setSelectedDetails(null)}
                  className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-2xl shadow-stone-200 dark:shadow-none transition-transform active:scale-95"
                >
                  Close Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* AI Details Modal */}
      <AnimatePresence>
        {aiDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiDetails(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-[3rem] p-10 overflow-hidden border border-stone-100 dark:border-stone-800 shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex justify-between items-start mb-8 border-b border-stone-50 dark:border-stone-800 pb-6">
                <div>
                   <h3 className="text-4xl font-serif text-stone-900 dark:text-stone-100 mb-1">{aiDetails.word}</h3>
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">AI Deep Insights</span>
                   </div>
                </div>
                <button 
                   onClick={() => setAiDetails(null)}
                   className="p-2 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>
              </div>

              <div className="prose prose-stone dark:prose-invert max-w-none prose-p:font-serif prose-p:italic prose-headings:font-editorial prose-headings:italic">
                <ReactMarkdown>
                  {aiDetails.content.split('\n')
                    .filter(l => !l.startsWith('[KANJI]') && !l.startsWith('[ROMAJI]') && !l.startsWith('[MEANING]'))
                    .join('\n')
                    .trim()}
                </ReactMarkdown>
              </div>

              <div className="mt-12">
                 <button 
                   onClick={() => setAiDetails(null)}
                   className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                 >
                   Dismiss
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
