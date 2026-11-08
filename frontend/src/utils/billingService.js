export const PRO_PLAN = {
  id: 'price_pro_monthly',
  name: 'ReelQuest Pro Monthly',
  amount: 3.00,
  currency: 'USD',
  interval: 'month',
  formattedPrice: '$3.00'
};

function getStorageKey(userId) {
  return `reelquest_subscription_${userId || 'guest'}`;
}

function getIdempotencyKeyMap(userId) {
  return `reelquest_idempotency_${userId || 'guest'}`;
}

export function computeNextMonthlyBillingDate(startDate = new Date()) {
  const d = new Date(startDate);
  const currentMonth = d.getMonth();
  d.setMonth(currentMonth + 1);
  return d.toISOString();
}

export function getDefaultCard(subscription) {
  if (!subscription || !Array.isArray(subscription.cards) || subscription.cards.length === 0) {
    return null;
  }
  const defaultCard = subscription.cards.find(c => c.isDefault);
  return defaultCard || subscription.cards[0];
}

export function getSubscription(userId, userEmail, isProUser = false) {
  if (!userId) return null;
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.cards)) {
        parsed.cards = parsed.paymentMethod ? [
          { ...parsed.paymentMethod, isDefault: true, createdAt: parsed.currentPeriodStart || new Date().toISOString() }
        ] : [];
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load subscription:', e);
  }

  if (isProUser) {
    const now = new Date();
    const nextMonth = computeNextMonthlyBillingDate(now);

    const initialSub = {
      userId,
      email: userEmail,
      status: 'ACTIVE',
      plan: PRO_PLAN,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
      retryCount: 0,
      dunningNotice: null,
      cards: [],
      invoices: [],
      notifications: []
    };
    saveSubscription(userId, initialSub);
    return initialSub;
  }

  return {
    userId,
    email: userEmail,
    status: 'INACTIVE',
    plan: PRO_PLAN,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    retryCount: 0,
    dunningNotice: null,
    cards: [],
    invoices: [],
    notifications: []
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

export function addPaymentMethod(userId, userEmail, cardInput, makeDefault = false) {
  const current = getSubscription(userId, userEmail, false);
  const cards = Array.isArray(current.cards) ? [...current.cards] : [];

  const shouldBeDefault = makeDefault || cards.length === 0;

  if (shouldBeDefault) {
    for (const c of cards) {
      c.isDefault = false;
    }
  }

  const rawNum = String(cardInput.number || '').replace(/\D/g, '');
  const last4 = cardInput.last4 || (rawNum.length >= 4 ? rawNum.slice(-4) : '4242');
  const brand = cardInput.brand || (
    rawNum.startsWith('3') ? 'Amex' : rawNum.startsWith('5') ? 'Mastercard' : 'Visa'
  );

  const newCard = {
    id: cardInput.id || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    brand,
    last4,
    cardholderName: cardInput.cardholderName?.trim() || 'Cinephile Member',
    expMonth: parseInt(cardInput.expMonth, 10) || 12,
    expYear: parseInt(cardInput.expYear, 10) || 2028,
    isDefault: shouldBeDefault,
    createdAt: new Date().toISOString()
  };

  cards.push(newCard);

  const updated = {
    ...current,
    cards,
    paymentMethod: shouldBeDefault ? newCard : (current.paymentMethod || newCard)
  };

  saveSubscription(userId, updated);
  return { updatedSubscription: updated, addedCard: newCard };
}

export function setDefaultPaymentMethod(userId, cardId) {
  const current = getSubscription(userId);
  if (!current || !Array.isArray(current.cards)) return null;

  let targetCard = null;
  const updatedCards = current.cards.map(c => {
    if (c.id === cardId) {
      targetCard = { ...c, isDefault: true };
      return targetCard;
    }
    return { ...c, isDefault: false };
  });

  if (!targetCard) return current;

  const updated = {
    ...current,
    cards: updatedCards,
    paymentMethod: targetCard
  };

  saveSubscription(userId, updated);
  return updated;
}

export function removePaymentMethod(userId, cardId) {
  const current = getSubscription(userId);
  if (!current || !Array.isArray(current.cards)) return null;

  const cardToRemove = current.cards.find(c => c.id === cardId);
  if (!cardToRemove) return current;

  let updatedCards = current.cards.filter(c => c.id !== cardId);

  if (cardToRemove.isDefault && updatedCards.length > 0) {
    updatedCards[0] = { ...updatedCards[0], isDefault: true };
  }

  const defaultCard = updatedCards.find(c => c.isDefault) || null;

  const updated = {
    ...current,
    cards: updatedCards,
    paymentMethod: defaultCard
  };

  saveSubscription(userId, updated);
  return updated;
}

export function processSubscriptionCharge(userId, userEmail, options = {}) {
  const current = getSubscription(userId, userEmail, true);
  const now = new Date();
  const idempotencyKey = options.idempotencyKey || `idem_charge_${userId}_${now.toISOString().slice(0, 10)}`;

  const idemKeyStore = getIdempotencyKeyMap(userId);
  try {
    const rawKeys = localStorage.getItem(idemKeyStore);
    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    if (keys[idempotencyKey]) {
      return {
        success: keys[idempotencyKey].success,
        subscription: current,
        cached: true,
        message: 'Idempotent request recognized. Reusing previous transaction.'
      };
    }
  } catch (e) {
    console.warn('Idempotency lookup warning:', e);
  }

  const cardToCharge = options.cardId
    ? current.cards.find(c => c.id === options.cardId)
    : getDefaultCard(current);

  const cardDesc = cardToCharge
    ? `${cardToCharge.brand} •••• ${cardToCharge.last4}`
    : 'No Card on File';

  const shouldDecline = options.forceDecline || (cardToCharge?.last4 === '0002');

  const invoiceId = `inv_${Date.now().toString().slice(-6)}`;
  let updatedSub;
  let success = false;

  if (!cardToCharge || shouldDecline) {
    const nextRetryCount = (current.retryCount || 0) + 1;
    const isSuspended = nextRetryCount >= 3;

    const failedInvoice = {
      id: invoiceId,
      date: now.toISOString(),
      amount: '$3.00',
      currency: 'USD',
      status: 'FAILED',
      description: 'ReelQuest Pro Monthly ($3.00/mo)',
      paymentMethod: cardDesc,
      failureReason: !cardToCharge
        ? 'No default payment method provided.'
        : 'Stripe Sandbox: Card declined (GenericDecline 0002).'
    };

    const newNotifications = [...(current.notifications || [])];
    if (isSuspended) {
      newNotifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'SUSPENDED',
        title: 'Pro Subscription Suspended',
        message: 'Your Pro subscription has been suspended after 3 failed billing attempts. Please update your payment card to reactivate.',
        date: now.toISOString(),
        read: false
      });
    } else {
      newNotifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'DUNNING',
        title: `Payment Failed (Attempt ${nextRetryCount}/3)`,
        message: 'We were unable to charge your default card. Automatic retries are in progress.',
        date: now.toISOString(),
        read: false
      });
    }

    updatedSub = {
      ...current,
      status: isSuspended ? 'SUSPENDED' : 'PAST_DUE',
      retryCount: nextRetryCount,
      dunningNotice: {
        attempt: nextRetryCount,
        maxAttempts: 3,
        lastAttemptDate: now.toISOString(),
        nextRetryDate: new Date(now.getTime() + 86400000 * 3).toISOString(),
        suspended: isSuspended
      },
      invoices: [failedInvoice, ...(current.invoices || [])],
      notifications: newNotifications
    };
    success = false;
  } else {
    const nextPeriodEnd = computeNextMonthlyBillingDate(now);

    const paidInvoice = {
      id: invoiceId,
      date: now.toISOString(),
      amount: '$3.00',
      currency: 'USD',
      status: 'PAID',
      description: 'ReelQuest Pro Monthly ($3.00/mo)',
      paymentMethod: cardDesc
    };

    const newNotifications = [...(current.notifications || [])];
    newNotifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'PAYMENT_SUCCESS',
      title: 'Pro Subscription Renewed',
      message: `Successfully charged $3.00 to ${cardDesc}. Next billing date is ${nextPeriodEnd.slice(0, 10)}.`,
      date: now.toISOString(),
      read: false
    });

    updatedSub = {
      ...current,
      status: 'ACTIVE',
      plan: PRO_PLAN,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextPeriodEnd,
      cancelAtPeriodEnd: false,
      retryCount: 0,
      dunningNotice: null,
      paymentMethod: cardToCharge,
      invoices: [paidInvoice, ...(current.invoices || [])],
      notifications: newNotifications
    };
    success = true;
  }

  saveSubscription(userId, updatedSub);

  try {
    const rawKeys = localStorage.getItem(idemKeyStore);
    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    keys[idempotencyKey] = {
      success,
      timestamp: now.toISOString(),
      invoiceId
    };
    localStorage.setItem(idemKeyStore, JSON.stringify(keys));
  } catch (e) {
    console.warn('Failed to record idempotency key:', e);
  }

  return {
    success,
    subscription: updatedSub,
    invoiceId,
    status: updatedSub.status,
    retryCount: updatedSub.retryCount
  };
}

