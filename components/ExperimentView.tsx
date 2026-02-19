'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ColorStimulus, ExperimentPhase } from '../types';

interface ExperimentViewProps {
  phase: ExperimentPhase;
  stimulus: ColorStimulus;
  stareLimit: number;
  onFinishStare: () => void;
  onFinishPersistence: (duration: number) => void;
  onAbort: () => void;
}

export const ExperimentView: React.FC<ExperimentViewProps> = ({
  phase, stimulus, stareLimit, onFinishStare, onFinishPersistence, onAbort
}) => {
  const [timeLeft, setTimeLeft] = useState(stareLimit);
  const [persistenceTime, setPersistenceTime] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (phase === ExperimentPhase.STARING) {
      setTimeLeft(stareLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onFinishStare();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, stareLimit, onFinishStare]);

  useEffect(() => {
    if (phase === ExperimentPhase.PERSISTENCE) {
      setPersistenceTime(0);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setPersistenceTime((Date.now() - start) / 1000);
      }, 10);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  if (phase === ExperimentPhase.STARING) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-none transition-colors duration-1000" style={{ backgroundColor: stimulus.hex }}>
        <div className="absolute top-8 left-0 right-0 flex justify-center opacity-50">
          <p className="text-white/80 font-mono tracking-widest text-lg uppercase">Phase 1: Concentration</p>
        </div>
        <div className="relative">
          <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        </div>
        <div className="mt-12 text-center">
          <p className="text-white font-black text-6xl tracking-tighter drop-shadow-md">{timeLeft}s</p>
          <p className="text-white/60 text-sm mt-4 font-medium max-w-xs mx-auto">Gaze at the central black dot. Keep your eyes steady to maximize retinal fatigue.</p>
        </div>
        <button onClick={onAbort} className="absolute bottom-12 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer">
          Cancel Trial
        </button>
      </div>
    );
  }

  if (phase === ExperimentPhase.PERSISTENCE) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white cursor-crosshair">
        <div className="absolute top-8 left-0 right-0 flex justify-center opacity-50">
          <p className="text-black/40 font-mono tracking-widest text-lg uppercase">Phase 2: Observation</p>
        </div>
        <div className="text-center">
          <p className="text-black/20 text-sm mb-4 font-bold uppercase tracking-widest">Persistence Duration</p>
          <p className="text-black font-mono text-7xl font-light mb-8 tabular-nums">{persistenceTime.toFixed(2)}s</p>
          <button onClick={() => onFinishPersistence(persistenceTime)} className="group relative px-12 py-6 bg-black text-white rounded-2xl text-xl font-bold shadow-2xl hover:bg-gray-900 transition-all active:scale-95">
            I CAN NO LONGER SEE IT
          </button>
        </div>
      </div>
    );
  }
  return null;
};