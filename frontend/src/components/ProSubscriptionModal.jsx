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
import { createCheckoutSession, simulatePaymentWebhook } from '../api/auth';

export function ProSubscriptionModal({ isOpen, onClose, onOpenAuth }) {
  const { user, isAuthenticated, setProStatus } = useAuth();

  // Modal checkout step: 'OVERVIEW' | 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'
  const [step, setStep] = useState('OVERVIEW');
  const [sessionData, setSessionData] = useState(null);
  const [sagaProgress, setSagaProgress] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);

  // Simulated card form fields
  const [cardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp] = useState('12 / 28');
  const [cardCvc] = useState('888');

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    if (!isAuthenticated) {
      onClose();
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setError(null);
    try {
      // Step 1: Create checkout session in backend
      const session = await createCheckoutSession(user.id, user.email);
      setSessionData(session);
      setStep('CHECKOUT');
    } catch (err) {
      setError(err.message || 'Failed to initiate checkout session.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!sessionData?.orderId) return;

    setError(null);
    setStep('PROCESSING');
    setSagaProgress([
      '1. Order initialized in DynamoDB (Status: PENDING)...'
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setSagaProgress(prev => [
        ...prev,
        '2. Stripe Sandbox: Authorizing payment transaction (4242)...'
      ]);

      await new Promise(r => setTimeout(r, 600));
      // Call SAGA webhook simulation on AWS backend
      const result = await simulatePaymentWebhook(sessionData.orderId, true);

      setSagaProgress(prev => [
        ...prev,
        '3. SAGA Orchestrator: Webhook verified & idempotency lock acquired.',
        '4. Cognito group ProUsers granted & DynamoDB profile upgraded!'
      ]);

      await new Promise(r => setTimeout(r, 800));

      setProStatus(true);
      setReceiptData({
        orderId: sessionData.orderId,
        sessionId: sessionData.sessionId,
        amount: '$4.99',
        currency: 'USD',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        userEmail: user.email
      });
      setStep('SUCCESS');
    } catch (err) {
      setError(err.message || 'Payment simulation failed.');
      setStep('CHECKOUT');
    }
  };

  const handleResetAndClose = () => {
    setStep('OVERVIEW');
    setSessionData(null);
    setSagaProgress([]);
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
                'Early access to upcoming game modes (Plot Guesser, Timeline)'
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
              <p className="mt-1 text-[11px] text-cinema-muted">Cancel anytime with 1-click in account settings</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-3 w-3" />
                <span>Stripe Sandbox Simulator Active</span>
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
        {/* VIEW 2: STRIPE SANDBOX CHECKOUT FORM */}
        {/* ==================================================== */}
        {step === 'CHECKOUT' && (
          <div className="space-y-5">
            <div className="border-b border-cinema-border pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Stripe Sandbox Checkout
                </span>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                  TEST MODE
                </span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">Complete Your Subscription</h3>
              <p className="text-xs text-cinema-muted">
                Order <code className="text-gold font-mono text-[11px]">{sessionData?.orderId}</code>
              </p>
            </div>

            {/* Order Summary box */}
            <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3.5 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>ReelQuest PRO (Monthly)</span>
                <span className="font-bold text-white">$4.99</span>
              </div>
              <div className="flex justify-between text-cinema-muted text-[11px]">
                <span>Sales Tax / VAT (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-cinema-border/60 pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total Due Today</span>
                <span className="text-gold">$4.99 USD</span>
              </div>
            </div>

            {/* Simulated Card Element */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                Test Payment Card
              </label>

              <div className="rounded-xl border border-cinema-border bg-cinema-surface/90 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-cinema-border/60 pb-2">
                  <span className="font-mono text-xs text-white tracking-widest">{cardNumber}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">VISA</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-cinema-muted">
                  <div>
                    <span className="text-[10px] block">Expires</span>
                    <span className="font-mono text-white text-xs">{cardExp}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block">CVC</span>
                    <span className="font-mono text-white text-xs">{cardCvc}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-cinema-muted flex items-start gap-1.5">
                <Lock className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                <span>Sandbox Mode: Test card prefilled. Clicking Pay triggers live AWS SAGA transaction orchestrator with zero real billing.</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep('OVERVIEW')}
                className="rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-95"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Pay $4.99 (Test Authorization)</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: LIVE SAGA PROCESSING ANIMATION */}
        {/* ==================================================== */}
        {step === 'PROCESSING' && (
          <div className="py-6 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/40 shadow-gold-glow animate-pulse">
              <RotateCcw className="h-7 w-7 animate-spin text-gold" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Executing Distributed SAGA</h3>
              <p className="text-xs text-cinema-muted mt-1">Processing atomic transaction across AWS microservices...</p>
            </div>

            <div className="rounded-xl border border-cinema-border bg-cinema-surface p-4 text-left font-mono text-xs space-y-2">
              {sagaProgress.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gold-light animate-fade-in">
                  <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="truncate">{p}</span>
                </div>
              ))}
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
