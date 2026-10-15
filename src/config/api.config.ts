export const APP_CONFIG = {
    /**
     * Автоматическое переключение:
     * Если запущено через `npm run dev:mock` — включаются автономные моки в памяти.
     * Если запущено через `npm run dev` — подключается к реальному Django.
     */
    USE_MOCKS: import.meta.env.MODE === 'mock' || false,

    // Адрес сервера Django
    BACKEND_URL: 'http://127.0.0.1:8000',

    // Префикс API
    API_BASE_URL: '/api/v1',

    // Таймаут сетевых запросов
    TIMEOUT_MS: 15000,
} as const;

export const getApiBaseUrl = (): string => {
    return `${APP_CONFIG.BACKEND_URL}${APP_CONFIG.API_BASE_URL}`;
};