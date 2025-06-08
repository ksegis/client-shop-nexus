import React, { useState } from 'react';
import { useKeystone } from '../hooks/useKeystone';

const KeystoneTest: React.FC = () => {
  const {
    isConfigured,
    environment,
    healthStatus,
    searchParts,
    getPartDetails,
    checkHealth,
    loading,
    error
  } = useKeystone();

  const [searchQuery, setSearchQuery] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const result = await searchParts(searchQuery);
    setResults(result);
  };

  const handleGetPartDetails = async () => {
    if (!partNumber.trim()) return;
    const result = await getPartDetails(partNumber);
    setResults(result);
  };

  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      case 'checking': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Keystone API Test</h2>
      
      {/* Configuration Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Configuration Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Configured:</span>
            <span className={`ml-2 ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
              {isConfigured ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Environment:</span>
            <span className="ml-2 font-mono">{environment}</span>
          </div>
          <div>
            <span className="font-medium">Health Status:</span>
            <span className={`ml-2 ${getHealthStatusColor()}`}>
              {healthStatus}
            </span>
          </div>
          <div>
            <button
              onClick={checkHealth}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              Check Health
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold">Error:</h4>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search Parts */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Search Parts</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1 px-3 py-2 border rounded-md"
            disabled={!isConfigured || loading}
          />
          <button
            onClick={handleSearch}
            disabled={!isConfigured || loading || !searchQuery.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Get Part Details */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Get Part Details</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            placeholder="Enter part number..."
            className="flex-1 px-3 py-2 border rounded-md"
            disabled={!isConfigured || loading}
          />
          <button
            onClick={handleGetPartDetails}
            disabled={!isConfigured || loading || !partNumber.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
          >
            {loading ? 'Loading...' : 'Get Details'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Results</h3>
          <pre className="bg-white p-4 rounded border overflow-auto text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      {!isConfigured && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-yellow-800 font-semibold">Setup Required</h4>
          <p className="text-yellow-700">
            Keystone service is not configured. Please check your environment variables.
          </p>
        </div>
      )}
    </div>
  );
};

export default KeystoneTest;

// Force deployment trigger
