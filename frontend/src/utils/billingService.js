/**
 * ReelQuest Pro Subscription & Billing Service
 * Models recurring $3.00/month subscription, Stripe integration ready,
 * saved payment methods, billing history, and dunning / retry handling.
 */

export const PRO_PLAN = {
  id: 'price_pro_monthly',
  name: 'ReelQuest Pro Monthly',
  amount: 3.00,
  currency: 'USD',
  interval: 'month',
  formattedPrice: '$3.00'
};

const DEFAULT_CARD = {
  id: 'pm_default_4242',
  brand: 'Visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2028,
  cardholderName: 'Cinephile Member'
};

function getStorageKey(userId) {
  return `reelquest_subscription_${userId || 'guest'}`;
}

export function getSubscription(userId, userEmail, isProUser = false) {
  if (!userId) return null;
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load subscription:', e);
  }

  // If user is already marked Pro in Cognito/Auth but has no local billing state,
  // generate a default active $3/month subscription
  if (isProUser) {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);

    const initialSub = {
      status: 'ACTIVE', // 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | 'INACTIVE'
      plan: PRO_PLAN,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextMonth.toISOString(),
      cancelAtPeriodEnd: false,
      retryCount: 0,
      dunningNotice: null,
      paymentMethod: DEFAULT_CARD,
      invoices: [
        {
          id: `inv_${Date.now().toString().slice(-6)}`,
          date: now.toISOString(),
          amount: '$3.00',
          currency: 'USD',
          status: 'PAID',
          description: 'ReelQuest Pro Monthly ($3.00/mo)',
          paymentMethod: 'Visa •••• 4242'
        }
      ]
    };
    saveSubscription(userId, initialSub);
    return initialSub;
  }

  return {
    status: 'INACTIVE',
    plan: PRO_PLAN,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    retryCount: 0,
    dunningNotice: null,
    paymentMethod: null,
    invoices: []
  };
}

export function saveSubscription(userId, subscriptionData) {
  if (!userId) return;
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(subscriptionData));
  } catch (e) {
    console.error('Failed to save subscription:', e);
  }
}

/**
 * Creates or updates an active $3/month subscription
 */
export function activateSubscription(userId, userEmail, cardDetails = DEFAULT_CARD) {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setDate(now.getDate() + 30);

  const existing = getSubscription(userId, userEmail, true);
  const newInvoice = {
    id: `inv_${Date.now().toString().slice(-6)}`,
    date: now.toISOString(),
    amount: '$3.00',
    currency: 'USD',
    status: 'PAID',
    description: 'ReelQuest Pro Monthly ($3.00/mo)',
    paymentMethod: `${cardDetails.brand || 'Visa'} •••• ${cardDetails.last4 || '4242'}`
  };

  const updated = {
    ...existing,
    status: 'ACTIVE',
    plan: PRO_PLAN,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
    retryCount: 0,
    dunningNotice: null,
    paymentMethod: {
      id: cardDetails.id || `pm_${Date.now()}`,
      brand: cardDetails.brand || 'Visa',
      last4: cardDetails.last4 || '4242',
      expMonth: cardDetails.expMonth || 12,
      expYear: cardDetails.expYear || 2028,
      cardholderName: cardDetails.cardholderName || 'Cinephile Member'
    },
    invoices: [newInvoice, ...(existing.invoices || [])]
  };

  saveSubscription(userId, updated);
  return updated;
}

/**
 * Updates user's saved payment method (card)
 */
export function updatePaymentMethod(userId, newCard) {
  const current = getSubscription(userId);
  if (!current) return null;

  const updatedMethod = {
    id: `pm_${Date.now()}`,
    brand: newCard.brand || 'Visa',
    last4: newCard.last4 || newCard.number?.slice(-4) || '4242',
    expMonth: parseInt(newCard.expMonth, 10) || 12,
    expYear: parseInt(newCard.expYear, 10) || 2028,
    cardholderName: newCard.cardholderName || 'Cinephile Member'
  };

  // If subscription was PAST_DUE, updating card resets retries and restores ACTIVE status
  const newStatus = current.status === 'PAST_DUE' ? 'ACTIVE' : current.status;

  const updated = {
    ...current,
    status: newStatus,
    retryCount: 0,
    dunningNotice: null,
    paymentMethod: updatedMethod
  };

  saveSubscription(userId, updated);
  return updated;
}

