
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { InvoicesProvider } from './InvoicesContext';
import InvoiceDialog from './InvoiceDialog';
import { useEstimateToInvoice } from './hooks/useEstimateToInvoice';

const NewInvoiceFromEstimate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const estimateId = searchParams.get('estimateId');
  const [estimateData, setEstimateData] = useState(null);
  const { getEstimateData, loading } = useEstimateToInvoice();
  
  useEffect(() => {
    if (estimateId) {
      loadEstimateData();
    } else {
      // No estimate ID provided, redirect to invoices page
      navigate('/shop/invoices');
    }
  }, [estimateId]);

  const loadEstimateData = async () => {
    if (!estimateId) return;
    
    const data = await getEstimateData(estimateId);
    if (data.estimate) {
      setEstimateData({
        ...data.estimate,
        lineItems: data.lineItems
      });
    } else {
      navigate('/shop/invoices');
    }
  };

  const handleClose = () => {
    navigate('/shop/invoices');
  };

  if (loading) {
    return (
      <Layout portalType="shop">
        <div className="flex items-center justify-center h-64">
          <p>Loading estimate data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout portalType="shop">
      <InvoicesProvider>
        {estimateData && (
          <InvoiceDialog
            open={true}
            onClose={handleClose}
            estimateData={estimateData}
          />
        )}
      </InvoicesProvider>
    </Layout>
  );
};

export default NewInvoiceFromEstimate;
