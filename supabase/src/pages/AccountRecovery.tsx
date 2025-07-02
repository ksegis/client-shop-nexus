
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountRecoveryForm } from '@/components/auth/AccountRecoveryForm';

const AccountRecovery = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate('/shop-login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4">
      <div className="mx-auto max-w-md w-full">
        <AccountRecoveryForm onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default AccountRecovery;
