import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
    ValidationError,
    LockedChecklistError,
    NotFoundError,
    DomainError
} from '@domain/models/errors';
import { tokenStorage } from './tokenStorage';
import { APP_CONFIG } from '../../config/api.config';

export class HttpClient {
    private readonly instance: AxiosInstance;

    constructor() {
        // Гарантируем корректный базовый URL без проблем со слешами
        const base = APP_CONFIG.BACKEND_URL.replace(/\/+$/, '');
        const prefix = APP_CONFIG.API_BASE_URL.replace(/^\/+|\/+$/g, '');
        const fullBaseUrl = `${base}/${prefix}`;

        this.instance = axios.create({
            baseURL: fullBaseUrl,
            timeout: APP_CONFIG.TIMEOUT_MS,
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.instance.interceptors.request.use(
            (config) => {
                const authHeader = tokenStorage.getAuthHeader();
                if (authHeader && config.headers && !config.headers.Authorization) {
                    config.headers.Authorization = authHeader;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.instance.interceptors.response.use(
            (response: AxiosResponse) => response.data,
            async (error: AxiosError<any>) => {
                if (!error.response) {
                    return Promise.reject(
                        new DomainError('Сервер недоступен или заблокирован CORS. Проверьте Django на порту 8000')
                    );
                }

                const { status, data } = error.response;

                if (status === 401) {
                    tokenStorage.clear();
                    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                    return Promise.reject(new DomainError('Неверный логин или пароль', 401));
                }

                if (status === 400) {
                    return Promise.reject(new ValidationError(data || {}));
                }

                if (status === 403) {
                    return Promise.reject(new LockedChecklistError(data?.detail || 'Доступ запрещен'));
                }

                if (status === 404) {
                    return Promise.reject(new NotFoundError(data?.detail || 'Ресурс не найден'));
                }

                return Promise.reject(new DomainError(data?.detail || error.message, status));
            }
        );
    }

    // Нормализация относительного пути (убираем ведущий слеш, чтобы не затирать baseURL)
    private normalizeUrl(url: string): string {
        return url.replace(/^\/+/, '');
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.get(this.normalizeUrl(url), config) as unknown as Promise<T>;
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.post(this.normalizeUrl(url), data, config) as unknown as Promise<T>;
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.put(this.normalizeUrl(url), data, config) as unknown as Promise<T>;
    }

    async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.patch(this.normalizeUrl(url), data, config) as unknown as Promise<T>;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.delete(this.normalizeUrl(url), config) as unknown as Promise<T>;
    }
}