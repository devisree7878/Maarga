import { supabase } from '../lib/supabaseClient';

export async function fetchConversation(myId, friendId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${myId})`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('Failed to load messages', error);
    return [];
  }
  return data || [];
}

export async function sendMessage(myId, friendId, message) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: myId, receiver_id: friendId, message: trimmed })
    .select()
    .single();
  if (error) {
    console.error('Failed to send message', error);
    throw error;
  }
  return data;
}

// Subscribes to new messages between myId and friendId via Supabase
// Realtime. Returns an unsubscribe function. If Realtime isn't enabled for
// the `messages` table in the Supabase dashboard, this simply never fires —
// the app still works via the initial fetch + manual refetch after sending.
export function subscribeToConversation(myId, friendId, onInsert) {
  const channel = supabase
    .channel(`messages:${[myId, friendId].sort().join(':')}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const m = payload.new;
        const isThisConversation =
          (m.sender_id === myId && m.receiver_id === friendId) ||
          (m.sender_id === friendId && m.receiver_id === myId);
        if (isThisConversation) onInsert(m);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markConversationRead(myId, friendId) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', friendId)
    .eq('receiver_id', myId)
    .is('read_at', null);
  if (error) console.error('Failed to mark messages read', error);
}
