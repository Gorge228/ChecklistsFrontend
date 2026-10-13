import {
    ITemplate,
    IChecklistResultCreate,
    IChecklistSign,
    ISignSuccessResponse,
    IAttachment
} from '../models/checklist';

export interface IChecklistAnswerItem {
    field_id: number;
    field_name: string;
    field_type: string;
    field_type_display: string;
    value: string;
    comment?: string | null;
    is_violation: boolean;
}

export interface IChecklistGroupItem {
    group_id: number;
    group_name: string;
    page_break?: boolean;
    answers: IChecklistAnswerItem[];
}

export interface ISignatureStamp {
    role: string;
    user_uid: string;
    signed_at: string;
    comment?: string | null;
}

export interface IChecklistResultItem {
    id: number;
    template: number;
    template_name: string;
    equipment_uid: string;
    user_uid: string;
    checklist_type?: string;
    checklist_type_display?: string;
    shift_number: 'DAY' | 'NIGHT';
    shift_date: string;
    shift_time: string;
    is_completed: boolean;
    is_draft: boolean;
    is_deprecated?: boolean;
    version?: number;
    has_violations: boolean;
    created_at: string;
    updated_at?: string;
    general_comment?: string | null;
    signatures: ISignatureStamp[];
    groups: IChecklistGroupItem[];
}

export interface ITemplateRepository {
    getList(params?: { checklist_type?: string; equipment_uid?: string }): Promise<ITemplate[]>;
    getById(id: number): Promise<ITemplate>;
    create(payload: Partial<ITemplate>): Promise<ITemplate>;
    update(id: number, payload: Partial<ITemplate>): Promise<ITemplate>;
    patch(id: number, payload: Partial<ITemplate>): Promise<ITemplate>;
    delete(id: number): Promise<void>;
    clone(id: number, targetEquipmentUid: string): Promise<ITemplate>;
    getHistory(id: number): Promise<ITemplate[]>;
}

export interface IResultRepository {
    getList(params?: Record<string, unknown>): Promise<IChecklistResultItem[]>;
    getById(id: number): Promise<IChecklistResultItem>;
    create(payload: IChecklistResultCreate): Promise<{ id: number } & Record<string, unknown>>;
    update(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem>;
    patch(id: number, payload: Partial<IChecklistResultCreate>): Promise<IChecklistResultItem>;
    delete(id: number): Promise<void>;
    getHistory(id: number): Promise<IChecklistResultItem[]>;
    sign(resultId: number, payload: IChecklistSign): Promise<ISignSuccessResponse>;
}

export interface IAttachmentRepository {
    upload(resultId: number, file: File): Promise<IAttachment>;
    getById(id: number): Promise<IAttachment>;
    delete(id: number): Promise<void>;
    downloadUrl(id: number): string;
}

export interface IUserSessionService {
    getCurrentUserUid(): string;
    getCurrentRole(): string;
    setCurrentUser(userUid: string, role: string): void;
}