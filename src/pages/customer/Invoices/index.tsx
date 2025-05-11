
import Layout from "@/components/layout/Layout";
import { CustomerInvoicesProvider } from "./CustomerInvoicesContext";
import CustomerInvoicesTable from "./CustomerInvoicesTable";

export default function CustomerInvoices() {
  return (
    <Layout portalType="customer">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Invoices</h1>
          <p className="text-gray-500">View and manage invoices for your vehicle services</p>
        </div>
        
        <CustomerInvoicesProvider>
          <CustomerInvoicesTable />
        </CustomerInvoicesProvider>
      </div>
    </Layout>
  );
}
