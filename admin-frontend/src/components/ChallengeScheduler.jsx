import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  Shuffle,
  Sparkles,
  ArrowRight,
  Search,
  Loader2,
  AlertCircle,
  User,
  Film
} from 'lucide-react';
import {
  fetchScheduledChallenges,
  saveScheduledChallenge,
  deleteScheduledChallenge,
  searchActors,
  getTmdbImageUrl
} from '../api/adminClient';

export function ChallengeScheduler() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(null);

  // Form State
  const [formDate, setFormDate] = useState('');
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectingTargetFor, setSelectingTargetFor] = useState(null); // 'START' | 'TARGET' | null

  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [optimalHops, setOptimalHops] = useState(2);
  const [pathSummary, setPathSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    const data = await fetchScheduledChallenges();
    setChallenges(data);
    setLoading(false);
  };

  const handleOpenNew = () => {
    // Next available date
    const tomorrow = new Date(Date.now() + 86400000 * (challenges.length + 1)).toISOString().slice(0, 10);
    setEditingDate(null);
    setFormDate(tomorrow);
    setSelectedStart(null);
    setSelectedTarget(null);
    setOptimalHops(2);
    setPathSummary('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleEdit = (challenge) => {
    setEditingDate(challenge.date);
    setFormDate(challenge.date);
    setSelectedStart(challenge.startActor);
    setSelectedTarget(challenge.targetActor);
    setOptimalHops(challenge.optimalHops || 2);
    setPathSummary(challenge.pathSummary || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleDelete = async (date) => {
    if (!window.confirm(`Are you sure you want to delete the scheduled puzzle for ${date}?`)) return;
    await deleteScheduledChallenge(date);
    loadChallenges();
  };

  const handleActorSearch = async (q) => {
    setActorSearchQuery(q);
    const results = await searchActors(q);
    setSearchResults(results);
  };

  const handleSelectActor = (actor) => {
    if (selectingTargetFor === 'START') {
      setSelectedStart(actor);
    } else if (selectingTargetFor === 'TARGET') {
      setSelectedTarget(actor);
    }
    setSelectingTargetFor(null);
    setActorSearchQuery('');
  };

  const handleRandomCuratedPair = async () => {
    const actors = await searchActors('');
    if (actors.length < 2) return;
    const i1 = Math.floor(Math.random() * actors.length);
    let i2 = Math.floor(Math.random() * actors.length);
    while (i2 === i1) i2 = Math.floor(Math.random() * actors.length);
    setSelectedStart(actors[i1]);
    setSelectedTarget(actors[i2]);
    setOptimalHops(2);
    setPathSummary(`${actors[i1].name} ➔ Hollywood Co-Star Bridge ➔ ${actors[i2].name}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formDate) {
      setErrorMsg('Please specify a valid challenge date (YYYY-MM-DD).');
      return;
    }
    if (!selectedStart || !selectedTarget) {
      setErrorMsg('Please select both a Starting Star and a Target Star.');
      return;
    }
    if (selectedStart.id === selectedTarget.id) {
      setErrorMsg('Start Star and Target Star must be two different actors.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const isToday = formDate === today;

      await saveScheduledChallenge({
        date: formDate,
        startActor: selectedStart,
        targetActor: selectedTarget,
        optimalHops: Number(optimalHops || 2),
        pathSummary: pathSummary || `${selectedStart.name} ➔ Verified BFS Path ➔ ${selectedTarget.name}`,
        status: isToday ? 'ACTIVE_TODAY' : 'SCHEDULED'
      });

      setModalOpen(false);
      loadChallenges();
    } catch (err) {
      setErrorMsg('Failed to save challenge: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Beat Otara Daily Challenge Calendar
          </h2>
          <p className="text-xs text-slate-400">
            Schedule future Hollywood connection pairs, verify BFS shortest routes, and inspect live puzzle states.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule New Challenge</span>
        </button>
      </div>

      {/* Challenges Table */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e17] border-b border-cinema-border/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4">Starting Star</th>
                <th className="py-3.5 px-4">Target Star</th>
                <th className="py-3.5 px-4">Otara Hops</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border/50 text-slate-300">
              {challenges.map((c) => {
                const isToday = c.status === 'ACTIVE_TODAY';
                return (
                  <tr key={c.date} className="hover:bg-cinema-surface/50 transition">
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gold shrink-0" />
                        <span>{c.date}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getTmdbImageUrl(c.startActor?.profilePath)}
                          alt={c.startActor?.name}
                          className="h-10 w-10 rounded-full object-cover border border-cinema-border shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white block">{c.startActor?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {c.startActor?.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getTmdbImageUrl(c.targetActor?.profilePath)}
                          alt={c.targetActor?.name}
                          className="h-10 w-10 rounded-full object-cover border border-cinema-border shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white block">{c.targetActor?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {c.targetActor?.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gold/15 text-gold font-bold font-mono text-[11px] border border-gold/30">
                        {c.optimalHops} Hops
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {isToday ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>LIVE TODAY</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          SCHEDULED
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(c)}
                          title="Edit Challenge"
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-surface transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!isToday && (
                          <button
                            onClick={() => handleDelete(c.date)}
                            title="Delete Challenge"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-gold/40 bg-cinema-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-border/70">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-gold" />
                <h3 className="text-base font-extrabold text-white">
                  {editingDate ? `Edit Challenge for ${editingDate}` : 'Schedule New Daily Challenge'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                Cancel
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Target Date (UTC)
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                  required
                />
              </div>

              {/* Actor Pair Selection Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Start Star Card */}
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    1. Starting Star
                  </span>
                  {selectedStart ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={getTmdbImageUrl(selectedStart.profilePath)}
                        alt={selectedStart.name}
                        className="h-10 w-10 rounded-full object-cover border border-gold/40"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">{selectedStart.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingTargetFor('START');
                            handleActorSearch('');
                          }}
                          className="text-[10px] text-gold hover:underline"
                        >
                          Change Actor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectingTargetFor('START');
                        handleActorSearch('');
                      }}
                      className="w-full py-3 rounded-lg border border-dashed border-cinema-border hover:border-gold/50 text-xs text-slate-400 hover:text-white transition"
                    >
                      + Pick Starting Star
                    </button>
                  )}
                </div>

                {/* Target Star Card */}
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    2. Target Star
                  </span>
                  {selectedTarget ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={getTmdbImageUrl(selectedTarget.profilePath)}
                        alt={selectedTarget.name}
                        className="h-10 w-10 rounded-full object-cover border border-gold/40"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">{selectedTarget.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingTargetFor('TARGET');
                            handleActorSearch('');
                          }}
                          className="text-[10px] text-gold hover:underline"
                        >
                          Change Actor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectingTargetFor('TARGET');
                        handleActorSearch('');
                      }}
                      className="w-full py-3 rounded-lg border border-dashed border-cinema-border hover:border-gold/50 text-xs text-slate-400 hover:text-white transition"
                    >
                      + Pick Target Star
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Curated Random Generator */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRandomCuratedPair}
                  className="flex items-center gap-1.5 text-xs text-gold hover:underline font-bold"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>1-Click Generate Random Curated Pair</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Optimal Hops:</span>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={optimalHops}
                    onChange={(e) => setOptimalHops(e.target.value)}
                    className="w-16 rounded-lg border border-cinema-border bg-cinema-surface px-2 py-1 text-xs text-center font-bold text-gold focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Path Summary Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Otara&apos;s Solution / Path Description
                </label>
                <input
                  type="text"
                  value={pathSummary}
                  onChange={(e) => setPathSummary(e.target.value)}
                  placeholder="e.g. Tom Hanks ➔ Catch Me If You Can ➔ Leonardo DiCaprio"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gold focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-cinema-border bg-cinema-surface text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  <span>Save Challenge</span>
                </button>
              </div>
            </form>

            {/* Inner Actor Picker Drawer */}
            {selectingTargetFor && (
              <div className="mt-4 pt-4 border-t border-cinema-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Select {selectingTargetFor === 'START' ? 'Starting Star' : 'Target Star'}:
                  </span>
                  <button
                    onClick={() => setSelectingTargetFor(null)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Close Picker
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={actorSearchQuery}
                    onChange={(e) => handleActorSearch(e.target.value)}
                    placeholder="Search by actor name (e.g. Cillian Murphy)..."
                    className="w-full rounded-xl border border-cinema-border bg-cinema-surface pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gold focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {searchResults.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectActor(a)}
                      className="flex items-center gap-2 p-2 rounded-lg border border-cinema-border/60 bg-cinema-surface hover:border-gold/60 text-left transition"
                    >
                      <img
                        src={getTmdbImageUrl(a.profilePath)}
                        alt={a.name}
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                      />
                      <span className="text-xs font-bold text-white truncate block">{a.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
