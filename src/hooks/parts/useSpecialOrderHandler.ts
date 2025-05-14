
import { useSpecialOrder } from '@/hooks/parts/useSpecialOrder';

export function useSpecialOrderHandler() {
  const { 
    specialOrders, 
    fetchSpecialOrders,
    updateSpecialOrderStatus
  } = useSpecialOrder();
  
  return {
    specialOrders,
    fetchSpecialOrders,
    updateSpecialOrderStatus
  };
}
