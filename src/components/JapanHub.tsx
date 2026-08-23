import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Layout, 
  CloudSun, 
  Coins, 
  Newspaper, 
  Sparkles, 
  Loader2,
  Bot,
  Camera,
  Image as ImageIcon,
  Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { getAI, getApiKey, getSafeModel } from '../lib/ai';

export const JapanHub = () => {
  const { profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'weather' | 'currency' | 'news' | 'best'>('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Layout, query: 'General overview of Japan today: key events, main highlights, and general vibe.' },
    { id: 'weather', label: 'Weather', icon: CloudSun, query: 'Current weather in major Japanese cities (Tokyo, Osaka, Sapporo, Fukuoka)' },
    { id: 'currency', label: 'Currency', icon: Coins, query: 'Latest Japanese Yen (JPY) exchange rate news and trends' },
    { id: 'news', label: 'Latest News', icon: Newspaper, query: 'Top news headlines from Japan today' },
    { id: 'best', label: 'Best of Japan', icon: Sparkles, query: 'Recent cultural highlights, festivals, or achievements in Japan' },
  ];

  const fetchData = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setLoading(true);
    try {
      const ai = getAI(profile, 'general');
      if (!ai) throw new Error("API Key not found.");

      const provider = getApiKey(profile, 'general')?.provider;
      const response = await ai.models.generateContent({
        model: getSafeModel(provider),
        contents: [{ role: 'user', parts: [{ text: section.query }] }],
        config: {
          // Only use googleSearch if it's Gemini, as proxy doesn't support it for others yet
          tools: provider === 'gemini' ? [{ googleSearch: {} }] : undefined,
        },
      });

      const text = response.text || "No information found.";
      const sources = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

      setData({ text, sources });
    } catch (error) {
      console.error("Japan Hub Error:", error);
      setData({ text: "Failed to fetch information. Please check your connection or API key.", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeSection);
  }, [activeSection]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-12">
        <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Overview Japan</h2>
        <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg opacity-60">Real-time insights and updates from the Land of the Rising Sun.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all",
              activeSection === section.id 
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xl shadow-stone-200 dark:shadow-none" 
                : "bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-50 dark:border-stone-800"
            )}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-stone-100 dark:border-stone-800 min-h-[400px] relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm z-10">
            <Loader2 className="w-12 h-12 text-stone-900 dark:text-stone-100 animate-spin mb-4" />
            <p className="text-stone-500 dark:text-stone-400 font-serif italic">Consulting the archives...</p>
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="prose prose-stone max-w-none dark:prose-invert">
              <ReactMarkdown>{data.text}</ReactMarkdown>
            </div>

            {data.sources.length > 0 && (
              <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">Sources</h4>
                <div className="flex flex-wrap gap-3">
                  {data.sources.map((source: any, i: number) => (
                    <a 
                      key={i}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 decoration-stone-200 dark:decoration-stone-700"
                    >
                      {source.title || "Source"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-300 dark:text-stone-700">
            <Bot className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-serif italic">Select a section to explore.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ImageAnalyzer = () => {
  const { profile } = useContext(AuthContext);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      const ai = getAI(profile, 'general');
      if (!ai) throw new Error("API Key not found.");

      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        // model: "gemini-2.0-flash-exp",
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Analyze this image. If it contains Japanese text, translate it and explain the meaning. CRITICAL RULE: When writing Japanese words, vocabulary, or example phrases in your response, write them ONLY in Hiragana (ひらがな) or Katakana (カタカナ) with Romaji and English translation (STRICTLY NO KANJI in your response). If it's a scene from Japan, identify it. Provide a detailed cultural or linguistic breakdown." }
          ]
        }]
      });

      setResult(response.text || "No analysis generated.");
    } catch (error) {
      console.error("Image Analysis Error:", error);
      setResult("Failed to analyze image. Ensure you have a valid Gemini API key.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-12">
        <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Image Sensei</h2>
        <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg opacity-60">Upload photos of Japanese text, signs, or scenes for instant analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-[3rem] border-4 border-dashed border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center cursor-pointer hover:border-stone-200 dark:hover:border-stone-700 transition-all overflow-hidden relative group",
              image && "border-none"
            )}
          >
            {image ? (
              <>
                <img src={image} alt="To analyze" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-bold text-xs uppercase tracking-widest">Change Image</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                </div>
                <p className="text-stone-400 dark:text-stone-500 font-serif italic">Click to upload or drag & drop</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <button
            onClick={analyzeImage}
            disabled={!image || analyzing}
            className="w-full py-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[2rem] font-bold text-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-stone-200 dark:shadow-none"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-6 h-6" />
                Analyze with Sensei
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-8 md:p-10 shadow-sm border border-stone-100 dark:border-stone-800 min-h-[400px]">
          {result ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-stone max-w-none dark:prose-invert"
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-300 dark:text-stone-700 text-center">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-serif italic">Analysis results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
