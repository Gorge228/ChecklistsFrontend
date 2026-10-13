import {
    ITemplateRepository,
    IResultRepository,
    IChecklistResultItem,
    IAttachmentRepository
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
    IUser
} from '@domain/models/auth';
import { tokenStorage } from '../api/tokenStorage';

const TEST_USERS: Record<string, { pass: string; user: IUser }> = {
    admin_mechanic: {
        pass: 'Polipak2026!',
        user: { id: 1, user_uid: 'admin_mechanic', username: 'admin_mechanic', full_name: 'Сидоров А.М. (Главный механик)', role: 'ADMIN' },
    },
    master_petrov: {
        pass: 'Polipak2026!',
        user: { id: 2, user_uid: 'master_petrov', username: 'master_petrov', full_name: 'Петров С.А. (Сменный мастер)', role: 'FOREMAN' },
    },
    operator_ivanov: {
        pass: 'Polipak2026!',
        user: { id: 3, user_uid: 'operator_ivanov', username: 'operator_ivanov', full_name: 'Иванов И.И. (Оператор)', role: 'OPERATOR' },
    },
    auditor_smirnov: {
        pass: 'Polipak2026!',
        user: { id: 4, user_uid: 'auditor_smirnov', username: 'auditor_smirnov', full_name: 'Смирнов Д.Н. (Аудитор ОТК)', role: 'VIEWER' },
    },
};

export class MockAuthRepository implements IAuthRepository {
    private currentUser: IUser = TEST_USERS.operator_ivanov.user;

    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        const record = TEST_USERS[credentials.username.trim()];
        if (!record || record.pass !== credentials.password) {
            throw new Error('Неверный логин или пароль тестовой учетной записи');
        }

        this.currentUser = record.user;
        tokenStorage.setAuth('Basic', btoa(`${record.user.username}:${credentials.password}`));
        localStorage.setItem('polipak_current_user', JSON.stringify(record.user));

        return { access: 'mock_token', refresh: 'mock_refresh', user: this.currentUser };
    }

    async refreshToken(): Promise<IRefreshResponse> {
        return { access: 'mock_refreshed' };
    }

    async getMe(): Promise<IUser> {
        return this.currentUser;
    }

    async logout(): Promise<void> {
        tokenStorage.clear();
    }
}

export class MockResultRepository implements IResultRepository {
    private results: IChecklistResultItem[] = [];

    async getList(): Promise<IChecklistResultItem[]> {
        return this.results;
    }

    async getById(id: number): Promise<IChecklistResultItem> {
        const item = this.results.find((r) => r.id === id);
        if (!item) throw new Error('Анкета не найдена');
        return item;
    }

    async create(payload: IChecklistResultCreate): Promise<{ id: number }> {
        const newId = Date.now();
        const now = new Date();

        const item: IChecklistResultItem = {
            id: newId,
            template: payload.template,
            template_name: `Чек-лист [${payload.equipment_uid}]`,
            equipment_uid: payload.equipment_uid,
            user_uid: payload.user_uid,
            shift_number: payload.shift_number,
            shift_date: now.toISOString().slice(0, 10),
            shift_time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            is_completed: false,
            is_draft: payload.is_draft,
            has_violations: payload.groups.some((g) => g.answers.some((a) => a.value === 'НЕТ')),
            created_at: now.toISOString(),
            general_comment: payload.general_comment || null,
            signatures: [],
            groups: payload.groups.map((g) => ({
                group_id: g.group_id,
                group_name: `Узел #${g.group_id}`,
                answers: g.answers.map((a) => ({
                    field_id: a.field_id,
                    field_name: `Поле #${a.field_id}`,
                    field_type: 'STRING',
                    field_type_display: 'Строка',
                    value: a.value,
                    comment: a.comment,
                    is_violation: a.value === 'НЕТ',
                })),
            })),
        };

        this.results.unshift(item);
        return { id: newId };
    }

    async update(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem> {
        const item = await this.getById(id);
        const updated = { ...item, ...payload as any };
        const idx = this.results.findIndex((r) => r.id === id);
        this.results[idx] = updated;
        return updated;
    }

    async patch(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem> {
        return this.update(id, payload);
    }

    async delete(id: number): Promise<void> {
        this.results = this.results.filter((r) => r.id !== id);
    }

    async getHistory(id: number): Promise<IChecklistResultItem[]> {
        const item = this.results.find((r) => r.id === id);
        return item ? [item] : [];
    }

    async sign(resultId: number, payload: IChecklistSign): Promise<ISignSuccessResponse> {
        const item = await this.getById(resultId);
        item.signatures.push({
            role: payload.role,
            user_uid: payload.user_uid,
            signed_at: new Date().toISOString(),
            comment: payload.comment || null,
        });
        if (payload.is_closing) {
            item.is_completed = true;
        }
        return { message: 'Подписано', is_completed: item.is_completed };
    }
}

export class MockTemplateRepository implements ITemplateRepository {
    private templates: ITemplate[] = [
        {
            id: 1,
            name: 'Ежесменный осмотр экструдера пленки №3',
            equipment_uid: 'EXTRUDER-LINE-03',
            checklist_type: 'INSPECTION',
            checklist_type_display: 'Осмотр оборудования',
            is_draft: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            groups: [
                {
                    id: 101,
                    name: '1. Механическая часть и безопасность',
                    order: 1,
                    page_break: false,
                    fields: [
                        { id: 1, name: 'Наличие защитных ограждений', field_type: 'RADIO', field_type_display: 'Радио', is_required: true, order: 1 },
                        { id: 2, name: 'Температура цилиндра (°C)', field_type: 'INTEGER', field_type_display: 'Число', is_required: true, order: 2, default_value: '185' },
                    ],
                },
            ],
        },
    ];

    async getList(): Promise<ITemplate[]> { return this.templates; }
    async getById(id: number): Promise<ITemplate> {
        const t = this.templates.find((x) => x.id === id);
        if (!t) throw new Error('Шаблон не найден');
        return t;
    }
    async create(payload: Partial<ITemplate>): Promise<ITemplate> {
        const newT = { ...payload, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), groups: payload.groups || [] } as ITemplate;
        this.templates.unshift(newT);
        return newT;
    }
    async update(id: number, payload: Partial<ITemplate>): Promise<ITemplate> {
        const t = await this.getById(id);
        const updated = { ...t, ...payload, updated_at: new Date().toISOString() };
        this.templates = this.templates.map((x) => (x.id === id ? updated : x));
        return updated;
    }
    async patch(id: number, payload: Partial<ITemplate>): Promise<ITemplate> { return this.update(id, payload); }
    async delete(id: number): Promise<void> { this.templates = this.templates.filter((x) => x.id !== id); }
    async clone(id: number, targetEquipmentUid: string): Promise<ITemplate> {
        const t = await this.getById(id);
        const cloned = { ...t, id: Date.now(), name: `${t.name} (Копия)`, equipment_uid: targetEquipmentUid };
        this.templates.unshift(cloned);
        return cloned;
    }
    async getHistory(id: number): Promise<ITemplate[]> {
        const t = await this.getById(id);
        return [t];
    }
}

export class MockAttachmentRepository implements IAttachmentRepository {
    async upload(resultId: number, file: File): Promise<IAttachment> {
        return { id: Date.now(), result: resultId, file: file.name, uploaded_at: new Date().toISOString() };
    }
    async getById(id: number): Promise<IAttachment> {
        return { id, result: 1, file: 'test.jpg', uploaded_at: new Date().toISOString() };
    }
    async delete(): Promise<void> {}
    downloadUrl(id: number): string { return `/mock-download/${id}`; }
}