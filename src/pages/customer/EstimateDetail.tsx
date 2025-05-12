
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEstimateDetail } from '@/hooks/useEstimateDetail';
import EstimateHeader from '@/components/customer/estimates/EstimateHeader';
import EstimateStatusWarning from '@/components/customer/estimates/EstimateStatusWarning';
import EstimateLineItems from '@/components/customer/estimates/EstimateLineItems';
import EstimateDetailsCard from '@/components/customer/estimates/EstimateDetailsCard';
import EstimateNotesCard from '@/components/customer/estimates/EstimateNotesCard';

const EstimateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const {
    estimate,
    lineItems,
    relatedInvoice,
    changesAllowed,
    loading,
    toggleItemApproval,
    handleApproveEstimate,
    handleRejectEstimate
  } = useEstimateDetail(id || '');

  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <EstimateHeader
          id={estimate.id}
          loading={loading}
          changesAllowed={changesAllowed}
          status={estimate.status}
          relatedInvoice={relatedInvoice}
          onReject={handleRejectEstimate}
          onApprove={handleApproveEstimate}
        />
        
        <EstimateStatusWarning 
          changesAllowed={changesAllowed} 
          status={estimate.status} 
        />
        
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading estimate details...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <EstimateLineItems
                  lineItems={lineItems}
                  toggleItemApproval={toggleItemApproval}
                  changesAllowed={changesAllowed}
                  subtotal={estimate.subtotal}
                  tax={estimate.tax}
                  total={estimate.total}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <EstimateDetailsCard
                status={estimate.status}
                date={estimate.date}
                vehicle={estimate.vehicle}
              />
              
              <EstimateNotesCard notes={estimate.notes} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EstimateDetailPage;
