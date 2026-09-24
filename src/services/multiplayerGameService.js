import { supabase } from '../supabaseClient';
import { generateQuestions } from './multiplayerQuestions';


function generateMatchCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}


function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Player'
  );
}


export async function createMultiplayerMatch(user) {
  let code = generateMatchCode();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await supabase
      .from('multiplayer_matches')
      .select('id')
      .eq('match_code', code)
      .maybeSingle();

    if (!data) {
      break;
    }

    code = generateMatchCode();
  }


  const { data, error } = await supabase.rpc(
    'create_multiplayer_match',
    {
      p_match_code: code,
      p_max_players: 3,
      p_total_questions: 10,
      p_display_name: getDisplayName(user),
    }
  );


  if (error) {
    throw error;
  }


  return data;
}


export async function joinMultiplayerMatch(user, matchCode) {
  const { data, error } = await supabase.rpc(
    'join_multiplayer_match',
    {
      p_match_code: matchCode.trim().toUpperCase(),
      p_display_name: getDisplayName(user),
    }
  );


  if (error) {
    throw error;
  }


  return data;
}


export async function getMatch(matchId) {
  const { data, error } = await supabase
    .from('multiplayer_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function getMatchPlayers(matchId) {
  const { data, error } = await supabase
    .from('multiplayer_match_players')
    .select('*')
    .eq('match_id', matchId)
    .order('joined_at', {
      ascending: true,
    });


  if (error) {
    throw error;
  }


  return data || [];
}


export async function getMatchQuestions(matchId) {
  const { data, error } = await supabase
    .from('multiplayer_questions')
    .select('*')
    .eq('match_id', matchId)
    .order('question_number', {
      ascending: true,
    });


  if (error) {
    throw error;
  }


  return data || [];
}


export async function startMultiplayerMatch(matchId) {
  const questions = generateQuestions(10);


  const { data, error } = await supabase.rpc(
    'start_multiplayer_match',
    {
      p_match_id: matchId,
      p_questions: questions,
    }
  );


  if (error) {
    throw error;
  }


  return data;
}


export async function submitMultiplayerAnswer({
  matchId,
  questionId,
  answer,
}) {
  const { data, error } = await supabase.rpc(
    'submit_multiplayer_answer',
    {
      p_match_id: matchId,
      p_question_id: questionId,
      p_answer: answer,
    }
  );


  if (error) {
    throw error;
  }


  return data;
}


export async function advanceMultiplayerQuestion(matchId) {
  const { data, error } = await supabase.rpc(
    'advance_multiplayer_question',
    {
      p_match_id: matchId,
    }
  );


  if (error) {
    return null;
  }


  return data;
}


export async function finalizeMultiplayerMatch(matchId) {
  const { data, error } = await supabase.rpc(
    'finalize_multiplayer_match',
    {
      p_match_id: matchId,
    }
  );


  if (error) {
    throw error;
  }


  return data;
}


export async function getWallet(userId) {
  const { data, error } = await supabase
    .rpc('ensure_game_wallet');


  if (error) {
    throw error;
  }


  return data;
}