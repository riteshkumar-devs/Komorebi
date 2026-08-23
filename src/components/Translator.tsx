import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Scan, XCircle, ArrowRight, Volume2, Sparkles, Plus, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { getAI, getApiKey, getSafeModel, checkAICache, updateAICache } from '../lib/ai';
import { MissingApiKeyWarning } from './ui/MissingApiKeyWarning';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const Translator = () => {
  const { profile, user, isDemo, setProfile, checkUsageLimit, incrementUsage, vocab = [] } = useContext(AuthContext);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'text' | 'photo'>('text');
  const [savingWord, setSavingWord] = useState<string | null>(null);
  const [duplicateFound, setDuplicateFound] = useState<string | null>(null);
  const { play, loading: ttsLoading } = useTTSContext();

  const handleTranslate = async () => {
    if (!text.trim()) return;
    
    if (!checkUsageLimit('translation')) return;

    const cachedResponse = checkAICache(profile, text);
    if (cachedResponse) {
      setResult(cachedResponse);
      return;
    }

    setLoading(true);
    try {
      const ai = getAI(profile, 'translation');
      if (!ai) {
        setResult("I need an API key to translate! Please add your key in the app settings.");
        return;
      }

      const response = await ai.models.generateContent({
        model: getSafeModel(getApiKey(profile, 'translation')?.provider),
        contents: `Translate the following text. 
        CRITICAL RULES:
        1. STRICTLY NO KANJI. If translating to Japanese, you MUST write exclusively in Hiragana (ひらがな) or Katakana (カタカナ). Never use Kanji characters under any circumstances.
        2. If translating to English, provide the natural English translation.
        3. If translating to Japanese, provide the Kana translation, followed by the Romaji in parentheses. Example: ありがとう (Arigatou)
        
        Text: "${text}"
        Provide ONLY the translation.`,
      });

      const translation = response.text?.trim() || "Translation failed";
      setResult(translation);
      
      if (translation !== "Translation failed") {
        updateAICache(profile, user, text, translation, !!isDemo, setProfile);
        await incrementUsage('translation');
      }
    } catch (error: any) {
      console.error("Translation Error:", error);
      setResult(`Error: ${error.message || "Something went wrong. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (val: string) => {
    const japanesePart = val.split('(')[0].trim();
    play(japanesePart);
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">AI Translator</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Translate words, sentences, or photos using AI.</p>
        </div>
        
        <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 self-start md:self-center">
          <button 
            onClick={() => { setMode('text'); setResult(''); }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              mode === 'text' 
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" 
                : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            )}
          >
            <Languages className="w-4 h-4" />
            Text
          </button>
          <button 
            onClick={() => { setMode('photo'); setResult(''); }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              mode === 'photo' 
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" 
                : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
            )}
          >
            <Scan className="w-4 h-4" />
            Photo
          </button>
        </div>
      </div>

      {!getApiKey(profile) && <div className="mb-8"><MissingApiKeyWarning /></div>}

      <div className="grid grid-cols-1 gap-8">
        {mode === 'text' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800"
          >
            <div className="space-y-6">
              <div className="relative group">
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a word or sentence in English or Japanese..."
                  className="w-full p-8 bg-stone-50 dark:bg-stone-800 border-none rounded-3xl focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 transition-all text-2xl outline-none font-serif italic min-h-[200px] resize-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
                {text && (
                  <button 
                    onClick={() => setText('')}
                    className="absolute right-8 top-8 p-2 text-stone-300 hover:text-stone-500 transition-all hover:scale-110"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleTranslate}
                  disabled={loading || !text.trim()}
                  className="px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-stone-200 dark:shadow-none"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 dark:border-stone-900/30 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      Translate
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800"
          >
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[2.5rem] bg-stone-50/50 dark:bg-stone-800/30 overflow-hidden relative">
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Visual Translation</h3>
                <p className="text-stone-500 dark:text-stone-400 font-serif italic mb-8 max-w-xs mx-auto">
                  Capture or upload a photo to translate text instantly like Google Lens.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-2xl text-lg font-bold border border-amber-200 dark:border-amber-800 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                  Coming Soon
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {(result || loading) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-stone-900 dark:bg-stone-100 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-10 h-10 border-4 border-white/20 dark:border-stone-900/20 border-t-amber-400 rounded-full animate-spin" />
                    <p className="text-stone-400 dark:text-stone-500 font-serif italic text-base">AI is translating...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/10 dark:bg-stone-900/10 rounded-full flex items-center justify-center mb-4">
                      <Languages className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-4">Translation Result</h3>
                    <div className="text-white dark:text-stone-900 text-2xl md:text-3xl font-editorial italic leading-tight mb-8 max-w-2xl whitespace-pre-wrap">
                      {result}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handlePlay(result)}
                        disabled={ttsLoading}
                        className="p-4 bg-white/10 dark:bg-stone-900/10 text-white dark:text-stone-900 rounded-full hover:bg-white/20 dark:hover:bg-stone-900/20 transition-all group active:scale-90"
                        title="Listen to translation"
                      >
                        {ttsLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 dark:border-stone-900/30 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
                        ) : (
                          <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                      </button>

                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(result);
                        }}
                        className="px-5 py-2.5 bg-white/10 dark:bg-stone-900/10 text-white dark:text-stone-900 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 dark:hover:bg-stone-900/20 transition-all font-display"
                      >
                        Copy Text
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
