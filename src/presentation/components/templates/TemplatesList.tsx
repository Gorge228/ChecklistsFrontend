import React, { useState, useMemo } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    IconButton,
    Chip,
    Typography,
    Collapse,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Alert,
    Divider
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    PlayArrow,
    Edit,
    ContentCopy,
    History,
    Delete,
    Add,
    Tune,
    Warning
} from '@mui/icons-material';
import {
    useTemplatesQuery,
    useCloneTemplateMutation,
    useDeleteTemplateMutation
} from '../../hooks/useChecklists';
import { ITemplate } from '@domain/models/checklist';
import { TemplateHistoryModal } from './TemplateHistoryModal';

interface ColumnMeta {
    id: string;
    label: string;
}

const INITIAL_TEMPLATE_COLUMNS: ColumnMeta[] = [
    { id: 'name', label: 'Название чек-листа' },
    { id: 'equipment_uid', label: 'Оборудование / Станок' },
    { id: 'checklist_type', label: 'Тип проверки' },
    { id: 'is_draft', label: 'Статус' },
    { id: 'questions_count', label: 'Вопросов' },
];

interface Props {
    onSelectToRun: (template: ITemplate) => void;
    onEditTemplate: (template: ITemplate) => void;
    onCreateTemplate: () => void;
}

