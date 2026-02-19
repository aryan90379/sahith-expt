export enum ExperimentPhase {
  IDLE = 'IDLE',
  CONFIGURING = 'CONFIGURING',
  STARING = 'STARING',
  PERSISTENCE = 'PERSISTENCE',
  INPUT_PERCEIVED = 'INPUT_PERCEIVED', // <-- New Phase added
  RESULTS = 'RESULTS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

export interface ColorStimulus {
  id: string;
  name: string;
  hex: string;
  complementName: string;
  complementHex: string;
  description: string;
}

export interface ExperimentResult {
  id: string;
  participantId: string;
  timestamp: number;
  colorName: string;
  colorHex: string;
  stareDuration: number;
  persistenceDuration: number;
  perceivedColor: string; // <-- New Data Point added
  aiInsight?: string;
  isSynced?: boolean;
}