import React from 'react';
import {
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel,
    FormHelperText,
    Select,
    MenuItem,
    Checkbox,
    Box,
    Chip
} from '@mui/material';
import { AutoAwesome, CalendarToday } from '@mui/icons-material';
import { IFieldStrategy, FieldRenderProps } from './types';
import { ITemplateField } from '@domain/models/checklist';

// 1. Текстовое поле
export class StringFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && (!value || value.trim() === '')) {
            return `Поле "${field.name}" обязательно для заполнения`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        return (
            <TextField
                fullWidth
                size="small"
                label={field.name}
                required={field.is_required}
                value={value || ''}
                disabled={disabled}
                error={Boolean(error)}
                helperText={error || field.default_value}
                onChange={(e) => onChangeValue(e.target.value)}
            />
        );
    }
}

// 2. Числовое поле с контролем диапазонов по metadata (min, max)
export class IntegerFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && (!value || value.trim() === '')) {
            return `Поле "${field.name}" обязательно для заполнения`;
        }
        if (value && isNaN(Number(value))) {
            return 'Введите корректное число';
        }

        const num = Number(value);
        const meta = field.metadata as Record<string, any> | undefined;
        if (meta?.minValue !== undefined && num < meta.minValue) {
            return `Значение ниже допустимой нормы (минимум: ${meta.minValue})`;
        }
        if (meta?.maxValue !== undefined && num > meta.maxValue) {
            return `Значение выше допустимой нормы (максимум: ${meta.maxValue})`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        return (
            <TextField
                fullWidth
                type="number"
                size="small"
                label={field.name}
                required={field.is_required}
                value={value || ''}
                disabled={disabled}
                error={Boolean(error)}
                helperText={error || field.default_value}
                onChange={(e) => onChangeValue(e.target.value)}
            />
        );
    }
}

// 3. Радио-кнопки (ДА = "true", НЕТ = "false" для Django)
export class RadioFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && !value) {
            return `Необходимо выбрать вариант в поле "${field.name}"`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        const currentVal = value === 'ДА' ? 'true' : value === 'НЕТ' ? 'false' : value || '';

        return (
            <FormControl error={Boolean(error)} required={field.is_required} component="fieldset">
                <FormLabel component="legend">{field.name}</FormLabel>
                <RadioGroup
                    row
                    value={currentVal}
                    onChange={(e) => onChangeValue(e.target.value)}
                >
                    <FormControlLabel value="true" control={<Radio color="success" />} label="ДА" disabled={disabled} />
                    <FormControlLabel value="false" control={<Radio color="error" />} label="НЕТ" disabled={disabled} />
                </RadioGroup>
                {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
        );
    }
}

// 4. Выбор из списка
export class ChoiceFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && !value) {
            return `Выберите пункт из списка "${field.name}"`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        return (
            <FormControl fullWidth size="small" error={Boolean(error)} required={field.is_required}>
                <FormLabel>{field.name}</FormLabel>
                <Select
                    value={value || ''}
                    disabled={disabled}
                    onChange={(e) => onChangeValue(e.target.value as string)}
                    displayEmpty
                >
                    <MenuItem value="">
                        <em>-- Выберите вариант --</em>
                    </MenuItem>
                    {field.choices?.map((choice) => (
                        <MenuItem key={choice.value} value={choice.value}>
                            {choice.value}
                        </MenuItem>
                    ))}
                </Select>
                {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
        );
    }
}

// 5. Чекбокс
export class CheckboxFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && value !== 'true') {
            return `Подтверждение обязательно для "${field.name}"`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        const isChecked = value === 'true';
        return (
            <FormControl error={Boolean(error)}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isChecked}
                            disabled={disabled}
                            onChange={(e) => onChangeValue(e.target.checked ? 'true' : 'false')}
                        />
                    }
                    label={`${field.name} ${field.is_required ? '*' : ''}`}
                />
                {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
        );
    }
}

// 6. Выбор даты (DATE) — с поддержкой slotProps для MUI v6
export class DateFieldStrategy implements IFieldStrategy {
    validate(value: string, field: ITemplateField): string | null {
        if (field.is_required && !value) {
            return `Укажите дату для "${field.name}"`;
        }
        return null;
    }

    render({ field, value, onChangeValue, disabled, error }: FieldRenderProps): React.ReactElement {
        return (
            <TextField
                fullWidth
                type="date"
                size="small"
                label={field.name}
                required={field.is_required}
                value={value || ''}
                disabled={disabled}
                error={Boolean(error)}
                helperText={error}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(e) => onChangeValue(e.target.value)}
            />
        );
    }
}

// 7. Автоматическое поле (AUTO_DATE)
export class AutoFieldStrategy implements IFieldStrategy {
    validate(): string | null {
        return null;
    }

    render({ field, value }: FieldRenderProps): React.ReactElement {
        const displayVal = value || new Date().toLocaleString('ru-RU');
        return (
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Box>
                        <FormLabel sx={{ fontSize: '0.8rem', display: 'block' }}>{field.name}</FormLabel>
                        <Box sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayVal}</Box>
                    </Box>
                </Box>
                <Chip icon={<AutoAwesome />} label="Автозаполнение" size="small" color="primary" variant="outlined" />
            </Box>
        );
    }
}