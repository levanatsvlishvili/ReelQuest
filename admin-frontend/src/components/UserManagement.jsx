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
  History,
  CreditCard,
  AlertTriangle,
  Receipt,
  X,
  Trash2
} from 'lucide-react';
import {
  fetchUsersList,
  updateUserTier,
  updateUserStatus,
  resetUserStreak,
  fetchUserSubscription,
  cancelUserSubscription,
  suspendUserSubscription,
  retryUserSubscriptionCharge,
  saveAdminSubscription
} from '../api/adminClient';

export function UserManagement({ onInspectUserHistory }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');

  const [selectedUserForBilling, setSelectedUserForBilling] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingActionMsg, setBillingActionMsg] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filterTier]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsersList(searchQuery, filterTier);
    setUsers(data);
    setLoading(false);
  };

  const handleOpenBilling = async (user) => {
    setSelectedUserForBilling(user);
    setBillingLoading(true);
    setBillingActionMsg(null);
    const sub = await fetchUserSubscription(user.id, user.email, user.tier === 'PRO');
    setSubscriptionData(sub);
    setBillingLoading(false);
  };

  const handleAdminRetryCharge = async (forceSuccess = true) => {
    if (!selectedUserForBilling) return;
    setBillingLoading(true);
    const updated = await retryUserSubscriptionCharge(selectedUserForBilling.id, selectedUserForBilling.email, forceSuccess);
    setSubscriptionData(updated);
    setBillingLoading(false);
    setBillingActionMsg(forceSuccess ? 'Monthly charge ($3.00) processed successfully.' : 'Payment declined recorded. Dunning retry count incremented.');
    loadUsers();
  };

  const handleAdminSuspend = async () => {
    if (!selectedUserForBilling) return;
    setBillingLoading(true);
    const updated = await suspendUserSubscription(selectedUserForBilling.id);
    await updateUserTier(selectedUserForBilling.id, 'FREE');
    setSubscriptionData(updated);
    setBillingLoading(false);
    setBillingActionMsg('Subscription suspended and user demoted to Free tier.');
    loadUsers();
  };

  const handleAdminCancel = async () => {
    if (!selectedUserForBilling) return;
    setBillingLoading(true);
    const updated = await cancelUserSubscription(selectedUserForBilling.id, true);
    setSubscriptionData(updated);
    setBillingLoading(false);
    setBillingActionMsg('Subscription canceled.');
    loadUsers();
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

                          <button
                            onClick={() => handleOpenBilling(u)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-cinema-border/80 bg-cinema-surface hover:text-gold hover:border-gold/40 text-slate-300 flex items-center gap-1 transition"
                            title="Inspect & Manage Billing, Cards and Subscriptions"
                          >
                            <CreditCard className="h-3 w-3 text-gold" />
                            <span>Billing</span>
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

      {selectedUserForBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cinema-border/90 bg-gradient-to-b from-cinema-card via-[#0b0e17] to-cinema-black p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setSelectedUserForBilling(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-cinema-border/60 pb-4">
              <div className="h-10 w-10 rounded-xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-extrabold text-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    {selectedUserForBilling.username} &bull; Billing CRM
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                    subscriptionData?.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : subscriptionData?.status === 'PAST_DUE'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : subscriptionData?.status === 'SUSPENDED'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {subscriptionData?.status || 'INACTIVE'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedUserForBilling.email} &bull; ID: {selectedUserForBilling.id}
                </span>
              </div>
            </div>

            {billingActionMsg && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{billingActionMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan & Price</span>
                <span className="font-extrabold text-white text-sm">ReelQuest Pro</span>
                <span className="text-[11px] text-gold font-bold block">$3.00 / month</span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Renewal Date</span>
                <span className="font-bold text-white text-sm">
                  {subscriptionData?.currentPeriodEnd ? subscriptionData.currentPeriodEnd.slice(0, 10) : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {subscriptionData?.cancelAtPeriodEnd ? 'Cancels at Period End' : 'Auto-Renewing Monthly'}
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dunning / Retries</span>
                <span className="font-bold text-white text-sm">
                  Attempt {subscriptionData?.retryCount || 0} of 3
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {subscriptionData?.retryCount >= 3 ? 'Suspended' : subscriptionData?.retryCount > 0 ? 'Past Due' : 'Healthy'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Attached Payment Cards
                </span>
                <span className="text-[10px] text-slate-500">
                  {subscriptionData?.cards?.length || 0} Cards
                </span>
              </div>

              {subscriptionData?.cards && subscriptionData.cards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {subscriptionData.cards.map(card => (
                    <div
                      key={card.id}
                      className={`rounded-xl border p-3 flex items-center justify-between text-xs ${
                        card.isDefault
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-cinema-border/70 bg-cinema-surface/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gold shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-white block">
                            {card.brand} &bull;&bull;&bull;&bull; {card.last4}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Exp {String(card.expMonth).padStart(2, '0')}/{card.expYear} &bull; {card.cardholderName}
                          </span>
                        </div>
                      </div>

                      {card.isDefault ? (
                        <span className="rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-[9px] font-black text-gold">
                          DEFAULT
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Secondary</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-cinema-border/70 p-4 text-center text-xs text-slate-500">
                  No cards attached to this user.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Invoice & Transaction History
                </span>
                <span className="text-[10px] text-slate-500">
                  {subscriptionData?.invoices?.length || 0} Invoices
                </span>
              </div>

              {subscriptionData?.invoices && subscriptionData.invoices.length > 0 ? (
                <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/40 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-cinema-border/60 text-[10px] text-slate-400 font-bold uppercase bg-black/40">
                      <tr>
                        <th className="p-2.5">Invoice ID</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Card</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cinema-border/30">
                      {subscriptionData.invoices.map((inv, i) => (
                        <tr key={i} className="hover:bg-cinema-surface/50">
                          <td className="p-2.5 font-mono text-slate-300">{inv.id}</td>
                          <td className="p-2.5 text-slate-400">{inv.date ? inv.date.slice(0, 10) : ''}</td>
                          <td className="p-2.5 font-mono font-bold text-gold">{inv.amount || '$3.00'}</td>
                          <td className="p-2.5 text-slate-400 text-[11px]">{inv.paymentMethod}</td>
                          <td className="p-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-cinema-border/70 p-4 text-center text-xs text-slate-500">
                  No invoices recorded.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-cinema-border/60 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdminRetryCharge(true)}
                  disabled={billingLoading}
                  className="px-3.5 py-2 rounded-xl bg-gold text-xs font-black text-cinema-black hover:opacity-90 transition shadow-gold-glow"
                >
                  Charge / Retry $3.00
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminRetryCharge(false)}
                  disabled={billingLoading}
                  className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                  title="Simulate Stripe card decline and advance retry attempt"
                >
                  Simulate Decline
                </button>
              </div>

              <div className="flex items-center gap-2">
                {subscriptionData?.status !== 'SUSPENDED' && (
                  <button
                    type="button"
                    onClick={handleAdminSuspend}
                    disabled={billingLoading}
                    className="px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                  >
                    Suspend Sub
                  </button>
                )}
                {subscriptionData?.status !== 'CANCELED' && (
                  <button
                    type="button"
                    onClick={handleAdminCancel}
                    disabled={billingLoading}
                    className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
                  >
                    Cancel Sub
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
