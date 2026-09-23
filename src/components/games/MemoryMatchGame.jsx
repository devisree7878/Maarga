import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { Brain, Star, Heart, Zap, Sun, Moon, Cloud, Leaf, Flame, Gem, Anchor, Feather } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { recordGameSession } from '../../services/gamesService';

const ICONS = [Brain, Star, Heart, Zap, Sun, Moon, Cloud, Leaf, Flame, Gem, Anchor, Feather];
const PAIR_COUNT = 8; // 16 cards, 4x4 grid

function shuffledDeck() {
  const chosen = ICONS.slice(0, PAIR_COUNT);
  const deck = [...chosen, ...chosen].map((Icon, i) => ({ id: `${i}-${Math.random()}`, Icon, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((c, i) => ({ ...c, pos: i }));
}

export default function MemoryMatchGame({ onExit }) {
  const { user } = useAuth();
  const [deck, setDeck] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState([]); // indices currently flipped, max 2
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);

  const score = useMemo(() => {
    // Fewer moves for the same number of pairs = higher score, capped 0-100.
    const ideal = PAIR_COUNT;
    const raw = Math.round((ideal / Math.max(moves, ideal)) * 100);
    return Math.max(0, Math.min(100, raw));
  }, [moves]);

  const handleFlip = (index) => {
    if (locked) return;
    if (deck[index].matched) return;
    if (flipped.includes(index)) return;
    if (flipped.length === 2) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].Icon === deck[b].Icon) {
        setTimeout(() => {
          setDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setMatchedCount((c) => c + 1);
          setFlipped([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (matchedCount === PAIR_COUNT) setFinished(true);
  }, [matchedCount]);

  useEffect(() => {
    if (!finished) return;
    setSaving(true);
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    recordGameSession(user.id, {
      gameType: 'memory_match',
      score,
      correctAnswers: matchedCount,
      wrongAnswers: Math.max(moves - matchedCount, 0),
      durationSeconds,
    }).finally(() => setSaving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <Trophy size={32} className="mx-auto accent-text mb-3" />
        <h2 className="text-lg font-bold text-[rgb(var(--text))] mb-1">All Pairs Matched!</h2>
        <p className="text-3xl font-black accent-text mb-4">{score}%</p>
        <p className="text-sm text-[rgb(var(--text-muted))] mb-6">{moves} moves · {PAIR_COUNT} pairs</p>
        {saving && <p className="text-xs text-[rgb(var(--text-dim))] mb-3 flex items-center justify-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Saving score…</p>}
        <Button onClick={onExit} className="w-full">Back to Games</Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 text-xs text-[rgb(var(--text-muted))] font-mono">
        <span>Moves: {moves}</span>
        <span>Matched: {matchedCount} / {PAIR_COUNT}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {deck.map((card, i) => {
          const isFlipped = card.matched || flipped.includes(i);
          const Icon = card.Icon;
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(i)}
              className={`aspect-square rounded-xl flex items-center justify-center border transition-all duration-200 ${
                isFlipped
                  ? 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]'
                  : 'accent-gradient border-transparent hover:brightness-110 active:scale-95'
              }`}
            >
              {isFlipped ? (
                <Icon size={22} className={card.matched ? 'text-emerald-400' : 'accent-text'} />
              ) : (
                <span className="text-white/70 font-bold text-lg">?</span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
