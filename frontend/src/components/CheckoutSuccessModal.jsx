import React from 'react';
import { Crown, Sparkles, Check, ArrowRight } from 'lucide-react';

export function CheckoutSuccessModal({ isOpen, onClose, details }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/50 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
          <Crown className="h-9 w-9 fill-gold/40 animate-pulse" />
        </div>

        <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold border border-gold/30">
          ReelQuest PRO Activated
        </span>

        <h3 className="mt-3 text-2xl font-black text-white">
          Welcome to ReelQuest PRO!
        </h3>

        <p className="mt-1 text-xs text-cinema-muted">
          Your monthly subscription is active. All premium perks and features are now fully unlocked.
        </p>

        {details && (
          <div className="my-5 rounded-xl border border-cinema-border/70 bg-cinema-card/70 p-3.5 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] text-cinema-muted uppercase font-bold">Plan</span>
              <span className="font-bold text-white">ReelQuest PRO ($3.00/mo)</span>
            </div>
            {details.orderId && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-[11px] text-cinema-muted uppercase font-bold">Order ID</span>
                <span className="font-mono text-[11px] text-gold">{details.orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] text-cinema-muted uppercase font-bold">Status</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                <Check className="h-3 w-3" />
                ACTIVE
              </span>
            </div>
          </div>
        )}

        <div className="mb-6 space-y-2 text-left">
          {[
            'Unlimited custom actor challenges unlocked',
            'All Frame Sleuth & Spotle clues unlocked',
            'Golden VIP badge on leaderboards and profile',
            '30,000+ movie & cast exploration graph access'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-3 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95"
        >
          <span>Explore PRO Features</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
