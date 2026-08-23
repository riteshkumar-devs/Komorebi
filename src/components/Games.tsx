import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Gamepad, 
  Search, 
  Zap, 
  Book, 
  List, 
  Pencil, 
  Volume2, 
  ChevronRight,
  Timer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Vocabulary } from '../types';
import { TypingGame } from './games/TypingGame';
import { KanaMatch } from './games/KanaMatch';
import { WordScramble } from './games/WordScramble';
import { SpeedQuiz } from './games/SpeedQuiz';
import { ListeningHero } from './games/ListeningHero';
import { FlashcardSprint } from './games/FlashcardSprint';
import { KanjiQuiz } from './games/KanjiQuiz';
import { ParticleMaster } from './games/ParticleMaster';
import { SentenceBuilder } from './games/SentenceBuilder';
import { KanaInvaders } from './games/KanaInvaders';
import { WordSearch } from './WordSearch';

export const Games = ({ vocab, onSelectGame }: { vocab: Vocabulary[]; onSelectGame?: (id: string) => void }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const gameList = [
    { id: 'kana-match', title: 'Kana Match', description: 'Memory game matching Kana to Romaji.', icon: Gamepad2, color: 'bg-indigo-500' },
    { id: 'word-scramble', title: 'Word Scramble', description: 'Unscramble Japanese words to test your recall.', icon: Search, color: 'bg-emerald-500' },
    { id: 'speed-quiz', title: 'Speed Quiz', description: '60 seconds of rapid translation challenge.', icon: Timer, color: 'bg-amber-500' },
    { id: 'listening-hero', title: 'Listening Hero', description: 'Listen to the word and pick the correct meaning.', icon: Volume2, color: 'bg-blue-500' },
    { id: 'flashcard-sprint', title: 'Flashcard Sprint', description: 'Review your entire library as fast as possible.', icon: Zap, color: 'bg-[#f2a93b]' },
    { id: 'kanji-quiz', title: 'Kana Vocab Quiz', description: 'Match Kana words to their meanings.', icon: Book, color: 'bg-red-500' },
    { id: 'particle-master', title: 'Particle Master', description: 'Fill in the blanks with the correct particles.', icon: List, color: 'bg-purple-500' },
    { id: 'sentence-builder', title: 'Sentence Builder', description: 'Construct grammatically correct sentences.', icon: Pencil, color: 'bg-pink-500' },
    { id: 'typing-game', title: 'Typing Game', description: 'Type romaji to pop falling character bubbles.', icon: Gamepad, color: 'bg-stone-800' },
    { id: 'kana-invaders', title: 'Kana Invaders', description: 'Defend your base by typing falling kana.', icon: Gamepad2, color: 'bg-cyan-600' },
    { id: 'word-search', title: 'Word Search', description: 'Find hidden Japanese words in a grid.', icon: Search, color: 'bg-lime-600' },
  ];

  const handleGameSelect = (id: string) => {
    if (onSelectGame && (id === 'kana-invaders' || id === 'word-search')) {
      onSelectGame(id === 'kana-invaders' ? 'invaders' : 'wordsearch');
      return;
    }
    setActiveGame(id);
  };

  if (activeGame === 'kana-match') return <KanaMatch onBack={() => setActiveGame(null)} />;
  if (activeGame === 'word-scramble') return <WordScramble vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'speed-quiz') return <SpeedQuiz vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'listening-hero') return <ListeningHero vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'flashcard-sprint') return <FlashcardSprint vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'kanji-quiz') return <KanjiQuiz vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'particle-master') return <ParticleMaster onBack={() => setActiveGame(null)} />;
  if (activeGame === 'sentence-builder') return <SentenceBuilder vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'typing-game') return <TypingGame vocab={vocab} onBack={() => setActiveGame(null)} />;
  if (activeGame === 'kana-invaders') return <KanaInvaders onBack={() => setActiveGame(null)} />;
  if (activeGame === 'word-search') return <WordSearch onBack={() => setActiveGame(null)} />;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Game Center</h2>
        <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg">Gamify your learning experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameList.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleGameSelect(game.id)}
            className="flex flex-col text-left bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800 group transition-all"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", game.color)}>
              <game.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">{game.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{game.description}</p>
            <div className="mt-6 flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-widest">
              Play Now <ChevronRight className="w-3 h-3" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
