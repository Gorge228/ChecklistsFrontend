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
    Stack,
    Alert,
    TableSortLabel
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    Warning,
    CheckCircle,
    HourglassEmpty,
    AssignmentTurnedIn,
    Thermostat,
    History,
    Lock,
    TaskAlt,
    Draw
} from '@mui/icons-material';
import { useResultsQuery } from '../../hooks/useChecklists';
import { useDI } from '../../di/DIContext';
import { IChecklistResultItem } from '@domain/ports/repositories';
import { SignaturesWorkflow } from '../signatures/SignaturesWorkflow';
import { SignChecklistModal } from '../signatures/SignChecklistModal';
import { ResultHistoryDialog } from './ResultHistoryDialog';
import { ResultsFilterBar, ResultsFilterState } from './ResultsFilterBar';

interface ColumnMeta {
    id: string;
    label: string;
}

const INITIAL_COLUMNS: ColumnMeta[] = [
    { id: 'shift_date', label: 'Дата смены' },
    { id: 'shift_time', label: 'Время смены' },
    { id: 'user_uid', label: 'Кто сдал смену' },
    { id: 'shift_number', label: 'Смена' },
    { id: 'equipment_uid', label: 'Рабочая станция' },
    { id: 'status', label: 'Статус' },
];

export const ResultsTable: React.FC = () => {
    const { data: results, isLoading } = useResultsQuery();
    const { sessionService } = useDI();

    const currentUserName = sessionService.getCurrentUserUid();
    const currentRole = sessionService.getCurrentRole().toUpperCase();
    const isMasterOrAdmin = currentRole === 'FOREMAN' || currentRole === 'ADMIN';

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

    const [sortField, setSortField] = useState<string>('shift_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [filters, setFilters] = useState<ResultsFilterState>({
        equipmentQuery: '',
        dateFrom: '',
        dateTo: '',
        onlyViolations: false,
        onlyDrafts: false,
    });

    const [signModalState, setSignModalState] = useState<{ open: boolean; resultId: number | null; role: string }>({
        open: false,
        resultId: null,
        role: 'APPROVER',
    });
    const [historyModalId, setHistoryModalId] = useState<number | null>(null);

    const [columns, setColumns] = useState<ColumnMeta[]>(INITIAL_COLUMNS);
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

    const handleRequestSort = (fieldId: string) => {
        const isAsc = sortField === fieldId && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(fieldId);
    };

    // ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ: смена утверждена ТОЛЬКО если есть подпись APPROVER в массиве!
    const isRowApproved = (item: IChecklistResultItem): boolean => {
        return Boolean(
            item.signatures?.some((s) => s.role.toUpperCase() === 'APPROVER')
        );
    };

    const processedResults = useMemo(() => {
        if (!results) return [];

        const filtered = results.filter((item) => {
            if (
                filters.equipmentQuery.trim() &&
                !item.equipment_uid.toLowerCase().includes(filters.equipmentQuery.trim().toLowerCase())
            ) {
                return false;
            }
            if (filters.dateFrom && item.shift_date < filters.dateFrom) return false;
            if (filters.dateTo && item.shift_date > filters.dateTo) return false;
            if (filters.onlyViolations && !item.has_violations) return false;
            if (filters.onlyDrafts && !item.is_draft) return false;
            return true;
        });

        return filtered.sort((a, b) => {
            let valA: any = (a as any)[sortField] ?? '';
            let valB: any = (b as any)[sortField] ?? '';

            if (sortField === 'status') {
                const aApproved = isRowApproved(a);
                const bApproved = isRowApproved(b);
                valA = a.has_violations ? 2 : aApproved ? 1 : 0;
                valB = b.has_violations ? 2 : bApproved ? 1 : 0;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [results, filters, sortField, sortOrder]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && processedResults) {
            setSelectedIds(processedResults.map((r) => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const renderCellContent = (colId: string, item: IChecklistResultItem) => {
        const approved = isRowApproved(item);

        switch (colId) {
            case 'shift_date':
                return item.shift_date;
            case 'shift_time':
                return item.shift_time;
            case 'user_uid':
                return (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.user_uid}
                    </Typography>
                );
            case 'shift_number':
                return (
                    <Chip
                        label={item.shift_number === 'DAY' ? 'Дневная' : 'Ночная'}
                        size="small"
                        color={item.shift_number === 'DAY' ? 'primary' : 'secondary'}
                        sx={{ fontWeight: 'bold' }}
                    />
                );
            case 'equipment_uid':
                return (
                    <Chip
                        label={item.equipment_uid}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                );
            case 'status':
                if (item.has_violations) {
                    return <Chip icon={<Warning />} label="Брак / Дефект" color="error" size="small" />;
                }
                if (approved) {
                    return <Chip icon={<CheckCircle />} label="Утверждена" color="success" size="small" />;
                }
                if (item.is_draft) {
                    return <Chip icon={<HourglassEmpty />} label="Черновик" color="default" size="small" />;
                }
                return <Chip icon={<HourglassEmpty />} label="Ждет мастера" color="warning" size="small" />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <ResultsFilterBar
                onFilterChange={setFilters}
                totalCount={results?.length || 0}
                filteredCount={processedResults.length}
            />

            {selectedIds.length > 0 && (
                <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                    Выбрано смен чекбоксами: <b>{selectedIds.length}</b>
                </Alert>
            )}

            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table sx={{ minWidth: 750 }}>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    size="small"
                                    checked={Boolean(processedResults.length > 0 && selectedIds.length === processedResults.length)}
                                    indeterminate={Boolean(selectedIds.length > 0 && selectedIds.length < processedResults.length)}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>

                            <TableCell sx={{ width: 50, p: 0 }} />

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
                                    <TableSortLabel
                                        active={sortField === col.id}
                                        direction={sortField === col.id ? sortOrder : 'asc'}
                                        onClick={() => handleRequestSort(col.id)}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}

                            <TableCell sx={{ fontWeight: 700, width: 230 }}>Действия</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {processedResults.length > 0 ? (
                            processedResults.map((row) => {
                                const isExpanded = expandedRowId === row.id;
                                const isSelected = selectedIds.includes(row.id);

                                // ТОЛЬКО ПОДПИСЬ APPROVER ДАЕТ СТАТУС УТВЕРЖДЕНИЯ
                                const isApproved = isRowApproved(row);

                                const isReaderSigned = Boolean(
                                    row.signatures?.some((s) => s.role.toUpperCase() === 'READER')
                                );

                                const isAuthor = row.user_uid === currentUserName || Boolean(
                                    row.signatures?.some((s) => s.role.toUpperCase() === 'AUTHOR' && s.user_uid === currentUserName)
                                );

                                const hasUserSigned = Boolean(
                                    row.signatures?.some((s) => s.user_uid === currentUserName)
                                );

                                return (
                                    <React.Fragment key={row.id}>
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

                                            {/* ЧЕСТНАЯ КНОПКА ДЕЙСТВИЯ */}
                                            <TableCell>
                                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        title="История изменений"
                                                        onClick={() => setHistoryModalId(row.id)}
                                                        sx={{ p: 1 }}
                                                    >
                                                        <History fontSize="small" />
                                                    </IconButton>

                                                    {/* 1. Если мастер УТВЕРДИЛ — зеленый замок для всех */}
                                                    {isApproved ? (
                                                        <Chip
                                                            icon={<Lock sx={{ fontSize: '14px !important' }} />}
                                                            label="Утверждена"
                                                            color="success"
                                                            size="small"
                                                            sx={{ fontWeight: 700, height: 28 }}
                                                        />
                                                    ) : isMasterOrAdmin ? (
                                                        /* 2. Мастер/Админ видит кнопку УТВЕРДИТЬ, пока сам не утвердил */
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<TaskAlt />}
                                                            onClick={() =>
                                                                setSignModalState({
                                                                    open: true,
                                                                    resultId: row.id,
                                                                    role: 'APPROVER',
                                                                })
                                                            }
                                                            sx={{ textTransform: 'none', minHeight: 28, px: 1.5, fontWeight: 700 }}
                                                        >
                                                            Утвердить
                                                        </Button>
                                                    ) : isAuthor ? (
                                                        /* 3. Автор сдал — ждет мастера */
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                                            label="Смена сдана (Ждет мастера)"
                                                            color="info"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ fontWeight: 600, height: 28 }}
                                                        />
                                                    ) : hasUserSigned || isReaderSigned ? (
                                                        /* 4. Сменщик подписал */
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                                            label="Смена принята"
                                                            color="success"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ fontWeight: 600, height: 28 }}
                                                        />
                                                    ) : (
                                                        /* 5. Сменщик еще не подписал */
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            startIcon={<Draw />}
                                                            onClick={() =>
                                                                setSignModalState({
                                                                    open: true,
                                                                    resultId: row.id,
                                                                    role: 'READER',
                                                                })
                                                            }
                                                            sx={{ textTransform: 'none', minHeight: 28, px: 1.5 }}
                                                        >
                                                            Принять смену
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>

                                        {/* РАЗВЁРТКА СТРОКИ */}
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 3} sx={{ py: 0, bgcolor: '#f8fafc' }}>
                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, my: 1, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#ffffff' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AssignmentTurnedIn color="primary" />
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                    Протокол чек-листа: {row.template_name} ({row.equipment_uid})
                                                                </Typography>
                                                                <Chip label={`Ревизия v${row.version || 1}`} size="small" variant="outlined" />
                                                            </Box>

                                                            {/* Зеленый замок шапки появляется ТОЛЬКО когда мастер РЕАЛЬНО утвердил */}
                                                            {isApproved && (
                                                                <Chip
                                                                    icon={<Lock />}
                                                                    label="Анкета утверждена мастером смены"
                                                                    color="success"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            )}
                                                        </Box>

                                                        {/* ШТАМПЫ ПОДПИСЕЙ */}
                                                        <SignaturesWorkflow
                                                            signatures={row.signatures || []}
                                                            currentRole={sessionService.getCurrentRole()}
                                                            isLocked={isApproved}
                                                            onOpenSignModal={(targetRole) =>
                                                                setSignModalState({
                                                                    open: true,
                                                                    resultId: row.id,
                                                                    role: targetRole,
                                                                })
                                                            }
                                                        />

                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
                                                            Ответы оператора по контрольным точкам
                                                        </Typography>

                                                        <Stack spacing={1.5}>
                                                            {row.groups && row.groups.length > 0 ? (
                                                                row.groups.map((group) => (
                                                                    <Box key={group.group_id} sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                                            {group.group_name}
                                                                        </Typography>
                                                                        <Stack spacing={1}>
                                                                            {group.answers.map((ans) => {
                                                                                const isTemp = ans.field_name.toLowerCase().includes('температур');
                                                                                return (
                                                                                    <Box
                                                                                        key={ans.field_id}
                                                                                        sx={{
                                                                                            p: 1.2,
                                                                                            bgcolor: ans.is_violation ? '#fef2f2' : '#ffffff',
                                                                                            border: '1px solid',
                                                                                            borderColor: ans.is_violation ? '#fca5a5' : '#e2e8f0',
                                                                                            borderRadius: 1,
                                                                                            display: 'flex',
                                                                                            justifyContent: 'space-between',
                                                                                            alignItems: 'center',
                                                                                            flexWrap: 'wrap',
                                                                                            gap: 1
                                                                                        }}
                                                                                    >
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                            {isTemp && <Thermostat color={ans.is_violation ? 'error' : 'action'} fontSize="small" />}
                                                                                            <Box>
                                                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                                                    {ans.field_name}
                                                                                                </Typography>
                                                                                                {ans.comment && (
                                                                                                    <Typography variant="caption" sx={{ color: ans.is_violation ? 'error.main' : 'text.secondary', display: 'block' }}>
                                                                                                        Замечание: {ans.comment}
                                                                                                    </Typography>
                                                                                                )}
                                                                                            </Box>
                                                                                        </Box>

                                                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                                            <Chip
                                                                                                label={ans.value === 'true' ? 'ДА' : ans.value === 'false' ? 'НЕТ' : ans.value}
                                                                                                size="small"
                                                                                                color={ans.is_violation ? 'error' : 'default'}
                                                                                                variant={ans.is_violation ? 'filled' : 'outlined'}
                                                                                                sx={{ fontWeight: 600 }}
                                                                                            />
                                                                                            {ans.is_violation && <Chip label="ДЕФЕКТ" size="small" color="error" />}
                                                                                        </Box>
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Stack>
                                                                    </Box>
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Ответы в чек-листе отсутствуют
                                                                </Typography>
                                                            )}
                                                        </Stack>

                                                        {row.general_comment && (
                                                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fffbeb', borderRadius: 1, border: '1px solid #fef3c7' }}>
                                                                <Typography variant="caption" color="text.secondary">Общий комментарий к смене: </Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.general_comment}</Typography>
                                                            </Box>
                                                        )}
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
                                        По заданным критериям фильтрации смены не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <ResultHistoryDialog
                open={Boolean(historyModalId)}
                resultId={historyModalId}
                onClose={() => setHistoryModalId(null)}
            />

            <SignChecklistModal
                open={signModalState.open}
                resultId={signModalState.resultId}
                initialRole={signModalState.role}
                onClose={() => setSignModalState({ open: false, resultId: null, role: 'APPROVER' })}
            />
        </Box>
    );
};