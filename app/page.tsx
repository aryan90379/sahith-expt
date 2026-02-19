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
  
  // States for capturing user input
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
      setIsAdmin(true);
      setPhase(ExperimentPhase.ADMIN_DASHBOARD);
      logoClickCount.current = 0;
    }
    setTimeout(() => { logoClickCount.current = 0; }, 2000);
  };

  const startConfig = () => { setPhase(ExperimentPhase.CONFIGURING); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startExperiment = () => setPhase(ExperimentPhase.STARING);
  const finishStare = useCallback(() => setPhase(ExperimentPhase.PERSISTENCE), []);
  const abortExperiment = () => setPhase(ExperimentPhase.IDLE);

  // Instead of finalizing immediately, jump to the input phase
  const finishPersistence = (duration: number) => {
    setTempPersistenceDuration(duration);
    setPerceivedColorInput('');
    setPhase(ExperimentPhase.INPUT_PERCEIVED);
  };

  // Submit the text and finalize the results to Cloud & Gemini
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
    
    // 1. Wait for Gemini to generate the insight
    const insight = await generateInsight(newResult);
    
    // 2. Attach the insight to the payload
    const finalResult = { ...newResult, aiInsight: insight, isSynced: true };
    
    // 3. Send securely to Google Sheets
    await DataService.syncToCloud(finalResult);
    
    setCurrentResult(finalResult);
    setResults(prev => [finalResult, ...prev]);
    setIsAiLoading(false);
  };

  const navigateToSection = (id: string) => {
    if (phase === ExperimentPhase.STARING || phase === ExperimentPhase.PERSISTENCE) return;
    setPhase(ExperimentPhase.IDLE);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
            <button onClick={() => navigateToSection('theory')} className="hidden md:block text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white transition-colors">Theory</button>
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
            
            {/* HERO SECTION */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-8">
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="space-y-2">
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.4em]">Perceptual Research Trials</span>
                  <h2 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tighter">
                    ChromaƟc <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Adaptation.</span>
                  </h2>
                </div>
                <p className="text-white/60 text-lg leading-relaxed max-w-lg">
                  Observe the biological phenomenon of <strong>Retinal Fatigue</strong>. Have participants stare at a high-contrast colored image, then immediately look at a blank white surface to measure the persistence of the phantom "afterimage."
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={startConfig} className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-xl active:scale-95">Start Experiment</button>
                  <button onClick={() => navigateToSection('theory')} className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">Explore Theory</button>
                </div>
              </div>
              <div className="relative aspect-video animate-in fade-in slide-in-from-right-8 duration-700 hidden lg:block">
                <div className="absolute -inset-4 bg-indigo-500/10 rounded-[3rem] blur-2xl"></div>
                <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] h-full w-full overflow-hidden flex justify-center items-center p-12">
                   <div className="grid grid-cols-4 gap-4 w-full h-full">
                      {COLOR_LIBRARY.slice(0, 4).map(c => (
                        <div key={c.id} className="rounded-2xl opacity-80 transition-all duration-500 hover:scale-105" style={{ backgroundColor: c.hex }} />
                      ))}
                   </div>
                </div>
              </div>
            </section>

            {/* CONFIGURATION SECTION */}
            {phase === ExperimentPhase.CONFIGURING && (
              <section className="bg-indigo-500/5 border border-indigo-500/20 p-8 md:p-12 rounded-[3rem] animate-in slide-in-from-bottom-8">
                <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-2">Configure Trial Parameters</h3>
                    <p className="text-white/40">Vary the staring time and color to measure how it affects the persistence duration.</p>
                  </div>
                  <div className="space-y-12">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center">I. Stimulus Selection</label>
                      <ColorGrid selectedId={selectedStimulus.id} onSelect={setSelectedStimulus} />
                    </div>
                    <div className="max-w-xl mx-auto">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center flex items-center justify-center gap-3">
                        II. Adaptation Period: <span className="text-white font-mono bg-white/10 px-4 py-1 rounded-lg text-sm">{stareDuration}s</span>
                      </label>
                      <input type="range" min="5" max="120" step="5" value={stareDuration} onChange={(e) => setStareDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      <div className="flex justify-between mt-4 text-[9px] font-mono text-white/20">
                        <span>5s (MIN)</span>
                        <span>30s (STANDARD)</span>
                        <span>120s (MAX)</span>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-6 max-w-xl mx-auto">
                      <button onClick={startExperiment} className="flex-1 py-6 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">BEGIN TRIAL</button>
                      <button onClick={abortExperiment} className="px-8 py-6 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all">CANCEL</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* THEORY & ANALYTICS SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-16 border-t border-white/5" id="theory">
              
              {/* DETAILED EDUCATIONAL THEORY */}
              <div className="lg:col-span-8 space-y-16">
                 <div>
                    <div className="inline-flex items-center gap-4 mb-6">
                      <div className="h-px w-12 bg-indigo-500/50"></div>
                      <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em]">Vision Science</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">The Anatomy of an Afterimage</h3>
                    
                    <div className="space-y-8 text-white/70 leading-relaxed text-lg">
                      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span> 
                          Why do afterimages appear in complementary colors?
                        </h4>
                        <p>
                          This phenomenon is governed by the <strong>Opponent-Process Theory</strong>, originally proposed by Ewald Hering. Our visual system processes color not as individual wavelengths, but as antagonistic pairs: <strong>Red vs. Green</strong>, <strong>Blue vs. Yellow</strong>, and <strong>Black vs. White</strong>.
                        </p>
                        <p>
                          When you stare at a vibrant green square for 30 seconds, the specific photoreceptor cells (M-cones) responsible for detecting green become heavily stimulated and eventually experience <strong>Photochemical Fatigue</strong>. Their light-sensitive proteins (photopsins) become temporarily depleted or "bleached."
                        </p>
                        <p>
                          When you immediately shift your gaze to a blank white screen (which contains all colors of light), your eyes send a baseline signal to your brain. However, because your green receptors are exhausted, they fire much weaker signals than the fully-rested red receptors. Your brain interprets this imbalance as a spike in the opposing color. Thus, you hallucinate a vivid <strong>Magenta/Red</strong> square that doesn't actually exist!
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span> 
                          How long does it take for photoreceptors to reset?
                        </h4>
                        <p>
                          The duration of the afterimage (its persistence) is a direct measurement of your retina's recovery time. This process is called <strong>Dark Adaptation</strong> or the <strong>Visual Cycle</strong>.
                        </p>
                        <p>
                          The reset time is rarely identical across different trials. It depends heavily on two factors: <strong>Intensity</strong> and <strong>Duration</strong> of the initial stimulus. Staring for 5 seconds might yield a faint afterimage that vanishes in 2 seconds. Staring for 60 seconds deeply bleaches the photopigments, requiring the retinal pigment epithelium (RPE) cells to physically reconvert trans-retinal back to 11-cis-retinal—a chemical regeneration process that can cause the afterimage to persist for 15 to 30 seconds or longer.
                        </p>
                      </div>
                    </div>
                 </div>
              </div>

              {/* ANALYTICS SIDEBAR */}
              <div className="lg:col-span-4 space-y-12">
                 <div className="sticky top-32 space-y-12">
                    <section className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Local Node Analytics</h4>
                      <ResultsChart results={results} />
                      {results.length === 0 && (
                        <p className="text-xs text-center text-white/30 font-mono pt-4">Run a trial to visualize neural rebound data.</p>
                      )}
                    </section>
                 </div>
              </div>

            </div>
          </div>

        ) : phase === ExperimentPhase.INPUT_PERCEIVED ? ( 
          /* PHASE: USER INPUT */
          <div className="max-w-2xl mx-auto py-24 space-y-8 text-center animate-in slide-in-from-bottom-8">
            <h3 className="text-5xl font-bold tracking-tight">What color did you see?</h3>
            <p className="text-white/50 text-lg">Describe the phantom color that appeared on the white screen.</p>
            <input
              type="text"
              value={perceivedColorInput}
              onChange={(e) => setPerceivedColorInput(e.target.value)}
              placeholder="e.g., Bright Cyan, Pale Pink, Nothing..."
              className="w-full bg-white/5 border border-white/20 rounded-2xl p-6 text-xl text-center focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && perceivedColorInput.trim() && submitFinalResult()}
            />
            <button
              onClick={submitFinalResult}
              disabled={!perceivedColorInput.trim() || isAiLoading}
              className="w-full py-6 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              Analyze Neural Response
            </button>
          </div>
          
        ) : phase === ExperimentPhase.RESULTS ? (
          /* PHASE: FINAL RESULTS */
          <div className="max-w-5xl mx-auto py-12 space-y-16 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-6">
              <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.4em]">Trial Concluded</span>
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter leading-none">Telemetry Recorded.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 p-10 md:p-12 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <h3 className="text-[10px] font-bold uppercase text-indigo-400 mb-6 tracking-[0.4em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    AI Diagnostic Insight
                  </h3>
                  {isAiLoading ? (
                    <div className="space-y-4 animate-pulse pt-4">
                      <div className="h-4 bg-white/10 rounded-full w-full"></div>
                      <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                      <div className="h-4 bg-white/10 rounded-full w-4/6"></div>
                    </div>
                  ) : (
                    <p className="text-xl md:text-2xl font-medium text-white/90 leading-relaxed italic">
                      "{currentResult?.aiInsight}"
                    </p>
                  )}
               </div>

               <div className="p-10 rounded-[3rem] bg-indigo-500 text-white flex flex-col justify-center items-center shadow-2xl shadow-indigo-500/20">
                  <p className="text-[10px] font-bold uppercase text-white/60 mb-2 tracking-widest text-center">Rebound Persistence</p>
                  <p className="text-6xl md:text-7xl font-black font-mono tracking-tighter">{currentResult?.persistenceDuration}s</p>
               </div>
            </div>

            <div className="flex justify-center gap-6 pt-8">
              <button onClick={startConfig} className="px-12 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-xl active:scale-95">Run Next Trial</button>
            </div>
          </div>

        ) : phase === ExperimentPhase.ADMIN_DASHBOARD ? (
          <AdminDashboard 
            onClose={() => setPhase(ExperimentPhase.IDLE)} 
            onRefresh={() => {
              const saved = localStorage.getItem('chroma_results');
              if (saved) setResults(JSON.parse(saved));
            }} 
          />
        ) : null}
      </main>

      {(phase === ExperimentPhase.STARING || phase === ExperimentPhase.PERSISTENCE) && (
        <ExperimentView phase={phase} stimulus={selectedStimulus} stareLimit={stareDuration} onFinishStare={finishStare} onFinishPersistence={finishPersistence} onAbort={abortExperiment} />
      )}
    </div>
  );
}