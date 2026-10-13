const STORAGE_KEY_AUTH = 'polipak_auth_header';
const STORAGE_KEY_USER = 'polipak_current_user';

export const tokenStorage = {
    getAuthHeader(): string | null {
        return localStorage.getItem(STORAGE_KEY_AUTH);
    },

    getAccessToken(): string | null {
        return localStorage.getItem(STORAGE_KEY_AUTH);
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(STORAGE_KEY_AUTH);
    },

    setAuth(type: 'Basic' | 'Bearer', token: string): void {
        localStorage.setItem(STORAGE_KEY_AUTH, `${type} ${token}`);
    },

    clear(): void {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(STORAGE_KEY_USER);
    },
};