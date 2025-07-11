
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useLocation } from 'react-router-dom';
import { UserRole } from '@/contexts/auth/types';

interface AuthStep {
  step: string;
  result: string | boolean | null;
  details?: string;
  timestamp: string;
}

export const AuthorizationDebugger: React.FC = () => {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading, 
    portalType,
    validateAccess
  } = useAuth();
  const location = useLocation();
  const [steps, setSteps] = useState<AuthStep[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  // Use localStorage to persist debug steps across refreshes
  useEffect(() => {
    const savedSteps = localStorage.getItem('authDebuggerSteps');
    if (savedSteps) {
      try {
        setSteps(JSON.parse(savedSteps));
      } catch (e) {
        console.error('Failed to parse saved debug steps', e);
      }
    }
    
    // Set visibility from localStorage if available
    const savedVisibility = localStorage.getItem('authDebuggerVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
    
    // Set expanded state from localStorage if available
    const savedExpanded = localStorage.getItem('authDebuggerExpanded');
    if (savedExpanded !== null) {
      setExpanded(savedExpanded === 'true');
    }
  }, []);
  
  // Save steps to localStorage when they change
  useEffect(() => {
    if (steps.length > 0) {
      localStorage.setItem('authDebuggerSteps', JSON.stringify(steps.slice(-50))); // Keep last 50 steps
    }
  }, [steps]);
  
  // Save visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('authDebuggerVisible', String(isVisible));
  }, [isVisible]);
  
  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('authDebuggerExpanded', String(expanded));
  }, [expanded]);
  
  // Format time for readability
  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
  };
  
  // Add a new step to our tracking
  const addStep = (step: string, result: string | boolean | null, details?: string) => {
    setSteps(prev => [
      ...prev,
      { step, result, details, timestamp: getTime() }
    ]);
  };
  
  // Clear steps when route changes
  useEffect(() => {
    setSteps([]);
    addStep('Navigation', location.pathname, 'Route changed');
  }, [location.pathname]);
  
  // Analyze auth state on initial load and changes
  useEffect(() => {
    // Record loading state
    addStep('Auth Loading', isLoading, 'Is auth context still loading');
    
    if (!isLoading) {
      // Record authentication state
      addStep('Is Authenticated', isAuthenticated, 'User authentication status');
      
      if (isAuthenticated) {
        // Record user details
        addStep('User ID', user?.id || 'missing', 'User identifier');
        addStep('Profile', profile ? 'loaded' : 'missing', 
          profile ? `Role: ${profile.role}, Name: ${profile.first_name} ${profile.last_name}` : 'Profile not loaded');
        
        // Record portal type determination
        addStep('Portal Type', portalType || 'undetermined', 'Customer or Shop portal');
        
        // Check access for each role type
        if (profile?.role) {
          addStep('Access: Customer', validateAccess(['customer']), 'Access to customer routes');
          addStep('Access: Staff', validateAccess(['staff']), 'Access to staff routes');
          addStep('Access: Admin', validateAccess(['admin']), 'Access to admin routes');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, profile, portalType]);
  
  // Analyze path-based access
  useEffect(() => {
    if (!isLoading && profile?.role) {
      // Check current path access
      const currentPath = location.pathname;
      
      // Determine required roles based on path
      let requiredRoles: UserRole[] = [];
      
      if (currentPath.startsWith('/shop')) {
        requiredRoles = ['staff', 'admin'];
        addStep('Path Analysis', 'Shop Route', 'This path requires shop access');
      } else if (currentPath.startsWith('/customer')) {
        requiredRoles = ['customer', 'staff', 'admin'];
        addStep('Path Analysis', 'Customer Route', 'This path requires customer access');
      } else if (currentPath.startsWith('/auth')) {
        requiredRoles = [];
        addStep('Path Analysis', 'Auth Route', 'Auth routes have no role requirements');
      } else if (currentPath === '/') {
        requiredRoles = [];
        addStep('Path Analysis', 'Root Route', 'Root route has no role requirements');
      } else if (currentPath.startsWith('/testing')) {
        requiredRoles = ['staff', 'admin'];
        addStep('Path Analysis', 'Testing Route', 'This path requires staff or admin access');
      }
      
      // Check if user has access to the current path
      if (requiredRoles.length > 0) {
        const hasAccess = validateAccess(requiredRoles);
        addStep(
          'Route Access Check', 
          hasAccess, 
          `User role ${profile.role} ${hasAccess ? 'has' : 'does not have'} access to ${currentPath}`
        );
      }
    }
  }, [location.pathname, profile?.role, isLoading]);
  
  // Don't return null, always render something even if hidden
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsVisible(true)} 
          className="bg-blue-500 text-white px-3 py-1 rounded-full shadow-lg text-xs"
        >
          Show Auth Debugger
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-800 text-white rounded-lg shadow-lg max-w-md overflow-hidden">
      <div className="p-2 bg-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-sm">Authentication Flow Debugger</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button 
            onClick={() => setSteps([])} 
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
          >
            Hide
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-2 max-h-96 overflow-auto text-sm">
          {steps.map((step, index) => (
            <div key={index} className="py-1 border-b border-slate-700 last:border-none">
              <div className="flex justify-between items-start">
                <div className="flex gap-1 items-center">
                  <span className="font-medium">{step.step}:</span>
                  <span className={
                    typeof step.result === 'boolean'
                      ? step.result ? 'text-green-400' : 'text-red-400' 
                      : 'text-blue-400'
                  }>
                    {typeof step.result === 'boolean' 
                      ? (step.result ? '✓ Yes' : '✗ No') 
                      : String(step.result)}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{step.timestamp}</span>
              </div>
              {step.details && (
                <div className="text-xs text-slate-400 pl-2 mt-1">{step.details}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
