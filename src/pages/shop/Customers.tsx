
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { CustomersProvider } from './customers/CustomersContext';
import { CustomersTable } from './customers/CustomersTable';
import { CustomerDialog } from './customers/CustomerDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from './customers/components/SearchBar';

const Customers = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Layout portalType="shop">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your shop's customer database
            </p>
          </div>
        </div>

        <CustomersProvider>
          <div className="rounded-md border">
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <TabsList>
                  <TabsTrigger value="all">All Customers</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2 items-center">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  <CustomerDialog />
                </div>
              </div>

              <TabsContent value="all">
                <CustomersTable filter="all" searchQuery={searchQuery} />
              </TabsContent>
              
              <TabsContent value="recent">
                <CustomersTable filter="recent" searchQuery={searchQuery} />
              </TabsContent>
            </Tabs>
          </div>
        </CustomersProvider>
      </div>
    </Layout>
  );
};

export default Customers;
