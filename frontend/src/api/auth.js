import { saveDetailedMatch, getStoredMatchHistory } from './matchHistory';

const REGION = import.meta.env.VITE_AWS_REGION || 'eu-central-1';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const PROD_API_URL = 'https://yzc360nxa0.execute-api.eu-central-1.amazonaws.com';
const DEV_API_URL = 'https://g4loma9iy3.execute-api.eu-central-1.amazonaws.com';
const PROD_CLIENT_ID = '6qq3adsee5c5q2h9kh1j8aal5v';
const DEV_CLIENT_ID = 'v7qlvblobmt33mqkfasdinp9s';
const PROD_USER_POOL_ID = 'eu-central-1_mnp890U3A';
const DEV_USER_POOL_ID = 'eu-central-1_9SzgEn1WX';

function resolveEnvConfig() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host === 'reelquest.io' || host === 'www.reelquest.io' || host === 'admin.reelquest.io') {
      return {
        apiBaseUrl: PROD_API_URL,
        clientId: PROD_CLIENT_ID,
        userPoolId: PROD_USER_POOL_ID,
        isProd: true
      };
    }
    if (host === 'dev.reelquest.io' || host === 'dev-admin.reelquest.io') {
      return {
        apiBaseUrl: DEV_API_URL,
        clientId: DEV_CLIENT_ID,
        userPoolId: DEV_USER_POOL_ID,
        isProd: false
      };
    }
  }
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || DEV_CLIENT_ID;
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEV_API_URL,
    clientId,
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || (clientId === PROD_CLIENT_ID ? PROD_USER_POOL_ID : DEV_USER_POOL_ID),
    isProd: clientId === PROD_CLIENT_ID
  };
}

const ENV_CONFIG = resolveEnvConfig();
export const RESOLVED_API_BASE_URL = ENV_CONFIG.apiBaseUrl;
export const RESOLVED_CLIENT_ID = ENV_CONFIG.clientId;
export const RESOLVED_USER_POOL_ID = ENV_CONFIG.userPoolId;

const STORAGE_KEY = 'reelquest_auth';
const STATS_KEY = 'reelquest_user_stats';

let refreshPromise = null;

export function hasActiveLocalPro(userId) {
  if (!userId) return false;
  try {
    const subRaw = localStorage.getItem(`reelquest_subscription_${userId}`);
    if (subRaw) {
      const sub = JSON.parse(subRaw);
      if (sub && (sub.status === 'ACTIVE' || sub.status === 'PAST_DUE')) {
        return true;
      }
      if (sub && (sub.status === 'CANCELED' || sub.status === 'SUSPENDED' || sub.status === 'INACTIVE')) {
        return false;
      }
    }
    const metaRaw = localStorage.getItem(`reelquest_user_meta_${userId}`);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (typeof meta.isPro === 'boolean') {
        return meta.isPro;
      }
    }
  } catch {
    return false;
  }
  return false;
}

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
    const err = new Error(errorMsg);
    err.code = data.__type || '';
    throw err;
  }
  return data;
}

export function parseJwt(token) {
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

export async function refreshCognitoSession(storedAuth) {
  if (!storedAuth?.tokens?.RefreshToken) return storedAuth;
  if (refreshPromise) return refreshPromise;

  const tokenClaims = parseJwt(storedAuth.tokens.IdToken);
  const tokenClientId = tokenClaims?.aud || RESOLVED_CLIENT_ID;

  refreshPromise = (async () => {
    try {
      const data = await callCognito('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: tokenClientId,
        AuthParameters: {
          REFRESH_TOKEN: storedAuth.tokens.RefreshToken
        }
      });
      if (data.AuthenticationResult?.IdToken) {
        const { IdToken, AccessToken } = data.AuthenticationResult;
        const claims = parseJwt(IdToken) || {};
        const groups = claims['cognito:groups'] || [];
        const preservedPro = Boolean(
          storedAuth.user?.isPro ||
          groups.includes('ProUsers') ||
          hasActiveLocalPro(storedAuth.user?.id)
        );
        const updatedAuth = {
          ...storedAuth,
          tokens: {
            ...storedAuth.tokens,
            IdToken,
            AccessToken: AccessToken || storedAuth.tokens.AccessToken
          },
          user: {
            ...storedAuth.user,
            isPro: preservedPro,
            groups: groups.length > 0 ? groups : (storedAuth.user?.groups || [])
          }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAuth));
        return updatedAuth;
      }
    } catch {
      return storedAuth;
    } finally {
      refreshPromise = null;
    }
    return storedAuth;
  })();

  return refreshPromise;
}

export async function signUp(email, password, username) {
  return await callCognito('SignUp', {
    ClientId: RESOLVED_CLIENT_ID,
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
    ClientId: RESOLVED_CLIENT_ID,
    Username: email,
    ConfirmationCode: code
  });
}

export async function resendConfirmationCode(email) {
  return await callCognito('ResendConfirmationCode', {
    ClientId: RESOLVED_CLIENT_ID,
    Username: email
  });
}

