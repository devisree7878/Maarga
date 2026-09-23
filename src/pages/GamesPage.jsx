import React, { useEffect, useState } from 'react';
import { Hash, Grid3x3, Puzzle, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { fetchMyGameSessions, GAME_TYPES } from '../services/gamesService';
import NumberSequenceGame from '../components/games/NumberSequenceGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import PatternLogicGame from '../components/games/PatternLogicGame';

const GAMES = [
  { key: 'number_sequence', title: 'Number Sequence', desc: 'Spot the pattern and predict what comes next.', icon: Hash },
  { key: 'memory_match', title: 'Memory Match', desc: 'Flip cards and find every matching pair.', icon: Grid3x3 },
  { key: 'pattern_logic', title: 'Pattern Logic', desc: 'Identify the missing shape in the pattern.', icon: Puzzle },
];

export default function GamesPage() {
  const { user } = useAuth();
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyGameSessions(user.id, 10).then((rows) => {
      if (!cancelled) {
        setHistory(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, reloadKey]);

  const exitGame = () => {
    setActive(null);
    setReloadKey((k) => k + 1);
  };

  if (active === 'number_sequence') return <div className="px-4 md:px-8 py-8"><NumberSequenceGame onExit={exitGame} /></div>;
  if (active === 'memory_match') return <div className="px-4 md:px-8 py-8"><MemoryMatchGame onExit={exitGame} /></div>;
  if (active === 'pattern_logic') return <div className="px-4 md:px-8 py-8"><PatternLogicGame onExit={exitGame} /></div>;

  return (
    <div>
      <Header title="Brain Games" subtitle="Train your mind with quick IQ challenges" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {GAMES.map((g) => (
            <Card key={g.key} className="p-5 flex flex-col">
              <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shadow-glow mb-4">
                <g.icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-[rgb(var(--text))] mb-1">{g.title}</p>
              <p className="text-xs text-[rgb(var(--text-muted))] mb-4 flex-1">{g.desc}</p>
              <button
                onClick={() => setActive(g.key)}
                className="w-full py-2.5 rounded-xl accent-bg text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Play
              </button>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text))] mb-3">Recent Sessions</h2>
          <Card className="divide-y divide-[rgb(var(--border-soft))]">
            {loading ? (
              <div className="p-6 flex items-center justify-center text-[rgb(var(--text-dim))]"><Loader2 size={16} className="animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="p-6 text-sm text-[rgb(var(--text-muted))] text-center">No games played yet. Play one above to start tracking your performance.</p>
            ) : (
              history.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text))]">{GAME_TYPES[s.game_type] || s.game_type}</p>
                    <p className="text-xs text-[rgb(var(--text-dim))]">{new Date(s.completed_at).toLocaleString()} · {s.duration_seconds}s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold accent-text">{s.score}%</p>
                    <p className="text-[11px] text-[rgb(var(--text-dim))]">{s.correct_answers}✓ / {s.wrong_answers}✗</p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