export const TemplatesList: React.FC<Props> = ({
                                                   onSelectToRun,
                                                   onEditTemplate,
                                                   onCreateTemplate,
                                               }) => {
    const { data: templates, isLoading } = useTemplatesQuery();
    const cloneMutation = useCloneTemplateMutation();
    const deleteMutation = useDeleteTemplateMutation();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Модальные окна
    const [cloneTarget, setCloneTarget] = useState<ITemplate | null>(null);
    const [newEquipmentUid, setNewEquipmentUid] = useState<string>('');
    const [historyTemplateId, setHistoryTemplateId] = useState<number | null>(null);

    // Drag-and-Drop колонок
    const [columns, setColumns] = useState<ColumnMeta[]>(INITIAL_TEMPLATE_COLUMNS);
    const [draggedColId, setDraggedColId] = useState<string | null>(null);

    const handleDragStart = (colId: string) => setDraggedColId(colId);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (targetColId: string) => {
        if (!draggedColId || draggedColId === targetColId) return;
        const newCols = [...columns];
        const fromIndex = newCols.findIndex((c) => c.id === draggedColId);
        const toIndex = newCols.findIndex((c) => c.id === targetColId);
        const [moved] = newCols.splice(fromIndex, 1);
        newCols.splice(toIndex, 0, moved);
        setColumns(newCols);
        setDraggedColId(null);
    };

    // Фильтрация по поисковой строке
    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.equipment_uid.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && filteredTemplates) {
            setSelectedIds(filteredTemplates.map((t) => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleConfirmClone = async () => {
        if (!cloneTarget || !newEquipmentUid.trim()) return;
        await cloneMutation.mutateAsync({
            id: cloneTarget.id,
            targetEquipmentUid: newEquipmentUid.trim(),
        });
        setCloneTarget(null);
        setNewEquipmentUid('');
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const renderCellContent = (colId: string, item: ITemplate) => {
        switch (colId) {
            case 'name':
                return (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.name}
                    </Typography>
                );
            case 'equipment_uid':
                return (
                    <Chip
                        label={item.equipment_uid}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                );
            case 'checklist_type': {
                let chipColor: 'primary' | 'secondary' | 'warning' = 'primary';
                if (item.checklist_type === 'HANDOVER') chipColor = 'secondary';
                if (item.checklist_type === 'ACCEPTANCE') chipColor = 'warning';
                return (
                    <Chip
                        label={item.checklist_type_display}
                        size="small"
                        color={chipColor}
                        variant="outlined"
                    />
                );
            }
            case 'is_draft':
                return (
                    <Chip
                        label={item.is_draft ? 'Черновик' : 'Актуален'}
                        size="small"
                        color={item.is_draft ? 'default' : 'success'}
                    />
                );
            case 'questions_count': {
                const total = item.groups?.reduce((acc, g) => acc + g.fields.length, 0) || 0;
                return (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {total} вопр.
                    </Typography>
                );
            }
            default:
                return null;
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            {/* Верхняя панель: Поиск и кнопка «Создать шаблон» */}
            <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Поиск по названию или станку..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 340 } }}
                />

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                    onClick={onCreateTemplate}
                    sx={{ fontWeight: 700 }}
                >
                    Создать новый шаблон
                </Button>
            </Paper>

            {selectedIds.length > 0 && (
                <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                    Выбрано шаблонов: <b>{selectedIds.length}</b>
                </Alert>
            )}

            {/* Таблица шаблонов */}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table sx={{ minWidth: 850 }}>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            {/* Чекбокс */}
                            <TableCell padding="checkbox">
                                <Checkbox
                                    size="small"
                                    checked={Boolean(filteredTemplates.length > 0 && selectedIds.length === filteredTemplates.length)}
                                    indeterminate={Boolean(selectedIds.length > 0 && selectedIds.length < filteredTemplates.length)}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>

                            {/* Стрелка разворота */}
                            <TableCell sx={{ width: 50, p: 0 }} />

                            {/* Перетаскиваемые колонки */}
                            {columns.map((col) => (
                                <TableCell
                                    key={col.id}
                                    draggable
                                    onDragStart={() => handleDragStart(col.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(col.id)}
                                    sx={{
                                        fontWeight: 700,
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        bgcolor: draggedColId === col.id ? '#e2e8f0' : 'inherit',
                                        '&:hover': { bgcolor: '#e2e8f0' },
                                    }}
                                >
                                    {col.label} ⠿
                                </TableCell>
                            ))}

                            <TableCell sx={{ fontWeight: 700, width: 280 }}>Действия</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredTemplates.length > 0 ? (
                            filteredTemplates.map((row) => {
                                const isExpanded = expandedRowId === row.id;
                                const isSelected = selectedIds.includes(row.id);

                                return (
                                    <React.Fragment key={row.id}>
                                        {/* ОСНОВНАЯ СТРОКА ШАБЛОНА */}
                                        <TableRow hover selected={isSelected} sx={{ '& > *': { minHeight: 48 } }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(row.id)}
                                                />
                                            </TableCell>

                                            <TableCell sx={{ p: 0.5 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                                                    sx={{ p: 1 }}
                                                >
                                                    {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                </IconButton>
                                            </TableCell>

                                            {columns.map((col) => (
                                                <TableCell key={col.id}>
                                                    {renderCellContent(col.id, row)}
                                                </TableCell>
                                            ))}

                                            {/* Кнопки действий */}
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<PlayArrow />}
                                                        onClick={() => onSelectToRun(row)}
                                                        sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}
                                                    >
                                                        Заполнить
                                                    </Button>

                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        title="Редактировать конструктором"
                                                        onClick={() => onEditTemplate(row)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        title="История изменений"
                                                        onClick={() => setHistoryTemplateId(row.id)}
                                                    >
                                                        <History fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        color="inherit"
                                                        title="Клонировать шаблон"
                                                        onClick={() => {
                                                            setCloneTarget(row);
                                                            setNewEquipmentUid(`${row.equipment_uid}-COPY`);
                                                        }}
                                                    >
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        title="Удалить шаблон"
                                                        onClick={() => {
                                                            if (window.confirm(`Удалить шаблон «${row.name}»?`)) {
                                                                deleteMutation.mutate(row.id);
                                                            }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>

                                        {/* РАЗВЁРТКА ШАБЛОНА ПРЯМО ВНИЗ (Структура чек-листа) */}
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 3} sx={{ py: 0, bgcolor: '#f8fafc' }}>
                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: 2.5, my: 1, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#ffffff' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Tune color="primary" />
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                    Структура чек-листа: {row.name} ({row.equipment_uid})
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Разделов: <b>{row.groups?.length || 0}</b>
                                                            </Typography>
                                                        </Box>

                                                        <Divider sx={{ mb: 2 }} />

                                                        {/* Вывод разделов и вопросов с их типами и Rule Engine */}
                                                        <Stack spacing={2}>
                                                            {row.groups && row.groups.length > 0 ? (
                                                                row.groups
                                                                    .slice()
                                                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                                    .map((group, gIdx) => (
                                                                        <Box key={group.id} sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark', textTransform: 'uppercase' }}>
                                                                                    Раздел {gIdx + 1}: {group.name}
                                                                                </Typography>
                                                                                {group.page_break && (
                                                                                    <Chip label="Разрыв страницы" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                                )}
                                                                            </Box>

                                                                            <Stack spacing={1}>
                                                                                {group.fields
                                                                                    .slice()
                                                                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                                                    .map((field, fIdx) => {
                                                                                        const meta = (field.metadata as any) || {};
                                                                                        const hasRuleEngine =
                                                                                            (meta.violation_values && meta.violation_values.length > 0) ||
                                                                                            meta.minValue !== undefined ||
                                                                                            meta.maxValue !== undefined;

                                                                                        return (
                                                                                            <Box
                                                                                                key={field.id}
                                                                                                sx={{
                                                                                                    p: 1,
                                                                                                    bgcolor: '#ffffff',
                                                                                                    border: '1px solid #e2e8f0',
                                                                                                    borderRadius: 1,
                                                                                                    display: 'flex',
                                                                                                    justifyContent: 'space-between',
                                                                                                    alignItems: 'center',
                                                                                                    flexWrap: 'wrap',
                                                                                                    gap: 1
                                                                                                }}
                                                                                            >
                                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                                                        {fIdx + 1}. {field.name}
                                                                                                    </Typography>
                                                                                                    {field.is_required && (
                                                                                                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>*</Typography>
                                                                                                    )}
                                                                                                </Box>

                                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                    <Chip label={field.field_type} size="small" sx={{ height: 20 }} />

                                                                                                    {hasRuleEngine && (
                                                                                                        <Chip
                                                                                                            icon={<Warning sx={{ fontSize: 13 }} />}
                                                                                                            label="Rule Engine"
                                                                                                            size="small"
                                                                                                            color="warning"
                                                                                                            variant="outlined"
                                                                                                            sx={{ height: 20 }}
                                                                                                        />
                                                                                                    )}
                                                                                                </Box>
                                                                                            </Box>
                                                                                        );
                                                                                    })}
                                                                            </Stack>
                                                                        </Box>
                                                                    ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    В шаблоне отсутствуют разделы и вопросы
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 3} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Шаблоны не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Диалог клонирования */}
            <Dialog open={Boolean(cloneTarget)} onClose={() => setCloneTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Клонирование шаблона чек-листа</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Вы создаете копию шаблона <b>«{cloneTarget?.name}»</b> со всеми разделами и вопросами.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        label="UID целевого оборудования (станка)"
                        value={newEquipmentUid}
                        onChange={(e) => setNewEquipmentUid(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCloneTarget(null)}>Отмена</Button>
                    <Button
                        onClick={handleConfirmClone}
                        variant="contained"
                        color="primary"
                        disabled={cloneMutation.isPending || !newEquipmentUid.trim()}
                    >
                        {cloneMutation.isPending ? 'Клонирование...' : 'Создать копию'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог истории версий */}
            <TemplateHistoryModal
                open={Boolean(historyTemplateId)}
                templateId={historyTemplateId}
                onClose={() => setHistoryTemplateId(null)}
            />
        </Box>
    );
};