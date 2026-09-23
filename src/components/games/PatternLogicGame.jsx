import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Loader2, Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { recordGameSession } from '../../services/gamesService';

const TOTAL_QUESTIONS = 6;
const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899'];

function Shape({ shape, color, size = 34 }) {
  const style = { width: size, height: size };
  if (shape === 'circle') return <div style={{ ...style, backgroundColor: color, borderRadius: '9999px' }} />;
  if (shape === 'square') return <div style={{ ...style, backgroundColor: color, borderRadius: 6 }} />;
  if (shape === 'diamond') return <div style={{ ...style, backgroundColor: color, borderRadius: 4, transform: 'rotate(45deg)' }} />;
  // triangle
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  );
}

// Builds a 3x3 grid where shape rotates cyclically across rows and color
// cycles across columns; one cell is left blank and four options are given.
function generateQuestion() {
  const shapeOrder = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, 3);
  const colorOrder = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 3);

  const grid = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid.push({ shape: shapeOrder[(r + c) % 3], color: colorOrder[c] });
    }
  }
  const missingIndex = Math.floor(Math.random() * 9);
  const answer = grid[missingIndex];

  const distractors = [];
  while (distractors.length < 3) {
    const candidate = { shape: SHAPES[Math.floor(Math.random() * SHAPES.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    const isAnswer = candidate.shape === answer.shape && candidate.color === answer.color;
    const isDup = distractors.some((d) => d.shape === candidate.shape && d.color === candidate.color);
    if (!isAnswer && !isDup) distractors.push(candidate);
  }
  const options = [...distractors, answer].sort(() => Math.random() - 0.5);

  return { grid, missingIndex, answer, options };
}

export default function PatternLogicGame({ onExit }) {
  const { user } = useAuth();
  const [questions] = useState(() => Array.from({ length: TOTAL_QUESTIONS }, generateQuestion));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = questions[index];
  const score = useMemo(() => Math.round((correct / TOTAL_QUESTIONS) * 100), [correct]);

  const choose = (option) => {
    if (feedback) return;
    const isCorrect = option.shape === q.answer.shape && option.color === q.answer.color;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);

    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= TOTAL_QUESTIONS) setFinished(true);
      else setIndex((i) => i + 1);
    }, 700);
  };

  useEffect(() => {
    if (!finished) return;
    setSaving(true);
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    recordGameSession(user.id, {
      gameType: 'pattern_logic',
      score,
      correctAnswers: correct,
      wrongAnswers: wrong,
      durationSeconds,
    }).finally(() => setSaving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <Trophy size={32} className="mx-auto accent-text mb-3" />
        <h2 className="text-lg font-bold text-[rgb(var(--text))] mb-1">Game Complete</h2>
        <p className="text-3xl font-black accent-text mb-4">{score}%</p>
        <p className="text-sm text-[rgb(var(--text-muted))] mb-6">{correct} correct · {wrong} wrong out of {TOTAL_QUESTIONS}</p>
        {saving && <p className="text-xs text-[rgb(var(--text-dim))] mb-3 flex items-center justify-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Saving score…</p>}
        <Button onClick={onExit} className="w-full">Back to Games</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 text-xs text-[rgb(var(--text-muted))] font-mono">
        <span>Question {index + 1} / {TOTAL_QUESTIONS}</span>
        <span>{correct} correct · {wrong} wrong</span>
      </div>

      <p className="text-sm text-[rgb(var(--text-muted))] mb-3">Which shape completes the pattern?</p>
      <div className="grid grid-cols-3 gap-2 w-fit mx-auto mb-6">
        {q.grid.map((cell, i) => (
          <div key={i} className="w-16 h-16 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))] flex items-center justify-center">
            {i === q.missingIndex ? (
              <span className="text-2xl font-black text-[rgb(var(--text-dim))]">?</span>
            ) : (
              <Shape shape={cell.shape} color={cell.color} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(opt)}
            disabled={!!feedback}
            className="aspect-square rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] flex items-center justify-center hover:border-[rgb(var(--accent))] transition-colors disabled:opacity-60"
          >
            <Shape shape={opt.shape} color={opt.color} />
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? <Check size={16} /> : <X size={16} />}
          {feedback === 'correct' ? 'Correct!' : 'Not quite right'}
        </div>
      )}
    </Card>
  );
}
