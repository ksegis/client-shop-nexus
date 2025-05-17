
/**
 * Utility functions for audit logging
 */

// Enum for audit log types
export enum AuditLogType {
  DEV_MODE_ENABLED = 'DEV_MODE_ENABLED',
  DEV_MODE_DISABLED = 'DEV_MODE_DISABLED',
  DEV_CUSTOMER_IMPERSONATION = 'DEV_CUSTOMER_IMPERSONATION',
  SKIP_AUTH = 'SKIP_AUTH',
}

// Interface for audit log entries
export interface AuditLogEntry {
  type: AuditLogType;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * Logs an audit event to the console and localStorage
 */
export const logAuditEvent = (
  type: AuditLogType, 
  details?: Record<string, any>
) => {
  // Create log entry
  const entry: AuditLogEntry = {
    type,
    timestamp: new Date().toISOString(),
    details
  };
  
  // Log to console
  console.log(`AUDIT: ${type}`, entry);
  
  // Store in localStorage for persistence
  const logKey = `audit_${type.toLowerCase()}`;
  const existingLogs = JSON.parse(localStorage.getItem(logKey) || '[]');
  existingLogs.push(entry);
  localStorage.setItem(logKey, JSON.stringify(existingLogs));
};

/**
 * Get all audit logs of a specific type
 */
export const getAuditLogs = (type: AuditLogType): AuditLogEntry[] => {
  const logKey = `audit_${type.toLowerCase()}`;
  return JSON.parse(localStorage.getItem(logKey) || '[]');
};

/**
 * View a specific audit log file in a readable format
 */
export const viewAuditLogFile = (type: AuditLogType): string => {
  const logs = getAuditLogs(type);
  
  if (logs.length === 0) {
    return `No entries found in ${type} log`;
  }
  
  return logs.map(entry => {
    const details = entry.details ? JSON.stringify(entry.details, null, 2) : '';
    return `[${entry.timestamp}] ${entry.type}\n${details}\n---`;
  }).join('\n');
};
