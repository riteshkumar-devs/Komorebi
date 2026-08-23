import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  RotateCcw, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Volume2, 
  Download,
  ChevronRight 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn, safeStorage } from '../lib/utils';
import { Vocabulary } from '../types';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { useSound } from '../hooks/useSound';
import { getAI, getApiKey, getSafeModel, checkAICache } from '../lib/ai';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { MissingApiKeyWarning } from './ui/MissingApiKeyWarning';
import { exportToPDF } from '../lib/pdf';

export const Dictionary = ({ vocab }: { vocab: Vocabulary[] }) => {
  const { profile, setProfile, user, isDemo, discoveredWords, setDiscoveredWords, checkUsageLimit, incrementUsage } = useContext(AuthContext);
  const { play: playSound } = useSound();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommon, setShowCommon] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState<string | null>(null);

  useEffect(() => {
    const pendingSearch = safeStorage.getItem('komorebi_search_query');
    if (pendingSearch) {
      setQuery(pendingSearch);
      safeStorage.removeItem('komorebi_search_query');
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, []);
  
  const [discovering, setDiscovering] = useState(false);
  const [savingWord, setSavingWord] = useState<string | null>(null);
  const { play, loading: ttsLoading } = useTTSContext();

  const handleSaveToLibrary = async (word: { jp: string; ro: string; en: string }, details?: string) => {
    if (!isDemo && !user) return;
    
    const isDuplicate = vocab.some(v => v.japanese === word.jp || v.meaning.toLowerCase() === word.en.toLowerCase());
    if (isDuplicate) {
      setDuplicateFound(word.jp);
      setTimeout(() => setDuplicateFound(null), 3000);
      return;
    }

    setSavingWord(word.jp);
    try {
      const vocabData = {
        uid: isDemo ? 'guest' : user!.uid,
        japanese: word.jp,
        meaning: word.en,
        romaji: word.ro,
        createdAt: Timestamp.now(),
        mastery: 0,
        type: 'main' as 'main' | 'sub',
        details: details || ''
      };

      if (isDemo) {
        const localVocab = JSON.parse(safeStorage.getItem('komorebi_vocab') || '[]');
        const newVocab = {
          id: Math.random().toString(36).substr(2, 9),
          ...vocabData
        };
        safeStorage.setItem('komorebi_vocab', JSON.stringify([newVocab, ...localVocab]));
        window.dispatchEvent(new Event('vocab_update'));
      } else if (user) {
        const vocabRef = collection(db, 'users', user.uid, 'vocabularies');
        await addDoc(vocabRef, vocabData);
      }
      playSound('success');
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setSavingWord(null);
    }
  };

  const commonWords = [
    { jp: "こんにちは", ro: "Konnichiwa", en: "Hello / Good afternoon" },
    { jp: "ありがとう", ro: "Arigatou", en: "Thank you" },
    { jp: "すみません", ro: "Sumimasen", en: "Excuse me / I'm sorry" },
    { jp: "はい", ro: "Hai", en: "Yes" },
    { jp: "いいえ", ro: "Iie", en: "No" },
    { jp: "おいしい", ro: "Oishii", en: "Delicious" },
    { jp: "かわいい", ro: "Kawaii", en: "Cute" },
    { jp: "さようなら", ro: "Sayounara", en: "Goodbye" },
  ];

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const ai = getAI(profile, 'translation');
      if (!ai) throw new Error("API Key not found.");

      const existingJp = discoveredWords.map(w => w.jp).slice(-100); 

      const response = await ai.models.generateContent({
        model: getSafeModel(getApiKey(profile, 'translation')?.provider),
        contents: [{
          role: 'user',
          parts: [{ text: `Provide a list of 20 common and useful Japanese words for beginners. 
          CRITICAL REQUIREMENT: Strictly write all Japanese words in Hiragana (ひらがな) or Katakana (カタカナ) ONLY. Do NOT use any Kanji whatsoever.
          Make sure these words are DIFFERENT from these already discovered ones: ${existingJp.join(', ')}.
          Avoid basic ones like 'Konnichiwa' or 'Arigatou'.
          Focus on interesting nouns, verbs, and adjectives that a traveler or student would find useful.
          For each word, provide:
          1. Japanese (Hiragana or Katakana ONLY, strictly NO Kanji)
          2. Romaji
          3. Simple English meaning
          
          Format the response as a JSON array of objects with keys: "jp", "ro", "en". 
          Example: [{"jp": "おいしい", "ro": "Oishii", "en": "Delicious"}]
          Provide ONLY the JSON.` }]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const words = JSON.parse(responseText);
      if (Array.isArray(words)) {
        const newWords = words.map(w => ({ ...w, createdAt: Timestamp.now() }));
        
        if (isDemo) {
          const updatedWords = [...discoveredWords, ...newWords];
          const uniqueWords = Array.from(new Map(updatedWords.map(item => [item['jp'], item])).values());
          setDiscoveredWords(uniqueWords);
          safeStorage.setItem('discovered_words', JSON.stringify(uniqueWords));
        } else if (user) {
          const discoveredRef = collection(db, 'users', user.uid, 'discovered_words');
          for (const word of newWords) {
            if (!discoveredWords.some(dw => dw.jp === word.jp)) {
              await addDoc(discoveredRef, word);
            }
          }
        }
      }
    } catch (error) {
      console.error("Discovery Error:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const parseDictionaryResult = (text: string) => {
    const cleanValue = (val: string) => {
      let cleaned = val.replace(/[#*`_~]/g, '').trim();
      cleaned = cleaned.replace(/^[:\s-]+|[:\s-]+$/g, '').trim();
      
      const labels = ['japanese', 'kana', 'kanji', 'romaji', 'meaning', 'definition', 'english', 'pronunciation'];
      for (const label of labels) {
        const regex = new RegExp(`^${label}\\s*[:\\s-]*`, 'i');
        if (regex.test(cleaned)) {
          cleaned = cleaned.replace(regex, '').trim();
          break;
        }
      }
      return cleaned.replace(/^[:\s-]+|[:\s-]+$/g, '').trim();
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let jpLineRaw = lines.find(l => /\[(JAPANESE|KANA|KANJI)\]/i.test(l)) || '';
    if (!jpLineRaw) {
      jpLineRaw = lines.find(l => 
        /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]/.test(l) && 
        !l.toLowerCase().includes('here is') && 
        !l.toLowerCase().includes('definition') &&
        l.length < 50
      ) || '';
    }
    const jpNoLabel = cleanValue(jpLineRaw.replace(/\[(JAPANESE|KANA|KANJI)\]/gi, ''));
    const jpMatch = jpNoLabel.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]+/g);
    const jp = jpMatch ? jpMatch.join('') : jpNoLabel || query;

    const roLineRaw = lines.find(l => /\[ROMAJI\]/i.test(l) || (/romaji/i.test(l) && l.includes(':'))) || '';
    const ro = cleanValue(roLineRaw.replace(/\[ROMAJI\]/gi, ''));

    let enLineRaw = lines.find(l => /\[MEANING\]/i.test(l)) || '';
    if (!enLineRaw) {
      enLineRaw = lines.find(l => 
        (l.toLowerCase().includes('meaning') || l.toLowerCase().includes('definition')) && 
        l.includes(':') && 
        !l.toLowerCase().includes('here is') && 
        !l.toLowerCase().includes('breakdown') &&
        l.split(' ').length < 15
      ) || '';
    }
    const en = cleanValue(enLineRaw.replace(/\[MEANING\]/gi, '')) || query;

    return { jp, ro, en };
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;

    if (!checkUsageLimit('dictionary')) return;

    const searchTerm = query.trim();
    const cachedResponse = checkAICache(profile, `dict_${searchTerm}`);
    if (cachedResponse) {
      setResult(cachedResponse);
      setShowCommon(false);
      setShowDetails(false);
      return;
    }

    setLoading(true);
    setShowCommon(false);
    setShowDetails(false);
    try {
      const ai = getAI(profile, 'translation');
      if (!ai) throw new Error("API Key not found.");

      const response = await ai.models.generateContent({
        model: getSafeModel(getApiKey(profile, 'translation')?.provider),
        contents: [{
          role: 'user',
          parts: [{ text: `Act as a professional Japanese-English dictionary. Provide a concise, structured definition for "${searchTerm}". 
          
          CRITICAL RULES:
          1. STRICTLY NO KANJI. All Japanese words, phrases, and example sentences MUST be written exclusively in Hiragana (ひらがな) or Katakana (カタカナ). Never include Kanji characters.
          2. Provide ONLY the requested fields at the top. DO NOT use introduction sentences like "Here is the definition...".
          
          Strictly follow this format for the summary at the top:
          [JAPANESE]: (The Japanese word in Hiragana or Katakana ONLY, strictly NO Kanji)
          [ROMAJI]: (The Romaji pronunciation ONLY, no labels)
          [MEANING]: (The primary English definition ONLY, no extra notes or sentences)

          Then provide a detailed breakdown with:
          ### Additional Context
          - Grammar points
          - Example sentences with translations (in Hiragana/Katakana + Romaji + English, NO Kanji)
          - Cultural nuances
          
          Format as clean Markdown.` }]
        }],
      });

      const definition = response.text?.trim() || "No results found.";
      setResult(definition);
      
      if (definition !== "No results found." && profile) {
        await incrementUsage('dictionary');
        const parsed = parseDictionaryResult(definition);
        const updates: Record<string, string> = { [`dict_${searchTerm}`]: definition };
        if (parsed.jp && parsed.jp !== searchTerm) {
          updates[`dict_${parsed.jp}`] = definition;
        }

        const newCache = { ...(profile.aiCache || {}), ...updates };
        if (isDemo) {
          const p = { ...profile, aiCache: newCache };
          setProfile(p);
          safeStorage.setItem('komorebi_profile', JSON.stringify(p));
        } else if (user) {
          updateDoc(doc(db, 'users', user.uid), { aiCache: newCache }).catch(e => console.error(e));
        }
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setResult(`Sorry, I couldn't find that word. Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const displayWords = discoveredWords.length > 0 ? discoveredWords : commonWords;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Japanese Dictionary</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Search for any word or browse common expressions below.</p>
        </div>
        <div className="flex items-center gap-3">
          {displayWords.length > 0 && (
            <button 
              onClick={() => exportToPDF(displayWords, "Dictionary Words")}
              className="px-4 py-2 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-stone-100 dark:hover:bg-stone-700 transition-all flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Export PDF
            </button>
          )}
          <button 
            onClick={handleDiscover}
            disabled={discovering}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
          {discovering ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Discover New Words
            </>
          )}
        </button>
      </div>
    </motion.div>

      {!getApiKey(profile) && <div className="mb-8"><MissingApiKeyWarning /></div>}

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSearch} 
        className="relative mb-8"
      >
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in Japanese or English..."
          className="w-full p-6 pl-16 bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 rounded-[2rem] shadow-sm focus:border-stone-900 dark:focus:border-stone-100 transition-all text-lg outline-none font-serif italic text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
        />
        <button 
          type="submit"
          disabled={loading || !query}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 hover:scale-105 active:scale-95"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </motion.form>

      <AnimatePresence mode="wait">
        {showCommon && !result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {displayWords.map((word, i) => (
              <div
                key={i}
                onClick={() => { setQuery(word.jp); setTimeout(() => handleSearch(), 100); }}
                className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl text-left hover:border-stone-300 dark:hover:border-stone-700 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-serif text-stone-900 dark:text-stone-100">{word.jp}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSaveToLibrary(word); }}
                      disabled={savingWord === word.jp}
                      className="p-2 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all disabled:opacity-50"
                      title="Save to Library"
                    >
                      {savingWord === word.jp ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <Volume2 
                      onClick={(e) => { e.stopPropagation(); play(word.jp); }}
                      className="w-4 h-4 text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-1">{word.ro}</div>
                <div className="text-sm text-stone-600 dark:text-stone-400 font-editorial italic">{word.en}</div>
              </div>
            ))}
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 relative group overflow-hidden">
              <div className="absolute top-6 right-6 flex gap-2">
                <div className="relative">
                  {duplicateFound === parseDictionaryResult(result).jp && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-10 right-0 whitespace-nowrap px-3 py-1 bg-stone-900 text-white text-[8px] uppercase tracking-widest font-bold rounded-lg shadow-xl z-10"
                    >
                      Already in Library
                    </motion.div>
                  )}
                  <button 
                    onClick={() => handleSaveToLibrary(parseDictionaryResult(result), result)}
                    disabled={savingWord === parseDictionaryResult(result).jp || !!vocab.find(v => v.japanese === parseDictionaryResult(result).jp)}
                    className={cn(
                      "p-3 rounded-full transition-all",
                      vocab.find(v => v.japanese === parseDictionaryResult(result).jp) 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 cursor-default" 
                        : "bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900"
                    )}
                    title={vocab.find(v => v.japanese === parseDictionaryResult(result).jp) ? "Already in Library" : "Save to Library"}
                  >
                    {vocab.find(v => v.japanese === parseDictionaryResult(result).jp) ? <CheckCircle2 className="w-5 h-5" /> : (savingWord === parseDictionaryResult(result).jp ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />)}
                  </button>
                </div>
                <button 
                  onClick={() => { setResult(null); setShowCommon(true); setQuery(''); }}
                  className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all font-bold"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => play(parseDictionaryResult(result).jp)}
                  disabled={ttsLoading}
                  className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all"
                >
                  <Volume2 className={cn("w-5 h-5", ttsLoading && "animate-pulse")} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-5xl font-serif text-stone-900 dark:text-stone-100">{parseDictionaryResult(result).jp}</span>
                  <div className="text-xs font-mono text-stone-400 uppercase tracking-widest">{parseDictionaryResult(result).ro || "Pronunciation N/A"}</div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#f2a93b]">Primary Meaning</span>
                  <div className="text-xl text-stone-600 dark:text-stone-400 font-editorial italic pr-32">{parseDictionaryResult(result).en}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-50 dark:border-stone-800">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-[#f2a93b] transition-colors flex items-center gap-2"
                >
                  {showDetails ? "Hide Content" : "Show AI Detailed Breakdown"}
                  <ChevronRight className={cn("w-3 h-3 transition-transform", showDetails && "rotate-90")} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-stone-50/50 dark:bg-stone-800/20 p-8 rounded-[2rem] border border-stone-100 dark:border-stone-800 overflow-hidden"
                >
                  <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-editorial prose-headings:italic text-sm">
                    <ReactMarkdown>
                      {result.split('\n')
                        .filter(l => !l.startsWith('[JAPANESE]') && !l.startsWith('[KANA]') && !l.startsWith('[KANJI]') && !l.startsWith('[ROMAJI]') && !l.startsWith('[MEANING]'))
                        .join('\n')
                        .trim()}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
