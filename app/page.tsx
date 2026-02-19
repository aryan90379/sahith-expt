'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExperimentPhase, ColorStimulus, ExperimentResult } from '../types';
import { COLOR_LIBRARY, DEFAULT_STARE_DURATION } from '../lib/constants';
import { ColorGrid } from '../components/ColorGrid';
import { ExperimentView } from '../components/ExperimentView';
import { ResultsChart } from '../components/ResultsChart';
import { AdminDashboard } from '../components/AdminDashboard';
import { generateInsight } from '../lib/geminiClient';
import { DataService } from '../lib/dataService';

export default function Home() {
  const [phase, setPhase] = useState<ExperimentPhase>(ExperimentPhase.IDLE);
  const [selectedStimulus, setSelectedStimulus] = useState<ColorStimulus>(COLOR_LIBRARY[0]);
  const [stareDuration, setStareDuration] = useState(DEFAULT_STARE_DURATION);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExperimentResult | null>(null);
  
  // New States for capturing user input
  const [tempPersistenceDuration, setTempPersistenceDuration] = useState(0);
  const [perceivedColorInput, setPerceivedColorInput] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [participantId, setParticipantId] = useState<string>('Loading...');
  
  const logoClickCount = useRef(0);

  useEffect(() => {
    setParticipantId(DataService.getParticipantId());
    const saved = localStorage.getItem('chroma_results');
    if (saved) {
      try { setResults(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (results.length > 0) localStorage.setItem('chroma_results', JSON.stringify(results));
  }, [results]);

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickCount.current >= 5) {
      const pin = prompt("Admin Access Required. Enter PIN:");
      if (pin === "chroma2024") {
        setIsAdmin(true);
        alert("Admin Mode: Global Vault Unlocked.");
      } else {
        alert("Incorrect PIN.");
      }
      logoClickCount.current = 0;
    }
    setTimeout(() => { logoClickCount.current = 0; }, 2000);
  };

  const startConfig = () => { setPhase(ExperimentPhase.CONFIGURING); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startExperiment = () => setPhase(ExperimentPhase.STARING);
  const finishStare = useCallback(() => setPhase(ExperimentPhase.PERSISTENCE), []);
  const abortExperiment = () => setPhase(ExperimentPhase.IDLE);

  // Instead of finalizing, we jump to the input phase
  const finishPersistence = (duration: number) => {
    setTempPersistenceDuration(duration);
    setPerceivedColorInput('');
    setPhase(ExperimentPhase.INPUT_PERCEIVED);
  };

  // Submit the text and finalize the results
  const submitFinalResult = async () => {
    const newResult: ExperimentResult = {
      id: crypto.randomUUID(),
      participantId: DataService.getParticipantId(),
      timestamp: Date.now(),
      colorName: selectedStimulus.name,
      colorHex: selectedStimulus.hex,
      stareDuration: stareDuration,
      persistenceDuration: parseFloat(tempPersistenceDuration.toFixed(2)),
      perceivedColor: perceivedColorInput, 
    };

    setCurrentResult(newResult);
    setPhase(ExperimentPhase.RESULTS);
    setIsAiLoading(true);
    
    // 1. Wait for Gemini to generate the insight FIRST
    const insight = await generateInsight(newResult);
    
    // 2. Attach the insight to the result
    const finalResult = { ...newResult, aiInsight: insight, isSynced: true };
    
    // 3. NOW send it to Google Sheets with the insight included
    await DataService.syncToCloud(finalResult);
    
    setCurrentResult(finalResult);
    setResults(prev => [finalResult, ...prev]);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500 selection:text-white">
      <header className="px-6 py-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={handleLogoClick} className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <span className="text-xl font-black italic">Ɵ</span>
            </div>
            <div onClick={() => setPhase(ExperimentPhase.IDLE)}>
              <h1 className="font-bold text-lg tracking-tight">ChromaƟc Adaptation</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {isAdmin && (
              <button onClick={() => setPhase(ExperimentPhase.ADMIN_DASHBOARD)} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Open Vault</button>
            )}
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Lab Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {phase === ExperimentPhase.IDLE || phase === ExperimentPhase.CONFIGURING ? (
          <div className="space-y-32">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-8">
              <div className="space-y-8 animate-in fade-in duration-700">
                <h2 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tighter">
                  ChromaƟc <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Adaptation.</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed max-w-lg">Observe the biological phenomenon of <strong>Retinal Fatigue</strong>.</p>
                <button onClick={startConfig} className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-xl active:scale-95">Start Experiment</button>
              </div>
            </section>

            {phase === ExperimentPhase.CONFIGURING && (
              <section className="bg-indigo-500/5 border border-indigo-500/20 p-12 rounded-[3rem]">
                <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-2">Configure Trial Parameters</h3>
                  </div>
                  <div className="space-y-12">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center">I. Stimulus Selection</label>
                      <ColorGrid selectedId={selectedStimulus.id} onSelect={setSelectedStimulus} />
                    </div>
                    <div className="max-w-xl mx-auto">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center">
                        II. Adaptation Period: <span className="text-white font-mono bg-white/10 px-4 py-1 rounded-lg">{stareDuration}s</span>
                      </label>
                      <input type="range" min="5" max="120" step="5" value={stareDuration} onChange={(e) => setStareDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>
                    <div className="flex gap-4 pt-6 max-w-xl mx-auto">
                      <button onClick={startExperiment} className="flex-1 py-6 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-400 transition-all">BEGIN TRIAL</button>
                      <button onClick={abortExperiment} className="px-8 py-6 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all">CANCEL</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-24">
                 <h3 className="text-4xl font-extrabold tracking-tight">The Opponent Process Theory</h3>
                 <p className="text-white/60 text-lg">Staring at colors exhausts processing neurons. Once switching to white, your visual system tries to re-calibrate, but the opposing color signal spikes, creating a ghost-like perception.</p>
              </div>
              <div className="lg:col-span-4 space-y-12">
                 <div className="sticky top-32 space-y-12">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Trial Analytics</h4>
                      <ResultsChart results={results} />
                    </section>
                 </div>
              </div>
            </div>
          </div>

        ) : phase === ExperimentPhase.INPUT_PERCEIVED ? ( // NEW INPUT SCREEN
          <div className="max-w-2xl mx-auto py-24 space-y-8 text-center animate-in slide-in-from-bottom-8">
            <h3 className="text-5xl font-bold tracking-tight">What color did you see?</h3>
            <p className="text-white/50 text-lg">Describe the phantom color that appeared on the white screen.</p>
            <input
              type="text"
              value={perceivedColorInput}
              onChange={(e) => setPerceivedColorInput(e.target.value)}
              placeholder="e.g., Bright Cyan, Pale Pink, Nothing..."
              className="w-full bg-white/5 border border-white/20 rounded-2xl p-6 text-xl text-center focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && perceivedColorInput.trim() && submitFinalResult()}
            />
            <button
              onClick={submitFinalResult}
              disabled={!perceivedColorInput.trim()}
              className="w-full py-6 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Results
            </button>
          </div>
          
        ) : phase === ExperimentPhase.RESULTS ? (
          <div className="max-w-4xl mx-auto py-12 space-y-16 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-8">
              <h2 className="text-7xl font-black tracking-tighter leading-none">Experiment Complete.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 p-12 rounded-[3.5rem] bg-white/5 border border-white/10">
                  <h3 className="text-[10px] font-bold uppercase text-indigo-400 mb-8 tracking-[0.4em]">Neural-AI Insight</h3>
                  {isAiLoading ? (
                    <div className="space-y-4 animate-pulse"><div className="h-5 bg-white/10 rounded-full w-full"></div></div>
                  ) : (
                    <p className="text-2xl font-medium italic leading-relaxed">"{currentResult?.aiInsight}"</p>
                  )}
               </div>
               <div className="p-12 rounded-[3.5rem] bg-indigo-500 text-white flex flex-col justify-center items-center">
                  <p className="text-[10px] font-bold uppercase text-white/60 mb-3 tracking-widest">Persistence</p>
                  <p className="text-6xl font-black font-mono tracking-tighter">{currentResult?.persistenceDuration}s</p>
               </div>
            </div>
            <div className="flex justify-center gap-4 pt-12">
              <button onClick={startConfig} className="px-12 py-6 bg-white text-black rounded-2xl font-bold hover:bg-gray-200">New Trial</button>
            </div>
          </div>
        ) : phase === ExperimentPhase.ADMIN_DASHBOARD ? (
          <AdminDashboard onClose={() => setPhase(ExperimentPhase.IDLE)} onRefresh={() => {
            const saved = localStorage.getItem('chroma_results');
            if (saved) setResults(JSON.parse(saved));
          }} />
        ) : null}
      </main>

      {(phase === ExperimentPhase.STARING || phase === ExperimentPhase.PERSISTENCE) && (
        <ExperimentView phase={phase} stimulus={selectedStimulus} stareLimit={stareDuration} onFinishStare={finishStare} onFinishPersistence={finishPersistence} onAbort={abortExperiment} />
      )}
    </div>
  );
}