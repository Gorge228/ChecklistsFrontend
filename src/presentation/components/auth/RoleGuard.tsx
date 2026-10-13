import React from 'react';
import { UserRole } from '@domain/models/auth';
import { useAuth } from '../../context/AuthContext';

interface RoleGuardProps {
    allow: UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
                                                        allow,
                                                        children,
                                                        fallback = null,
                                                    }) => {
    const { role, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    if (!allow.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};