import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Stepper,
    Step,
    StepLabel,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Divider,
    Stack,
    Alert,
    FormHelperText,
    SelectChangeEvent
} from '@mui/material';
import {
    Save,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ErrorOutlined
} from '@mui/icons-material';
import { ITemplate, ShiftNumber } from '@domain/models/checklist';
import { FieldRegistry } from '../field-strategies/FieldRegistry';
import { ChecklistItemWrapper } from './ChecklistItemWrapper';
import { LocalAttachment } from '../media/AttachmentManager';
import { validateChecklistForm, FieldValidationError } from '@application/validation/dynamicSchemaBuilder';
import { transformDrfErrors } from '@infrastructure/api/drfErrorTransformer';
import { useDI } from '../../di/DIContext';

interface Props {
    template: ITemplate;
    onFinished: (resultId: number) => void;
    onBackToTemplates?: () => void;
}

export const ChecklistRunner: React.FC<Props> = ({
                                                     template,
                                                     onFinished,
                                                     onBackToTemplates,
                                                 }) => {
    const { submitChecklistUseCase, sessionService } = useDI();
    const queryClient = useQueryClient();

    const [shiftNumber, setShiftNumber] = useState<ShiftNumber>('DAY');
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, { value: string; comment?: string }>>({});
    const [attachments, setAttachments] = useState<Record<number, LocalAttachment[]>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<number, FieldValidationError>>({});
    const [groupErrorCounts, setGroupErrorCounts] = useState<Record<number, number>>({});
    const [serverErrors, setServerErrors] = useState<string[]>([]);

    const sortedTemplateGroups = useMemo(() => {
        return (template.groups || [])
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((g) => ({
                ...g,
                fields: (g.fields || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
            }));
    }, [template]);

    const pages = useMemo(() => {
        const resultPages: (typeof sortedTemplateGroups)[] = [];
        let currentGroupList: (typeof sortedTemplateGroups[0])[] = [];

        sortedTemplateGroups.forEach((group) => {
            currentGroupList.push(group);
            if (group.page_break) {
                resultPages.push(currentGroupList);
                currentGroupList = [];
            }
        });

        if (currentGroupList.length > 0) {
            resultPages.push(currentGroupList);
        }
        return resultPages.length > 0 ? resultPages : [[]];
    }, [sortedTemplateGroups]);

    const activeGroups = pages[currentPage] || [];
    const isLastPage = currentPage === pages.length - 1;

    const buildPayloadGroups = useCallback(() => {
        return sortedTemplateGroups.map((group) => ({
            group_id: group.id,
            answers: group.fields.map((field) => ({
                field_id: field.id,
                value: answers[field.id]?.value || field.default_value || '',
                comment: answers[field.id]?.comment || null,
            })),
        }));
    }, [sortedTemplateGroups, answers]);

    const buildPendingFiles = useCallback(() => {
        const pending: { fieldId: number; file: File }[] = [];
        Object.entries(attachments).forEach(([fieldIdStr, attList]) => {
            const fieldId = Number(fieldIdStr);
            attList.forEach((att) => {
                if (att.file) {
                    pending.push({ fieldId, file: att.file });
                }
            });
        });
        return pending;
    }, [attachments]);

    const runValidation = useCallback((isDraft: boolean): boolean => {
        const res = validateChecklistForm(
            { ...template, groups: sortedTemplateGroups },
            { shiftNumber, answers, attachments },
            isDraft
        );

        setErrors(res.fieldErrors);
        setGroupErrorCounts(res.groupErrorCounts);

        if (!res.isValid && res.firstErrorFieldId !== null && !isDraft) {
            setTimeout(() => {
                const elem = document.getElementById(`field-wrapper-${res.firstErrorFieldId}`);
                if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        return res.isValid;
    }, [template, sortedTemplateGroups, shiftNumber, answers, attachments]);

    useEffect(() => {
        if (hasAttemptedSubmit) {
            runValidation(false);
        }
    }, [answers, attachments, hasAttemptedSubmit, runValidation]);

    const handleFieldChange = (fieldId: number, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], value },
        }));
    };

    const handleCommentChange = (fieldId: number, comment: string) => {
        setAnswers((prev) => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], comment },
        }));
    };

    const handleAddAttachment = (fieldId: number, att: LocalAttachment) => {
        setAttachments((prev) => ({
            ...prev,
            [fieldId]: [...(prev[fieldId] || []), att],
        }));
    };

    const handleRemoveAttachment = (fieldId: number, attachmentId: string) => {
        setAttachments((prev) => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).filter((a) => a.id !== attachmentId),
        }));
    };

    const handleSubmit = async (isDraft: boolean) => {
        setServerErrors([]);

        if (!isDraft) {
            setHasAttemptedSubmit(true);
            const isValid = runValidation(false);
            if (!isValid) return;
        }

        try {
            setIsSubmitting(true);
            const groupsPayload = buildPayloadGroups();
            const pendingFiles = buildPendingFiles();

            const res = await submitChecklistUseCase.execute({
                templateId: template.id,
                equipmentUid: template.equipment_uid,
                checklistType: template.checklist_type,
                shiftNumber,
                groups: groupsPayload,
                isDraft,
                autoSign: !isDraft,
                pendingFiles,
            });

            await queryClient.invalidateQueries({ queryKey: ['checklist-results'] });
            onFinished(res.resultId);
        } catch (err: any) {
            if (err.errors) {
                const transformed = transformDrfErrors(err.errors);
                if (transformed.nonFieldErrors.length > 0) {
                    setServerErrors(transformed.nonFieldErrors);
                } else {
                    setServerErrors(['Ошибка валидации полей формы бэкендом Django']);
                }
            } else {
                setServerErrors([err.message || 'Ошибка отправки формы на сервер']);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card elevation={2} sx={{ maxWidth: 880, mx: 'auto', borderRadius: 3, p: 2 }}>
            <CardContent>
                {onBackToTemplates && (
                    <Button
                        size="small"
                        variant="text"
                        startIcon={<ChevronLeft />}
                        onClick={onBackToTemplates}
                        sx={{ mb: 1.5 }}
                    >
                        К выбору шаблонов
                    </Button>
                )}

                {serverErrors.length > 0 && (
                    <Alert severity="error" icon={<ErrorOutlined />} sx={{ mb: 2 }}>
                        {serverErrors.map((msg, i) => (
                            <Typography key={i} variant="body2">{msg}</Typography>
                        ))}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                            <Chip
                                label={template.checklist_type_display || template.checklist_type}
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Stack>

                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Оборудование: <b>{template.equipment_uid}</b> | Шаблон ID: <b>#{template.id}</b>
                        </Typography>
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="shift-select-label">Смена</InputLabel>
                        <Select
                            labelId="shift-select-label"
                            value={shiftNumber}
                            label="Смена"
                            onChange={(e: SelectChangeEvent<ShiftNumber>) => {
                                setShiftNumber(e.target.value as ShiftNumber);
                            }}
                        >
                            <MenuItem value="DAY">Дневная (DAY)</MenuItem>
                            <MenuItem value="NIGHT">Ночная (NIGHT)</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {pages.length > 1 && (
                    <Box sx={{ my: 3 }}>
                        <Stepper activeStep={currentPage}>
                            {pages.map((_, idx) => (
                                <Step key={idx}>
                                    <StepLabel>Раздел {idx + 1}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {activeGroups.map((group) => {
                        const errorCount = groupErrorCounts[group.id] || 0;

                        return (
                            <Paper key={group.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                                        {group.name}
                                    </Typography>

                                    {errorCount > 0 && (
                                        <Chip
                                            label={`Ошибок: ${errorCount}`}
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {group.fields.map((field) => {
                                        const strategy = FieldRegistry.get(field.field_type);
                                        const currentVal = answers[field.id]?.value || '';
                                        const meta = (field.metadata as Record<string, any>) || {};
                                        const violationValues: string[] = meta.violation_values || ['НЕТ', 'Критически низкий'];
                                        const isViolation = violationValues.includes(currentVal) || currentVal.toLowerCase().includes('перегрев');
                                        const fieldErr = errors[field.id];

                                        return (
                                            <Box id={`field-wrapper-${field.id}`} key={field.id}>
                                                <ChecklistItemWrapper
                                                    field={field}
                                                    isViolation={isViolation}
                                                    comment={answers[field.id]?.comment}
                                                    onChangeComment={(comm) => handleCommentChange(field.id, comm)}
                                                    attachments={attachments[field.id] || []}
                                                    onAddAttachment={(att) => handleAddAttachment(field.id, att)}
                                                    onRemoveAttachment={(attId) => handleRemoveAttachment(field.id, attId)}
                                                    controlNode={
                                                        <Box id={`input-${field.id}`}>
                                                            {strategy.render({
                                                                field,
                                                                value: currentVal,
                                                                comment: answers[field.id]?.comment,
                                                                onChangeValue: (val) => handleFieldChange(field.id, val),
                                                                onChangeComment: (comm) => handleCommentChange(field.id, comm),
                                                                error: fieldErr?.value,
                                                            })}
                                                            {fieldErr?.comment && (
                                                                <FormHelperText error sx={{ mt: 0.5, fontWeight: 600 }}>
                                                                    {fieldErr.comment}
                                                                </FormHelperText>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ChevronLeft />}
                        disabled={currentPage === 0 || isSubmitting}
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    >
                        Назад
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="text"
                            startIcon={<Save />}
                            disabled={isSubmitting}
                            onClick={() => handleSubmit(true)}
                        >
                            Сохранить черновик
                        </Button>

                        {!isLastPage ? (
                            <Button
                                variant="contained"
                                endIcon={<ChevronRight />}
                                onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                            >
                                Далее
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                disabled={isSubmitting}
                                onClick={() => handleSubmit(false)}
                            >
                                Отправить анкету ({sessionService.getCurrentRole()})
                            </Button>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};