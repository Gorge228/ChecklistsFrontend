import React from 'react';
import {
    Box,
    Chip,
    Typography
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export const UserSessionBar: React.FC = () => {
    const { user, role } = useAuth();

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Бейдж текущей должности/роли */}
            <Chip
                label={role}
                color={
                    role === 'ADMIN'
                        ? 'error'
                        : role === 'FOREMAN'
                            ? 'secondary'
                            : role === 'OPERATOR'
                                ? 'primary'
                                : 'default'
                }
                size="small"
                sx={{ fontWeight: 'bold' }}
            />

            {/* ФИО и логин вошедшего сотрудника */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" color="action" />
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {user.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {user.user_uid}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};