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
import { History, Person, Schedule } from '@mui/icons-material';
import { useResultHistoryQuery } from '../../hooks/useChecklists';

interface Props {
    open: boolean;
    resultId: number | null;
    onClose: () => void;
}

export const ResultHistoryDialog: React.FC<Props> = ({
                                                         open,
                                                         resultId,
                                                         onClose,
                                                     }) => {
    const { data: history, isLoading } = useResultHistoryQuery(resultId);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                История изменений анкеты #{resultId}
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
                            return (
                                <Paper
                                    key={rev.version || index}
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
                                                label={`Версия ${rev.version || history.length - index}`}
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

                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, mb: 1 }}>
                                        <Person sx={{ fontSize: 16 }} color="action" />
                                        Автор ревизии: {rev.user_uid}
                                    </Typography>

                                    {rev.general_comment && (
                                        <Box sx={{ p: 1, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                Замечание к версии:
                                            </Typography>
                                            <Typography variant="body2">{rev.general_comment}</Typography>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                        История правок отсутствует
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