import { ColorStimulus } from '../types';

export const COLOR_LIBRARY: ColorStimulus[] = [
  {
    id: 'red',
    name: 'Vibrant Red',
    hex: '#FF0000',
    complementName: 'Cyan',
    complementHex: '#00FFFF',
    description: 'Stimulates L-cones. Expect a high-frequency Cyan afterimage.'
  },
  {
    id: 'green',
    name: 'Pure Green',
    hex: '#00FF00',
    complementName: 'Magenta',
    complementHex: '#FF00FF',
    description: 'Stimulates M-cones. Results in a Magenta (non-spectral) rebound.'
  },
  {
    id: 'blue',
    name: 'Deep Blue',
    hex: '#0000FF',
    complementName: 'Yellow',
    complementHex: '#FFFF00',
    description: 'Stimulates S-cones. Produces a bright Yellow afterimage.'
  },
  {
    id: 'amber',
    name: 'Deep Amber',
    hex: '#FFBF00',
    complementName: 'Azure',
    complementHex: '#007FFF',
    description: 'A balance of L and M stimulation. Yields a cool Azure blue.'
  },
  {
    id: 'lime',
    name: 'Lime Neon',
    hex: '#32CD32',
    complementName: 'Purple',
    complementHex: '#800080',
    description: 'Strong M-cone bias with slight L-cone activation.'
  },
  {
    id: 'violet',
    name: 'Electric Violet',
    hex: '#8F00FF',
    complementName: 'Spring Green',
    complementHex: '#00FF7F',
    description: 'Shortest visible wavelength stimulus.'
  },
  {
    id: 'cyan',
    name: 'Bright Cyan',
    hex: '#00FFFF',
    complementName: 'Pure Red',
    complementHex: '#FF0000',
    description: 'Stimulates S and M cones simultaneously.'
  }
];

export const DEFAULT_STARE_DURATION = 45;