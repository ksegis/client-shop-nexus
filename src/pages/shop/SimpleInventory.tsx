
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth';
import { useRlsAwareInventoryData } from '@/hooks/useRlsAwareInventoryData';
import { RlsTroubleshooter } from '@/components/dev/RlsTroubleshooter';

const SimpleInventory = () => {
  const { user, loading } = useAuth();
  const { 
    inventoryItems, 
    isLoading,
    error
  } = useRlsAwareInventoryData();
  
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  
  if (loading) {
    return <div className="p-8 text-center">Loading authentication status...</div>;
  }
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Simple Inventory</h1>
          <p className="text-muted-foreground">
            {user 
              ? `Authenticated as ${user.email} (${user.app_metadata?.role || user.user_metadata?.role || 'no role'})` 
              : 'Not authenticated - RLS policies may block access'}
          </p>
        </div>
        <button 
          onClick={() => setShowTroubleshooter(!showTroubleshooter)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showTroubleshooter ? 'Hide' : 'Show'} RLS Troubleshooter
        </button>
      </div>
      
      {showTroubleshooter && (
        <RlsTroubleshooter />
      )}
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <p className="mt-2 text-sm text-red-600">
              This may be due to Row Level Security (RLS) policies. Use the troubleshooter above to diagnose.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({inventoryItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading inventory data...</p>
          ) : inventoryItems.length > 0 ? (
            <div className="grid gap-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2">{item.description || '—'}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">${item.price.toFixed(2)}</td>
                        <td className="p-2">{item.category || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>No inventory items found. This could be due to RLS policies or empty table.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleInventory;
