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
  Sparkles,
  RefreshCw,
  History
} from 'lucide-react';
import {
  fetchUsersList,
  updateUserTier,
  updateUserStatus,
  resetUserStreak
} from '../api/adminClient';

export function UserManagement({ onInspectUserHistory }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');

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

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            User Directory & Access Management
          </h2>
          <p className="text-xs text-slate-400">
            Real registered players and administrator accounts retrieved from live AWS authentication and leaderboard telemetry.
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
              placeholder="Search username, email or ID..."
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
            <option value="PRO">PRO Members</option>
            <option value="FREE">Free Tier</option>
          </select>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-xl border border-cinema-border/80 bg-cinema-card text-slate-400 hover:text-white hover:border-gold/40 transition"
            title="Refresh Users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e17] border-b border-cinema-border/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User Account</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">High Score</th>
                <th className="py-3.5 px-4">Account Origin</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border/50 text-slate-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                    No users matching criteria found in this environment.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isPro = u.tier === 'PRO';
                  const isBanned = u.status === 'BANNED';
                  const isAdmin = u.role === 'ADMINISTRATOR';

                  return (
                    <tr key={u.id} className="hover:bg-cinema-surface/50 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            isAdmin
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-glow'
                              : isPro
                              ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.username ? u.username.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{u.username}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[220px]">
                              {u.email}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono block truncate max-w-[220px]">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          isAdmin
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.role || 'PLAYER'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-gold/15 border border-gold/40 text-gold shadow-gold-glow">
                            <Crown className="h-3 w-3" />
                            <span>PRO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400">
                            FREE
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            <Ban className="h-3 w-3" />
                            <span>BANNED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-gold">
                        {u.bestScore ? `${u.bestScore.toLocaleString()} pts` : '-'}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-400 text-[10px]">
                        {u.joinedAt || 'Active'}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onInspectUserHistory && onInspectUserHistory(u.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-cinema-border/80 bg-cinema-surface hover:text-gold hover:border-gold/40 text-slate-300 flex items-center gap-1 transition"
                            title="View Player Match History"
                          >
                            <History className="h-3 w-3 text-gold" />
                            <span>Matches</span>
                          </button>

                          {!isAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleTier(u)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                  isPro
                                    ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                                    : 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25'
                                }`}
                              >
                                {isPro ? 'Demote' : 'Promote Pro'}
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
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
