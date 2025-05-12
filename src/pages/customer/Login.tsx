
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CustomerLoginHeader from '@/components/customer/auth/CustomerLoginHeader';
import CustomerLoginForm from '@/components/customer/auth/CustomerLoginForm';
import SocialLoginOptions from '@/components/customer/auth/SocialLoginOptions';
import PasswordResetForm from '@/components/customer/auth/PasswordResetForm';

const CustomerLogin = () => {
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    navigate('/customer/profile');
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-md p-6 shadow-md">
        <CustomerLoginHeader />
        
        {showResetForm ? (
          <PasswordResetForm 
            email={email}
            onCancel={() => setShowResetForm(false)} 
          />
        ) : (
          <>
            <CustomerLoginForm 
              onResetPassword={() => setShowResetForm(true)} 
            />
            <SocialLoginOptions />
          </>
        )}
      </Card>
    </div>
  );
};

export default CustomerLogin;
