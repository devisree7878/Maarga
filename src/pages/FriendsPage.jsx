import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Check, X, MessageCircle, Loader2, Users, Clock } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import {
  searchUsersByEmail,
  sendFriendRequest,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  fetchFriends,
  removeFriend,
} from '../services/friendsService';

const TABS = [
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'find', label: 'Find People' },
];

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sentTo, setSentTo] = useState(new Set());

  const reload = async () => {
    setLoading(true);
    const [f, inc, out] = await Promise.all([
      fetchFriends(user.id),
      fetchIncomingRequests(user.id),
      fetchOutgoingRequests(user.id),
    ]);
    setFriends(f);
    setIncoming(inc);
    setOutgoing(out);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (tab !== 'find') return;
    const t = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }
      setSearching(true);
      const rows = await searchUsersByEmail(query, user.id);
      setResults(rows);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, tab, user.id]);

  const handleSend = async (targetId) => {
    setMessage('');
    try {
      await sendFriendRequest(user.id, targetId);
      setSentTo((s) => new Set(s).add(targetId));
      reload();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAccept = async (requestId) => {
    await acceptFriendRequest(requestId);
    reload();
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    reload();
  };

  const handleCancel = async (requestId) => {
    await cancelFriendRequest(requestId);
    reload();
  };

  const handleRemove = async (friendshipId) => {
    if (!window.confirm('Remove this friend?')) return;
    await removeFriend(friendshipId);
    reload();
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const pendingOutgoingIds = new Set(outgoing.map((r) => r.addressee.id));

  return (
    <div>
      <Header title="Friends" subtitle="Connect with people on the same journey" />
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-2xl space-y-5">
        <div className="flex items-center gap-1 bg-[rgb(var(--surface-2))] rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                tab === t.key ? 'accent-bg text-white' : 'text-[rgb(var(--text-muted))]'
              }`}
            >
              {t.label}
              {t.key === 'requests' && incoming.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px]">{incoming.length}</span>
              )}
            </button>
          ))}
        </div>

        {message && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5">{message}</div>}

        {tab === 'find' && (
          <div>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))]" />
              <Input className="pl-9" placeholder="Search by email…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {searching && <p className="text-xs text-[rgb(var(--text-dim))] flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Searching…</p>}
            {!searching && query.trim().length >= 3 && results.length === 0 && (
              <p className="text-sm text-[rgb(var(--text-muted))]">No users found for "{query}".</p>
            )}
            <div className="space-y-2">
              {results.map((r) => {
                const isFriend = friendIds.has(r.id);
                const isPending = pendingOutgoingIds.has(r.id) || sentTo.has(r.id);
                return (
                  <Card key={r.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--text))]">{r.full_name || r.email}</p>
                      <p className="text-xs text-[rgb(var(--text-dim))]">{r.email}</p>
                    </div>
                    {isFriend ? (
                      <span className="text-xs font-medium text-emerald-400">Connected</span>
                    ) : isPending ? (
                      <span className="text-xs font-medium text-[rgb(var(--text-dim))] flex items-center gap-1"><Clock size={12} /> Pending</span>
                    ) : (
                      <Button size="sm" onClick={() => handleSend(r.id)}><UserPlus size={13} /> Send Request</Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-dim))] mb-2">Incoming</p>
              {loading ? (
                <Loader2 size={16} className="animate-spin text-[rgb(var(--text-dim))]" />
              ) : incoming.length === 0 ? (
                <p className="text-sm text-[rgb(var(--text-muted))]">No incoming requests.</p>
              ) : (
                <div className="space-y-2">
                  {incoming.map((r) => (
                    <Card key={r.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--text))]">{r.requester.full_name || r.requester.email}</p>
                        <p className="text-xs text-[rgb(var(--text-dim))]">sent you a friend request</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => handleAccept(r.id)}><Check size={13} /> Accept</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReject(r.id)}><X size={13} /> Reject</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-dim))] mb-2">Sent</p>
              {outgoing.length === 0 ? (
                <p className="text-sm text-[rgb(var(--text-muted))]">No pending sent requests.</p>
              ) : (
                <div className="space-y-2">
                  {outgoing.map((r) => (
                    <Card key={r.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--text))]">{r.addressee.full_name || r.addressee.email}</p>
                        <p className="text-xs text-[rgb(var(--text-dim))] flex items-center gap-1"><Clock size={11} /> Pending</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleCancel(r.id)}>Cancel</Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="space-y-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-[rgb(var(--text-dim))]" />
            ) : friends.length === 0 ? (
              <Card className="p-8 text-center">
                <Users size={26} className="mx-auto text-[rgb(var(--text-dim))] mb-3" />
                <p className="text-sm text-[rgb(var(--text-muted))]">No friends yet. Find people to connect with.</p>
              </Card>
            ) : (
              friends.map((f) => (
                <Card key={f.friendshipId} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text))]">{f.full_name || f.email}</p>
                    <p className="text-xs text-[rgb(var(--text-dim))]">{f.email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link to={`/chat/${f.id}`}>
                      <Button size="sm" variant="secondary"><MessageCircle size={13} /> Chat</Button>
                    </Link>
                    <Button size="sm" variant="danger" onClick={() => handleRemove(f.friendshipId)}>Remove</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
