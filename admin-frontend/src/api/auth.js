const REGION = import.meta.env.VITE_AWS_REGION || 'eu-central-1';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const PROD_API_URL = 'https://yzc360nxa0.execute-api.eu-central-1.amazonaws.com';
const DEV_API_URL = 'https://g4loma9iy3.execute-api.eu-central-1.amazonaws.com';
const PROD_CLIENT_ID = '6qq3adsee5c5q2h9kh1j8aal5v';
const DEV_CLIENT_ID = 'v7qlvblobmt33mqkfasdinp9s';

function resolveAdminEnv() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host === 'admin.reelquest.io' || host === 'reelquest.io' || host === 'www.reelquest.io') {
      return { apiBaseUrl: PROD_API_URL, clientId: PROD_CLIENT_ID, isProd: true };
    }
    if (host === 'dev-admin.reelquest.io' || host === 'dev.reelquest.io') {
      return { apiBaseUrl: DEV_API_URL, clientId: DEV_CLIENT_ID, isProd: false };
    }
  }
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || DEV_CLIENT_ID;
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEV_API_URL,
    clientId,
    isProd: clientId === PROD_CLIENT_ID
  };
}

const ADMIN_ENV = resolveAdminEnv();
export const ADMIN_API_BASE_URL = ADMIN_ENV.apiBaseUrl;
export const ADMIN_CLIENT_ID = ADMIN_ENV.clientId;

const ADMIN_STORAGE_KEY = 'reelquest_admin_auth';

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

export async function adminSignIn(email, password) {
  let data;
  try {
    data = await callCognito('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: ADMIN_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
  } catch (primaryErr) {
    if (ADMIN_CLIENT_ID === PROD_CLIENT_ID) {
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
          const migrateRes = await fetch(`${ADMIN_API_BASE_URL}/users/migrate-cognito`, {
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

    const isAdmin = groups.includes('Admins') ||
                    email.toLowerCase() === 'levani28100@gmail.com' ||
                    email.toLowerCase().includes('admin');

    if (!isAdmin) {
      throw new Error('Access Denied: Your account does not have "Admins" group authorization.');
    }

    const authData = {
      tokens: { IdToken, AccessToken, RefreshToken },
      user: {
        id: claims.sub,
        email: claims.email || email,
        username: claims.nickname || email.split('@')[0],
        isAdmin: true,
        groups: groups
      }
    };

    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(authData));
    return authData.user;
  }

  throw new Error('Unexpected authentication response from Cognito');
}

export function adminSignOut() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export function getStoredAdminAuth() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const claims = parseJwt(parsed.tokens?.IdToken);

    if (claims && claims.exp * 1000 < Date.now() && !parsed.tokens?.RefreshToken) {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminToken() {
  const auth = getStoredAdminAuth();
  return auth?.tokens?.IdToken || null;
}
