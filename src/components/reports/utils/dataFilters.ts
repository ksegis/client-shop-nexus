
export const filterDataByTimeframe = (
  data: any[],
  timeframe: string
): any[] => {
  switch (timeframe) {
    case 'month':
      return data.slice(0, 1);
    case 'quarter':
      return data.slice(0, 3);
    case 'year':
    default:
      return data;
  }
};