/**
 * Toggle auto-renew cancellation
 */
export function setAutoRenew(userId, cancelAtPeriodEnd) {
  const current = getSubscription(userId);
  if (!current) return null;

  const updated = {
    ...current,
    cancelAtPeriodEnd
  };
  saveSubscription(userId, updated);
  return updated;
}

/**
 * Simulates a recurring monthly billing cycle run
 * @param {'SUCCESS' | 'FAIL'} outcome
 */
export function simulateMonthlyBillingRun(userId, userEmail, outcome = 'SUCCESS') {
  const current = getSubscription(userId, userEmail, true);
  if (!current) return null;

  const now = new Date();

  if (outcome === 'SUCCESS') {
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + 30);

    const successInvoice = {
      id: `inv_${Date.now().toString().slice(-6)}`,
      date: now.toISOString(),
      amount: '$3.00',
      currency: 'USD',
      status: 'PAID',
      description: 'ReelQuest Pro Monthly Renewal ($3.00/mo)',
      paymentMethod: `${current.paymentMethod?.brand || 'Visa'} •••• ${current.paymentMethod?.last4 || '4242'}`
    };

    const updated = {
      ...current,
      status: 'ACTIVE',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextDate.toISOString(),
      retryCount: 0,
      dunningNotice: null,
      invoices: [successInvoice, ...(current.invoices || [])]
    };
    saveSubscription(userId, updated);
    return { subscription: updated, isPro: true, message: 'Monthly renewal of $3.00 succeeded!' };
  }

  // Outcome === 'FAIL'
  const newRetryCount = (current.retryCount || 0) + 1;
  const failedInvoice = {
    id: `inv_fail_${Date.now().toString().slice(-6)}`,
    date: now.toISOString(),
    amount: '$3.00',
    currency: 'USD',
    status: 'FAILED',
    description: `ReelQuest Pro Monthly ($3.00) - Attempt #${newRetryCount} Declined`,
    paymentMethod: `${current.paymentMethod?.brand || 'Visa'} •••• ${current.paymentMethod?.last4 || '4242'}`
  };

  if (newRetryCount < 3) {
    const warningMessage = `Monthly charge of $3.00 failed (Attempt ${newRetryCount}/3). A warning notice has been sent to ${userEmail || 'your email'}. Next retry scheduled in 3 days. Please update your payment method.`;
    const updated = {
      ...current,
      status: 'PAST_DUE',
      retryCount: newRetryCount,
      dunningNotice: {
        attempt: newRetryCount,
        maxAttempts: 3,
        emailSentTo: userEmail || 'user@reelquest.io',
        sentAt: now.toISOString(),
        message: warningMessage
      },
      invoices: [failedInvoice, ...(current.invoices || [])]
    };
    saveSubscription(userId, updated);
    return {
      subscription: updated,
      isPro: true, // Grace period: still active until 3rd failure
      message: warningMessage,
      warning: true
    };
  }

  // 3rd attempt failed -> Subscription Suspended & Pro revoked
  const suspensionMessage = `Subscription suspended after 3 failed payment attempts. An account notification was sent to ${userEmail || 'your email'}. PRO VIP perks have been deactivated.`;
  const updated = {
    ...current,
    status: 'SUSPENDED',
    retryCount: 3,
    dunningNotice: {
      attempt: 3,
      maxAttempts: 3,
      emailSentTo: userEmail || 'user@reelquest.io',
      sentAt: now.toISOString(),
      message: suspensionMessage
    },
    invoices: [failedInvoice, ...(current.invoices || [])]
  };
  saveSubscription(userId, updated);
  return {
    subscription: updated,
    isPro: false,
    message: suspensionMessage,
    suspended: true
  };
}
