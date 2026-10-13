export type ChecklistType = 'INSPECTION' | 'ACCEPTANCE' | 'HANDOVER';
export type ShiftNumber = 'DAY' | 'NIGHT';

export type FieldType =
    | 'STRING'
    | 'INTEGER'
    | 'CHOICE'
    | 'CHECKBOX'
    | 'RADIO'
    | 'DATE'
    | 'AUTO_DATE';

export interface IFieldChoice {
    readonly value: string;
    readonly order?: number;
}

export interface ITemplateField {
    readonly id: number;
    readonly name: string;
    readonly field_type: FieldType;
    readonly field_type_display: string;
    readonly is_required?: boolean;
    readonly order?: number;
    readonly default_value?: string;
    readonly metadata?: Record<string, unknown>;
    readonly choices?: readonly IFieldChoice[];
}

export interface ITemplateFieldGroup {
    readonly id: number;
    readonly name: string;
    readonly order?: number;
    readonly page_break?: boolean;
    readonly fields: readonly ITemplateField[];
}

export interface ITemplate {
    readonly id: number;
    readonly name: string;
    readonly equipment_uid: string;
    readonly checklist_type: ChecklistType;
    readonly checklist_type_display: string;
    readonly is_draft?: boolean;
    readonly is_deprecated?: boolean;
    readonly has_results?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
    readonly groups: readonly ITemplateFieldGroup[];
}

export interface IAnswerItem {
    readonly field_id: number;
    readonly value: string;
    readonly comment?: string | null;
}

export interface IAnswerGroup {
    readonly group_id: number;
    readonly answers: readonly IAnswerItem[];
}

export interface IChecklistResultCreate {
    readonly template: number;
    readonly equipment_uid: string;
    readonly checklist_type: ChecklistType;
    readonly user_uid: string;
    readonly shift_number: ShiftNumber;
    readonly shift_time: string;
    readonly is_draft: boolean;
    readonly general_comment?: string | null;
    readonly groups: readonly IAnswerGroup[];
}

export interface IChecklistSign {
    readonly role: string;
    readonly user_uid: string;
    readonly is_closing?: boolean;
    readonly comment?: string;
}

export interface ISignSuccessResponse {
    readonly message: string;
    readonly is_completed: boolean;
}

export interface IAttachment {
    readonly id: number;
    readonly result: number;
    readonly file: string;
    readonly uploaded_at: string;
}