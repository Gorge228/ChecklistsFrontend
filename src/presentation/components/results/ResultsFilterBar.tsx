import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Stack,
    Typography,
    Chip
} from '@mui/material';
import { FilterList, RestartAlt, Warning, EditNote } from '@mui/icons-material';

export interface ResultsFilterState {
    equipmentQuery: string;
    dateFrom: string;
    dateTo: string;
    onlyViolations: boolean;
    onlyDrafts: boolean;
}

interface Props {
    onFilterChange: (filters: ResultsFilterState) => void;
    totalCount: number;
    filteredCount: number;
}

export const ResultsFilterBar: React.FC<Props> = ({
                                                      onFilterChange,
                                                      totalCount,
                                                      filteredCount,
                                                  }) => {
    const [equipmentQuery, setEquipmentQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [onlyViolations, setOnlyViolations] = useState(false);
    const [onlyDrafts, setOnlyDrafts] = useState(false);

    const applyFilters = (
        eq: string,
        dFrom: string,
        dTo: string,
        violation: boolean,
        drafts: boolean
    ) => {
        onFilterChange({
            equipmentQuery: eq,
            dateFrom: dFrom,
            dateTo: dTo,
            onlyViolations: violation,
            onlyDrafts: drafts,
        });
    };

    const handleReset = () => {
        setEquipmentQuery('');
        setDateFrom('');
        setDateTo('');
        setOnlyViolations(false);
        setOnlyDrafts(false);
        applyFilters('', '', '', false, false);
    };

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FilterList color="primary" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Фильтры журнала проверок
                    </Typography>
                    <Chip
                        label={`Найдено: ${filteredCount} из ${totalCount}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Stack>

                {(equipmentQuery || dateFrom || dateTo || onlyViolations || onlyDrafts) && (
                    <Button
                        size="small"
                        color="inherit"
                        startIcon={<RestartAlt />}
                        onClick={handleReset}
                        sx={{ textTransform: 'none' }}
                    >
                        Сбросить фильтры
                    </Button>
                )}
            </Box>

            {/* Поля фильтрации */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1.2fr 1.2fr' },
                    gap: 2,
                    mb: 1.5,
                }}
            >
                <TextField
                    size="small"
                    label="Поиск по станку / оборудованию"
                    placeholder="Например: EXTRUDER-LINE-03"
                    value={equipmentQuery}
                    onChange={(e) => {
                        const val = e.target.value;
                        setEquipmentQuery(val);
                        applyFilters(val, dateFrom, dateTo, onlyViolations, onlyDrafts);
                    }}
                />

                <TextField
                    size="small"
                    type="date"
                    label="Дата смены с"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={dateFrom}
                    onChange={(e) => {
                        const val = e.target.value;
                        setDateFrom(val);
                        applyFilters(equipmentQuery, val, dateTo, onlyViolations, onlyDrafts);
                    }}
                />

                <TextField
                    size="small"
                    type="date"
                    label="Дата смены по"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={dateTo}
                    onChange={(e) => {
                        const val = e.target.value;
                        setDateTo(val);
                        applyFilters(equipmentQuery, dateFrom, val, onlyViolations, onlyDrafts);
                    }}
                />
            </Box>

            {/* Быстрые переключатели: Брак и Черновики */}
            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                    control={
                        <Switch
                            color="error"
                            size="small"
                            checked={onlyViolations}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setOnlyViolations(checked);
                                applyFilters(equipmentQuery, dateFrom, dateTo, checked, onlyDrafts);
                            }}
                        />
                    }
                    label={
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <Warning sx={{ fontSize: 16 }} color={onlyViolations ? 'error' : 'action'} />
                            <Typography variant="body2" sx={{ fontWeight: onlyViolations ? 700 : 500, color: onlyViolations ? 'error.main' : 'text.primary' }}>
                                Только с дефектами
                            </Typography>
                        </Stack>
                    }
                />

                <FormControlLabel
                    control={
                        <Switch
                            color="warning"
                            size="small"
                            checked={onlyDrafts}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setOnlyDrafts(checked);
                                applyFilters(equipmentQuery, dateFrom, dateTo, onlyViolations, checked);
                            }}
                        />
                    }
                    label={
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <EditNote sx={{ fontSize: 18 }} color={onlyDrafts ? 'warning' : 'action'} />
                            <Typography variant="body2" sx={{ fontWeight: onlyDrafts ? 700 : 500, color: onlyDrafts ? 'warning.dark' : 'text.primary' }}>
                                Только черновики
                            </Typography>
                        </Stack>
                    }
                />
            </Stack>
        </Paper>
    );
};