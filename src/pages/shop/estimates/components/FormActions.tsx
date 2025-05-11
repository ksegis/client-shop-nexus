
import React from "react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  mode: "create" | "edit";
}

export function FormActions({ onCancel, mode }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        {mode === "create" ? "Create Estimate" : "Update Estimate"}
      </Button>
    </div>
  );
}