export function activateSubscriptionWithCard(userId, userEmail, cardInput) {
  const { addedCard } = addPaymentMethod(userId, userEmail, cardInput, true);
  const idempotencyKey = `idem_activation_${userId}_${Date.now()}`;
  const chargeResult = processSubscriptionCharge(userId, userEmail, {
    cardId: addedCard.id,
    idempotencyKey
  });
  return chargeResult.subscription;
}

export function setAutoRenew(userId, cancelAtPeriodEnd) {
  const current = getSubscription(userId);
  if (!current) return null;

  const updated = {
    ...current,
    cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd)
  };
  saveSubscription(userId, updated);
  return updated;
}

export function markNotificationsAsRead(userId) {
  const current = getSubscription(userId);
  if (!current || !Array.isArray(current.notifications)) return current;

  const updatedNotifications = current.notifications.map(n => ({ ...n, read: true }));
  const updated = { ...current, notifications: updatedNotifications };
  saveSubscription(userId, updated);
  return updated;
}

export function adminCancelSubscription(userId, immediate = false) {
  const current = getSubscription(userId);
  if (!current) return null;

  const now = new Date().toISOString();
  const updated = {
    ...current,
    status: immediate ? 'CANCELED' : current.status,
    cancelAtPeriodEnd: true,
    canceledAt: now
  };
  saveSubscription(userId, updated);
  return updated;
}

export function adminSuspendSubscription(userId) {
  const current = getSubscription(userId);
  if (!current) return null;

  const now = new Date().toISOString();
  const updated = {
    ...current,
    status: 'SUSPENDED',
    retryCount: 3,
    dunningNotice: {
      attempt: 3,
      maxAttempts: 3,
      lastAttemptDate: now,
      suspended: true
    }
  };
  saveSubscription(userId, updated);
  return updated;
}

export function adminReactivateSubscription(userId, userEmail) {
  return processSubscriptionCharge(userId, userEmail, {
    isRetry: true,
    forceSuccess: true
  });
}
