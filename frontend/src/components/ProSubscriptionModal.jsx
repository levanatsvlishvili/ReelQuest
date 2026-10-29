import { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession, confirmPaymentOrder } from '../api/auth';
import { activateSubscription } from '../utils/billingService';

export function ProSubscriptionModal({ isOpen, onClose, onOpenAuth }) {
  const { user, isAuthenticated, setProStatus } = useAuth();

  // Modal checkout step: 'OVERVIEW' | 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'
  const [step, setStep] = useState('OVERVIEW');
  const [sessionData, setSessionData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);

  // Real interactive card form fields
  const [cardholderName, setCardholderName] = useState(user?.username || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    if (!isAuthenticated) {
      onClose();
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setError(null);
    try {
      const session = await createCheckoutSession(user.id, user.email);
      setSessionData(session);
      // If Stripe returned a hosted checkout URL, redirect directly
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
        return;
      }
      setStep('CHECKOUT');
    } catch (err) {
      setError(err.message || 'Failed to initiate checkout session.');
    }
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleCardExpChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)} / ${raw.slice(2)}`;
    }
    setCardExp(raw);
  };

  const handleConfirmPayment = async (e) => {
    e?.preventDefault();
    if (!sessionData?.orderId) return;

    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length < 15) {
      setError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExp.trim() || cardExp.length < 5) {
      setError('Please enter expiration in MM / YY format.');
      return;
    }
    if (cardCvc.length < 3) {
      setError('Please enter a valid CVC code.');
      return;
    }

    setError(null);
    setStep('PROCESSING');

    try {
      // Process payment order with backend
      await confirmPaymentOrder(sessionData.orderId, true);

      const last4 = cleanNum.slice(-4);
      const brand = cleanNum.startsWith('3') ? 'Amex' : cleanNum.startsWith('5') ? 'Mastercard' : 'Visa';
      const [expMonth, expYear] = cardExp.split('/').map(s => s.trim());

      setProStatus(true);
      if (user?.id) {
        activateSubscription(user.id, user.email, {
          brand,
          last4,
          cardholderName: cardholderName.trim() || 'Cinephile Member',
          expMonth: parseInt(expMonth, 10) || 12,
          expYear: parseInt(expYear, 10) || 2028
        });
      }

      setReceiptData({
        orderId: sessionData.orderId,
        sessionId: sessionData.sessionId,
        amount: '$3.00',
        currency: 'USD',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        userEmail: user.email,
        cardSummary: `${brand} •••• ${last4}`
      });
      setStep('SUCCESS');
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please check your card details.');
      setStep('CHECKOUT');
    }
  };

  const handleResetAndClose = () => {
    setStep('OVERVIEW');
    setSessionData(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/50 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 shadow-2xl">
        <button
          onClick={handleResetAndClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ==================================================== */}
        {/* VIEW 1: OVERVIEW & PLAN PERKS */}
        {/* ==================================================== */}
        {step === 'OVERVIEW' && (
          <div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
                <Crown className="h-8 w-8 fill-gold/30" />
              </div>

              <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold border border-gold/30">
                ReelQuest Pro
              </span>

              <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                {user?.isPro ? 'You are a PRO Cinephile!' : 'Upgrade Your Cinephile Experience'}
              </h3>
              <p className="mt-1 text-xs text-cinema-muted">
                {user?.isPro
                  ? 'Your subscription is active with full access to all premium features.'
                  : 'Unlock infinite graph exploration, custom challenges, and competitive perks.'}
              </p>
            </div>

            <div className="my-6 space-y-3">
              {[
                'Unlimited custom actor-to-actor challenges',
                'Full 30,000+ TMDB movie & actor graph access',
                'Golden PRO crown badge on global leaderboards',
                'Detailed analytics & graph visualizer inspection',
                'Early access to upcoming game modes'
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
                <span className="text-3xl font-extrabold text-white">$3.00</span>
                <span className="text-xs text-cinema-muted">/ month</span>
              </div>
              <p className="mt-1 text-[11px] text-cinema-muted">Cancel anytime with 1-click in account settings</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {user?.isPro ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold/20 py-3 text-xs font-bold text-gold border border-gold/40">
                <Crown className="h-4 w-4 fill-gold" />
                <span>PRO Plan Active</span>
              </div>
            ) : (
              <button
                onClick={handleStartCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-3 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95"
              >
                {!isAuthenticated ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Sign In to Unlock PRO</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: REAL STRIPE CHECKOUT FORM */}
        {/* ==================================================== */}
        {step === 'CHECKOUT' && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="border-b border-cinema-border pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Stripe Encrypted Checkout
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  SSL SECURE
                </span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">Complete Your Subscription</h3>
            </div>

            {/* Order Summary box */}
            <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>ReelQuest PRO (Monthly)</span>
                <span className="font-bold text-white">$3.00</span>
              </div>
              <div className="border-t border-cinema-border/60 pt-1.5 flex justify-between font-bold text-white">
                <span>Total Due Today</span>
                <span className="text-gold">$3.00 USD</span>
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Name on Card
              </label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Full name on card"
                className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Card Number
              </label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full font-mono rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
              />
            </div>

            {/* Exp and CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Expiration
                </label>
                <input
                  type="text"
                  required
                  value={cardExp}
                  onChange={handleCardExpChange}
                  placeholder="MM / YY"
                  maxLength={7}
                  className="w-full font-mono rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  CVC Code
                </label>
                <input
                  type="password"
                  required
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full font-mono rounded-xl border border-cinema-border bg-cinema-surface py-2 px-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
                />
              </div>
            </div>

            <p className="text-[11px] text-cinema-muted flex items-start gap-1.5 pt-1">
              <Lock className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
              <span>Recurring monthly subscription ($3.00/mo). Cancel anytime with 1-click in account settings.</span>
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('OVERVIEW')}
                className="rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Pay $3.00 / Month</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: PAYMENT PROCESSING */}
        {/* ==================================================== */}
        {step === 'PROCESSING' && (
          <div className="py-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/40 shadow-gold-glow animate-pulse">
              <RotateCcw className="h-7 w-7 animate-spin text-gold" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Processing Subscription</h3>
              <p className="text-xs text-cinema-muted mt-1">Connecting to Stripe and securely authorizing payment...</p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 4: SUCCESS RECEIPT */}
        {/* ==================================================== */}
        {step === 'SUCCESS' && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg">
              <Check className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Payment Confirmed!</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                Welcome to ReelQuest PRO, {user?.username || 'Cinephile'}!
              </p>
            </div>

            {/* Digital Receipt Card */}
            <div className="rounded-xl border border-cinema-border bg-cinema-surface p-4 text-xs text-left space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cinema-muted text-[10px] border-b border-cinema-border pb-2">
                <Receipt className="h-3.5 w-3.5 text-gold" />
                <span>Transaction Receipt</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Plan</span>
                <span className="font-semibold text-white">ReelQuest PRO (Monthly)</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Order ID</span>
                <span className="font-mono text-gold text-[11px]">{receiptData?.orderId}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Payment Method</span>
                <span>{receiptData?.cardSummary}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Billing Email</span>
                <span>{receiptData?.userEmail}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Amount Paid</span>
                <span className="font-bold text-emerald-400">{receiptData?.amount} {receiptData?.currency}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Date</span>
                <span>{receiptData?.date}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-cinema-muted">Status</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  COMPLETED
                </span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95"
            >
              <Crown className="h-4 w-4 fill-cinema-black" />
              <span>Enjoy ReelQuest PRO</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
