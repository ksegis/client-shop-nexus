
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from "@/hooks/use-toast";

interface ReportHeaderProps {
  timeframe: string;
  setTimeframe: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
}

export const ReportHeader = ({ timeframe, setTimeframe, year, setYear }: ReportHeaderProps) => {
  const filterData = () => {
    // For demonstration purposes - would connect to real data filtering
    toast({
      title: "Data filtered",
      description: `Showing data for ${year}, view: ${timeframe}`,
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View performance metrics and analytics for your shop.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Select defaultValue={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        
          <Button 
            variant="outline" 
            className="flex items-center gap-1" 
            onClick={filterData}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        
        <ToggleGroup 
          type="single" 
          value={timeframe} 
          onValueChange={(value) => value && setTimeframe(value)}
        >
          <ToggleGroupItem value="month" aria-label="Toggle month view">
            Month
          </ToggleGroupItem>
          <ToggleGroupItem value="quarter" aria-label="Toggle quarter view">
            Quarter
          </ToggleGroupItem>
          <ToggleGroupItem value="year" aria-label="Toggle year view">
            Year
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
