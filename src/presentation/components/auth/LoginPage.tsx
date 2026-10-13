import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    Divider,
    Chip,
    Stack,
    InputAdornment,
    IconButton,
    CircularProgress
} from '@mui/material';
import { LockOutlined, Login, Visibility, VisibilityOff, Security, PrecisionManufacturing, FactCheck } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface Props {
    onSuccessLogin: () => void;
}

export const LoginPage: React.FC<Props> = ({ onSuccessLogin }) => {
    const { login } = useAuth();

    const [username, setUsername] = useState('operator_ivanov');
    const [password, setPassword] = useState('Polipak2026!');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSubmitting(true);

        try {
            await login({ username: username.trim(), password });
            onSuccessLogin();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMsg(err.message);
            } else {
                setErrorMsg('Неверный логин или пароль');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectPreset = (user: string) => {
        setUsername(user);
        setPassword('Polipak2026!');
        setErrorMsg(null);
    };

    return (
        <Box
            sx={{
                minHeight: '85vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Card elevation={3} sx={{ maxWidth: 480, width: '100%', borderRadius: 3, p: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                mb: 1.5,
                            }}
                        >
                            <LockOutlined />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Полипак // Чек-листы
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Вход в производственную систему
                        </Typography>
                    </Box>

                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMsg}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Логин"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />

                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                size="small"
                                label="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Login />}
                                disabled={isSubmitting}
                                sx={{ mt: 1, py: 1.2, fontWeight: 700 }}
                            >
                                {isSubmitting ? 'Проверка...' : 'Войти'}
                            </Button>
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                            Быстрый выбор роли
                        </Typography>
                    </Divider>

                    <Stack spacing={1}>
                        <Chip
                            icon={<PrecisionManufacturing fontSize="small" />}
                            label="Оператор (operator_ivanov)"
                            color="primary"
                            clickable
                            onClick={() => handleSelectPreset('operator_ivanov')}
                            variant={username === 'operator_ivanov' ? 'filled' : 'outlined'}
                        />

                        <Chip
                            icon={<Security fontSize="small" />}
                            label="Мастер цеха (master_petrov)"
                            color="secondary"
                            clickable
                            onClick={() => handleSelectPreset('master_petrov')}
                            variant={username === 'master_petrov' ? 'filled' : 'outlined'}
                        />

                        <Chip
                            icon={<Security fontSize="small" />}
                            label="Главный механик / Админ (admin_mechanic)"
                            color="error"
                            clickable
                            onClick={() => handleSelectPreset('admin_mechanic')}
                            variant={username === 'admin_mechanic' ? 'filled' : 'outlined'}
                        />

                        <Chip
                            icon={<FactCheck fontSize="small" />}
                            label="Аудитор ОТК (auditor_smirnov)"
                            clickable
                            onClick={() => handleSelectPreset('auditor_smirnov')}
                            variant={username === 'auditor_smirnov' ? 'filled' : 'outlined'}
                        />
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};