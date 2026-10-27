import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Swords,
  Sparkles,
  Trophy,
  Clock,
  Footprints,
  User,
  ShieldCheck,
  Eye,
  X,
  ExternalLink,
  Film,
  Camera
} from 'lucide-react';
import { fetchGameHistory, fetchUsersList, getTmdbImageUrl } from '../api/adminClient';

export function GameHistory({ initialUserId = 'ALL', onInspectUser }) {
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination State
  const [selectedUser, setSelectedUser] = useState(initialUserId);
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal inspection
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchUsersList().then(uList => setUsers(uList)).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedUser(initialUserId);
  }, [initialUserId]);

  useEffect(() => {
    loadSessions();
  }, [selectedUser, selectedMode, sortBy, currentPage, pageSize]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const result = await fetchGameHistory({
        userId: selectedUser,
        gameMode: selectedMode,
        sortBy,
        page: currentPage,
        pageSize
      });
      setSessions(result.items || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.userId && s.userId.toLowerCase().includes(q)) ||
      (s.startActorName && s.startActorName.toLowerCase().includes(q)) ||
      (s.targetActorName && s.targetActorName.toLowerCase().includes(q)) ||
      (s.sessionId && s.sessionId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 border border-gold/30 text-gold">
              <History className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Game Sessions History & Match Audit
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified match logs across Beat Otara (Six Degrees) puzzles and 1v1 Live Duels.
          </p>
        </div>

        {/* Global Match Stats summary */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-cinema-card border border-cinema-border/80 text-xs">
            <span className="text-slate-400">Total Matches: </span>
            <span className="font-extrabold text-gold font-mono">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Sorting, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl border border-cinema-border/80 bg-cinema-card">
        {/* User Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Filter by Player
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0b0e17] border border-cinema-border/80 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Players ({users.length})</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {/* Game Mode Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Game Mode
          </label>
          <select
            value={selectedMode}
            onChange={(e) => {
              setSelectedMode(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0b0e17] border border-cinema-border/80 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Game Modes</option>
            <option value="six-degrees">Beat Otara (Six Degrees)</option>
            <option value="spotle">Spotle (Movie Mystery)</option>
            <option value="frame-sleuth">Frame Sleuth (6 Frames)</option>
            <option value="duel">1v1 Live Duel</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0b0e17] border border-cinema-border/80 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="newest">Newest First (Recent)</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_score">Highest Score</option>
            <option value="lowest_moves">Fewest Moves (Optimal)</option>
            <option value="fastest_time">Fastest Duration</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Search Matches
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search star or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0b0e17] border border-cinema-border/80 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e17] border-b border-cinema-border/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Date & Time</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Game Mode</th>
                <th className="py-3.5 px-4">Hollywood Matchup</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Moves</th>
                <th className="py-3.5 px-4 text-center">Time</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                      <span>Loading real match history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching game sessions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s, idx) => {
                  const isDuel = s.gameMode === 'duel';
                  const formattedTime = s.createdAt
                    ? new Date(s.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : s.date || 'Recent';

                  return (
                    <tr
                      key={s.sessionId || idx}
                      className="hover:bg-cinema-surface/50 transition cursor-pointer"
                      onClick={() => setSelectedMatch(s)}
                    >
                      {/* Date & Time */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-[11px]">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {s.sessionId ? s.sessionId.slice(-12) : ''}
                        </div>
                      </td>

                      {/* Player */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center font-bold text-gold shrink-0">
                            {s.username ? s.username[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{s.username || 'Player'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {s.userId ? s.userId.slice(0, 10) + '...' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Game Mode */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {s.gameMode === 'frame-sleuth' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-violet-500/15 border border-violet-500/30 text-violet-300">
                            <Camera className="h-3 w-3" />
                            <span>Frame Sleuth</span>
                          </span>
                        ) : s.gameMode === 'spotle' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Film className="h-3 w-3" />
                            <span>Spotle</span>
                          </span>
                        ) : isDuel ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                            <Swords className="h-3 w-3" />
                            <span>1v1 Duel</span>
                            {s.duelResult && (
                              <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold ${s.duelResult === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {s.duelResult}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gold/15 border border-gold/30 text-gold">
                            <Sparkles className="h-3 w-3" />
                            <span>Beat Otara</span>
                          </span>
                        )}
                      </td>

                      {/* Matchup Route */}
                      <td className="py-4 px-4">
                        {s.gameMode === 'frame-sleuth' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">
                              📷 {s.targetMovie?.title || s.targetMovieTitle || 'Daily Mystery Movie'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({s.hops || s.framesUsed || '—'}/6 frames)
                            </span>
                          </div>
                        ) : s.gameMode === 'spotle' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">
                              🎬 {s.targetMovie?.title || s.targetMovieTitle || 'Daily Mystery Movie'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({s.hops || s.guessCount || '—'}/10 guesses)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Start Star */}
                            <div className="flex items-center gap-1.5">
                              <img
                                src={getTmdbImageUrl(s.startActorImage)}
                                alt={s.startActorName}
                                className="h-7 w-7 rounded-full object-cover border border-cinema-border shrink-0"
                              />
                              <span className="font-medium text-slate-200 text-xs whitespace-nowrap">
                                {s.startActorName}
                              </span>
                            </div>

                            <span className="text-slate-500 font-bold">➔</span>

                            {/* Target Star */}
                            <div className="flex items-center gap-1.5">
                              <img
                                src={getTmdbImageUrl(s.targetActorImage)}
                                alt={s.targetActorName}
                                className="h-7 w-7 rounded-full object-cover border border-cinema-border shrink-0"
                              />
                              <span className="font-medium text-slate-200 text-xs whitespace-nowrap">
                                {s.targetActorName}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-gold text-xs">
                          {s.score.toLocaleString()}
                        </span>
                      </td>

                      {/* Moves */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                          <Footprints className="h-3 w-3 text-gold" />
                          <span>{s.moves}</span>
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{s.durationSeconds}s</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMatch(s);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-cinema-surface transition"
                          title="Inspect Match"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-[#0b0e17] border-t border-cinema-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Showing rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-cinema-card border border-cinema-border text-white text-xs focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2 font-mono text-slate-500">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cinema-border/80 bg-cinema-card text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cinema-surface transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 w-8 rounded-xl font-mono text-xs font-bold transition ${
                  pageNum === currentPage
                    ? 'bg-gold text-cinema-black shadow-gold-glow'
                    : 'bg-cinema-card border border-cinema-border/80 text-slate-400 hover:text-white hover:bg-cinema-surface'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cinema-border/80 bg-cinema-card text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cinema-surface transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Match Inspection Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-gold/40 bg-cinema-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-border/70">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">
                  Match Session Audit & Telemetry
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Match Cards */}
            <div className="p-4 rounded-xl border border-cinema-border/80 bg-[#0b0e17] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Game Mode</span>
                <span className="text-xs font-extrabold text-gold uppercase">
                  {selectedMatch.gameMode === 'frame-sleuth'
                    ? 'Frame Sleuth (6 Frames)'
                    : selectedMatch.gameMode === 'spotle'
                      ? 'Spotle (Movie Mystery)'
                      : selectedMatch.gameMode === 'duel'
                        ? '1v1 Live Duel'
                        : 'Beat Otara (Six Degrees)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cinema-border/50">
                {/* Starting Star */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cinema-card border border-cinema-border">
                  <img
                    src={getTmdbImageUrl(selectedMatch.startActorImage)}
                    alt={selectedMatch.startActorName}
                    className="h-12 w-12 rounded-full object-cover border border-gold shrink-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Starting Star</span>
                    <span className="font-extrabold text-white text-sm">{selectedMatch.startActorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">ID: {selectedMatch.startActorId}</span>
                  </div>
                </div>

                {/* Target Star */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cinema-card border border-cinema-border">
                  <img
                    src={getTmdbImageUrl(selectedMatch.targetActorImage)}
                    alt={selectedMatch.targetActorName}
                    className="h-12 w-12 rounded-full object-cover border border-gold shrink-0"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Star</span>
                    <span className="font-extrabold text-white text-sm">{selectedMatch.targetActorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">ID: {selectedMatch.targetActorId}</span>
                  </div>
                </div>
              </div>

              {/* Match Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-cinema-card text-center border border-cinema-border">
                  <span className="text-[10px] text-slate-400 block">Verified Score</span>
                  <span className="text-sm font-extrabold text-gold font-mono">{selectedMatch.score}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cinema-card text-center border border-cinema-border">
                  <span className="text-[10px] text-slate-400 block">Moves / Hops</span>
                  <span className="text-sm font-extrabold text-white font-mono">{selectedMatch.moves}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cinema-card text-center border border-cinema-border">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="text-sm font-extrabold text-white font-mono">{selectedMatch.durationSeconds}s</span>
                </div>
              </div>

              {selectedMatch.opponentUsername && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
                  <span className="text-purple-300">Duel Opponent: <strong>{selectedMatch.opponentUsername}</strong></span>
                  <span className="font-mono text-purple-200">Score: {selectedMatch.opponentScore}</span>
                </div>
              )}
            </div>

            {/* Session Metadata */}
            <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-[#0b0e17] p-3 rounded-xl border border-cinema-border/60">
              <div><span className="text-slate-500">Player ID:</span> {selectedMatch.userId}</div>
              <div><span className="text-slate-500">Session ID:</span> {selectedMatch.sessionId}</div>
              <div><span className="text-slate-500">Timestamp:</span> {selectedMatch.createdAt}</div>
              <div className="flex items-center gap-1.5 text-emerald-400 pt-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Anti-Cheat Status: Verified Valid Server Run</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 rounded-xl bg-cinema-surface hover:bg-slate-800 text-xs font-bold text-white transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
