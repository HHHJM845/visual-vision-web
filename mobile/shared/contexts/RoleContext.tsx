import React, { createContext, useContext, useState, ReactNode } from 'react';

// For the Stitch UI demo: easily switch between creator and client views
export type AppRole = 'creator' | 'client';

interface RoleContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  isCreator: boolean;
  isClient: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children, initialRole = 'creator' }: { children: ReactNode; initialRole?: AppRole }) {
  const [role, setRole] = useState<AppRole>(initialRole);

  return (
    <RoleContext.Provider value={{
      role,
      setRole,
      isCreator: role === 'creator',
      isClient: role === 'client',
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
