import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  RefreshCw,
  Bot
} from 'lucide-react';
import { cn, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { getAI, checkAICache, getApiKey, getSafeModel, rotateApiKey, updateAICache } from '../lib/ai';

export const Chatbot = () => {
  const { profile, setProfile, user, isDemo, checkUsageLimit, incrementUsage } = useContext(AuthContext);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>(() => {
      const saved = safeStorage.getItem('chatbot_history');
      return saved ? JSON.parse(saved) : [
        { role: 'model', text: "Konnichiwa! I'm Sensei AI. How can I help you today?" }
      ];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      safeStorage.setItem('chatbot_history', JSON.stringify(messages));
    }, [messages]);
  
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);
  
    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;
  
      // Check limit
      if (!checkUsageLimit('chat')) return;
  
      const userMsg = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
  
      // Check cache
      const cachedResponse = checkAICache(profile, `chat_${userMsg}`);
      if (cachedResponse) {
        setMessages(prev => [...prev, { role: 'model', text: cachedResponse }]);
        return;
      }
  
      if (!getApiKey(profile, 'sensei')) {
        setMessages(prev => [...prev, { role: 'model', text: "Please add your Gemini API key in the settings to enable Sensei Chat." }]);
        return;
      }
  
      setLoading(true);
  
      try {
        let ai = getAI(profile, 'sensei');
        if (!ai) throw new Error("AI Key not found.");
  
        const chat = ai.chats.create({
          model: getSafeModel(getApiKey(profile, 'sensei')?.provider),
          config: {
            systemInstruction: "You are Sensei AI, a professional Japanese language tutor. Keep your responses very short, concise, and direct (max 2-3 sentences). Always provide examples in Japanese with furigana and English translations. ALWAYS provide Romaji for any Japanese text. Be encouraging but brief.",
          },
        });
  
        try {
          const response = await chat.sendMessage({ message: userMsg, history: messages });
          const modelText = response.text || "I apologize, but I am unable to process your request at the moment.";
          setMessages(prev => [...prev, { role: 'model', text: modelText }]);
          
          // Update cache and increment usage
          updateAICache(profile, user, `chat_${userMsg}`, modelText, !!isDemo, setProfile);
          await incrementUsage('chat');
        } catch (error: any) {
          if (error.message?.includes('429') || error.message?.includes('quota')) {
            if (rotateApiKey(profile)) {
              ai = getAI(profile, 'sensei');
              if (ai) {
                const newChat = ai.chats.create({
                  model: getSafeModel(getApiKey(profile, 'sensei')?.provider),
                  config: {
                    systemInstruction: "You are Sensei AI, a professional Japanese language tutor. Keep your responses very short, concise, and direct (max 2-3 sentences). Always provide examples in Japanese with furigana and English translations. ALWAYS provide Romaji for any Japanese text. Be encouraging but brief.",
                  },
                });
                const retryResponse = await newChat.sendMessage({ message: userMsg, history: messages });
                const retryText = retryResponse.text || "I apologize, but I am unable to process your request at the moment.";
                setMessages(prev => [...prev, { role: 'model', text: retryText }]);
                
                // Update cache and increment usage
                updateAICache(profile, user, `chat_${userMsg}`, retryText, !!isDemo, setProfile);
                await incrementUsage('chat');
                return;
              }
            }
          }
          throw error;
        }
      } catch (error: any) {
        setMessages(prev => [...prev, { role: 'model', text: `Sensei encountered an error: ${error.message}` }]);
      } finally {
        setLoading(false);
      }
    };
  
    const clearChat = () => {
      // Using a simple state-based confirm for better iFrame compatibility if needed, but for now just using the native one as a start
      if (confirm("Are you sure you want to clear your chat history?")) {
        const initial = [{ role: 'model', text: "Konnichiwa! I'm Sensei AI. How can I help you today?" }];
        setMessages(initial as any);
        safeStorage.removeItem('chatbot_history');
      }
    };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col bg-[#efe7de] dark:bg-stone-950 rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-200 dark:border-stone-800">
      <div className="px-4 py-4 bg-[#075e54] dark:bg-stone-900 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" 
              alt="Sensei" 
              className="w-full h-full object-cover scale-110 drop-shadow-lg" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold">Sensei AI</h2>
            <span className="text-[10px] opacity-80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              online
            </span>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-full transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none dark:bg-stone-900 bg-repeat"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm relative",
              msg.role === 'user' 
                ? "bg-[#dcf8c6] dark:bg-emerald-900/40 ml-auto rounded-tr-none text-stone-800 dark:text-emerald-50" 
                : "bg-white dark:bg-stone-800 mr-auto rounded-tl-none text-stone-800 dark:text-stone-100"
            )}
          >
            <div className="whitespace-pre-wrap leading-relaxed">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            <div className="text-[9px] text-stone-400 dark:text-stone-500 text-right mt-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="bg-white dark:bg-stone-800 mr-auto rounded-2xl rounded-tl-none p-3 shadow-sm">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-[#f0f0f0] dark:bg-stone-800 flex items-center gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-white dark:bg-stone-900 p-4 rounded-full text-sm outline-none shadow-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-[#128c7e] dark:bg-stone-100 text-white dark:text-stone-900 rounded-full flex items-center justify-center shadow-md hover:bg-[#075e54] dark:hover:bg-stone-200 transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
