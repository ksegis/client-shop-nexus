
import React from 'react';
import { MessagingProvider } from '@/contexts/messaging';
import { MessagesContent } from './MessagesContent';

const ShopMessages = () => {
  return (
    <MessagingProvider>
      <MessagesContent />
    </MessagingProvider>
  );
};

export default ShopMessages;
