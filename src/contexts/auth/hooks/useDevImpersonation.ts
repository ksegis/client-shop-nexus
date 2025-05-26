
export function useDevImpersonation() {
  const impersonateCustomer = () => {
    // This is a development-only function to create a mock customer user
    const mockCustomerUser = {
      id: 'dev-customer-user-id',
      email: 'customer@example.com',
      app_metadata: {
        role: 'customer'
      },
      user_metadata: {
        first_name: 'Dev',
        last_name: 'Customer',
        phone: '555-5678',
        role: 'customer'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    
    console.log('Switching to dev customer mode');
    
    // Store the mock user in localStorage for development
    localStorage.setItem('dev-customer-user', JSON.stringify(mockCustomerUser));
    
    // Force a page reload to apply the dev customer mode
    window.location.reload();
  };

  return { impersonateCustomer };
}
