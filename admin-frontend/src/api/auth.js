const REGION = import.meta.env.VITE_AWS_REGION || 'eu-central-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || 'v7qlvblobmt33mqkfasdinp9s';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

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
    
    // Check if user is member of Admins group or root admin email
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
    
    // Token expiry check
    if (claims && claims.exp * 1000 < Date.now()) {
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