export async function signIn(email, password) {
  let data;
  try {
    data = await callCognito('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: RESOLVED_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
  } catch (primaryErr) {
    if (RESOLVED_CLIENT_ID === PROD_CLIENT_ID) {
      try {
        const legacyData = await callCognito('InitiateAuth', {
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: DEV_CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        });
        if (legacyData.AuthenticationResult?.IdToken) {
          const legacyClaims = parseJwt(legacyData.AuthenticationResult.IdToken) || {};
          const migrateRes = await fetch(`${RESOLVED_API_BASE_URL}/users/migrate-cognito`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: legacyClaims.email || email,
              password,
              username: legacyClaims.nickname || email.split('@')[0],
              legacyUserId: legacyClaims.sub,
              groups: legacyClaims['cognito:groups'] || []
            })
          });
          if (migrateRes.ok) {
            data = await callCognito('InitiateAuth', {
              AuthFlow: 'USER_PASSWORD_AUTH',
              ClientId: PROD_CLIENT_ID,
              AuthParameters: {
                USERNAME: email,
                PASSWORD: password
              }
            });
          } else {
            data = legacyData;
          }
        }
      } catch {
        throw primaryErr;
      }
    } else {
      throw primaryErr;
    }
  }

  if (data && data.AuthenticationResult) {
    const { IdToken, AccessToken, RefreshToken } = data.AuthenticationResult;
    const claims = parseJwt(IdToken) || {};
    const groups = claims['cognito:groups'] || [];
    const userId = claims.sub;
    const isPro = Boolean(groups.includes('ProUsers') || hasActiveLocalPro(userId));

    const authData = {
      tokens: { IdToken, AccessToken, RefreshToken },
      user: {
        id: userId,
        email: claims.email || email,
        username: claims.nickname || email.split('@')[0],
        isPro,
        groups
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

    if (claims && claims.exp * 1000 < Date.now() + 60000) {
      if (parsed.tokens?.RefreshToken) {
        refreshCognitoSession(parsed);
      }
    }
    if (parsed.user && !parsed.user.isPro && hasActiveLocalPro(parsed.user.id)) {
      parsed.user.isPro = true;
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

export const getAccessToken = getAuthToken;

export async function syncUserProfile(user) {
  if (!RESOLVED_API_BASE_URL || !user) return null;
  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const uid = user.id || user.userId;
    const effectivePro = Boolean(user.isPro || hasActiveLocalPro(uid));
    const res = await fetch(`${RESOLVED_API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: uid,
        email: user.email,
        username: user.username,
        isPro: effectivePro
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchUserProfile(userId) {
  if (!RESOLVED_API_BASE_URL || !userId) return null;
  try {
    const res = await fetch(`${RESOLVED_API_BASE_URL}/users/${encodeURIComponent(userId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function createCheckoutSession(userId, email) {
  if (!RESOLVED_API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }
  const res = await fetch(`${RESOLVED_API_BASE_URL}/billing/checkout`, {
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

export async function confirmPaymentOrder(orderId, success = true) {
  if (!RESOLVED_API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }
  const res = await fetch(`${RESOLVED_API_BASE_URL}/billing/simulate-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, success })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to process payment');
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

  if (winSet.has(checkDate)) {
    streak += 1;
    checkDate = shiftDateStr(checkDate, -1);
    while (winSet.has(checkDate)) {
      streak += 1;
      checkDate = shiftDateStr(checkDate, -1);
    }
    return streak;
  }

  checkDate = shiftDateStr(todayStr, -1);
  while (winSet.has(checkDate)) {
    streak += 1;
    checkDate = shiftDateStr(checkDate, -1);
  }

  return streak;
}

export function calculateGameStreak(gameMode, userId, todayStr = new Date().toISOString().slice(0, 10)) {
  if (!userId || userId === 'guest') return 0;

  try {
    const history = getStoredMatchHistory(userId);
    if (!Array.isArray(history) || history.length === 0) return 0;

    let targetMode = gameMode;
    if (gameMode === 'six-degrees' || gameMode === 'beat-otara') targetMode = 'six-degrees';

    const dailyWins = history
      .filter(m => {
        const modeMatches = m.gameMode === targetMode || (targetMode === 'six-degrees' && (!m.gameMode || m.gameMode === 'six-degrees'));
        const isDailyWin = m.won && (m.subMode === 'daily' || !m.subMode);
        return modeMatches && isDailyWin;
      })
      .map(m => m.date)
      .filter(Boolean);

    if (targetMode === 'six-degrees') {
      const stats = getUserStats(userId);
      if (Array.isArray(stats?.dailyWins)) {
        dailyWins.push(...stats.dailyWins);
      }
    }

    const uniqueWins = Array.from(new Set(dailyWins));
    return calculateStreak(uniqueWins, todayStr);
  } catch {
    return 0;
  }
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
      if (dailyWins.length === 0 && Array.isArray(parsed.history)) {
        dailyWins = parsed.history
          .filter(h => h.won && h.date)
          .map(h => h.date);
      }
      const calculatedStreak = calculateStreak(dailyWins, todayStr);
      const longestStreak = Math.max(parsed.longestStreak || 0, parsed.streak || 0, calculatedStreak);
      return {
        ...parsed,
        dailyWins,
        streak: calculatedStreak,
        longestStreak
      };
    }
  } catch {}
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

    const isTodayChallenge = gameResult.date === todayStr;
    if (isTodayChallenge) {
      if (!stats.dailyWins) stats.dailyWins = [];
      if (!stats.dailyWins.includes(todayStr)) {
        stats.dailyWins.push(todayStr);
      }
    }
  }

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

  try {
    saveDetailedMatch(userId, gameResult);
  } catch (err) {
    console.warn('Failed to record match history in auth.js:', err);
  }

  return stats;
}

export { saveDetailedMatch };
