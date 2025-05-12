
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import EstimatesTable from "./estimates/EstimatesTable";
import EstimateDialog from "./estimates/EstimateDialog";
import { EstimatesProvider, useEstimates } from "./estimates/EstimatesContext";
import { Estimate } from "./estimates/types";
import EstimateStatCards from "./estimates/components/EstimateStatCards";
import EmptyState from "./estimates/components/EmptyState";

function EstimatesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | undefined>(undefined);
  
  // Add debugging to check what's coming from useEstimates
  const estimatesResult = useEstimates();
  
  useEffect(() => {
    console.log("Estimates result:", estimatesResult);
    if (estimatesResult.error) {
      console.error("Estimates error:", estimatesResult.error);
    }
  }, [estimatesResult]);
  
  const { estimates, isLoading, stats } = estimatesResult;

  const handleCreateEstimate = () => {
    console.log("Creating new estimate");
    setSelectedEstimate(undefined);
    setDialogOpen(true);
  };

  const handleEditEstimate = (estimate: Estimate) => {
    console.log("Editing estimate:", estimate);
    setSelectedEstimate(estimate);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log("Closing dialog");
    setDialogOpen(false);
    setSelectedEstimate(undefined);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Estimates</h1>
          <p className="text-muted-foreground">
            Create and manage repair estimates for your customers
          </p>
        </div>
        <Button onClick={handleCreateEstimate}>
          <Plus className="mr-1 h-4 w-4" />
          Create Estimate
        </Button>
      </div>

      <EstimateStatCards stats={stats} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading estimates...</p>
        </div>
      ) : estimates && estimates.length > 0 ? (
        <EstimatesTable onEdit={handleEditEstimate} />
      ) : (
        <EmptyState onCreateEstimate={handleCreateEstimate} />
      )}

      <EstimateDialog
        estimate={selectedEstimate}
        open={dialogOpen}
        onClose={handleCloseDialog}
      />
    </>
  );
}

export default function Estimates() {
  console.log("Rendering Estimates wrapper");
  
  // Add error boundary to catch any rendering errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('React error')) {
        console.log("React error details:", args);
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return (
    <Layout portalType="shop">
      <EstimatesProvider>
        <EstimatesContent />
      </EstimatesProvider>
    </Layout>
  );
}
