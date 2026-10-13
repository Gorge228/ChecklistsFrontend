import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Tabs,
    Tab,
    Box,
    Container,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Assignment,
    TableChart,
    Insights,
    Logout
} from '@mui/icons-material';
import { DIProvider, useDI } from './presentation/di/DIContext';
import { AuthProvider, useAuth } from './presentation/context/AuthContext';
import { LoginPage } from './presentation/components/auth/LoginPage';
import { RoleGuard } from './presentation/components/auth/RoleGuard';
import { TemplatesList } from './presentation/components/templates/TemplatesList';
import { TemplateBuilder } from './presentation/components/templates/TemplateBuilder';
import { ChecklistRunner } from './presentation/components/runner/ChecklistRunner';
import { ResultsTable } from './presentation/components/results/ResultsTable';
import { AnalyticsDashboard } from './presentation/components/analytics/AnalyticsDashboard';
import { UserSessionBar } from './presentation/components/session/UserSessionBar';
import { ITemplate } from './domain/models/checklist';

const MainLayout: React.FC = () => {
    const { isAuthenticated, logout, role } = useAuth();
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [activeTemplate, setActiveTemplate] = useState<ITemplate | null>(null);
    const [builderState, setBuilderState] = useState<{ isEditing: boolean; template: ITemplate | null } | null>(null);

    if (!isAuthenticated) {
        return <LoginPage onSuccessLogin={() => setCurrentTab(0)} />;
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            <AppBar position="static" elevation={1} sx={{ bgcolor: '#ffffff', color: '#1a202c' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mr: 3 }}>
                        Полипак // Чек-листы
                    </Typography>

                    <Tabs
                        value={currentTab}
                        onChange={(_, val) => {
                            setCurrentTab(val);
                            setBuilderState(null);
                        }}
                        indicatorColor="primary"
                        sx={{ flexGrow: 1 }}
                    >
                        {role !== 'VIEWER' && (
                            <Tab icon={<Assignment />} iconPosition="start" label="Шаблоны" />
                        )}
                        <Tab icon={<TableChart />} iconPosition="start" label="Журнал анкет" />
                        <Tab icon={<Insights />} iconPosition="start" label="Аналитика" />
                    </Tabs>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UserSessionBar />

                        <Tooltip title="Выйти из системы">
                            <IconButton size="small" color="inherit" onClick={() => logout()}>
                                <Logout fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
                {role !== 'VIEWER' && currentTab === 0 && (
                    builderState ? (
                        <RoleGuard allow={['ADMIN']} fallback={<Typography color="error" sx={{ p: 3 }}>Конструктор доступен только администраторам</Typography>}>
                            <TemplateBuilder
                                initialTemplate={builderState.template}
                                onSaved={() => setBuilderState(null)}
                                onCancel={() => setBuilderState(null)}
                            />
                        </RoleGuard>
                    ) : activeTemplate ? (
                        <ChecklistRunner
                            template={activeTemplate}
                            onBackToTemplates={() => setActiveTemplate(null)}
                            onFinished={() => {
                                setActiveTemplate(null);
                                setCurrentTab(1);
                            }}
                        />
                    ) : (
                        <TemplatesList
                            onSelectToRun={(tmpl) => setActiveTemplate(tmpl)}
                            onCreateTemplate={() => setBuilderState({ isEditing: false, template: null })}
                            onEditTemplate={(tmpl) => setBuilderState({ isEditing: true, template: tmpl })}
                        />
                    )
                )}

                {((role === 'VIEWER' && currentTab === 0) || (role !== 'VIEWER' && currentTab === 1)) && (
                    <ResultsTable />
                )}

                {((role === 'VIEWER' && currentTab === 1) || (role !== 'VIEWER' && currentTab === 2)) && (
                    <AnalyticsDashboard />
                )}
            </Container>
        </Box>
    );
};

const AuthBootstrap: React.FC = () => {
    const { authRepo } = useDI();
    return (
        <AuthProvider authRepo={authRepo}>
            <MainLayout />
        </AuthProvider>
    );
};

export default function App() {
    return (
        <DIProvider>
            <AuthBootstrap />
        </DIProvider>
    );
}