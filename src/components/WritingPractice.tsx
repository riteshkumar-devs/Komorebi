import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eraser, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  RotateCcw, 
  Volume2, 
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTTSContext } from '../context/TTSContext';
import { hiragana, katakana, PRACTICE_SENTENCES } from '../lib/constants';
import { useSound } from '../hooks/useSound';
import { getAI } from '../lib/ai';
import { AuthContext } from '../context/AuthContext';

const DrawingCanvas = ({ 
  target, 
  showGhost = true, 
  initialData, 
  onSave, 
  onClear,
  isParagraph = false
}: { 
  target: string, 
  showGhost?: boolean, 
  initialData?: string, 
  onSave?: (data: string) => void, 
  onClear?: () => void,
  isParagraph?: boolean
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.scale(dpr, dpr);
      
      const isDark = document.documentElement.classList.contains('dark');
      context.strokeStyle = isDark ? '#f5f2ed' : '#1c1917';
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.lineJoin = 'round';
    };

    resize();
    setCtx(context);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      resize();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [isParagraph]);

  useEffect(() => {
    if (ctx && canvasRef.current) {
      if (initialData) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          const dpr = window.devicePixelRatio || 1;
          ctx.drawImage(img, 0, 0, canvasRef.current!.width / dpr, canvasRef.current!.height / dpr);
        };
        img.src = initialData;
      } else {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvasRef.current.width / dpr, canvasRef.current.height / dpr);
      }
    }
  }, [ctx, initialData, target]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    if ('touches' in e) {
      (e as React.TouchEvent).preventDefault();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && onSave && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if ('touches' in e) {
      (e as React.TouchEvent).preventDefault();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (onClear) onClear();
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "relative bg-white dark:bg-stone-800 rounded-[2.5rem] border-2 border-stone-100 dark:border-stone-700 shadow-inner overflow-hidden mx-auto touch-none",
        isParagraph ? "aspect-[2/1] w-full max-w-[600px]" : "aspect-square max-w-[320px]"
      )}>
        {showGhost && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] dark:opacity-[0.3] pointer-events-none select-none p-4 text-center">
            <span className={cn("font-serif text-stone-900 dark:text-stone-100", isParagraph ? "text-4xl" : "text-[14rem]")}>{target}</span>
          </div>
        )}
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair relative z-10"
        />
      </div>
      <div className="flex justify-center">
        <button 
          onClick={clearCanvas}
          className="flex items-center gap-2 px-6 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full font-bold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95"
        >
          <Eraser className="w-4 h-4" />
          Clear Canvas
        </button>
      </div>
    </div>
  );
};

