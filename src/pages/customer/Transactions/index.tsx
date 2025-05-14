
import { TransactionHistoryProvider } from "./TransactionHistoryContext";
import TransactionHistoryTable from "./TransactionHistoryTable";
import TransactionHistoryBreadcrumbs from "./components/TransactionHistoryBreadcrumbs";

export default function CustomerTransactions() {
  return (
    <div className="container mx-auto">
      <TransactionHistoryBreadcrumbs />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-gray-500">View your payment history for vehicle services</p>
      </div>
      
      <TransactionHistoryProvider>
        <TransactionHistoryTable />
      </TransactionHistoryProvider>
    </div>
  );
}
