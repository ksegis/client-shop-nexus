
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Estimate" : "Edit Estimate"}
          </DialogTitle>
        </DialogHeader>
        <EstimateForm
          estimate={estimate}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EstimateDialog;
