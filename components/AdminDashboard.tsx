'use client';
import React, { useState, useEffect } from 'react';
import { ExperimentResult } from '../types';
import { DataService } from '../lib/dataService';

export const AdminDashboard: React.FC<{ onClose: () => void; onRefresh: () => void }> = ({ onClose, onRefresh }) => {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setResults(DataService.getGlobalResults());
  }, []);

  const handleRefreshCloud = async () => {
    setIsLoading(true);
    const cloudData = await DataService.fetchFromCloud();
    if (cloudData.length > 0) {
      setResults(cloudData);
      localStorage.setItem('chroma_global_vault', JSON.stringify(cloudData));
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleClearAll = () => {
    if (confirm("DANGER: This will delete local view cache. Proceed?")) {
      DataService.nukeGlobalData();
      setResults([]);
      onRefresh();
    }
  };

  const downloadCSV = () => {
    const headers = ['Participant ID', 'Timestamp', 'Stimulus', 'Stare(s)', 'Persistence(s)', 'AI Insight'];
    const rows = results.map(r => [r.participantId, new Date(r.timestamp).toLocaleString(), r.colorName, r.stareDuration, r.persistenceDuration, `"${r.aiInsight || ''}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Afterimage_Data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-black">
        <h2 className="text-xl font-bold">Admin Research Log</h2>
        <div className="flex gap-3">
          <button onClick={handleRefreshCloud} disabled={isLoading} className="px-4 py-2 bg-green-600 rounded-lg text-sm font-bold">{isLoading ? 'Syncing...' : 'Sync Cloud'}</button>
          <button onClick={downloadCSV} className="px-4 py-2 bg-indigo-500 rounded-lg text-sm font-bold">Export CSV</button>
          <button onClick={handleClearAll} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold">Reset Local</button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">Close</button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-8">
        <table className="w-full text-left text-sm max-w-7xl mx-auto">
          <thead className="bg-white/5 uppercase text-[10px] font-mono tracking-widest text-white/40">
            <tr>
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">Stimulus</th>
              <th className="px-6 py-4 text-center">Stare</th>
              <th className="px-6 py-4 text-center">Persistence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.slice().reverse().map((res, idx) => (
              <tr key={idx} className="hover:bg-white/5">
                <td className="px-6 py-4 font-mono text-xs">{res.participantId}</td>
                <td className="px-6 py-4">{res.colorName}</td>
                <td className="px-6 py-4 text-center">{res.stareDuration}s</td>
                <td className="px-6 py-4 text-center font-bold text-indigo-400">{res.persistenceDuration}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};