
import { formatDistanceToNow } from 'date-fns';

export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  lastUpdated: Date;
  isHealthy: boolean;
}

export interface StatusThresholds {
  warning: { cpu: number; memory: number; disk: number };
  critical: { cpu: number; memory: number; disk: number };
}

export const DEFAULT_THRESHOLDS: StatusThresholds = {
  warning: { cpu: 70, memory: 70, disk: 80 },
  critical: { cpu: 90, memory: 90, disk: 90 }
};

export const getStatusSeverity = (
  value: number,
  thresholds: StatusThresholds = DEFAULT_THRESHOLDS
): 'normal' | 'warning' | 'critical' => {
  if (value >= thresholds.critical.cpu) return 'critical';
  if (value >= thresholds.warning.cpu) return 'warning';
  return 'normal';
};

export const getFormattedLastUpdated = (date: Date): string => {
  return `${formatDistanceToNow(date)} ago`;
};
