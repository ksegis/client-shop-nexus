
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Estimate } from "./EstimatesContext";
import { EstimateFormValues } from "./schemas/estimateSchema";
import { EstimateForm } from "./components/EstimateForm";

interface EstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate?: Estimate;
  onSubmit: (values: EstimateFormValues) => Promise<void>;
  mode: "create" | "edit";
}

export function EstimateDialog({ 
  open, 
  onOpenChange, 
  estimate, 
  onSubmit, 
  mode 
}: EstimateDialogProps) {
  const handleSubmit = async (values: EstimateFormValues) => {
    try {
      console.log("EstimateDialog - handleSubmit called with:", values);
      await onSubmit(values);
      console.log("EstimateDialog - onSubmit completed successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("EstimateDialog - Failed to submit estimate:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Estimate" : "Edit Estimate"}
          </DialogTitle>
          <DialogDescription>
            Fill out the details below to {mode === "create" ? "create a new" : "edit the"} estimate.
          </DialogDescription>
        </DialogHeader>
        <EstimateForm
          estimate={estimate}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EstimateDialog;
