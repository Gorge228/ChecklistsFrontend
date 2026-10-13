import {
    ITemplateRepository,
    IResultRepository,
    IAttachmentRepository,
    IUserSessionService,
    IChecklistResultItem
} from '@domain/ports/repositories';
import { IAuthRepository } from '@domain/ports/IAuthRepository';
import {
    ITemplate,
    IChecklistResultCreate,
    IChecklistSign,
    ISignSuccessResponse,
    IAttachment
} from '@domain/models/checklist';
import {
    ILoginRequest,
    ILoginResponse,
    IRefreshResponse,
    IUser,
    UserRole
} from '@domain/models/auth';
import { HttpClient } from '../api/HttpClient';
import { tokenStorage } from '../api/tokenStorage';
import { getApiBaseUrl } from '../../config/api.config';

function mapBackendResultToFrontend(item: any): IChecklistResultItem {
    const createdDate = item.created_at ? new Date(item.created_at) : new Date();
    const shiftTimeDate = item.shift_time ? new Date(item.shift_time) : createdDate;

    return {
        id: item.id,
        template: item.template || 0,
        template_name: item.template_name || `Чек-лист #${item.id}`,
        equipment_uid: item.equipment_uid || 'LINE-GENERIC',
        user_uid: item.user_uid || 'Оператор',
        shift_number: item.shift_number || 'DAY',
        shift_date: !isNaN(shiftTimeDate.getTime()) ? shiftTimeDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        shift_time: !isNaN(shiftTimeDate.getTime())
            ? shiftTimeDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : '08:00',
        is_completed: Boolean(item.is_completed),
        is_draft: Boolean(item.is_draft),
        is_deprecated: Boolean(item.is_deprecated),
        version: item.version || 1,
        has_violations: Boolean(item.has_violations),
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at,
        general_comment: item.general_comment || null,
        signatures: Array.isArray(item.signatures) ? item.signatures : [],
        groups: Array.isArray(item.groups) ? item.groups : [],
    };
}

export class HttpAuthRepository implements IAuthRepository {
    constructor(private readonly client: HttpClient) {}

    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        const username = credentials.username.trim();
        const password = credentials.password;

        const basicToken = btoa(`${username}:${password}`);
        tokenStorage.setAuth('Basic', basicToken);

        await this.client.get('/templates/');

        let role: UserRole = 'OPERATOR';
        const lower = username.toLowerCase();
        if (lower.includes('admin')) role = 'ADMIN';
        else if (lower.includes('master') || lower.includes('foreman')) role = 'FOREMAN';
        else if (lower.includes('auditor') || lower.includes('viewer')) role = 'VIEWER';

        const user: IUser = {
            id: Date.now(),
            user_uid: username,
            username: username,
            full_name: username === 'admin_mechanic'
                ? 'Сидоров А.М. (Главный механик)'
                : username === 'master_petrov'
                    ? 'Петров С.А. (Сменный мастер)'
                    : username === 'operator_ivanov'
                        ? 'Иванов И.И. (Оператор)'
                        : 'Смирнов Д.Н. (Аудитор)',
            role,
        };

        localStorage.setItem('polipak_current_user', JSON.stringify(user));
        return {
            access: basicToken,
            refresh: 'session',
            user,
        };
    }

    async refreshToken(_refreshToken: string): Promise<IRefreshResponse> {
        return { access: tokenStorage.getAuthHeader() || '' };
    }

    async getMe(): Promise<IUser> {
        const saved = localStorage.getItem('polipak_current_user');
        if (saved) {
            return JSON.parse(saved);
        }
        throw new Error('Пользователь не авторизован');
    }

    async logout(): Promise<void> {
        tokenStorage.clear();
    }
}

export class HttpTemplateRepository implements ITemplateRepository {
    constructor(private readonly client: HttpClient) {}

    async getList(params?: { checklist_type?: string; equipment_uid?: string }): Promise<ITemplate[]> {
        return this.client.get<ITemplate[]>('/templates/', { params });
    }

    async getById(id: number): Promise<ITemplate> {
        return this.client.get<ITemplate>(`/templates/${id}/`);
    }

    async create(payload: Partial<ITemplate>): Promise<ITemplate> {
        return this.client.post<ITemplate>('/templates/', payload);
    }

    async update(id: number, payload: Partial<ITemplate>): Promise<ITemplate> {
        return this.client.put<ITemplate>(`/templates/${id}/`, payload);
    }

