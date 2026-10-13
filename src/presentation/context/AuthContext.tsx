import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUser, UserRole, ILoginRequest } from '@domain/models/auth';
import { IAuthRepository } from '@domain/ports/IAuthRepository';
import { tokenStorage } from '@infrastructure/api/tokenStorage';

interface AuthContextType {
    user: IUser | null;
    role: UserRole;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: ILoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode; authRepo: IAuthRepository }> = ({
                                                                                                     children,
                                                                                                     authRepo,
                                                                                                 }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            const authHeader = tokenStorage.getAuthHeader();
            if (!authHeader) {
                setIsLoading(false);
                return;
            }

            try {
                const currentUser = await authRepo.getMe();
                setUser(currentUser);
            } catch {
                tokenStorage.clear();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        const handleUnauthorized = () => {
            setUser(null);
            setIsLoading(false);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [authRepo]);

    const login = useCallback(async (credentials: ILoginRequest) => {
        const data = await authRepo.login(credentials);
        setUser(data.user);
    }, [authRepo]);

    const logout = useCallback(async () => {
        await authRepo.logout();
        setUser(null);
    }, [authRepo]);

    const value: AuthContextType = {
        user,
        role: user?.role || 'VIEWER',
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};