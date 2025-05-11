
import { History } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg p-8">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <History className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
      <p className="text-sm text-gray-500 text-center mt-2">
        You don't have any transactions yet. Your payment history will appear here after you make payments for invoices.
      </p>
    </div>
  );
}
