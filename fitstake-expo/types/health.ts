/**
 * Types related to health data and step tracking
 */

export interface StepRecord {
  count: number;
  startTime: string;
  endTime: string;
  recordingMethod?: number;
  dataOrigin?: string;
  id?: string;
  lastModifiedTime?: string;
}

export interface StepsData {
  date: string;
  dateISO?: string; // ISO format date string (YYYY-MM-DD)
  count: number;
  startTime?: string; // ISO format date-time for time-bounded queries
  endTime?: string; // ISO format date-time for time-bounded queries
  sources?: string[];
  recordCount?: number;
  timestamps?: number[];
  records?: StepRecord[];
}
