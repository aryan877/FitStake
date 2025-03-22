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
  count: number;
  sources?: string[];
  recordCount?: number;
  timestamps?: number[];
  records?: StepRecord[];
}
