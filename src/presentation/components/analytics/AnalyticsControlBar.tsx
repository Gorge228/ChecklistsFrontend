import React from 'react';
import {
    Paper,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Button,
    ButtonGroup,
    OutlinedInput,
    Chip,
    Stack
} from '@mui/material';
import {
    FileDownload,
    Print,
    FilterAlt
} from '@mui/icons-material';
import { AnalyticsFilterState } from '@domain/analytics/dashboardCalculator';
import { IChecklistResultItem } from '@domain/ports/repositories';

interface Props {
    filters: AnalyticsFilterState;
    onChangeFilters: (newFilters: AnalyticsFilterState) => void;
    availableEquipments: string[];
    rawResults: IChecklistResultItem[];
}

export const AnalyticsControlBar: React.FC<Props> = ({
                                                         filters,
                                                         onChangeFilters,
                                                         availableEquipments,
                                                         rawResults,
                                                     }) => {
    // Установка пресетов дат
    const handlePresetChange = (preset: AnalyticsFilterState['periodPreset']) => {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        let dFrom = todayStr;
        let dTo = todayStr;

        if (preset === 'yesterday') {
            const y = new Date();
            y.setDate(today.getDate() - 1);
            dFrom = y.toISOString().slice(0, 10);
            dTo = dFrom;
        } else if (preset === 'week') {
            const w = new Date();
            w.setDate(today.getDate() - 7);
            dFrom = w.toISOString().slice(0, 10);
            dTo = todayStr;
        } else if (preset === 'month') {
            const m = new Date();
            m.setDate(1);
            dFrom = m.toISOString().slice(0, 10);
            dTo = todayStr;
        }

        onChangeFilters({
            ...filters,
            periodPreset: preset,
            dateFrom: dFrom,
            dateTo: dTo,
        });
    };

    // Экспорт сырых данных в CSV по ТЗ
    const handleExportCsv = () => {
        const headers = ['ID', 'Дата', 'Время', 'Смена', 'Оборудование', 'Оператор', 'Дефекты', 'Статус', 'Комментарий'];
        const rows = rawResults.map((r) => [
            r.id,
            r.shift_date,
            r.shift_time,
            r.shift_number === 'DAY' ? 'Дневная' : 'Ночная',
            `"${r.equipment_uid}"`,
            `"${r.user_uid}"`,
            r.has_violations ? 'ДЕФЕКТ' : 'Норма',
            r.is_completed ? 'Утвержден' : 'Черновик',
            `"${r.general_comment || ''}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Отчет_дефектов_Полипак_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FilterAlt color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Панель управления выборкой (Control Bar)
                    </Typography>
                </Stack>

                {/* Кнопки отчётов и экспорта */}
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExportCsv}
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                        Экспорт в CSV
                    </Button>

                    <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        startIcon={<Print />}
                        onClick={() => window.print()}
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                        Печать сводки (PDF)
                    </Button>
                </Stack>
            </Box>

            {/* Элементы управления фильтрами */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr 180px 160px' }, gap: 2, alignItems: 'center' }}>
                {/* Пресеты дат */}
                <ButtonGroup size="small" variant="outlined">
                    <Button
                        variant={filters.periodPreset === 'today' ? 'contained' : 'outlined'}
                        onClick={() => handlePresetChange('today')}
                    >
                        Сегодня
                    </Button>
                    <Button
                        variant={filters.periodPreset === 'yesterday' ? 'contained' : 'outlined'}
                        onClick={() => handlePresetChange('yesterday')}
                    >
                        Вчера
                    </Button>
                    <Button
                        variant={filters.periodPreset === 'week' ? 'contained' : 'outlined'}
                        onClick={() => handlePresetChange('week')}
                    >
                        7 дней
                    </Button>
                    <Button
                        variant={filters.periodPreset === 'month' ? 'contained' : 'outlined'}
                        onClick={() => handlePresetChange('month')}
                    >
                        Месяц
                    </Button>
                </ButtonGroup>

                {/* Мультиселект оборудования */}
                <FormControl size="small" fullWidth>
                    <InputLabel id="equip-multiselect-label">Оборудование / Станки</InputLabel>
                    <Select
                        labelId="equip-multiselect-label"
                        multiple
                        value={filters.selectedEquipments}
                        onChange={(e) =>
                            onChangeFilters({
                                ...filters,
                                selectedEquipments: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                            })
                        }
                        input={<OutlinedInput label="Оборудование / Станки" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.length === 0 ? (
                                    <em>Все станки</em>
                                ) : (
                                    selected.map((value) => <Chip key={value} label={value} size="small" />)
                                )}
                            </Box>
                        )}
                    >
                        {availableEquipments.map((eq) => (
                            <MenuItem key={eq} value={eq}>
                                {eq}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Фильтр по смене */}
                <FormControl size="small" fullWidth>
                    <InputLabel id="shift-filter-label">Смена</InputLabel>
                    <Select
                        labelId="shift-filter-label"
                        value={filters.shiftFilter}
                        label="Смена"
                        onChange={(e) =>
                            onChangeFilters({
                                ...filters,
                                shiftFilter: e.target.value as any,
                            })
                        }
                    >
                        <MenuItem value="ALL">Все смены</MenuItem>
                        <MenuItem value="DAY">Только дневная (DAY)</MenuItem>
                        <MenuItem value="NIGHT">Только ночная (NIGHT)</MenuItem>
                    </Select>
                </FormControl>

                {/* Произвольная дата при необходимости */}
                <TextField
                    size="small"
                    type="date"
                    label="По дату"
                    value={filters.dateTo}
                    slotProps={{ inputLabel: { shrink: true } }}
                    onChange={(e) =>
                        onChangeFilters({
                            ...filters,
                            periodPreset: 'custom',
                            dateTo: e.target.value,
                        })
                    }
                />
            </Box>
        </Paper>
    );
};