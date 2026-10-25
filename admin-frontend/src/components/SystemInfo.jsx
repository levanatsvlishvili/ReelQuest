import React, { useState } from 'react';
import {
  Server,
  Database,
  Shield,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Globe,
  Radio,
  ExternalLink
} from 'lucide-react';

export function SystemInfo() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [pingStatus, setPingStatus] = useState(null);
  const [pinging, setPinging] = useState(false);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDev = hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://g4loma9iy3.execute-api.eu-central-1.amazonaws.com';
  const cognitoPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-central-1_9SzgEn1WX';
  const cognitoClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || 'v7qlvblobmt33mqkfasdinp9s';
  const region = import.meta.env.VITE_AWS_REGION || 'eu-central-1';

  const tableName = isDev ? 'reelquest-dev-data' : 'reelquest-prod-data';
  const gameUrl = isLocal ? 'http://localhost:5173' : (isDev ? 'https://dev.reelquest.io' : 'https://reelquest.io');
  const adminUrl = isLocal ? 'http://localhost:5174' : (isDev ? 'https://dev-admin.reelquest.io' : 'https://admin.reelquest.io');

  const envVars = [
    { label: 'AWS Primary Region', value: `${region} (Frankfurt)`, key: 'region' },
    { label: 'API Gateway Endpoint', value: apiBaseUrl, key: 'api' },
    { label: 'Cognito User Pool ID', value: cognitoPoolId, key: 'pool' },
    { label: 'Cognito SPA Client ID', value: cognitoClientId, key: 'client' },
    { label: 'DynamoDB Table Name', value: tableName, key: 'ddb' },
    { label: 'Java 21 Lambda Engine', value: 'SnapStart Enabled (x86_64, 512 MB)', key: 'lambda' },
    { label: 'Player Game Application', value: gameUrl, key: 'player' },
    { label: 'Admin Dedicated Portal', value: adminUrl, key: 'admin' }
  ];

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePingBackend = async () => {
    setPinging(true);
    setPingStatus(null);
    const start = performance.now();
    try {
      const res = await fetch(`${apiBaseUrl}/challenges/daily`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingStatus({ ok: true, msg: `API Gateway & Java 21 Lambda responding healthy: HTTP 200 OK (${latency}ms)` });
      } else {
        setPingStatus({ ok: false, msg: `API responded with status HTTP ${res.status} (${latency}ms)` });
      }
    } catch (e) {
      setPingStatus({ ok: false, msg: 'Failed to reach API endpoint: ' + e.message });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            AWS Serverless Infrastructure & System Diagnostics
          </h2>
          <p className="text-xs text-slate-400">
            Real environment configuration, Cognito user pool identifiers, and live backend connectivity checks.
          </p>
        </div>

        <button
          onClick={handlePingBackend}
          disabled={pinging}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition disabled:opacity-50"
        >
          <Radio className={`h-4 w-4 ${pinging ? 'animate-pulse' : ''}`} />
          <span>{pinging ? 'Pinging Cloud Gateway...' : 'Ping Live API Gateway'}</span>
        </button>
      </div>

      {pingStatus && (
        <div className={`rounded-xl border p-4 text-xs flex items-center gap-3 animate-fade-in ${
          pingStatus.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
        }`}>
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-bold">{pingStatus.msg}</span>
        </div>
      )}

      {/* Grid of parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {envVars.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <button
                onClick={() => handleCopy(item.key, item.value)}
                className="text-slate-400 hover:text-white p-1 rounded transition"
                title="Copy Value"
              >
                {copiedKey === item.key ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs font-mono font-bold text-white break-all">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
