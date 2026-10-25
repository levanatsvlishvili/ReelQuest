import { saveDetailedMatch } from './matchHistory';

const REGION = import.meta.env.VITE_AWS_REGION || 'eu-central-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || 'v7qlvblobmt33mqkfasdinp9s';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const STORAGE_KEY = 'reelquest_auth';
const STATS_KEY = 'reelquest_user_stats';

async function callCognito(target, payload) {
  const res = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || data.__type || 'Authentication failed';
    throw new Error(errorMsg);
  }
  return data;
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function signUp(email, password, username) {
  return await callCognito('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'nickname', Value: username || email.split('@')[0] }
    ]
  });
}

export async function confirmSignUp(email, code) {
  return await callCognito('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code
  });
}

export async function resendConfirmationCode(email) {
  return await callCognito('ResendConfirmationCode', {
    ClientId: CLIENT_ID,
    Username: email
  });
}

export async function signIn(email, password) {
  const data = await callCognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  if (data.AuthenticationResult) {
    const { IdToken, AccessToken, RefreshToken } = data.AuthenticationResult;
    const claims = parseJwt(IdToken) || {};
    const groups = claims['cognito:groups'] || [];
    const isPro = groups.includes('ProUsers');

    const authData = {
      tokens: { IdToken, AccessToken, RefreshToken },
      user: {
        id: claims.sub,
        email: claims.email || email,
        username: claims.nickname || email.split('@')[0],
        isPro: isPro,
        groups: groups
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    syncUserProfile(authData.user).catch(() => {});
    return authData.user;
  }

  throw new Error('Unexpected authentication response');
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const claims = parseJwt(parsed.tokens?.IdToken);
    
    if (claims && claims.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  const auth = getStoredAuth();
  return auth?.tokens?.IdToken || null;
}

export async function syncUserProfile(user) {
  if (!API_BASE_URL || !user) return null;
  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: user.id || user.userId,
        email: user.email,
        username: user.username,
        isPro: Boolean(user.isPro)
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client-only state
  }
  return null;
}

export async function fetchUserProfile(userId) {
  if (!API_BASE_URL || !userId) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback
  }
  return null;
}

export async function createCheckoutSession(userId, email) {
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }
  const res = await fetch(`${API_BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      email,
      successUrl: window.location.origin,
      cancelUrl: window.location.origin
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create checkout session');
  }
  return await res.json();
}

export async function simulatePaymentWebhook(orderId, success = true) {
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }
  const res = await fetch(`${API_BASE_URL}/billing/simulate-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, success })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to process payment webhook');
  }
  return await res.json();
}

export function shiftDateStr(dateStr, days) {
  if (!dateStr || dateStr === 'Custom') return new Date().toISOString().slice(0, 10);
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

export function calculateStreak(dailyWins = [], todayStr = new Date().toISOString().slice(0, 10)) {
  const winSet = new Set(dailyWins || []);
  if (winSet.size === 0) return 0;

  let streak = 0;
  let checkDate = todayStr;

  // If today's challenge was won on-time:
  if (winSet.has(checkDate)) {
    streak += 1;
    checkDate = shiftDateStr(checkDate, -1);
    while (winSet.has(checkDate)) {
      streak += 1;
      checkDate = shiftDateStr(checkDate, -1);
    }
    return streak;
  }

  // Today has not yet been won: check if yesterday was won to preserve the streak
  checkDate = shiftDateStr(todayStr, -1);
  while (winSet.has(checkDate)) {
    streak += 1;
    checkDate = shiftDateStr(checkDate, -1);
  }

  return streak;
}

export function getUserStats(userId) {
  if (!userId || userId === 'guest') {
    return {
      streak: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      totalHops: 0,
      bestHops: 0,
      dailyWins: [],
      history: []
    };
  }

  const key = `${STATS_KEY}_${userId}`;
  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      let dailyWins = parsed.dailyWins || [];
      // If dailyWins is empty but history has won games, extract on-time wins
      if (dailyWins.length === 0 && Array.isArray(parsed.history)) {
        dailyWins = parsed.history
          .filter(h => h.won && h.date)
          .map(h => h.date);
      }
      const calculatedStreak = calculateStreak(dailyWins, todayStr);
      return {
        ...parsed,
        dailyWins,
        streak: Math.max(calculatedStreak, parsed.streak || 0)
      };
    }
  } catch {
    // Return defaults
  }
  return {
    streak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    totalHops: 0,
    bestHops: 0,
    dailyWins: [],
    history: []
  };
}

export function recordGameResult(userId, gameResult) {
  const stats = getUserStats(userId);
  const todayStr = new Date().toISOString().slice(0, 10);
  stats.gamesPlayed += 1;

  if (gameResult.won) {
    stats.gamesWon += 1;
    if (!stats.bestHops || gameResult.hops < stats.bestHops) {
      stats.bestHops = gameResult.hops;
    }

    // STRICT CONSECUTIVE DAILY CHALLENGE STREAK RULE:
    // Only completing today's challenge on its active calendar date counts towards the streak!
    // Solving archive challenges (e.g. from 3 days ago) must NOT extend or increment the streak.
    const isTodayChallenge = gameResult.date === todayStr;
    if (isTodayChallenge) {
      if (!stats.dailyWins) stats.dailyWins = [];
      if (!stats.dailyWins.includes(todayStr)) {
        stats.dailyWins.push(todayStr);
      }
    }
  }

  // Recalculate streak
  stats.streak = calculateStreak(stats.dailyWins || [], todayStr);
  stats.totalHops += (gameResult.hops || 0);

  if (!stats.history) stats.history = [];
  stats.history.unshift({
    date: gameResult.date,
    won: gameResult.won,
    hops: gameResult.hops,
    duration: gameResult.durationSeconds,
    timestamp: new Date().toISOString()
  });

  if (stats.history.length > 30) stats.history.pop();

  const key = `${STATS_KEY}_${userId || 'guest'}`;
  localStorage.setItem(key, JSON.stringify(stats));

  // Save full structured match to historical timeline
  try {
    saveDetailedMatch(userId, gameResult);
  } catch (err) {
    console.warn('Failed to record match history in auth.js:', err);
  }

  return stats;
}

export { saveDetailedMatch };
