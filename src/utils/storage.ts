import type { ExperimentRecord } from '../types';

const STORAGE_KEY = 'treadmill-experiments';

export function saveRecords(records: ExperimentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save records:', error);
  }
}

export function loadRecords(): ExperimentRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load records:', error);
    return [];
  }
}

export function addRecord(record: ExperimentRecord): ExperimentRecord[] {
  const records = loadRecords();
  records.unshift(record);
  const limitedRecords = records.slice(0, 50);
  saveRecords(limitedRecords);
  return limitedRecords;
}

export function deleteRecord(id: string): ExperimentRecord[] {
  const records = loadRecords();
  const filtered = records.filter((r) => r.id !== id);
  saveRecords(filtered);
  return filtered;
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear records:', error);
  }
}

export function exportRecord(record: ExperimentRecord): string {
  return JSON.stringify(record, null, 2);
}

export function generateRecordId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
