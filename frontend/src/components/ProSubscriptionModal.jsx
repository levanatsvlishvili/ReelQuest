import { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles } from 'lucide-react';

export function ProSubscriptionModal({ isOpen, onClose }) {
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      setSubscribed(true);
      setTimeout(() => {
        onClose();
        setSubscribed(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/50 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
            <Crown className="h-8 w-8 fill-gold/30" />
          </div>

          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold border border-gold/30">
            ReelQuest Pro
          </span>

          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Upgrade Your Cinephile Experience
          </h3>
          <p className="mt-1 text-xs text-cinema-muted">
            Unlock infinite graph exploration, custom challenges, and competitive perks.
          </p>
        </div>

        <div className="my-6 space-y-3">
          {[
            'Unlimited custom actor-to-actor challenges',
            'Full 30,000+ TMDB movie & actor graph access',
            'Golden PRO crown badge on global leaderboards',
            'Detailed analytics & graph visualizer inspection',
            'Zero advertisements or daily play limits'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Check className="h-2.5 w-2.5" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-gold/30 bg-cinema-card/80 p-4 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold text-white">$4.99</span>
            <span className="text-xs text-cinema-muted">/ month</span>
          </div>
          <p className="mt-1 text-[11px] text-cinema-muted">Cancel anytime in account settings</p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={subscribing || subscribed}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-3 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95 disabled:opacity-50"
        >
          {subscribed ? (
            <>
              <Check className="h-4 w-4" />
              <span>Subscription Active!</span>
            </>
          ) : subscribing ? (
            <span className="animate-pulse">Processing checkout...</span>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Unlock ReelQuest PRO</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
