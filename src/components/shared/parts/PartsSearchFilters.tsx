
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Package, Search } from 'lucide-react';
import { PartSearchFilters } from '@/types/parts';

interface PartsSearchFiltersProps {
  searchFilters: PartSearchFilters;
  setSearchFilters: (filters: PartSearchFilters) => void;
  categories: string[];
  suppliers: string[];
}

export const PartsSearchFilters = ({
  searchFilters,
  setSearchFilters,
  categories,
  suppliers
}: PartsSearchFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<PartSearchFilters>(searchFilters);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(searchFilters);
  }, [searchFilters]);
  
  // Handle search input change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters({
      ...localFilters,
      query: e.target.value
    });
  };
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      category: value === "all" ? undefined : value
    });
  };
  
  // Handle manufacturer/supplier change
  const handleManufacturerChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      manufacturer: value === "all" ? undefined : value
    });
  };
  
  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    setLocalFilters({
      ...localFilters,
      minPrice: values[0],
      maxPrice: values[1]
    });
  };
  
  // Apply all filters
  const applyFilters = () => {
    setSearchFilters(localFilters);
  };
  
  // Reset all filters
  const resetFilters = () => {
    const resetFilters = { query: '' };
    setLocalFilters(resetFilters);
    setSearchFilters(resetFilters);
    setPriceRange([0, 1000]);
  };
  
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search parts by name, SKU, or description" 
            value={localFilters.query || ''} 
            onChange={handleQueryChange}
            className="flex-1"
          />
          <Button onClick={applyFilters}>Search</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={localFilters.category || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Manufacturer</Label>
            <Select 
              value={localFilters.manufacturer || "all"}
              onValueChange={handleManufacturerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Range</Label>
              <span className="text-sm text-muted-foreground">
                ${priceRange[0]} - ${priceRange[1]}
              </span>
            </div>
            <Slider
              defaultValue={[0, 1000]}
              value={[localFilters.minPrice || 0, localFilters.maxPrice || 1000]}
              min={0}
              max={1000}
              step={10}
              onValueChange={handlePriceRangeChange}
              className="py-4"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="mr-2">
            Reset Filters
          </Button>
          <Button onClick={applyFilters}>
            <Package className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
