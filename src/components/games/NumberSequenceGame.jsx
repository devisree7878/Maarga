import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, Trophy, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Input } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { recordGameSession } from '../../services/gamesService';

const TOTAL_QUESTIONS = 8;

// Generates one of several sequence "families" so questions vary each run.
function generateQuestion() {
  const kinds = ['arithmetic', 'geometric', 'squares', 'fibonacciLike', 'alternating'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const seq = [];
  let answer;

  if (kind === 'arithmetic') {
    const start = 1 + Math.floor(Math.random() * 10);
    const step = 1 + Math.floor(Math.random() * 8);
    for (let i = 0; i < 5; i++) seq.push(start + step * i);
    answer = start + step * 5;
  } else if (kind === 'geometric') {
    const start = 1 + Math.floor(Math.random() * 4);
    const ratio = 2 + Math.floor(Math.random() * 2);
    let v = start;
    for (let i = 0; i < 5; i++) { seq.push(v); v *= ratio; }
    answer = v;
  } else if (kind === 'squares') {
    const start = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < 5; i++) seq.push((start + i) * (start + i));
    answer = (start + 5) * (start + 5);
  } else if (kind === 'fibonacciLike') {
    let a = 1 + Math.floor(Math.random() * 3);
    let b = 1 + Math.floor(Math.random() * 3);
    seq.push(a, b);
    for (let i = 0; i < 3; i++) { const c = a + b; seq.push(c); a = b; b = c; }
    answer = a + b;
  } else {
    const base = 1 + Math.floor(Math.random() * 5);
    const delta = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < 5; i++) seq.push(i % 2 === 0 ? base + i * delta : base - Math.floor(i / 2));
    answer = seq[4] + (seq[4] - seq[2]);
  }

  return { sequence: seq, answer };
}

export default function NumberSequenceGame({ onExit }) {
  const { user } = useAuth();
  const [questions] = useState(() => Array.from({ length: TOTAL_QUESTIONS }, generateQuestion));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = questions[index];
  const score = useMemo(() => Math.round((correct / TOTAL_QUESTIONS) * 100), [correct]);

  const submit = (e) => {
    e.preventDefault();
    if (feedback) return;
    const isCorrect = Number(value) === q.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);

    setTimeout(() => {
      setFeedback(null);
      setValue('');
      if (index + 1 >= TOTAL_QUESTIONS) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }
    }, 700);
  };

  useEffect(() => {
    if (!finished) return;
    setSaving(true);
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    recordGameSession(user.id, {
      gameType: 'number_sequence',
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

      <p className="text-sm text-[rgb(var(--text-muted))] mb-3">What comes next?</p>
      <div className="flex items-center gap-2 flex-wrap font-mono text-2xl md:text-3xl font-black text-[rgb(var(--text))] mb-6">
        {q.sequence.map((n, i) => (
          <span key={i} className="px-3 py-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-soft))]">{n}</span>
        ))}
        <span className="px-3 py-2 rounded-xl border-2 border-dashed accent-border">?</span>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          type="number"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your answer"
          disabled={!!feedback}
        />
        <Button type="submit" disabled={!!feedback || value === ''}>Submit</Button>
      </form>

      {feedback && (
        <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? <Check size={16} /> : <X size={16} />}
          {feedback === 'correct' ? 'Correct!' : `Not quite — it was ${q.answer}`}
        </div>
      )}
    </Card>
  );
}
