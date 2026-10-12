const REGION = import.meta.env.VITE_AWS_REGION || 'eu-central-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || 'v7qlvblobmt33mqkfasdinp9s';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

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
    
    // Check token expiration
    if (claims && claims.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getUserStats(userId) {
  const key = `${STATS_KEY}_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Return defaults
  }
  return {
    streak: 3,
    gamesPlayed: 5,
    gamesWon: 4,
    totalHops: 13,
    bestHops: 2,
    history: []
  };
}

export function recordGameResult(userId, gameResult) {
  const stats = getUserStats(userId);
  stats.gamesPlayed += 1;
  if (gameResult.won) {
    stats.gamesWon += 1;
    stats.streak += 1;
    if (!stats.bestHops || gameResult.hops < stats.bestHops) {
      stats.bestHops = gameResult.hops;
    }
  } else {
    stats.streak = 0;
  }
  stats.totalHops += gameResult.hops;
  stats.history.unshift({
    date: gameResult.date,
    won: gameResult.won,
    hops: gameResult.hops,
    duration: gameResult.durationSeconds
  });

  if (stats.history.length > 30) stats.history.pop();

  const key = `${STATS_KEY}_${userId || 'guest'}`;
  localStorage.setItem(key, JSON.stringify(stats));
  return stats;
}
