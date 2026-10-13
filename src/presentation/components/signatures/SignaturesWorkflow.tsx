import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Stack,
    Button
} from '@mui/material';
import {
    CheckCircle,
    HourglassEmpty,
    Draw,
    Lock
} from '@mui/icons-material';
import { ISignatureStamp } from '@domain/ports/repositories';

interface Props {
    signatures: ISignatureStamp[];
    currentRole: string;
    onOpenSignModal: (role: string) => void;
    isLocked: boolean;
}

interface RoleConfig {
    roleKey: string;
    title: string;
    subtitle: string;
    allowedUserRoles: string[];
    requiredForClose: boolean;
    buttonText: string;
}

const ROLES: RoleConfig[] = [
    {
        roleKey: 'AUTHOR',
        title: '1. Сдал смену (Оператор)',
        subtitle: 'Первичный осмотр и сдача',
        allowedUserRoles: ['OPERATOR', 'FOREMAN', 'ADMIN'],
        requiredForClose: false,
        buttonText: 'Сдать смену',
    },
    {
        roleKey: 'READER',
        title: '2. Принял смену (Сменщик)',
        subtitle: 'Ознакомление и прием оборудования',
        allowedUserRoles: ['OPERATOR', 'FOREMAN', 'ADMIN'],
        requiredForClose: false,
        buttonText: 'Принять смену',
    },
    {
        roleKey: 'APPROVER',
        title: '3. Утвердил (Мастер цеха)',
        subtitle: 'Проверка и закрытие смены',
        allowedUserRoles: ['FOREMAN', 'ADMIN'],
        requiredForClose: true,
        buttonText: 'Утвердить смену',
    },
];

export const SignaturesWorkflow: React.FC<Props> = ({
                                                        signatures,
                                                        currentRole,
                                                        onOpenSignModal,
                                                    }) => {
    const userRole = currentRole.toUpperCase();
    const isMasterOrAdmin = userRole === 'ADMIN' || userRole === 'FOREMAN';

    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase' }}>
                Штампы сдачи и утверждения смены
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {ROLES.map((cfg) => {
                    // Ищем существующую подпись строго по роли штампа
                    const sig = signatures.find((s) => s.role.toUpperCase() === cfg.roleKey);
                    const isSigned = Boolean(sig);

                    // Админ и Мастер МОГУТ подписать карточку №3 ВСЕГДА, если она еще не подписана
                    const canSignThisRole = !isSigned && (
                        isMasterOrAdmin || cfg.allowedUserRoles.includes(userRole)
                    );

                    return (
                        <Card
                            key={cfg.roleKey}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                border: '1.5px solid',
                                borderColor: isSigned ? 'success.main' : 'grey.300',
                                bgcolor: isSigned ? '#f0fdf4' : '#fafafa',
                                transition: 'all 0.2s',
                            }}
                        >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: isSigned ? 'success.dark' : 'text.primary' }}>
                                        {cfg.title}
                                    </Typography>

                                    {isSigned ? (
                                        <Chip
                                            icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                            label="Подписано"
                                            color="success"
                                            size="small"
                                            sx={{ fontWeight: 600, height: 22 }}
                                        />
                                    ) : (
                                        <Chip
                                            icon={<HourglassEmpty sx={{ fontSize: '14px !important' }} />}
                                            label="Ожидает"
                                            size="small"
                                            sx={{ height: 22 }}
                                        />
                                    )}
                                </Box>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                    {cfg.subtitle}
                                </Typography>

                                {isSigned ? (
                                    <Stack spacing={0.5} sx={{ pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {sig?.user_uid}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Дата: {new Date(sig?.signed_at || '').toLocaleString('ru-RU')}
                                        </Typography>
                                        {sig?.comment && (
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.primary', mt: 0.5 }}>
                                                «{sig.comment}»
                                            </Typography>
                                        )}
                                    </Stack>
                                ) : (
                                    <Box sx={{ pt: 1, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                        {canSignThisRole ? (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color={cfg.requiredForClose ? 'error' : 'primary'}
                                                startIcon={cfg.requiredForClose ? <Lock /> : <Draw />}
                                                onClick={() => onOpenSignModal(cfg.roleKey)}
                                                fullWidth
                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                            >
                                                {cfg.buttonText}
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">
                                                {cfg.requiredForClose
                                                    ? 'Требуется подпись Мастера/Админа'
                                                    : 'Ожидает подписи'}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
};