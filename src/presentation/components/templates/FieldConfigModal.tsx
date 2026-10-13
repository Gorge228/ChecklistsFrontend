import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Box,
    Typography,
    Stack,
    IconButton,
    Chip,
    Paper,
    Divider
} from '@mui/material';
import { Add, Delete, Tune, Warning } from '@mui/icons-material';
import { ITemplateField, FieldType, IFieldChoice } from '@domain/models/checklist';

interface Props {
    open: boolean;
    field: ITemplateField | null;
    onClose: () => void;
    onSave: (field: ITemplateField) => void;
}

export const FieldConfigModal: React.FC<Props> = ({
                                                      open,
                                                      field,
                                                      onClose,
                                                      onSave,
                                                  }) => {
    const [name, setName] = useState('');
    const [fieldType, setFieldType] = useState<FieldType>('STRING');
    const [isRequired, setIsRequired] = useState(false);
    const [defaultValue, setDefaultValue] = useState('');

    // Для CHOICE и RADIO: список вариантов и отметка нарушений
    const [choices, setChoices] = useState<{ value: string; isViolation: boolean }[]>([]);
    const [newChoiceText, setNewChoiceText] = useState('');

    // Для INTEGER: Rule Engine границы (min/max)
    const [minValue, setMinValue] = useState<string>('');
    const [maxValue, setMaxValue] = useState<string>('');

    useEffect(() => {
        if (field) {
            setName(field.name || '');
            setFieldType(field.field_type || 'STRING');
            setIsRequired(Boolean(field.is_required));
            setDefaultValue(field.default_value || '');

            const meta = (field.metadata as any) || {};
            setMinValue(meta.minValue !== undefined ? String(meta.minValue) : '');
            setMaxValue(meta.maxValue !== undefined ? String(meta.maxValue) : '');

            if (field.choices && field.choices.length > 0) {
                const violations = meta.violation_values || [];
                setChoices(
                    field.choices.map((c) => ({
                        value: c.value,
                        isViolation: violations.includes(c.value),
                    }))
                );
            } else if (field.field_type === 'RADIO') {
                setChoices([
                    { value: 'ДА', isViolation: false },
                    { value: 'НЕТ', isViolation: true },
                ]);
            } else {
                setChoices([]);
            }
        } else {
            setName('');
            setFieldType('STRING');
            setIsRequired(false);
            setDefaultValue('');
            setChoices([]);
            setMinValue('');
            setMaxValue('');
        }
    }, [field, open]);

    const handleAddChoice = () => {
        if (!newChoiceText.trim()) return;
        setChoices((prev) => [...prev, { value: newChoiceText.trim(), isViolation: false }]);
        setNewChoiceText('');
    };

    const handleToggleViolation = (idx: number) => {
        setChoices((prev) =>
            prev.map((c, i) => (i === idx ? { ...c, isViolation: !c.isViolation } : c))
        );
    };

    const handleRemoveChoice = (idx: number) => {
        setChoices((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        if (!name.trim()) return;

        const metadata: Record<string, any> = {};
        if (fieldType === 'INTEGER') {
            if (minValue !== '') metadata.minValue = Number(minValue);
            if (maxValue !== '') metadata.maxValue = Number(maxValue);
        }

        if (fieldType === 'CHOICE' || fieldType === 'RADIO') {
            metadata.violation_values = choices.filter((c) => c.isViolation).map((c) => c.value);
        }

        const savedChoices: IFieldChoice[] = choices.map((c, idx) => ({
            value: c.value,
            order: idx + 1,
        }));

        const resultField: ITemplateField = {
            id: field?.id || Date.now(),
            name: name.trim(),
            field_type: fieldType,
            field_type_display: fieldType,
            is_required: isRequired,
            default_value: defaultValue || undefined,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            choices: savedChoices.length > 0 ? savedChoices : undefined,
        };

        onSave(resultField);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune color="primary" />
                {field ? 'Настройка вопроса чек-листа' : 'Новый вопрос чек-листа'}
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {/* Название вопроса */}
                    <TextField
                        fullWidth
                        size="small"
                        label="Текст вопроса / контрольной точки"
                        placeholder="Например: Температура вала экструдера или Уровень масла"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    {/* Тип контрола по OpenAPI */}
                    <FormControl fullWidth size="small">
                        <InputLabel id="field-type-select-label">Тип поля (Field Type)</InputLabel>
                        <Select
                            labelId="field-type-select-label"
                            value={fieldType}
                            label="Тип поля (Field Type)"
                            onChange={(e) => setFieldType(e.target.value as FieldType)}
                        >
                            <MenuItem value="STRING">Строка (STRING)</MenuItem>
                            <MenuItem value="INTEGER">Целое число (INTEGER)</MenuItem>
                            <MenuItem value="RADIO">Радио-кнопки (RADIO)</MenuItem>
                            <MenuItem value="CHOICE">Выбор из списка (CHOICE)</MenuItem>
                            <MenuItem value="CHECKBOX">Булев чекбокс (CHECKBOX)</MenuItem>
                            <MenuItem value="DATE">Выбор даты (DATE)</MenuItem>
                            <MenuItem value="AUTO_DATE">Автоматическая дата/время (AUTO_DATE)</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Чекбокс обязательности */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isRequired}
                                onChange={(e) => setIsRequired(e.target.checked)}
                            />
                        }
                        label="Обязательное поле для заполнения (*)"
                    />

                    <Divider />

                    {/* RULE ENGINE: Настройка вариантов выбора и брака */}
                    {(fieldType === 'CHOICE' || fieldType === 'RADIO') && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Варианты ответа и Rule Engine (Фиксация дефектов):
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                Нажмите на иконку щита, чтобы пометить вариант, который считается браком (система подсветит его красным).
                            </Typography>

                            {/* Добавление нового варианта */}
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Новый вариант ответа"
                                    value={newChoiceText}
                                    onChange={(e) => setNewChoiceText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddChoice();
                                        }
                                    }}
                                />
                                <Button variant="outlined" startIcon={<Add />} onClick={handleAddChoice}>
                                    Добавить
                                </Button>
                            </Stack>

                            {/* Список вариантов */}
                            <Stack spacing={1}>
                                {choices.map((c, idx) => (
                                    <Paper
                                        key={idx}
                                        variant="outlined"
                                        sx={{
                                            p: 1,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            bgcolor: c.isViolation ? '#fff5f5' : '#ffffff',
                                            borderColor: c.isViolation ? 'error.light' : '#e0e0e0',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {c.value}
                                            </Typography>
                                            {c.isViolation && (
                                                <Chip icon={<Warning />} label="ДЕФЕКТ" size="small" color="error" sx={{ height: 20 }} />
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Button
                                                size="small"
                                                variant={c.isViolation ? 'contained' : 'outlined'}
                                                color={c.isViolation ? 'error' : 'inherit'}
                                                onClick={() => handleToggleViolation(idx)}
                                                sx={{ fontSize: '0.75rem', py: 0.2 }}
                                            >
                                                {c.isViolation ? 'Считать дефектом' : 'В норме'}
                                            </Button>
                                            <IconButton size="small" color="error" onClick={() => handleRemoveChoice(idx)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* RULE ENGINE: Границы допустимых температур / давлений для чисел */}
                    {fieldType === 'INTEGER' && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Rule Engine: Допустимый диапазон нормы (min / max)
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    label="Минимум (норма от)"
                                    value={minValue}
                                    onChange={(e) => setMinValue(e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    label="Максимум (норма до)"
                                    value={maxValue}
                                    onChange={(e) => setMaxValue(e.target.value)}
                                />
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Отмена
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>
                    Сохранить вопрос
                </Button>
            </DialogActions>
        </Dialog>
    );
};