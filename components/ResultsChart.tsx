'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExperimentResult } from '../types';

export const ResultsChart: React.FC<{ results: ExperimentResult[] }> = ({ results }) => {
  if (results.length === 0) return null;

  const data = results.slice(-10).map((r) => ({
    name: `${r.colorName.split(' ')[0]}`,
    persistence: r.persistenceDuration,
    color: r.colorHex,
    id: r.id
  }));

  return (
    <div className="w-full h-64 bg-white/5 p-6 rounded-2xl border border-white/10">
      <h3 className="text-sm font-bold uppercase text-white/50 mb-6 tracking-widest flex items-center gap-2">Recent Trials (s)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
          <Bar dataKey="persistence" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};