import { supabase } from '../lib/supabaseClient';

export async function searchUsersByEmail(query, myId) {
  const trimmed = query.trim();

  if (trimmed.length < 3) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('email', `%${trimmed}%`)
    .neq('id', myId)
    .limit(10);

  if (error) {
    console.error('User search failed', error);
    return [];
  }

  return data || [];
}

export async function sendFriendRequest(requesterId, addresseeId) {
  const { error } = await supabase
    .from('friend_requests')
    .insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: 'pending',
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('A request already exists between you and this user.');
    }

    if (error.message?.includes('no_self_request')) {
      throw new Error('You cannot send a request to yourself.');
    }

    throw error;
  }
}

export async function fetchIncomingRequests(myId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      status,
      created_at,
      requester:requester_id (
        id,
        full_name,
        email
      )
    `)
    .eq('addressee_id', myId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load incoming requests', error);
    return [];
  }

  return data || [];
}

export async function fetchOutgoingRequests(myId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      status,
      created_at,
      addressee:addressee_id (
        id,
        full_name,
        email
      )
    `)
    .eq('requester_id', myId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load outgoing requests', error);
    return [];
  }

  return data || [];
}

export async function acceptFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('Failed to accept friend request', error);
    throw error;
  }
}

export async function rejectFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
}

/*
 * Return accepted friends directly from friend_requests.
 *
 * requester_id = the person who sent the request
 * addressee_id = the person who received it
 */
export async function fetchFriends(myId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      requester_id,
      addressee_id,
      status,
      created_at
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

  if (error) {
    console.error('Failed to load friends', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get the other user's IDs
  const friendIds = data.map((row) =>
    row.requester_id === myId
      ? row.addressee_id
      : row.requester_id
  );

  // Load profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', friendIds);

  if (profileError) {
    console.error('Failed to load friend profiles', profileError);
    return [];
  }

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  return data
    .map((row) => {
      const friendId =
        row.requester_id === myId
          ? row.addressee_id
          : row.requester_id;

      const friend = profileMap.get(friendId);

      if (!friend) return null;

      return {
        friendshipId: row.id,
        ...friend,
      };
    })
    .filter(Boolean);
}

export async function removeFriend(friendshipId) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', friendshipId);

  if (error) throw error;
}