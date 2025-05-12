
import { RefreshCw, Check, AlertTriangle, X } from 'lucide-react';
import React from 'react';

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <X className="h-4 w-4 text-red-500" />;
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return null;
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
