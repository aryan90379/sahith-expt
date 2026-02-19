'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter
} from 'recharts';
import { ExperimentResult } from '@/types'; 

export default function AdminDashboard() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // --- DATA STATE ---
  const [data, setData] = useState<ExperimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('chroma_admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingSession(false);
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        sessionStorage.setItem('chroma_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setAuthError(json.error || 'Access Denied.');
      }
    } catch (err) {
      setAuthError('Failed to connect to authentication server.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chroma_admin_auth');
    setIsAuthenticated(false);
  };

  // --- DATA FETCHING ---
  const fetchCloudData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sheet');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      
      if (Array.isArray(json)) {
        const sanitizedData = json
          .filter(d => d && d.participantId)
          .map(d => ({
            ...d,
            stareDuration: Number(d.stareDuration) || 0,
            persistenceDuration: Number(d.persistenceDuration) || 0,
          }));
        setData(sanitizedData);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setError(err.message || "Failed to fetch telemetry data.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCloudData();
    }
  }, [isAuthenticated, fetchCloudData]);

  // --- CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Participant ID', 'Timestamp', 'Color Name', 'HEX', 'Stare (s)', 'Persistence (s)', 'Perceived Color', 'AI Insight'];
    const rows = data.map(r => [
      r.participantId, 
      r.timestamp, 
      r.colorName, 
      r.colorHex, 
      r.stareDuration, 
      r.persistenceDuration, 
      r.perceivedColor || 'N/A', 
      `"${(r.aiInsight || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Chroma_Telemetry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- DATA AGGREGATION & INSIGHTS ---
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const totalTrials = data.length;
    const totalPersist = data.reduce((acc, curr) => acc + curr.persistenceDuration, 0);
    const totalStare = data.reduce((acc, curr) => acc + curr.stareDuration, 0);
    
    const avgPersistence = (totalPersist / totalTrials).toFixed(2);
    const avgStare = (totalStare / totalTrials).toFixed(1);

    const colorMap: Record<string, { count: number; totalPersistence: number; hex: string }> = {};
    data.forEach(d => {
      if (!colorMap[d.colorName]) colorMap[d.colorName] = { count: 0, totalPersistence: 0, hex: d.colorHex };
      colorMap[d.colorName].count += 1;
      colorMap[d.colorName].totalPersistence += d.persistenceDuration;
    });

    const colorStats = Object.entries(colorMap).map(([name, stats]) => ({
      name: name.split(' ')[1] || name, 
      fullName: name,
      count: stats.count,
      avgPersistence: parseFloat((stats.totalPersistence / stats.count).toFixed(2)),
      hex: stats.hex
    })).sort((a, b) => b.avgPersistence - a.avgPersistence);

    const topColor = colorStats.length > 0 ? colorStats[0] : null;

    const scatterData = data.map(d => ({
      stare: d.stareDuration,
      persistence: d.persistenceDuration,
      name: d.colorName,
      hex: d.colorHex
    }));

    return { totalTrials, avgPersistence, avgStare, colorStats, topColor, scatterData };
  }, [data]);

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (isCheckingSession) return <div className="min-h-screen bg-[#050505]" />; // Blank while checking

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
              <span className="text-3xl font-black italic text-indigo-500">Ɵ</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Clearance Required</h2>
            <p className="text-xs text-white/40 uppercase font-mono tracking-widest">Global Telemetry Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="Admin Node Email" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Access Passphrase" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 text-center font-mono">{authError}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 mt-4 shadow-lg shadow-indigo-500/20"
            >
              {isAuthenticating ? 'Decrypting...' : 'Initiate Handshake'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD (LOADING STATE) ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-indigo-500 font-mono text-sm tracking-widest uppercase animate-pulse">
        Decrypting Global Vault...
      </div>
    );
  }

  // --- RENDER DASHBOARD (ERROR STATE) ---
  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-red-500 space-y-4">
        <div className="text-4xl italic font-black">!</div>
        <p className="font-mono text-sm uppercase tracking-widest">Connection Error</p>
        <p className="text-xs text-red-500/60 max-w-md text-center">{error}</p>
        <button onClick={fetchCloudData} className="mt-4 px-6 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">Retry Connection</button>
      </div>
    );
  }

  // --- RENDER DASHBOARD (EMPTY STATE) ---
  if (!stats) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 space-y-4">
        <div className="text-4xl italic font-black">Ɵ</div>
        <p className="font-mono text-sm uppercase tracking-widest">Vault is empty.</p>
        <button onClick={fetchCloudData} className="mt-4 px-6 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-xs">Refresh</button>
      </div>
    );
  }

  // --- RENDER FULL DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER & CONTROLS */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2 text-indigo-500">
              <span className="text-2xl font-black italic bg-indigo-500/10 w-10 h-10 flex items-center justify-center rounded-xl border border-indigo-500/20">Ɵ</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Lab Command Center</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter">Global Telemetry.</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40 mr-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync Active
            </span>
            <button onClick={fetchCloudData} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button onClick={handleExportCSV} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
              Terminate
            </button>
          </div>
        </header>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Trials" value={stats.totalTrials.toString()} subtext="Across all nodes" />
          <MetricCard title="Avg Persistence" value={`${stats.avgPersistence}s`} subtext="Global neural baseline" color="text-indigo-400" />
          <MetricCard title="Avg Stare Time" value={`${stats.avgStare}s`} subtext="Stimulus exposure limit" />
          <MetricCard 
            title="Max Impact Stimulus" 
            value={stats.topColor?.name || 'N/A'} 
            subtext={stats.topColor ? `${stats.topColor.avgPersistence}s avg rebound` : 'Insufficient Data'} 
            colorStyle={stats.topColor ? { color: stats.topColor.hex } : undefined}
          />
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Exposure vs. Persistence Correlation</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis type="number" dataKey="stare" name="Stare Time" unit="s" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="persistence" name="Persistence" unit="s" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter name="Trials" data={stats.scatterData}>
                    {stats.scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hex} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Avg Persistence by Color</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.colorStats} layout="vertical" margin={{ top: 0, right: 0, bottom: -10, left: -20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                  <Bar dataKey="avgPersistence" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.colorStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* DATA GRID TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Raw Neural Telemetry Log</h3>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{data.length} Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Participant Node</th>
                  <th className="px-6 py-4 font-medium">Stimulus</th>
                  <th className="px-6 py-4 font-medium text-center">Stare (s)</th>
                  <th className="px-6 py-4 font-medium text-center">Persist (s)</th>
                  <th className="px-6 py-4 font-medium">Perceived Color</th>
                  <th className="px-6 py-4 font-medium">AI Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {[...data].reverse().map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 text-white/40 group-hover:text-white/70 transition-colors">{row.participantId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: row.colorHex }} />
                        <span className="font-sans font-medium text-white/80">{row.colorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-white/50">{row.stareDuration}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-400">{row.persistenceDuration}</td>
                    <td className="px-6 py-4">
                      {row.perceivedColor ? (
                        <span className="bg-white/5 px-3 py-1.5 rounded-lg text-white/70 border border-white/10 uppercase tracking-wider text-[10px]">
                          {row.perceivedColor}
                        </span>
                      ) : (
                        <span className="text-white/20 italic text-[10px]">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-sans text-[11px] text-white/50 max-w-xs truncate group-hover:text-white/80 transition-colors cursor-help" title={row.aiInsight}>
                      {row.aiInsight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function MetricCard({ title, value, subtext, color = "text-white", colorStyle = {} }: { title: string, value: string, subtext: string, color?: string, colorStyle?: React.CSSProperties }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:bg-white/10 transition-colors duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">{title}</p>
      <div>
        <h4 className={`text-4xl font-black font-mono tracking-tighter mb-1 ${color}`} style={colorStyle}>{value}</h4>
        <p className="text-xs text-white/30 font-medium">{subtext}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl z-50">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.hex }} />
          <p className="text-xs font-bold text-white uppercase tracking-wider">{data.name || data.fullName}</p>
        </div>
        
        {data.stare !== undefined && (
          <div className="flex justify-between items-center gap-6 mb-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Stare Limit:</span>
            <span className="text-xs font-mono text-white font-medium">{data.stare}s</span>
          </div>
        )}
        
        {data.persistence !== undefined ? (
          <div className="flex justify-between items-center gap-6">
            <span className="text-[10px] font-mono uppercase text-white/40">Persistence:</span>
            <span className="text-xs font-mono text-indigo-400 font-bold">{data.persistence}s</span>
          </div>
        ) : (
          <div className="flex justify-between items-center gap-6">
            <span className="text-[10px] font-mono uppercase text-white/40">Avg Persist:</span>
            <span className="text-xs font-mono text-indigo-400 font-bold">{data.avgPersistence}s</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};