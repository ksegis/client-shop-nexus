
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EstimateDetailsCardProps {
  status: string;
  date: string;
  vehicle: string;
}

const EstimateDetailsCard = ({ status, date, vehicle }: EstimateDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="font-medium capitalize mt-1">{status}</dd>
          </div>
          
          <div>
            <dt className="text-gray-500">Date</dt>
            <dd className="font-medium mt-1">{date}</dd>
          </div>
          
          <div>
            <dt className="text-gray-500">Vehicle</dt>
            <dd className="font-medium mt-1">{vehicle}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default EstimateDetailsCard;
