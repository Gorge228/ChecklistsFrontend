import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Stack
} from '@mui/material';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';
import {
    Timeline,
    Leaderboard,
    DonutLarge,
    Brightness4
} from '@mui/icons-material';
import { useResultsQuery } from '../../hooks/useChecklists';
import {
    filterResults,
    calculateSummaryMetrics,
    calculateTopEquipmentDefects,
    calculateSubsystemDefects,
    calculateTimelineData,
    extractLiveIncidents,
    AnalyticsFilterState
} from '@domain/analytics/dashboardCalculator';
import { AnalyticsControlBar } from './AnalyticsControlBar';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { IncidentsLiveFeed } from './IncidentsLiveFeed';

const DONUT_COLORS = ['#d32f2f', '#ed6c02', '#0288d1', '#7b1fa2', '#2e7d32', '#00796b'];
const SHIFT_COLORS = ['#1976d2', '#7b1fa2'];

interface Props {
    onNavigateToResult?: (resultId: number) => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ onNavigateToResult }) => {
    const { data: rawResults, isLoading } = useResultsQuery();

    // Состояние глобальной панели управления фильтрами
    const [filters, setFilters] = useState<AnalyticsFilterState>({
        periodPreset: 'week',
        dateFrom: '',
        dateTo: '',
        selectedEquipments: [],
        checklistType: 'ALL',
        shiftFilter: 'ALL',
    });

    // Список всех уникальных станков для фильтра
    const availableEquipments = useMemo(() => {
        if (!rawResults) return [];
        return Array.from(new Set(rawResults.map((r) => r.equipment_uid))).filter(Boolean);
    }, [rawResults]);

    // Фильтрованный список результатов
    const filteredResults = useMemo(() => {
        if (!rawResults) return [];
        return filterResults(rawResults, filters);
    }, [rawResults, filters]);

    // Расчёт всех производственных показателей
    const metrics = useMemo(() => calculateSummaryMetrics(filteredResults), [filteredResults]);
    const timelineData = useMemo(() => calculateTimelineData(filteredResults), [filteredResults]);
    const topEquipmentData = useMemo(() => calculateTopEquipmentDefects(filteredResults), [filteredResults]);
    const subsystemData = useMemo(() => calculateSubsystemDefects(filteredResults), [filteredResults]);
    const liveIncidents = useMemo(() => extractLiveIncidents(filteredResults), [filteredResults]);

    // Распределение проверок по сменам
    const shiftDistributionData = useMemo(() => {
        const dayCount = filteredResults.filter((r) => r.shift_number === 'DAY').length;
        const nightCount = filteredResults.filter((r) => r.shift_number === 'NIGHT').length;
        return [
            { name: 'Дневная смена (DAY)', value: dayCount },
            { name: 'Ночная смена (NIGHT)', value: nightCount },
        ];
    }, [filteredResults]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', pb: 4 }}>
            {/* 1. Панель глобального управления (Control Bar) */}
            <AnalyticsControlBar
                filters={filters}
                onChangeFilters={setFilters}
                availableEquipments={availableEquipments}
                rawResults={filteredResults}
            />

            {/* 2. Верхнеуровневые KPI-карточки (Summary Metrics) */}
            <AnalyticsKpiCards metrics={metrics} />

            {/* 3. Верхний блок графиков: Динамика во времени + ТОП-5 проблемных станков */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 3, mb: 3 }}>
                {/* График динамики дефектов во времени */}
                <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Timeline color="primary" fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Динамика проверок и инцидентов во времени
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Линейный тренд
                        </Typography>
                    </Box>

                    <Box sx={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="totalChecks"
                                    name="Всего проверок"
                                    stroke="#1976d2"
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="defectsCount"
                                    name="Выявлено дефектов"
                                    stroke="#d32f2f"
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* ТОП-5 проблемных единиц техники (Горизонтальный Bar Chart) */}
                <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Leaderboard color="error" fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                ТОП-5 проблемных станков (Антирейтинг)
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Количество дефектов
                        </Typography>
                    </Box>

                    <Box sx={{ height: 300, width: '100%' }}>
                        {topEquipmentData.length === 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography variant="body2" color="text.secondary">Нарушений нет</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topEquipmentData} margin={{ left: 15, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={110} />
                                    <Tooltip />
                                    <Bar dataKey="violations" name="Количество дефектов" fill="#d32f2f" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* 4. Нижний блок графиков: Распределение по узлам (Donut) + Распределение по сменам (Pie) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Распределение дефектов по узлам и системам (Donut Chart) */}
                <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <DonutLarge color="primary" fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Распределение дефектов по узлам и системам
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">EAV-аналитика</Typography>
                    </Box>

                    <Box sx={{ height: 260, width: '100%' }}>
                        {subsystemData.length === 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography variant="body2" color="text.secondary">Дефектов в узлах не зафиксировано</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subsystemData}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                    >
                                        {subsystemData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} шт.`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Paper>

                {/* Распределение по сменам (DAY vs NIGHT) */}
                <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Brightness4 color="secondary" fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Распределение проверок по сменам
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">День / Ночь</Typography>
                    </Box>

                    <Box sx={{ height: 260, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={shiftDistributionData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    label
                                >
                                    {shiftDistributionData.map((_, index) => (
                                        <Cell key={`cell-shift-${index}`} fill={SHIFT_COLORS[index % SHIFT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>

            {/* 5. Оперативный журнал последних инцидентов (Live Feed) */}
            <IncidentsLiveFeed
                incidents={liveIncidents}
                onViewResult={onNavigateToResult}
            />
        </Box>
    );
};