export const WritingPractice = () => {
  const { profile } = useContext(AuthContext);
  const [type, setType] = useState<'hiragana' | 'katakana' | 'sentences'>('hiragana');
  const [selected, setSelected] = useState<any>(hiragana[0]);
  const [practiceMode, setPracticeMode] = useState(false);
  const [autoClear, setAutoClear] = useState(true);
  const [drawings, setDrawings] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [testMode, setTestMode] = useState(false);
  const [testSelection, setTestSelection] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testOrder, setTestOrder] = useState<number[]>([]);
  
  const [customSentences, setCustomSentences] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const { play, loading: ttsLoading } = useTTSContext();
  const { play: playEffect } = useSound();

  const data = type === 'hiragana' ? hiragana : (type === 'katakana' ? katakana : []);
  const sentenceData = customSentences.length > 0 ? customSentences : PRACTICE_SENTENCES;

  const handleRefreshParagraphs = async () => {
    setRefreshing(true);
    try {
      const ai = getAI(profile, 'general');
      if (!ai) {
        alert("Please set up your Gemini API key in Settings to use AI refresh.");
        return;
      }

      const prompt = `Generate 5 short sentences or paragraphs in Japanese for writing practice. 
      Format as a JSON array of objects with keys: "japanese", "romaji", "meaning".
      The sentences should be useful for learners and range from simple to medium difficulty.
      Only return the JSON array.`;

      const result = await ai.models.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = result.text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
          const newSentences = JSON.parse(jsonMatch[0]);
          setCustomSentences(newSentences);
          if (newSentences.length > 0) {
            setSelected(newSentences[0]);
          }
      }
    } catch (error) {
      console.error("AI Refresh Error:", error);
      alert("Failed to generate new paragraphs. Please check your API settings.");
    } finally {
      setRefreshing(false);
    }
  };

  const currentSelection = type === 'sentences' ? selected : selected; 
  // Just to make sure we have the right object structure

  const clearAllDrawings = () => {
    setDrawings({});
    setShowClearConfirm(false);
  };

  const startTest = () => {
    if (testSelection.length === 0) return;
    const order = Array.from({ length: testSelection.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    setTestOrder(order);
    setCurrentTestIndex(0);
    setIsTesting(true);
  };

  const nextTest = () => {
    if (currentTestIndex < testOrder.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    } else {
      setIsTesting(false);
      setTestMode(false);
    }
  };

  if (testMode && !isTesting) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-0.5">Writing Test</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Select the characters you want to be tested on.</p>
          </div>
          <button 
            onClick={() => setTestMode(false)}
            className="text-xs font-bold text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 uppercase tracking-widest"
          >
            Back to Practice
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm space-y-8">
          <div className="flex gap-4 border-b border-stone-50 dark:border-stone-800 pb-4">
            <button 
              onClick={() => setType('hiragana')}
              className={cn("text-xs font-bold uppercase tracking-widest transition-all", type === 'hiragana' ? "text-stone-900 dark:text-stone-100" : "text-stone-300 dark:text-stone-600")}
            >
              Hiragana
            </button>
            <button 
              onClick={() => setType('katakana')}
              className={cn("text-xs font-bold uppercase tracking-widest transition-all", type === 'katakana' ? "text-stone-900 dark:text-stone-100" : "text-stone-300 dark:text-stone-600")}
            >
              Katakana
            </button>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {data.map(k => (
              <button
                key={k.kana}
                onClick={() => {
                  if (testSelection.includes(k.kana)) {
                    setTestSelection(prev => prev.filter(s => s !== k.kana));
                  } else {
                    setTestSelection(prev => [...prev, k.kana]);
                  }
                }}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-xl border-2 transition-all",
                  testSelection.includes(k.kana)
                    ? "border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md"
                    : "border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:border-stone-200 dark:hover:border-stone-700"
                )}
              >
                <span className="text-xl font-serif">{k.kana}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 border-t border-stone-50 dark:border-stone-800">
            <div className="text-xs font-serif italic text-stone-500 dark:text-stone-400">
              {testSelection.length} characters selected
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setTestSelection(data.map(k => k.kana))}
                className="px-4 py-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                Select All
              </button>
              <button 
                onClick={() => setTestSelection([])}
                className="px-4 py-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                Clear Selection
              </button>
              <button 
                onClick={startTest}
                disabled={testSelection.length === 0}
                className="px-8 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-200 dark:shadow-none disabled:opacity-50"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTesting) {
    const currentKana = testSelection[testOrder[currentTestIndex]];
    const currentData = [...hiragana, ...katakana].find(k => k.kana === currentKana);

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 mb-0.5">Writing Test</h2>
            <p className="text-stone-500 font-serif italic text-xs">Character {currentTestIndex + 1} of {testOrder.length}</p>
          </div>
          <button 
            onClick={() => setIsTesting(false)}
            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
          >
            End Test
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm text-center space-y-8">
          <div className="space-y-2">
            <span className="text-stone-400 dark:text-stone-500 font-mono tracking-[0.3em] uppercase text-xs block">Write this:</span>
            <span className="text-6xl font-mono text-stone-900 dark:text-stone-100 font-bold uppercase tracking-widest">{currentData?.romaji}</span>
          </div>

          <DrawingCanvas 
            key={currentKana}
            target={currentKana} 
            showGhost={false} 
            onSave={() => {}}
          />

          <div className="flex justify-center pt-4">
            <button 
              onClick={nextTest}
              className="px-12 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold text-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-200 dark:shadow-none flex items-center gap-3"
            >
              {currentTestIndex < testOrder.length - 1 ? 'Next Character' : 'Finish Test'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100 mb-0.5">Writing Practice</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Master the building blocks of Japanese.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className="px-4 py-1.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
            {showClearConfirm && (
              <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl border border-stone-100 dark:border-stone-800 max-w-xs w-full space-y-6 text-center"
                >
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">Clear All Progress?</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 font-serif italic leading-relaxed">
                      This will permanently delete all your writing practice drawings. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={clearAllDrawings}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100 dark:shadow-none"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
          
          <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-full border border-stone-100 dark:border-stone-800 shadow-sm self-start">
            <button 
              onClick={() => { setType('hiragana'); setSelected(hiragana[0]); }}
              className={cn(
                "px-5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap",
                type === 'hiragana' ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              Hiragana
            </button>
            <button 
              onClick={() => { setType('katakana'); setSelected(katakana[0]); }}
              className={cn(
                "px-5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap",
                type === 'katakana' ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              Katakana
            </button>
            <button 
              onClick={() => { setType('sentences'); setSelected(sentenceData[0]); }}
              className={cn(
                "px-5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap",
                type === 'sentences' ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              Paragraphs
            </button>
          </div>
          
          {type === 'sentences' && (
            <button 
              onClick={handleRefreshParagraphs}
              disabled={refreshing}
              className="px-5 py-1.5 rounded-full font-bold text-xs bg-[#f2a93b]/10 text-[#f2a93b] border border-[#f2a93b]/20 hover:bg-[#f2a93b]/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Loader2 className="w-3 h-3" />
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              )}
              AI Refresh
            </button>
          )}

          <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-full border border-stone-100 dark:border-stone-800 shadow-sm self-start">
            <button 
              onClick={() => setPracticeMode(!practiceMode)}
              className={cn(
                "px-5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2",
                practiceMode ? "bg-emerald-600 text-white shadow-md font-bold" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              <Pencil className="w-3 h-3" />
              Practice
            </button>
            <button 
              onClick={() => setTestMode(true)}
              className="px-5 py-1.5 rounded-full font-bold text-xs text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all whitespace-nowrap flex items-center gap-2"
            >
              <CheckCircle2 className="w-3 h-3" />
              Test
            </button>
            <button 
              onClick={() => setAutoClear(!autoClear)}
              className={cn(
                "px-5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2",
                !autoClear ? "bg-amber-600 text-white shadow-md font-bold" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              <RotateCcw className="w-3 h-3" />
              Persistent
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={cn("bg-white dark:bg-stone-900 p-6 rounded-[2rem] shadow-sm border border-stone-50 dark:border-stone-800", type === 'sentences' ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className={cn("grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar", type === 'sentences' ? "grid-cols-1" : "grid-cols-6 sm:grid-cols-8")}>
            {(type === 'sentences' ? sentenceData : data).map((k: any) => (
              <button
                key={type === 'sentences' ? k.japanese : k.kana}
                onClick={() => setSelected(k)}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all border-2",
                  type === 'sentences' ? "p-4 justify-start text-left" : "aspect-square flex-col",
                  (selected.kana === k.kana || (type === 'sentences' && selected.japanese === k.japanese))
                    ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900 shadow-md" 
                    : "bg-stone-50 dark:bg-stone-800 border-transparent text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100"
                )}
              >
                {type === 'sentences' ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-japanese line-clamp-1">{k.japanese}</span>
                    <span className="text-[10px] opacity-60 line-clamp-1">{k.meaning}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xl font-serif">{k.kana}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">{k.romaji}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("space-y-4", type === 'sentences' ? "lg:col-span-3" : "lg:col-span-2")}>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] shadow-sm border border-stone-50 dark:border-stone-800 text-center relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => play(type === 'sentences' ? selected.japanese : selected.kana)}
                disabled={ttsLoading}
                className="p-2 bg-stone-50 dark:bg-stone-800 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all active:scale-90"
              >
                <Volume2 className={cn("w-4 h-4", ttsLoading && "animate-pulse font-bold")} />
              </button>
            </div>
            
            <div className={cn("min-h-[120px] flex flex-col items-center justify-center pt-8", type === 'sentences' ? "pt-4" : "")}>
              {!practiceMode ? (
                <>
                  <span className={cn("font-serif text-stone-900 dark:text-stone-100 block mb-1", type === 'sentences' ? "text-2xl" : "text-8xl")}>
                    {type === 'sentences' ? selected.japanese : selected.kana}
                  </span>
                  <span className="text-stone-400 dark:text-stone-500 font-mono tracking-[0.3em] uppercase text-xs">
                    {type === 'sentences' ? selected.romaji : selected.romaji}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-stone-400 dark:text-stone-500 font-mono tracking-[0.3em] uppercase text-sm mb-2 font-bold">Write this:</span>
                  <span className={cn("font-mono text-stone-900 dark:text-stone-100 font-bold uppercase tracking-widest", type === 'sentences' ? "text-lg text-center px-4" : "text-6xl")}>
                    {type === 'sentences' ? selected.romaji : selected.romaji}
                  </span>
                </>
              )}
            </div>
            
            <div className="mt-6">
              <DrawingCanvas 
                key={type === 'sentences' ? selected.japanese : selected.kana}
                target={type === 'sentences' ? selected.japanese : selected.kana} 
                showGhost={!practiceMode} 
                initialData={autoClear ? undefined : drawings[type === 'sentences' ? selected.japanese : selected.kana]}
                onSave={(data) => setDrawings(prev => ({ ...prev, [type === 'sentences' ? selected.japanese : selected.kana]: data }))}
                onClear={() => setDrawings(prev => {
                  const next = { ...prev };
                  delete next[type === 'sentences' ? selected.japanese : selected.kana];
                  return next;
                })}
                isParagraph={type === 'sentences'}
              />
            </div>
            
            {type === 'sentences' && (
              <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                <p className="text-xs text-stone-900 dark:text-stone-100 font-japanese">{selected.japanese}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
