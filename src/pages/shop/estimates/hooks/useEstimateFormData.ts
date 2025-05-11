
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  owner_id: string;
};

export function useEstimateFormData(customerId: string | null) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "customer");

      if (error) {
        console.error("Error fetching customers:", error);
      } else {
        setCustomers(data as Customer[]);
      }
      setIsLoading(false);
    };

    fetchCustomers();
  }, []);

  // Fetch vehicles for selected customer
  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      return;
    }

    const fetchVehicles = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year, owner_id")
        .eq("owner_id", customerId);

      if (error) {
        console.error("Error fetching vehicles:", error);
      } else {
        setVehicles(data as Vehicle[]);
      }
      setIsLoading(false);
    };

    fetchVehicles();
  }, [customerId]);

  return { customers, vehicles, isLoading };
}
