
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface CustomerPartsSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVehicle: string | null;
  setSelectedVehicle: (vehicleId: string | null) => void;
  vehicles: Vehicle[];
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const CustomerPartsSidebar = ({
  searchQuery,
  setSearchQuery,
  selectedVehicle,
  setSelectedVehicle,
  vehicles,
  categories,
  activeCategory,
  setActiveCategory
}: CustomerPartsSidebarProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder="Search parts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter By Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVehicle || 'none'} onValueChange={(value) => setSelectedVehicle(value === 'none' ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All Vehicles</SelectItem>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVehicle && selectedVehicle !== 'none' && (
            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setSelectedVehicle(null)}>
              Clear selection
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <div className="space-y-1">
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
