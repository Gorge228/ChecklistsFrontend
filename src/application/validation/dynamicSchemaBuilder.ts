import { ITemplate } from '@domain/models/checklist';
import { LocalAttachment } from '@presentation/components/media/AttachmentManager';

export interface FieldValidationError {
    value?: string;
    comment?: string;
}

export interface ValidationResult {
    isValid: boolean;
    fieldErrors: Record<number, FieldValidationError>;
    groupErrorCounts: Record<number, number>;
    firstErrorFieldId: number | null;
}

interface ValidationData {
    shiftNumber: string;
    answers: Record<number, { value: string; comment?: string }>;
    attachments: Record<number, LocalAttachment[]>;
}

export const validateChecklistForm = (
    template: ITemplate,
    data: ValidationData,
    isDraft: boolean
): ValidationResult => {
    const fieldErrors: Record<number, FieldValidationError> = {};
    const groupErrorCounts: Record<number, number> = {};
    let firstErrorFieldId: number | null = null;

    template.groups.forEach((group) => {
        let groupErrors = 0;

        group.fields.forEach((field) => {
            const userAns = data.answers[field.id];
            const val = userAns?.value?.trim() || '';
            const comment = userAns?.comment?.trim() || '';
            const fieldAttachments = data.attachments[field.id] || [];
            const meta = (field.metadata as Record<string, any>) || {};

            let valueError: string | undefined;
            let commentError: string | undefined;

            // 1. Валидация формата (проверяется ВСЕГДА, даже в черновике)
            if (val !== '') {
                if (field.field_type === 'INTEGER') {
                    const num = Number(val);
                    if (isNaN(num)) {
                        valueError = 'Значение обязано быть корректным числом';
                    } else {
                        if (meta.minValue !== undefined && num < meta.minValue) {
                            valueError = `Значение не может быть меньше ${meta.minValue}`;
                        }
                        if (meta.maxValue !== undefined && num > meta.maxValue) {
                            valueError = `Значение не может быть больше ${meta.maxValue}`;
                        }
                    }
                }

                if (field.field_type === 'DATE') {
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(val)) {
                        valueError = 'Неверный формат даты (ожидается ГГГГ-ММ-ДД)';
                    }
                }
            }

            // 2. Строгая валидация чистовика (is_draft: false)
            if (!isDraft) {
                if (field.is_required && val === '') {
                    valueError = 'Поле обязательно для заполнения';
                }

                if (field.field_type === 'CHECKBOX' && field.is_required && val !== 'true') {
                    valueError = 'Подтверждение обязательно';
                }

                if (field.field_type === 'STRING' && val !== '') {
                    const maxLen = meta.max_length || 1000;
                    if (val.length > maxLen) {
                        valueError = `Длина текста не должна превышать ${maxLen} символов`;
                    }
                }

                // 3. Бизнес-правило Rule Engine: условная зависимость дефектов
                const violationValues: string[] = meta.violation_values || ['НЕТ', 'Критически низкий'];
                const isViolation = violationValues.includes(val) || val.toLowerCase().includes('перегрев');

                if (isViolation) {
                    // Обязательный комментарий не менее 5 символов
                    if (!comment || comment.length < 5) {
                        commentError = 'При выявлении дефекта необходимо подробно описать неисправность (не менее 5 символов)';
                    }

                    // Требование обязательной фотофиксации при дефекте
                    const requirePhoto = meta.require_photo_on_violation ?? true;
                    if (requirePhoto && fieldAttachments.length === 0) {
                        valueError = valueError
                            ? `${valueError} | Требуется фотофиксация дефекта`
                            : 'При зафиксированном дефекте обязательна фотофиксация (прикрепите фото)';
                    }
                }
            }

            if (valueError || commentError) {
                fieldErrors[field.id] = {
                    value: valueError,
                    comment: commentError,
                };
                groupErrors += 1;

                if (firstErrorFieldId === null) {
                    firstErrorFieldId = field.id;
                }
            }
        });

        if (groupErrors > 0) {
            groupErrorCounts[group.id] = groupErrors;
        }
    });

    return {
        isValid: Object.keys(fieldErrors).length === 0,
        fieldErrors,
        groupErrorCounts,
        firstErrorFieldId,
    };
};