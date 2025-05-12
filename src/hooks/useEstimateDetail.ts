
import { useFetchEstimate } from './estimates/useFetchEstimate';
import { useEstimateActions } from './estimates/useEstimateActions';

export const useEstimateDetail = (estimateId: string) => {
  const {
    estimate,
    setEstimate,
    lineItems,
    setLineItems,
    relatedInvoice,
    loading
  } = useFetchEstimate(estimateId);
  
  const {
    changesAllowed,
    toggleItemApproval,
    areAllItemsApproved,
    handleApproveEstimate,
    handleRejectEstimate
  } = useEstimateActions(estimateId, estimate, setEstimate, lineItems, setLineItems);

  return {
    estimate,
    lineItems,
    relatedInvoice,
    changesAllowed,
    loading,
    toggleItemApproval,
    areAllItemsApproved,
    handleApproveEstimate,
    handleRejectEstimate
  };
};
