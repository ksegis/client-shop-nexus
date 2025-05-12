
import React from 'react';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

/**
 * Returns the appropriate icon component for a given system status
 */
export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'online':
      return <CheckCircle2 className="text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="text-amber-500" />;
    case 'offline':
      return <AlertCircle className="text-red-500" />;
    default:
      return <Clock className="text-slate-400" />;
  }
};

/**
 * Formats a timestamp for display in the UI
 */
export const formatTimestamp = (timestamp: string | number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Calculates the performance grade based on system metrics
 */
export const calculatePerformanceGrade = (responseTime: number, availability: number): { grade: string; color: string } => {
  // Lower response time is better, higher availability is better
  if (responseTime < 200 && availability >= 99.9) {
    return { grade: 'A+', color: 'text-green-600' };
  } else if (responseTime < 300 && availability >= 99.5) {
    return { grade: 'A', color: 'text-green-500' };
  } else if (responseTime < 500 && availability >= 99.0) {
    return { grade: 'B', color: 'text-green-400' };
  } else if (responseTime < 800 && availability >= 98.0) {
    return { grade: 'C', color: 'text-amber-500' };
  } else if (responseTime < 1200 && availability >= 95.0) {
    return { grade: 'D', color: 'text-orange-500' };
  } else {
    return { grade: 'F', color: 'text-red-500' };
  }
};
