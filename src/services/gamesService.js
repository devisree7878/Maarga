import { supabase } from '../lib/supabaseClient';

export const GAME_TYPES = {
  number_sequence: 'Number Sequence',
  memory_match: 'Memory Match',
  pattern_logic: 'Pattern Logic',
};

export async function recordGameSession(userId, { gameType, score, correctAnswers = 0, wrongAnswers = 0, durationSeconds = 0 }) {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_type: gameType,
      score,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      duration_seconds: durationSeconds,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save game session', error);
    return null;
  }
  return data;
}

export async function fetchMyGameSessions(userId, limit = 50) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load game sessions', error);
    return [];
  }
  return data || [];
}

export function summarizeGameSessions(sessions) {
  if (!sessions.length) {
    return { totalGames: 0, averageScore: 0, byType: {}, bestScore: 0 };
  }
  const byType = {};
  let totalScore = 0;
  let bestScore = 0;
  sessions.forEach((s) => {
    byType[s.game_type] = (byType[s.game_type] || 0) + 1;
    totalScore += s.score;
    if (s.score > bestScore) bestScore = s.score;
  });
  return {
    totalGames: sessions.length,
    averageScore: Math.round(totalScore / sessions.length),
    bestScore,
    byType,
  };
}
