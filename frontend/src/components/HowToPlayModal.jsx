import { X, Film, Users, Target, Zap } from 'lucide-react';

export function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card to-cinema-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white">How to Play ReelQuest</h3>
        <p className="mt-1 text-xs text-cinema-muted">
          Connect two Hollywood actors in the fewest movies possible.
        </p>

        <div className="my-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">1. Pick a Movie</h4>
              <p className="text-xs text-cinema-muted">
                From the origin actor, choose any movie from their filmography.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">2. Pick a Co-Star</h4>
              <p className="text-xs text-cinema-muted">
                Select an actor who starred in that same movie to continue the chain.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">3. Reach the Target</h4>
              <p className="text-xs text-cinema-muted">
                Navigate the Hollywood graph until you connect directly to today's Target Actor!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">4. Beat Otara (The Cinema Oracle)</h4>
              <p className="text-xs text-cinema-muted">
                ოთარა ყოველდღიურად პოულობს უმოკლეს გზას. შეეჯიბრე ოთარას და ეცადე გაუთანაბრდე მის ნიშნულს!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90"
        >
          Got it, Let's Play!
        </button>
      </div>
    </div>
  );
}
