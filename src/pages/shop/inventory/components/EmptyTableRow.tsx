
import { TableRow, TableCell } from '@/components/ui/table';

interface EmptyTableRowProps {
  colSpan: number;
  message: string;
}

export const EmptyTableRow = ({ colSpan, message }: EmptyTableRowProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-6">
        {message}
      </TableCell>
    </TableRow>
  );
};
