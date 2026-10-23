import React from 'react';
import UserManagementModule from '../UserManagementModule';

interface CRMUsuariosProps {
  currentUser: { 
    id: number; 
    username: string; 
    role: string;
    name?: string;
    custom_permissions?: any;
  };
}

export default function CRMUsuarios({ currentUser }: CRMUsuariosProps) {
  return (
    <div className="w-full">
      <UserManagementModule currentUser={currentUser} />
    </div>
  );
}
