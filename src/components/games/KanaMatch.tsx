import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { hiragana, katakana } from '../../lib/constants';

export const KanaMatch = ({ onBack }: { onBack: () => void }) => {
  const [cards, setCards] = useState<{ id: number; content: string; type: 'kana' | 'romaji'; matched: boolean; flipped: boolean; pairId: number }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = useCallback(() => {
    const pool = hiragana.concat(katakana);
    const selected = [];
    const usedIndices = new Set();
    while (selected.length < 8) {
      const idx = Math.floor(Math.random() * pool.length);
      if (!usedIndices.has(idx)) {
        selected.push(pool[idx]);
        usedIndices.add(idx);
      }
    }

    const gameCards: any[] = [];
    selected.forEach((item, idx) => {
      gameCards.push({ id: idx * 2, content: item.kana, type: 'kana', matched: false, flipped: false, pairId: idx });
      gameCards.push({ id: idx * 2 + 1, content: item.romaji, type: 'romaji', matched: false, flipped: false, pairId: idx });
    });

    setCards(gameCards.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || cards.find(c => c.id === id)?.flipped || cards.find(c => c.id === id)?.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [id1, id2] = newFlipped;
      const card1 = cards.find(c => c.id === id1)!;
      const card2 = cards.find(c => c.id === id2)!;

      if (card1.pairId === card2.pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, matched: true } : c));
          setFlipped([]);
          setMatches(prev => {
            const next = prev + 1;
            if (next === 8) setGameOver(true);
            return next;
          });
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 shadow-sm transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Kana Match</h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-xs">Match the Kana with its Romaji.</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Moves</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{moves}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Matches</div>
            <div className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{matches}/8</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <motion.button
            key={card.id}
            whileHover={!card.matched && !card.flipped ? { scale: 1.05 } : {}}
            whileTap={!card.matched && !card.flipped ? { scale: 0.95 } : {}}
            onClick={() => handleFlip(card.id)}
            className={cn(
              "aspect-square rounded-3xl flex items-center justify-center text-3xl font-bold transition-all duration-500 preserve-3d relative shadow-lg",
              card.flipped || card.matched ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rotate-y-180" : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
            )}
          >
            {(card.flipped || card.matched) ? card.content : '?'}
          </motion.button>
        ))}
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-10 rounded-[3rem] text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-3xl font-editorial italic mb-2">Well Done!</h3>
          <p className="text-stone-400 dark:text-stone-500 mb-8">You finished in {moves} moves.</p>
          <button onClick={initGame} className="px-10 py-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">Play Again</button>
        </motion.div>
      )}
    </div>
  );
};
