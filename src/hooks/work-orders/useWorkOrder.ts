
import { useState, useEffect } from 'react';

export interface WorkOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  license: string;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string;
  progress: number;
  estimatedCompletion: string;
  customer: Customer;
  vehicle: Vehicle;
  lineItems: WorkOrderLineItem[];
  total: number;
}

interface WorkOrderHook {
  workOrder: WorkOrder | null;
  loading: boolean;
  error: Error | null;
}

export const useWorkOrder = (id: string): WorkOrderHook => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          // Mock data based on the ID
          const mockWorkOrder = {
            id: id,
            title: 'Brake Service',
            description: 'Complete brake service including replacement of front and rear brake pads, inspection of rotors and brake lines.',
            status: 'in_progress',
            date: '2023-05-10',
            progress: 75,
            estimatedCompletion: '2023-05-12',
            customer: {
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '(555) 123-4567'
            },
            vehicle: {
              year: '2023',
              make: 'Ford',
              model: 'F-150',
              vin: '1FTEW1E53NFC12345',
              license: 'ABC123'
            },
            lineItems: [
              {
                id: '1',
                description: 'Front Brake Pads (Premium)',
                quantity: 1,
                price: 120.00,
                total: 120.00
              },
              {
                id: '2',
                description: 'Rear Brake Pads (Premium)',
                quantity: 1,
                price: 110.00,
                total: 110.00
              },
              {
                id: '3',
                description: 'Labor - Brake Service',
                quantity: 3,
                price: 85.00,
                total: 255.00
              }
            ],
            total: 485.00
          };
          
          setWorkOrder(mockWorkOrder);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching work order:', error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching work order'));
        setLoading(false);
      }
    };
    
    fetchWorkOrder();
  }, [id]);

  return { workOrder, loading, error };
};
