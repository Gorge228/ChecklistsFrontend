import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Stack,
    CircularProgress,
    Paper
} from '@mui/material';
import { History, Schedule } from '@mui/icons-material';
import { useTemplateHistoryQuery } from '../../hooks/useChecklists';

interface Props {
    open: boolean;
    templateId: number | null;
    onClose: () => void;
}

export const TemplateHistoryModal: React.FC<Props> = ({
                                                          open,
                                                          templateId,
                                                          onClose,
                                                      }) => {
    const { data: history, isLoading } = useTemplateHistoryQuery(templateId);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                История изменений шаблона #{templateId}
            </DialogTitle>

            <DialogContent dividers>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : history && history.length > 0 ? (
                    <Stack spacing={2}>
                        {history.map((rev, index) => {
                            const isLatest = index === 0;
                            const totalFields = rev.groups?.reduce((acc, g) => acc + g.fields.length, 0) || 0;

                            return (
                                <Paper
                                    key={rev.id || index}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1.5px solid',
                                        borderColor: isLatest ? 'primary.main' : '#e2e8f0',
                                        bgcolor: isLatest ? '#f0f7ff' : '#ffffff',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Chip
                                                label={`Ревизия ${history.length - index}`}
                                                color={isLatest ? 'primary' : 'default'}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                            {isLatest && (
                                                <Chip label="Актуальная" size="small" color="success" variant="outlined" />
                                            )}
                                        </Stack>

                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Schedule sx={{ fontSize: 14 }} />
                                            {new Date(rev.updated_at || rev.created_at).toLocaleString('ru-RU')}
                                        </Typography>
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {rev.name}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Станок: <b>{rev.equipment_uid}</b> | Разделов: <b>{rev.groups?.length || 0}</b> | Вопросов: <b>{totalFields}</b>
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                        История изменений отсутствует
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">
                    Закрыть
                </Button>
            </DialogActions>
        </Dialog>
    );
};