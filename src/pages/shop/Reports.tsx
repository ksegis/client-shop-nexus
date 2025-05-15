
import { useState } from 'react';
import {
  ReportHeader,
  RevenueChart,
  ServicesChart,
  SatisfactionChart,
  TechnicianPerformanceChart,
  filterDataByTimeframe
} from '@/components/reports';

import {
  revenueData,
  servicesData,
  customerSatisfactionData,
  technicianPerformanceData
} from '@/components/reports/data/reportData';

const Reports = () => {
  const [timeframe, setTimeframe] = useState("year");
  const [year, setYear] = useState("2024");
  
  // Dynamically filter data based on selected timeframe
  const filteredRevenueData = filterDataByTimeframe(revenueData, timeframe);

  return (
    <div className="space-y-6">
      <ReportHeader 
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        year={year}
        setYear={setYear}
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Report */}
        <RevenueChart data={filteredRevenueData} />
        
        {/* Services Report */}
        <ServicesChart data={servicesData} />
        
        {/* Customer Satisfaction */}
        <SatisfactionChart data={customerSatisfactionData} />

        {/* Technician Performance */}
        <TechnicianPerformanceChart data={technicianPerformanceData} />
      </div>
    </div>
  );
};

export default Reports;
