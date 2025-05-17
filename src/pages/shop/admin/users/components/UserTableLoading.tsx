
import React from 'react';

export const UserTableLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
};
