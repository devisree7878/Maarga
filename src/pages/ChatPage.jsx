import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { fetchConversation, sendMessage, subscribeToConversation, markConversationRead } from '../services/messagesService';
import { fetchFriends } from '../services/friendsService';

export default function ChatPage() {
  const { friendId } = useParams();
  const { user } = useAuth();
  const [friend, setFriend] = useState(null);
  const [isFriend, setIsFriend] = useState(null); // null = checking
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const friends = await fetchFriends(user.id);
      const match = friends.find((f) => f.id === friendId);
      if (cancelled) return;
      setIsFriend(!!match);
      setFriend(match || null);
      if (match) {
        const rows = await fetchConversation(user.id, friendId);
        if (cancelled) return;
        setMessages(rows);
        markConversationRead(user.id, friendId);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, friendId]);

  useEffect(() => {
    if (!isFriend) return undefined;
    const unsubscribe = subscribeToConversation(user.id, friendId, (m) => {
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
      if (m.sender_id === friendId) markConversationRead(user.id, friendId);
    });
    return unsubscribe;
  }, [isFriend, user.id, friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setText('');
    try {
      const saved = await sendMessage(user.id, friendId, value);
      // Fall back to appending locally in case Realtime isn't enabled for
      // this table — subscribeToConversation's dedupe-by-id keeps this safe
      // even if the Realtime event also arrives.
      if (saved) setMessages((prev) => (prev.some((p) => p.id === saved.id) ? prev : [...prev, saved]));
    } catch (err) {
      setText(value);
    } finally {
      setSending(false);
    }
  };

  if (!loading && isFriend === false) {
    return <Navigate to="/friends" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title={friend ? friend.full_name || friend.email : 'Chat'} subtitle={friend ? 'Connected friend' : undefined} />
      <div className="flex items-center gap-2 px-4 md:px-8 pt-1 pb-3">
        <Link to="/friends" className="text-xs flex items-center gap-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
          <ArrowLeft size={13} /> Back to Friends
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 space-y-2 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[rgb(var(--text-dim))]"><Loader2 size={18} className="animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-muted))] text-center mt-10">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                    mine ? 'accent-bg text-white rounded-br-sm' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] rounded-bl-sm'
                  }`}
                >
                  {m.message}
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-[rgb(var(--text-dim))]'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-[rgb(var(--border-soft))] px-4 md:px-8 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl px-3.5 py-2.5 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-dim))] focus:outline-none focus:ring-2 accent-ring"
        />
        <Button type="submit" disabled={sending || !text.trim()}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
