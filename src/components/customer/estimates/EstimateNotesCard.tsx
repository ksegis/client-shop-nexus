
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EstimateNotesCardProps {
  notes: string;
}

const EstimateNotesCard = ({ notes }: EstimateNotesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{notes || 'No notes available.'}</p>
      </CardContent>
    </Card>
  );
};

export default EstimateNotesCard;
