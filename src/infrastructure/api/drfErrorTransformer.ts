export interface TransformedBackendErrors {
    headerErrors: Record<string, string>;
    fieldErrors: Record<number, { value?: string; comment?: string }>;
    nonFieldErrors: string[];
}

export const transformDrfErrors = (errorData: any): TransformedBackendErrors => {
    const result: TransformedBackendErrors = {
        headerErrors: {},
        fieldErrors: {},
        nonFieldErrors: [],
    };

    if (!errorData || typeof errorData !== 'object') {
        result.nonFieldErrors.push(String(errorData || 'Неизвестная ошибка сервера'));
        return result;
    }

    // Разбираем абсолютно все ключи, пришедшие от Django
    Object.entries(errorData).forEach(([key, value]) => {
        const messages = Array.isArray(value) ? value.join(' ') : typeof value === 'object' ? JSON.stringify(value) : String(value);

        if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
            result.nonFieldErrors.push(messages);
        } else if (key === 'groups' && Array.isArray(value)) {
            value.forEach((groupErr: any) => {
                if (groupErr && Array.isArray(groupErr.answers)) {
                    groupErr.answers.forEach((ansErr: any) => {
                        if (ansErr && typeof ansErr === 'object') {
                            const fieldId = Number(ansErr.field_id);
                            if (!isNaN(fieldId)) {
                                result.fieldErrors[fieldId] = {
                                    value: ansErr.value ? String(ansErr.value) : undefined,
                                    comment: ansErr.comment ? String(ansErr.comment) : undefined,
                                };
                            }
                        }
                    });
                }
            });
        } else {
            // Любая ошибка шапки (shift_time, template, equipment_uid и т.д.)
            result.headerErrors[key] = messages;
            result.nonFieldErrors.push(`Поле "${key}": ${messages}`);
        }
    });

    if (result.nonFieldErrors.length === 0) {
        result.nonFieldErrors.push('Ошибка валидации данных. Проверьте обязательные поля.');
    }


    // 3. Плоские ошибки answers
    if (Array.isArray(errorData.answers)) {
        errorData.answers.forEach((ansErr: any) => {
            if (ansErr && typeof ansErr === 'object') {
                const fieldId = Number(ansErr.field_id);
                if (!isNaN(fieldId)) {
                    result.fieldErrors[fieldId] = {
                        value: ansErr.value ? (Array.isArray(ansErr.value) ? ansErr.value.join(' ') : String(ansErr.value)) : undefined,
                        comment: ansErr.comment ? (Array.isArray(ansErr.comment) ? ansErr.comment.join(' ') : String(ansErr.comment)) : undefined,
                    };
                }
            }
        });
    }

    // 4. Ошибки верхнего уровня
    if (errorData.non_field_errors) {
        const list = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors : [errorData.non_field_errors];
        result.nonFieldErrors.push(...list.map(String));
    }

    if (errorData.detail) {
        result.nonFieldErrors.push(String(errorData.detail));
    }

    return result;
};