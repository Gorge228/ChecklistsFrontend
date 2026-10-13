import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Stack,
    IconButton,
    Chip,
    Switch,
    FormControlLabel,
    Divider,
    Alert
} from '@mui/material';
import {
    Add,
    Delete,
    ArrowUpward,
    ArrowDownward,
    Tune,
    Save,
    ChevronLeft,
    Warning
} from '@mui/icons-material';
import {
    ITemplate,
    ITemplateFieldGroup,
    ITemplateField,
    ChecklistType
} from '@domain/models/checklist';
import { FieldConfigModal } from './FieldConfigModal';
import { useCreateTemplateMutation, useUpdateTemplateMutation } from '../../hooks/useChecklists';

interface Props {
    initialTemplate?: ITemplate | null;
    onSaved: () => void;
    onCancel: () => void;
}

export const TemplateBuilder: React.FC<Props> = ({
                                                     initialTemplate,
                                                     onSaved,
                                                     onCancel,
                                                 }) => {
    const createMutation = useCreateTemplateMutation();
    const updateMutation = useUpdateTemplateMutation();

    // Параметры шапки шаблона
    const [name, setName] = useState(initialTemplate?.name || '');
    const [equipmentUid, setEquipmentUid] = useState(initialTemplate?.equipment_uid || '');
    const [checklistType, setChecklistType] = useState<ChecklistType>(initialTemplate?.checklist_type || 'INSPECTION');

    // Разделы и вопросы чек-листа
    const [groups, setGroups] = useState<ITemplateFieldGroup[]>(
        initialTemplate?.groups ? JSON.parse(JSON.stringify(initialTemplate.groups)) : []
    );

    // Модалка настройки конкретного вопроса
    const [editingFieldModal, setEditingFieldModal] = useState<{
        open: boolean;
        groupId: number | null;
        field: ITemplateField | null;
    }>({
        open: false,
        groupId: null,
        field: null,
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // 1. Управление разделами (группами)
    const handleAddGroup = () => {
        const newGroup: ITemplateFieldGroup = {
            id: Date.now(),
            name: `Новый раздел ${groups.length + 1}`,
            order: groups.length + 1,
            page_break: false,
            fields: [],
        };
        setGroups((prev) => [...prev, newGroup]);
    };

    const handleUpdateGroupName = (groupId: number, newName: string) => {
        setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g))
        );
    };

    const handleTogglePageBreak = (groupId: number) => {
        setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, page_break: !g.page_break } : g))
        );
    };

    const handleDeleteGroup = (groupId: number) => {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
    };

    // 2. Управление вопросами внутри группы
    const handleOpenAddField = (groupId: number) => {
        setEditingFieldModal({
            open: true,
            groupId,
            field: null,
        });
    };

    const handleOpenEditField = (groupId: number, field: ITemplateField) => {
        setEditingFieldModal({
            open: true,
            groupId,
            field,
        });
    };

    const handleSaveField = (savedField: ITemplateField) => {
        const targetGroupId = editingFieldModal.groupId;
        if (!targetGroupId) return;

        setGroups((prev) =>
            prev.map((g) => {
                if (g.id !== targetGroupId) return g;

                const exists = g.fields.some((f) => f.id === savedField.id);
                const updatedFields = exists
                    ? g.fields.map((f) => (f.id === savedField.id ? savedField : f))
                    : [...g.fields, { ...savedField, order: g.fields.length + 1 }];

                return { ...g, fields: updatedFields };
            })
        );
    };

    const handleDeleteField = (groupId: number, fieldId: number) => {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.id !== groupId) return g;
                return { ...g, fields: g.fields.filter((f) => f.id !== fieldId) };
            })
        );
    };

    // 3. Сортировка вопросов (Вверх / Вниз)
    const handleMoveField = (groupId: number, index: number, direction: 'up' | 'down') => {
        setGroups((prev) =>
            prev.map((g) => {
                if (g.id !== groupId) return g;
                const newFields = [...g.fields];
                const targetIndex = direction === 'up' ? index - 1 : index + 1;
                if (targetIndex < 0 || targetIndex >= newFields.length) return g;

                const temp = newFields[index];
                newFields[index] = newFields[targetIndex];
                newFields[targetIndex] = temp;

                return { ...g, fields: newFields };
            })
        );
    };

    // Сохранение шаблона
    const handleSaveTemplate = async () => {
        if (!name.trim() || !equipmentUid.trim()) {
            alert('Заполните название шаблона и UID оборудования!');
            return;
        }

        const payload: Partial<ITemplate> = {
            name: name.trim(),
            equipment_uid: equipmentUid.trim(),
            checklist_type: checklistType,
            checklist_type_display:
                checklistType === 'INSPECTION'
                    ? 'Осмотр оборудования'
                    : checklistType === 'ACCEPTANCE'
                        ? 'Приемка'
                        : 'Сдача смены',
            is_draft: false,
            groups: groups.map((g, gIdx) => ({
                ...g,
                order: gIdx + 1,
                fields: g.fields.map((f, fIdx) => ({ ...f, order: fIdx + 1 })),
            })),
        };

        if (initialTemplate) {
            await updateMutation.mutateAsync({ id: initialTemplate.id, payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        onSaved();
    };

    return (
        <Card elevation={3} sx={{ maxWidth: 950, mx: 'auto', borderRadius: 3, p: 2, mb: 4 }}>
            <CardContent>
                {/* Кнопка выхода назад */}
                <Button
                    size="small"
                    variant="text"
                    startIcon={<ChevronLeft />}
                    onClick={onCancel}
                    sx={{ mb: 1.5 }}
                >
                    Назад к списку шаблонов
                </Button>

                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {initialTemplate ? `Редактирование шаблона #${initialTemplate.id}` : 'Конструктор нового чек-листа'}
                </Typography>

                {/* Шапка шаблона */}
                <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                        Параметры чек-листа
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
                        <TextField
                            size="small"
                            label="Название чек-листа"
                            placeholder="Например: Ежесменный осмотр экструдера пленки №3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <TextField
                            size="small"
                            label="UID Оборудования"
                            placeholder="Например: EXTRUDER-LINE-03"
                            value={equipmentUid}
                            onChange={(e) => setEquipmentUid(e.target.value)}
                            required
                        />

                        <FormControl size="small">
                            <InputLabel id="type-select-label">Тип проверки</InputLabel>
                            <Select
                                labelId="type-select-label"
                                value={checklistType}
                                label="Тип проверки"
                                onChange={(e) => setChecklistType(e.target.value as ChecklistType)}
                            >
                                <MenuItem value="INSPECTION">Осмотр (INSPECTION)</MenuItem>
                                <MenuItem value="ACCEPTANCE">Приемка (ACCEPTANCE)</MenuItem>
                                <MenuItem value="HANDOVER">Сдача (HANDOVER)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>

                <Divider sx={{ mb: 3 }} />

                {/* Разделы и вопросы */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Разделы и контрольные точки ({groups.length})
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddGroup}
                    >
                        Добавить раздел
                    </Button>
                </Box>

                {groups.length === 0 ? (
                    <Alert severity="info" sx={{ my: 2 }}>
                        Чек-лист пуст. Нажмите кнопку <b>«Добавить раздел»</b>, чтобы создать первый узел станка.
                    </Alert>
                ) : (
                    <Stack spacing={3}>
                        {groups.map((group, groupIndex) => (
                            <Paper
                                key={group.id}
                                variant="outlined"
                                sx={{ p: 2.5, borderRadius: 2, bgcolor: '#ffffff', border: '1.5px solid #cbd5e1' }}
                            >
                                {/* Шапка раздела */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        label={`Раздел ${groupIndex + 1}`}
                                        value={group.name}
                                        onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                                        sx={{ flexGrow: 1, maxWidth: 450, fontWeight: 700 }}
                                    />

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={Boolean(group.page_break)}
                                                    onChange={() => handleTogglePageBreak(group.id)}
                                                />
                                            }
                                            label={<Typography variant="caption">Разрыв страницы (Шаг Stepper)</Typography>}
                                        />

                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteGroup(group.id)}
                                            title="Удалить раздел"
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {/* Вопросы внутри раздела */}
                                <Box sx={{ pl: { xs: 0, sm: 2 } }}>
                                    {group.fields.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: 'italic' }}>
                                            В этом разделе пока нет вопросов.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                                            {group.fields.map((field, fieldIndex) => {
                                                const meta = (field.metadata as any) || {};
                                                const hasRuleEngine =
                                                    (meta.violation_values && meta.violation_values.length > 0) ||
                                                    meta.minValue !== undefined ||
                                                    meta.maxValue !== undefined;

                                                return (
                                                    <Paper
                                                        key={field.id}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: 1.5,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            bgcolor: '#f8fafc',
                                                            flexWrap: 'wrap',
                                                            gap: 1
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {fieldIndex + 1}. {field.name}
                                                            </Typography>

                                                            {field.is_required && (
                                                                <Chip label="Обязательно *" size="small" color="error" variant="outlined" sx={{ height: 20 }} />
                                                            )}

                                                            <Chip label={field.field_type} size="small" sx={{ height: 20 }} />

                                                            {hasRuleEngine && (
                                                                <Chip icon={<Warning sx={{ fontSize: 14 }} />} label="Rule Engine" color="warning" size="small" sx={{ height: 20 }} />
                                                            )}
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                disabled={fieldIndex === 0}
                                                                onClick={() => handleMoveField(group.id, fieldIndex, 'up')}
                                                            >
                                                                <ArrowUpward fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                disabled={fieldIndex === group.fields.length - 1}
                                                                onClick={() => handleMoveField(group.id, fieldIndex, 'down')}
                                                            >
                                                                <ArrowDownward fontSize="small" />
                                                            </IconButton>

                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<Tune />}
                                                                onClick={() => handleOpenEditField(group.id, field)}
                                                                sx={{ textTransform: 'none', ml: 1 }}
                                                            >
                                                                Настроить
                                                            </Button>

                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteField(group.id, field.id)}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    )}

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => handleOpenAddField(group.id)}
                                    >
                                        Добавить вопрос
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Нижние кнопки сохранения */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button variant="outlined" color="inherit" onClick={onCancel}>
                        Отмена
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<Save />}
                        disabled={isSaving}
                        onClick={handleSaveTemplate}
                    >
                        {isSaving ? 'Сохранение шаблона...' : 'Сохранить шаблон'}
                    </Button>
                </Box>
            </CardContent>

            {/* Модалка детальной настройки вопроса */}
            <FieldConfigModal
                open={editingFieldModal.open}
                field={editingFieldModal.field}
                onClose={() => setEditingFieldModal({ open: false, groupId: null, field: null })}
                onSave={handleSaveField}
            />
        </Card>
    );
};