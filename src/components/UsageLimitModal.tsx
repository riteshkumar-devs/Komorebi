import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Settings, 
  X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export const UsageLimitModal = ({ 
  isOpen, 
  onClose, 
  type
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  type: 'dictionary' | 'translation' | 'chat';
}) => {
  const { setActiveTab } = useContext(AuthContext);
  
  if (!isOpen) return null;

  const handleGoToSettings = () => {
    setActiveTab?.('settings');
    onClose();
  };

  const content = {
    dictionary: {
      title: "Dictionary Limit",
      desc: "You've reached your free daily dictionary searches."
    },
    translation: {
      title: "Translation Limit",
      desc: "You've reached your free daily AI translations."
    },
    chat: {
      title: "Sensei Chat Limit",
      desc: "You've reached your free daily messages with Sensei."
    }
  };

  const { title, desc } = content[type];

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-100 dark:border-stone-800 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-all font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-4 text-center">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative">
            <Zap className="w-10 h-10 text-amber-500 fill-amber-500" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900">!</div>
          </div>
          
          <h2 className="text-3xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">{title}</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic text-base leading-relaxed">
            {desc} Add your own <span className="text-stone-900 dark:text-stone-100 font-bold">Gemini API Key</span> in Settings to unlock unlimited usage for free.
          </p>
        </div>

        <div className="p-8 pt-4 space-y-3">
          <button 
            onClick={handleGoToSettings}
            className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold text-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-200 dark:shadow-none"
          >
            <Settings className="w-4 h-4" />
            Configure API Keys
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-bold text-xs uppercase tracking-widest transition-all"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
};
