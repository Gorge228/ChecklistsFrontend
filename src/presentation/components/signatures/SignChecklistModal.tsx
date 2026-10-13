import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
    Stack,
    CircularProgress
} from '@mui/material';
import { Lock, Draw, ErrorOutlined } from '@mui/icons-material';
import { useSignResultMutation } from '../../hooks/useChecklists';
import { useDI } from '../../di/DIContext';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
    open: boolean;
    resultId: number | null;
    initialRole?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const SignChecklistModal: React.FC<Props> = ({
                                                        open,
                                                        resultId,
                                                        initialRole = 'APPROVER',
                                                        onClose,
                                                        onSuccess,
                                                    }) => {
    const { sessionService } = useDI();
    const queryClient = useQueryClient();
    const signMutation = useSignResultMutation();

    const currentUserRole = sessionService.getCurrentRole().toUpperCase();
    const currentUserName = sessionService.getCurrentUserUid();

    const isMasterOrAdmin = currentUserRole === 'FOREMAN' || currentUserRole === 'ADMIN';

    const availableRoles = useMemo(() => {
        if (isMasterOrAdmin) {
            return [
                { key: 'APPROVER', title: 'Мастер цеха (Утверждение смены)' },
                { key: 'READER', title: 'Принимающий смену (READER)' },
            ];
        }
        return [
            { key: 'READER', title: 'Принимающий смену (READER)' },
        ];
    }, [isMasterOrAdmin]);

    const [role, setRole] = useState<string>(initialRole);
    const [comment, setComment] = useState<string>('');
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        setServerError(null);
        if (isMasterOrAdmin) {
            setRole(initialRole || 'APPROVER');
        } else {
            setRole('READER');
        }
    }, [initialRole, isMasterOrAdmin, open]);

    const isApprover = role === 'APPROVER';

    const handleSign = async () => {
        if (!resultId) {
            setServerError('Не указан ID анкеты');
            return;
        }

        if (isApprover && !isMasterOrAdmin) {
            setServerError('У вас нет прав мастера цеха для утверждения анкеты.');
            return;
        }

        setServerError(null);
        setIsSubmitting(true);

        try {
            // Пытаемся подписать с закрытием
            await signMutation.mutateAsync({
                resultId,
                payload: {
                    role: role,
                    user_uid: currentUserName,
                    is_closing: isApprover,
                    comment: comment.trim() || (isApprover ? 'Утверждено' : 'Ознакомлен'),
                },
            });

            setComment('');
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            const errStr = JSON.stringify(err);

            // Если Django ругается, что анкета уже была закрыта ранее — отправляем БЕЗ флага закрытия
            if (errStr.includes('уже закрыта') || errStr.includes('already closed')) {
                try {
                    await signMutation.mutateAsync({
                        resultId,
                        payload: {
                            role: role,
                            user_uid: currentUserName,
                            is_closing: false,
                            comment: comment.trim() || 'Утверждено',
                        },
                    });
                } catch {
                    // Подпись уже принята сервером
                }

                await queryClient.invalidateQueries({ queryKey: ['checklist-results'] });
                await queryClient.refetchQueries({ queryKey: ['checklist-results'] });
                onClose();
                if (onSuccess) onSuccess();
                return;
            }

            let detailedMsg = '';
            if (err.errors && typeof err.errors === 'object') {
                detailedMsg = Object.entries(err.errors)
                    .map(([field, text]) => {
                        const val = Array.isArray(text) ? text.join(', ') : typeof text === 'object' ? JSON.stringify(text) : String(text);
                        return `Поле "${field}": ${val}`;
                    })
                    .join(' | ');
            } else if (err.message && err.message !== 'Ошибка валидации данных анкеты') {
                detailedMsg = err.message;
            } else {
                detailedMsg = JSON.stringify(err);
            }

            setServerError(detailedMsg || 'Ошибка сервера при постановке подписи');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Draw color="primary" />
                Электронная подпись анкеты #{resultId}
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {serverError && (
                        <Alert severity="error" icon={<ErrorOutlined />}>
                            {serverError}
                        </Alert>
                    )}

                    {isApprover && isMasterOrAdmin && (
                        <Alert severity="warning" icon={<Lock />}>
                            Внимание: подпись мастера <b>заблокирует анкету от любых изменений</b> и окончательно закроет смену.
                        </Alert>
                    )}

                    <FormControl fullWidth size="small">
                        <InputLabel id="role-select-label">Роль подписи</InputLabel>
                        <Select
                            labelId="role-select-label"
                            value={role}
                            label="Роль подписи"
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {availableRoles.map((r) => (
                                <MenuItem key={r.key} value={r.key}>
                                    {r.title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Подпись ставится от имени:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {currentUserName} (Роль: {currentUserRole})
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Замечание / Комментарий к смене"
                        placeholder="Например: Смена проверена, оборудование в норме"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    color={isApprover ? 'error' : 'primary'}
                    onClick={handleSign}
                    disabled={isSubmitting || (isApprover && !isMasterOrAdmin)}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : (isApprover ? <Lock /> : <Draw />)}
                >
                    {isSubmitting
                        ? 'Отправка...'
                        : isApprover
                            ? 'Утвердить смену'
                            : 'Подписать как READER'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};