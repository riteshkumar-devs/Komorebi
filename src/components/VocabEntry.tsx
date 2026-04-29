import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  PlusCircle, 
  AlertCircle, 
  Volume2 
} from 'lucide-react';
import { cn, calculateRank, handleFirestoreError, safeStorage } from '../lib/utils';
import { Vocabulary, OperationType } from '../types';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { useSound } from '../hooks/useSound';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

export const VocabEntry = ({ vocab }: { vocab: Vocabulary[] }) => {
  const { user, isDemo, profile } = useContext(AuthContext);
  const { play: playSound } = useSound(true);
  const [japanese, setJapanese] = useState('');
  const [meaning, setMeaning] = useState('');
  const [romaji, setRomaji] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<Vocabulary | null>(null);
  const { play, loading: ttsLoading } = useTTSContext();

  const handleSubmit = async (e?: React.FormEvent, isSubtype: boolean = false) => {
    if (e) e.preventDefault();
    if (!japanese || !meaning) return;
    if (!isDemo && !user) return;

    const cleanJp = japanese.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+/g)?.join('') || japanese.trim();
    const cleanRo = romaji.replace(/[#*`_~]/g, '').trim();
    const cleanEn = meaning.replace(/[#*`_~]/g, '').trim();

    if (!isSubtype) {
      const existing = vocab.find(v => 
        v.meaning.toLowerCase().trim() === cleanEn.toLowerCase().trim() ||
        v.japanese.trim() === cleanJp
      );
      if (existing) {
        setDuplicateMatch(existing);
        setShowDuplicateModal(true);
        return;
      }
    }
    
    setLoading(true);
    try {
      const vocabData: Partial<Vocabulary> = {
        uid: isDemo ? 'guest' : user!.uid,
        japanese: cleanJp,
        meaning: cleanEn,
        romaji: cleanRo,
        createdAt: Timestamp.now(),
        type: isSubtype ? 'sub' : 'main',
      };

      if (isSubtype && duplicateMatch?.id) {
        vocabData.parentId = duplicateMatch.id;
      }

      if (isDemo) {
        const localVocab = JSON.parse(safeStorage.getItem('komorebi_vocab') || '[]');
        const newVocab = {
          id: Math.random().toString(36).substr(2, 9),
          ...vocabData
        };
        safeStorage.setItem('komorebi_vocab', JSON.stringify([newVocab, ...localVocab]));
        
        const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
        const newWordCount = localVocab.length + 1;
        const { title: newTitle } = calculateRank(newWordCount);
        safeStorage.setItem('komorebi_profile', JSON.stringify({ 
          ...p, 
          title: newTitle
        }));
        
        window.dispatchEvent(new Event('vocab_update'));
      } else if (user) {
        const vocabRef = collection(db, 'users', user.uid, 'vocabularies');
        await addDoc(vocabRef, vocabData);
        
        const profileRef = doc(db, 'users', user.uid);
        const newWordCount = vocab.length + 1;
        const { title: newTitle } = calculateRank(newWordCount);
        await updateDoc(profileRef, {
          title: newTitle
        });
      }
      
      setJapanese('');
      setMeaning('');
      setRomaji('');
      setSuccess(true);
      playSound('success');
      setShowDuplicateModal(false);
      setDuplicateMatch(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      if (!isDemo && user) handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/vocabularies`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-stone-100 dark:border-stone-800"
          >
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Duplicate Meaning</h3>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm mb-8">
              The meaning "<span className="text-stone-900 dark:text-stone-100 font-bold">{meaning}</span>" already exists for "<span className="text-stone-900 dark:text-stone-100 font-bold">{duplicateMatch?.japanese}</span>". 
              Would you like to add this as a sub-type of the existing word?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSubmit(undefined, true)}
                className="py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all"
              >
                Yes, Add Sub-type
              </button>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="py-4 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div className="xl:col-span-2">
        <div className="mb-6">
          <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 mb-1">New Word</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Build your personal dictionary, one word at a time.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] shadow-sm border border-stone-50 dark:border-stone-800 space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-300">Japanese (Kanji/Kana)</label>
            <input 
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              placeholder="e.g. 木漏れ日"
              className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-xl focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all text-xl font-serif text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-300">Romaji</label>
            <input 
              value={romaji}
              onChange={(e) => setRomaji(e.target.value)}
              placeholder="e.g. Komorebi"
              className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-xl focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-300">Meaning</label>
            <input 
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g. Sunlight filtering through leaves"
              className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-xl focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-editorial italic text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-500"
              required
            />
          </div>
          <button 
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-stone-100 dark:shadow-none",
              success ? "bg-emerald-500 text-white" : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
            )}
          >
            {loading ? "Adding..." : success ? <><CheckCircle2 className="w-5 h-5" /> Added!</> : <><PlusCircle className="w-5 h-5" /> Add Word</>}
          </button>
        </form>
      </div>

      <div className="xl:col-span-3">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100">Recent Words</h2>
          <span className="text-stone-400 dark:text-stone-500 font-mono text-xs uppercase tracking-widest">{vocab.length} Total</span>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
          {vocab.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800">
              <p className="text-stone-400 dark:text-stone-500 font-editorial italic">Your list is empty. Add your first word!</p>
            </div>
          ) : (
            vocab.filter(v => v.type !== 'sub').map((v) => {
              const subs = vocab.filter(s => s.parentId === v.id);
              return (
                <div key={v.id} className="space-y-2">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-50 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-2xl font-serif text-stone-900 dark:text-stone-100 group-hover:bg-stone-900 dark:group-hover:bg-stone-100 group-hover:text-white dark:group-hover:text-stone-900 transition-colors">
                        {v.japanese[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-serif text-stone-900 dark:text-stone-100">{v.japanese}</span>
                          <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px] uppercase tracking-widest">{v.romaji}</span>
                        </div>
                        <p className="text-stone-500 dark:text-stone-400 font-editorial italic">{v.meaning}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => play(v.japanese)}
                      disabled={ttsLoading}
                      className="p-3 text-stone-300 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-all"
                    >
                      <Volume2 className={cn("w-5 h-5", ttsLoading && "animate-pulse")} />
                    </button>
                  </motion.div>
                  
                  {subs.length > 0 && (
                    <div className="ml-12 space-y-2 border-l-2 border-stone-100 dark:border-stone-800 pl-6">
                      {subs.map(sub => (
                        <motion.div 
                          key={sub.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-stone-50/50 dark:bg-stone-800/50 p-4 rounded-2xl flex items-center justify-between group/sub"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-stone-900 rounded-xl flex items-center justify-center text-lg font-serif text-stone-400 dark:text-stone-500 group-hover/sub:bg-stone-900 dark:group-hover/sub:bg-stone-100 group-hover/sub:text-white dark:group-hover/sub:text-stone-900 transition-colors">
                              {sub.japanese[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-serif text-stone-900 dark:text-stone-100">{sub.japanese}</span>
                                <span className="text-stone-400 dark:text-stone-500 font-mono text-[8px] uppercase tracking-widest">{sub.romaji}</span>
                                <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[6px] font-bold uppercase tracking-widest rounded-full border border-amber-100 dark:border-amber-800">Sub</span>
                              </div>
                              <p className="text-stone-400 dark:text-stone-500 font-editorial italic text-sm">{sub.meaning}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => play(sub.japanese)}
                            disabled={ttsLoading}
                            className="p-2 text-stone-200 hover:text-stone-900 transition-all font-bold"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
