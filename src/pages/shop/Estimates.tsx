
import Layout from "@/components/layout/Layout";
import { EstimatesProvider, useEstimates } from "./estimates/EstimatesContext";
import EstimatesTable from "./estimates/EstimatesTable";
import { Loader2 } from "lucide-react";
import { EstimateFormValues } from "./estimates/schemas/estimateSchema";

export default function Estimates() {
  return (
    <Layout portalType="shop">
      <EstimatesProvider>
        <EstimatesContent />
      </EstimatesProvider>
    </Layout>
  );
}

function EstimatesContent() {
  const { 
    estimates, 
    isLoading, 
    updateEstimate, 
    deleteEstimate,
    createEstimate 
  } = useEstimates();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estimates</h1>
        <p className="text-muted-foreground">
          Manage customer estimates and track their approval status.
        </p>
      </div>
      
      <EstimatesTable
        estimates={estimates}
        onUpdateEstimate={updateEstimate}
        onDeleteEstimate={deleteEstimate}
        onCreateEstimate={createEstimate}
      />
    </div>
  );
}