    async patch(id: number, payload: Partial<ITemplate>): Promise<ITemplate> {
        return this.client.patch<ITemplate>(`/templates/${id}/`, payload);
    }

    async delete(id: number): Promise<void> {
        await this.client.delete(`/templates/${id}/`);
    }

    async clone(id: number, targetEquipmentUid: string): Promise<ITemplate> {
        return this.client.post<ITemplate>(`/templates/${id}/clone/`, { equipment_uid: targetEquipmentUid });
    }

    async getHistory(id: number): Promise<ITemplate[]> {
        return this.client.get<ITemplate[]>(`/templates/${id}/history/`);
    }
}

export class HttpResultRepository implements IResultRepository {
    constructor(private readonly client: HttpClient) {}

    async getList(params?: Record<string, unknown>): Promise<IChecklistResultItem[]> {
        const rawList = await this.client.get<any[]>('/results/', { params });
        return rawList.map(mapBackendResultToFrontend);
    }

    async getById(id: number): Promise<IChecklistResultItem> {
        const raw = await this.client.get<any>(`/results/${id}/`);
        return mapBackendResultToFrontend(raw);
    }

    async create(payload: IChecklistResultCreate): Promise<{ id: number } & Record<string, unknown>> {
        const nowIsoDateTime = new Date().toISOString();

        const backendPayload = {
            template: payload.template,
            equipment_uid: payload.equipment_uid,
            checklist_type: payload.checklist_type,
            user_uid: payload.user_uid,
            shift_number: payload.shift_number,
            shift_time: nowIsoDateTime,
            is_draft: Boolean(payload.is_draft),
            general_comment: payload.general_comment || '',
            groups: payload.groups.map((g) => ({
                group_id: g.group_id,
                answers: g.answers.map((a) => {
                    let val = String(a.value ?? '').trim();
                    // АВТО-ПЕРЕВОД: "ДА" -> "true", "НЕТ" -> "false" для Django
                    if (val === 'ДА') val = 'true';
                    if (val === 'НЕТ') val = 'false';

                    return {
                        field_id: a.field_id,
                        value: val,
                        comment: a.comment || '',
                    };
                }),
            })),
        };

        return this.client.post<{ id: number }>('/results/', backendPayload);
    }

    async update(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem> {
        const res = await this.client.put<any>(`/results/${id}/`, payload);
        return mapBackendResultToFrontend(res);
    }

    async patch(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem> {
        const res = await this.client.patch<any>(`/results/${id}/`, payload);
        return mapBackendResultToFrontend(res);
    }

    async delete(id: number): Promise<void> {
        await this.client.delete(`/results/${id}/`);
    }

    async getHistory(id: number): Promise<IChecklistResultItem[]> {
        const raw = await this.client.get<any[]>(`/results/${id}/history/`);
        return Array.isArray(raw) ? raw.map(mapBackendResultToFrontend) : [];
    }

    async sign(resultId: number, payload: IChecklistSign): Promise<ISignSuccessResponse> {
        return this.client.post<ISignSuccessResponse>(`/results/${resultId}/sign/`, payload);
    }
}

export class HttpAttachmentRepository implements IAttachmentRepository {
    constructor(private readonly client: HttpClient) {}

    async upload(resultId: number, file: File): Promise<IAttachment> {
        const formData = new FormData();
        formData.append('result', resultId.toString());
        formData.append('file', file);

        return this.client.post<IAttachment>('/attachments/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }

    async getById(id: number): Promise<IAttachment> {
        return this.client.get<IAttachment>(`/attachments/${id}/`);
    }

    async delete(id: number): Promise<void> {
        await this.client.delete(`/attachments/${id}/`);
    }

    downloadUrl(id: number): string {
        return `${getApiBaseUrl()}/attachments/${id}/download/`;
    }
}

export class LocalUserSessionService implements IUserSessionService {
    getCurrentUserUid(): string {
        const saved = localStorage.getItem('polipak_current_user');
        if (saved) {
            try {
                return JSON.parse(saved).username;
            } catch {
                // fallback
            }
        }
        return 'operator_ivanov';
    }

    getCurrentRole(): string {
        const saved = localStorage.getItem('polipak_current_user');
        if (saved) {
            try {
                return JSON.parse(saved).role;
            } catch {
                // fallback
            }
        }
        return 'OPERATOR';
    }

    setCurrentUser(userUid: string, role: string): void {
        const user = { id: 1, user_uid: userUid, username: userUid, full_name: userUid, role };
        localStorage.setItem('polipak_current_user', JSON.stringify(user));
    }
}