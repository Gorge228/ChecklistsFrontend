import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip
} from '@mui/material';
import {
    CheckCircle,
    Warning,
    AssignmentTurnedIn,
    HourglassTop,
    ArrowDownward,
    ArrowUpward
} from '@mui/icons-material';
import { SummaryMetrics } from '@domain/analytics/dashboardCalculator';

interface Props {
    metrics: SummaryMetrics;
}

export const AnalyticsKpiCards: React.FC<Props> = ({ metrics }) => {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5, mb: 3 }}>
            {/* 1. Коэффициент исправности парка */}
            <Card
                elevation={2}
                sx={{
                    borderRadius: 2.5,
                    border: '1.5px solid',
                    borderColor: metrics.isHealthCritical ? 'error.main' : 'success.light',
                    bgcolor: metrics.isHealthCritical ? '#fff5f5' : '#ffffff',
                }}
            >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            Исправность парка
                        </Typography>
                        <CheckCircle color={metrics.isHealthCritical ? 'error' : 'success'} fontSize="small" />
                    </Box>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: metrics.isHealthCritical ? 'error.main' : 'success.dark',
                            lineHeight: 1.1,
                            mb: 1,
                        }}
                    >
                        {metrics.healthRate}%
                    </Typography>

                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {metrics.isHealthCritical ? (
                            <Chip
                                icon={<ArrowDownward sx={{ fontSize: 14 }} />}
                                label="Ниже нормы (<90%)"
                                size="small"
                                color="error"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                        ) : (
                            <Chip
                                icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                                label="Норма регламента"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* 2. Всего выявлено дефектов */}
            <Card elevation={2} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            Выявлено дефектов
                        </Typography>
                        <Warning color={metrics.totalDefects > 0 ? 'error' : 'action'} fontSize="small" />
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', lineHeight: 1.1, mb: 1 }}>
                        {metrics.totalDefects}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={`Критических: ${metrics.criticalDefects}`}
                            size="small"
                            color={metrics.criticalDefects > 0 ? 'error' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                        <Chip
                            label={`В работе: ${metrics.inProgressDefects}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    </Stack>
                </CardContent>
            </Card>

            {/* 3. Индекс выполнения регламента (SLA) */}
            <Card elevation={2} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            SLA план обходов
                        </Typography>
                        <AssignmentTurnedIn color="primary" fontSize="small" />
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.1, mb: 1 }}>
                        {metrics.slaComplianceRate}%
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        Сдано чистовиков: <b>{metrics.completedChecks}</b> из <b>{metrics.expectedChecks}</b>
                    </Typography>
                </CardContent>
            </Card>

            {/* 4. Анкеты, ожидающие утверждения */}
            <Card
                elevation={2}
                sx={{
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    bgcolor: metrics.pendingApprovals > 0 ? '#fffbeb' : '#ffffff',
                }}
            >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            Ждут утверждения
                        </Typography>
                        <HourglassTop color={metrics.pendingApprovals > 0 ? 'warning' : 'action'} fontSize="small" />
                    </Box>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: metrics.pendingApprovals > 0 ? 'warning.dark' : 'text.primary',
                            lineHeight: 1.1,
                            mb: 1,
                        }}
                    >
                        {metrics.pendingApprovals}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        Требуется подпись <b>APPROVER</b>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};