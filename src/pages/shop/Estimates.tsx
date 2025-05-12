
import { useState } from "react";
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
  const { estimates, isLoading, stats } = useEstimates();

  const handleCreateEstimate = () => {
    setSelectedEstimate(undefined);
    setDialogOpen(true);
  };

  const handleEditEstimate = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
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
      ) : estimates.length > 0 ? (
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
  return (
    <Layout portalType="shop">
      <EstimatesProvider>
        <EstimatesContent />
      </EstimatesProvider>
    </Layout>
  );
}
