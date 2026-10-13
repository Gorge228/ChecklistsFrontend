import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    Stack
} from '@mui/material';
import {
    Warning,
    PhotoCamera,
    OpenInNew,
    Close,
    Build
} from '@mui/icons-material';
import { LiveIncidentItem } from '@domain/analytics/dashboardCalculator';

interface Props {
    incidents: LiveIncidentItem[];
    onViewResult?: (resultId: number) => void;
}

export const IncidentsLiveFeed: React.FC<Props> = ({
                                                       incidents,
                                                       onViewResult,
                                                   }) => {
    const [photoPreview, setPhotoPreview] = useState<{ open: boolean; title: string } | null>(null);

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                mt: 3,
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Build color="error" fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Оперативный журнал последних инцидентов (Live Feed)
                    </Typography>
                </Stack>

                <Chip
                    label={`Зафиксировано дефектов: ${incidents.length}`}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                />
            </Box>

            {incidents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    В выбранном периоде критических инцидентов и нарушений не зафиксировано
                </Typography>
            ) : (
                <TableContainer sx={{ maxHeight: 380 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 700 } }}>
                                <TableCell sx={{ width: 130 }}>Время / Дата</TableCell>
                                <TableCell sx={{ width: 140 }}>Оборудование</TableCell>
                                <TableCell sx={{ width: 220 }}>Узел / Вопрос</TableCell>
                                <TableCell>Описание дефекта</TableCell>
                                <TableCell sx={{ width: 80, textAlign: 'center' }}>Фото</TableCell>
                                <TableCell sx={{ width: 160 }}>Оператор</TableCell>
                                <TableCell sx={{ width: 150 }}>Статус</TableCell>
                                <TableCell sx={{ width: 110, textAlign: 'center' }}>Анкета</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {incidents.map((item, idx) => (
                                <TableRow
                                    key={idx}
                                    hover
                                    sx={{
                                        bgcolor: '#fffbfb',
                                        '&:hover': { bgcolor: '#fff0f0 !important' },
                                    }}
                                >
                                    {/* Время и дата */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.time}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.date}
                                        </Typography>
                                    </TableCell>

                                    {/* Оборудование */}
                                    <TableCell>
                                        <Chip
                                            label={item.equipment_uid}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                                        />
                                    </TableCell>

                                    {/* Узел станка */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.nodeName}
                                        </Typography>
                                    </TableCell>

                                    {/* Описание дефекта */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Warning color="error" sx={{ fontSize: 16 }} />
                                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                                {item.defectDescription}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Наличие фото */}
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {item.hasPhoto ? (
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() =>
                                                    setPhotoPreview({
                                                        open: true,
                                                        title: `Фото дефекта: ${item.equipment_uid} (${item.nodeName})`,
                                                    })
                                                }
                                            >
                                                <PhotoCamera fontSize="small" />
                                            </IconButton>
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">
                                                —
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* Оператор */}
                                    <TableCell>
                                        <Typography variant="body2">{item.operator}</Typography>
                                    </TableCell>

                                    {/* Статус */}
                                    <TableCell>
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={
                                                item.status === 'Требует ремонта'
                                                    ? 'error'
                                                    : item.status === 'В работе'
                                                        ? 'warning'
                                                        : 'success'
                                            }
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>

                                    {/* Переход в анкету */}
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {onViewResult && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                                onClick={() => onViewResult(item.resultId)}
                                                sx={{ textTransform: 'none', fontWeight: 600, py: 0 }}
                                            >
                                                #{item.resultId}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Модалка превью фото */}
            <Dialog
                open={Boolean(photoPreview?.open)}
                onClose={() => setPhotoPreview(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {photoPreview?.title}
                    </Typography>
                    <IconButton size="small" onClick={() => setPhotoPreview(null)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: 3, bgcolor: '#f8fafc' }}>
                    <Box
                        sx={{
                            p: 4,
                            border: '2px dashed #cbd5e1',
                            borderRadius: 2,
                            bgcolor: '#ffffff',
                        }}
                    >
                        <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Фотоснимок зафиксирован оператором через мобильную камеру планшета при выявлении дефекта.
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        </Paper>
    );
};