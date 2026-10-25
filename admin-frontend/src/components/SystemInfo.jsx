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
  Radio
} from 'lucide-react';

export function SystemInfo() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [pingStatus, setPingStatus] = useState(null);
  const [pinging, setPinging] = useState(false);

  const envVars = [
    { label: 'AWS Primary Region', value: 'eu-central-1 (Frankfurt)', key: 'region' },
    { label: 'API Gateway Base URL', value: 'https://g4loma9iy3.execute-api.eu-central-1.amazonaws.com', key: 'api' },
    { label: 'Cognito User Pool ID', value: 'eu-central-1_9SzgEn1WX', key: 'pool' },
    { label: 'Cognito Web Client ID', value: 'v7qlvblobmt33mqkfasdinp9s', key: 'client' },
    { label: 'DynamoDB Production Table', value: 'reelquest-prod-data (PITR Enabled)', key: 'ddb' },
    { label: 'Java 21 Lambda Execution', value: 'SnapStart Enabled (arm64, 1024 MB)', key: 'lambda' },
    { label: 'Player Web Application Port', value: 'http://localhost:5173', key: 'player' },
    { label: 'Admin Dedicated Portal Port', value: 'http://localhost:5174', key: 'admin' }
  ];

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePingBackend = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      const res = await fetch('https://g4loma9iy3.execute-api.eu-central-1.amazonaws.com/games/daily');
      if (res.ok) {
        setPingStatus({ ok: true, msg: 'API Gateway & Java 21 Lambda Responding (HTTP 200 OK)' });
      } else {
        setPingStatus({ ok: false, msg: `API Responded with status HTTP ${res.status}` });
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
            Real-time topology configuration, Cognito identifiers, and live backend ping tests.
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
            <div className="font-mono text-xs font-bold text-white break-all bg-cinema-surface/80 p-2.5 rounded-xl border border-cinema-border/60">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
