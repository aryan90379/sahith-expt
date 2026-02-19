import { ExperimentResult } from "../types";

const LOCAL_STORAGE_KEY = 'chroma_global_vault';

export const DataService = {
  getParticipantId: (): string => {
    if (typeof window === 'undefined') return 'SSR_ID';
    let pid = localStorage.getItem('participant_id');
    if (!pid) {
      pid = `subject_${Math.random().toString(36).substring(2, 7)}_${Date.now().toString().slice(-4)}`;
      localStorage.setItem('participant_id', pid);
    }
    return pid;
  },

  syncToCloud: async (result: ExperimentResult): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    localData.push({ ...result, isSynced: false });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));

    try {
      const response = await fetch('/api/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: [{
            participantId: result.participantId,
            timestamp: new Date(result.timestamp).toLocaleString(),
            colorName: result.colorName,
            colorHex: result.colorHex,
            stareDuration: result.stareDuration,
            persistenceDuration: result.persistenceDuration,
            perceivedColor: result.perceivedColor, // <-- Added here
            aiInsight: result.aiInsight || 'Processing...'
          }] 
        })
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  fetchFromCloud: async (): Promise<ExperimentResult[]> => {
    try {
      const response = await fetch('/api/sheet');
      const cloudRows = await response.json();
      
      if (cloudRows.error) return [];

      return cloudRows.map((row: any, index: number) => ({
        id: `cloud-${index}`,
        participantId: row.participantId,
        timestamp: new Date(row.timestamp).getTime(),
        colorName: row.colorName,
        colorHex: row.colorHex,
        stareDuration: parseFloat(row.stareDuration),
        persistenceDuration: parseFloat(row.persistenceDuration),
        perceivedColor: row.perceivedColor, // <-- Added here
        aiInsight: row.aiInsight,
        isSynced: true
      }));
    } catch (e) {
      return [];
    }
  },

  getGlobalResults: (): ExperimentResult[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  },

  nukeGlobalData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('chroma_results');
  }
};