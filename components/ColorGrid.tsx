'use client';
import React from 'react';
import { ColorStimulus } from '../types';
import { COLOR_LIBRARY } from '@/lib/constants';

interface ColorGridProps {
  onSelect: (color: ColorStimulus) => void;
  selectedId?: string;
}

export const ColorGrid: React.FC<ColorGridProps> = ({ onSelect, selectedId }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {COLOR_LIBRARY.map((color) => (
        <button
          key={color.id}
          onClick={() => onSelect(color)}
          className={`group relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 border-2 ${
            selectedId === color.id 
            ? 'border-indigo-500 bg-indigo-500/10 scale-105' 
            : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div 
            className="w-full aspect-square rounded-lg shadow-lg mb-3 transition-transform group-hover:scale-95"
            style={{ backgroundColor: color.hex }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {color.name}
          </span>
          {selectedId === color.id && (
            <div className="absolute -top-2 -right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};