
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchFilter = ({ searchTerm, setSearchTerm }: SearchFilterProps) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search inventory items..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
