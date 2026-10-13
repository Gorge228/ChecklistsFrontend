export const APP_CONFIG = {
    // Переключение: false — реальный Django бэкенд, true — автономный мок
    USE_MOCKS: false,

    // Базовый протокол и адрес бэкенда Django
    BACKEND_URL: 'http://127.0.0.1:8000',

    // Префикс API согласно спецификации Swagger
    API_BASE_URL: '/api/v1',

    // Таймаут сетевых запросов (15 сек)
    TIMEOUT_MS: 15000,
} as const;

export const getApiBaseUrl = (): string => {
    return `${APP_CONFIG.BACKEND_URL}${APP_CONFIG.API_BASE_URL}`;
};