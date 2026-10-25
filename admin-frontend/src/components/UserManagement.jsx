import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Crown,
  Shield,
  Ban,
  CheckCircle,
  Flame,
  Swords,
  Trophy,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  fetchUsersList,
  updateUserTier,
  updateUserStatus,
  resetUserStreak
} from '../api/adminClient';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filterTier]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsersList(searchQuery, filterTier);
    setUsers(data);
    setLoading(false);
  };

  const handleToggleTier = async (user) => {
    const nextTier = user.tier === 'PRO' ? 'FREE' : 'PRO';
    await updateUserTier(user.id, nextTier);
    loadUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to set status of ${user.username} to ${nextStatus}?`)) return;
    await updateUserStatus(user.id, nextStatus);
    loadUsers();
  };

  const handleEditStreak = async (user) => {
    const nextStreak = window.prompt(`Enter new daily streak for ${user.username}:`, user.streak);
    if (nextStreak !== null && !isNaN(Number(nextStreak))) {
      await resetUserStreak(user.id, Number(nextStreak));
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            User Directory & Pro Subscription CRM
          </h2>
          <p className="text-xs text-slate-400">
            Search registered cinephiles, inspect match histories, manage Pro subscriptions, and handle account moderation.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search username or email..."
              className="w-full rounded-xl border border-cinema-border bg-cinema-card pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="rounded-xl border border-cinema-border bg-cinema-card px-3 py-2 text-xs font-bold text-slate-300 focus:border-gold focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="PRO">PRO Members Only</option>
            <option value="FREE">Free Tier Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e17] border-b border-cinema-border/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Cinephile User</th>
                <th className="py-3.5 px-4">Tier Status</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Daily Streak</th>
                <th className="py-3.5 px-4">Beat Otara Stats</th>
                <th className="py-3.5 px-4">1v1 Duels Won</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border/50 text-slate-300">
              {users.map((u) => {
                const isPro = u.tier === 'PRO';
                const isBanned = u.status === 'BANNED';
                return (
                  <tr key={u.id} className="hover:bg-cinema-surface/50 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          isPro ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">{u.username}</span>
                          <span className="text-[10px] text-slate-500 font-mono block truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isPro ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gold/15 border border-gold/40 text-gold shadow-gold-glow">
                          <Crown className="h-3 w-3" />
                          <span>PRO VIP</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          FREE
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <Ban className="h-3 w-3" />
                          <span>BANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleEditStreak(u)}
                        title="Click to manually edit streak"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cinema-surface hover:border-gold/40 border border-cinema-border/60 text-xs font-mono font-bold text-amber-400 transition"
                      >
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        <span>{u.streak} days</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="text-white font-bold">{u.gamesWon}</span>
                      <span className="text-slate-500"> / {u.gamesPlayed} won</span>
                      <span className="text-[10px] text-gold block">Best: {u.bestHops} hops</span>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 font-bold text-white">
                        <Swords className="h-3.5 w-3.5 text-amber-400" />
                        <span>{u.duelsWon} wins</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleTier(u)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                            isPro
                              ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                              : 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25'
                          }`}
                        >
                          {isPro ? 'Revoke Pro' : 'Grant Pro'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition ${
                            isBanned
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                          title={isBanned ? 'Unban Account' : 'Ban Account'}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
