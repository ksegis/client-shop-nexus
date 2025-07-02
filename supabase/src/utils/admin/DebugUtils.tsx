// Debug utilities to identify undefined length errors
import React, { useEffect, useState } from 'react';

// Array Access Monitor
export class ArrayAccessMonitor {
  private static accessLog: Array<{
    timestamp: number;
    component: string;
    property: string;
    value: any;
    stack: string;
  }> = [];

  static logAccess(component: string, property: string, value: any) {
    const stack = new Error().stack || '';
    this.accessLog.push({
      timestamp: Date.now(),
      component,
      property,
      value,
      stack
    });

    // Keep only last 100 entries
    if (this.accessLog.length > 100) {
      this.accessLog = this.accessLog.slice(-100);
    }

    // Log suspicious accesses
    if (value === undefined || value === null) {
      console.warn(`[ArrayMonitor] Undefined access in ${component}.${property}:`, {
        value,
        stack: stack.split('\n').slice(1, 4).join('\n')
      });
    }
  }

  static getLog() {
    return this.accessLog;
  }

  static getUndefinedAccesses() {
    return this.accessLog.filter(entry => 
      entry.value === undefined || entry.value === null
    );
  }
}

// Safe Array Hook
export const useSafeArray = <T,>(
  initialValue: T[] | undefined | null,
  componentName: string,
  propertyName: string
): T[] => {
  const [safeArray, setSafeArray] = useState<T[]>(() => {
    ArrayAccessMonitor.logAccess(componentName, propertyName, initialValue);
    return Array.isArray(initialValue) ? initialValue : [];
  });

  useEffect(() => {
    ArrayAccessMonitor.logAccess(componentName, `${propertyName}_effect`, initialValue);
    if (Array.isArray(initialValue)) {
      setSafeArray(initialValue);
    } else if (initialValue !== undefined && initialValue !== null) {
      console.warn(`[useSafeArray] ${componentName}.${propertyName} is not an array:`, initialValue);
      setSafeArray([]);
    }
  }, [initialValue, componentName, propertyName]);

  return safeArray;
};

// Component Wrapper for Debugging
export const withArrayDebug = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    useEffect(() => {
      console.log(`[ArrayDebug] ${componentName} mounted`);
      
      // Check all props for arrays
      Object.entries(props || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          ArrayAccessMonitor.logAccess(componentName, key, value);
        } else if (value === undefined || value === null) {
          ArrayAccessMonitor.logAccess(componentName, key, value);
        }
      });

      return () => {
        console.log(`[ArrayDebug] ${componentName} unmounted`);
      };
    }, [props]);

    try {
      return <Component {...props} ref={ref} />;
    } catch (error) {
      console.error(`[ArrayDebug] Error in ${componentName}:`, error);
      throw error;
    }
  });
};

// Debug Panel Component
export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [undefinedAccesses, setUndefinedAccesses] = useState<any[]>([]);
  const [allAccesses, setAllAccesses] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUndefinedAccesses(ArrayAccessMonitor.getUndefinedAccesses());
      setAllAccesses(ArrayAccessMonitor.getLog());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-mono z-50"
      >
        🐛 Debug ({undefinedAccesses.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border-2 border-purple-500 rounded-lg shadow-lg z-50 w-96 max-h-96 overflow-hidden">
      <div className="bg-purple-500 text-white px-3 py-2 flex justify-between items-center">
        <span className="font-mono text-sm">Array Access Debug</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 overflow-auto max-h-80">
        <div className="mb-3">
          <h4 className="font-semibold text-red-600 mb-1">
            Undefined Accesses ({undefinedAccesses.length})
          </h4>
          {undefinedAccesses.length === 0 ? (
            <p className="text-green-600 text-sm">No undefined accesses detected!</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-auto">
              {undefinedAccesses.slice(-5).map((access, index) => (
                <div key={index} className="text-xs bg-red-50 p-2 rounded">
                  <div className="font-mono">
                    {access.component}.{access.property}
                  </div>
                  <div className="text-gray-600">
                    {new Date(access.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-blue-600 mb-1">
            Recent Accesses ({allAccesses.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-auto">
            {allAccesses.slice(-5).map((access, index) => (
              <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                <div className="font-mono">
                  {access.component}.{access.property}
                </div>
                <div className="text-gray-600">
                  {Array.isArray(access.value) ? `Array(${access.value.length})` : String(access.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              console.log('Full Access Log:', ArrayAccessMonitor.getLog());
              console.log('Undefined Accesses:', ArrayAccessMonitor.getUndefinedAccesses());
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Log to Console
          </button>
          <button
            onClick={() => {
              (ArrayAccessMonitor as any).accessLog = [];
              setUndefinedAccesses([]);
              setAllAccesses([]);
            }}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

// Safe Array Access Function with Logging
export const safeArrayAccess = <T,>(
  array: T[] | undefined | null,
  componentName: string,
  propertyName: string,
  defaultValue: T[] = []
): T[] => {
  ArrayAccessMonitor.logAccess(componentName, propertyName, array);
  
  if (Array.isArray(array)) {
    return array;
  }
  
  if (array === undefined || array === null) {
    console.warn(`[SafeArray] ${componentName}.${propertyName} is ${array}, using default:`, defaultValue);
  } else {
    console.warn(`[SafeArray] ${componentName}.${propertyName} is not an array:`, array, 'using default:', defaultValue);
  }
  
  return defaultValue;
};

// Hook to detect undefined length errors
export const useUndefinedLengthDetector = (componentName: string) => {
  useEffect(() => {
    const originalObjectDefineProperty = Object.defineProperty;
    
    // Override Object.defineProperty to catch length access
    Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
      if (prop === 'length' && obj === undefined) {
        console.error(`[UndefinedLength] Attempted to access length on undefined object in ${componentName}`);
        console.trace();
      }
      return originalObjectDefineProperty.call(this, obj, prop, descriptor);
    };

    return () => {
      Object.defineProperty = originalObjectDefineProperty;
    };
  }, [componentName]);
};

// Error Boundary specifically for array errors
export class ArrayErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's an array-related error
    if (error.message.includes('length') || 
        error.message.includes('undefined') ||
        error.message.includes('Cannot read properties')) {
      console.error('[ArrayErrorBoundary] Array-related error caught:', error);
      return { hasError: true, error };
    }
    
    // Re-throw non-array errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group(`[ArrayErrorBoundary] Error in ${this.props.componentName}`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.log('Recent array accesses:', ArrayAccessMonitor.getUndefinedAccesses());
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">Array Error in {this.props.componentName}</h3>
          <p className="text-red-600 text-sm mt-1">
            This component encountered an array-related error. Check the console for details.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  ArrayAccessMonitor,
  useSafeArray,
  withArrayDebug,
  DebugPanel,
  safeArrayAccess,
  useUndefinedLengthDetector,
  ArrayErrorBoundary
};

