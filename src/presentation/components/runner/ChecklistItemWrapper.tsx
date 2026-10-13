import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Collapse,
    Button,
    Chip,
    Stack
} from '@mui/material';
import {
    ChatBubbleOutlined,
    Warning
} from '@mui/icons-material';
import { ITemplateField } from '@domain/models/checklist';
import { AttachmentManager, LocalAttachment } from '../media/AttachmentManager';

interface Props {
    field: ITemplateField;
    controlNode: React.ReactNode;
    comment?: string;
    onChangeComment: (val: string) => void;
    isViolation: boolean;
    attachments?: LocalAttachment[];
    onAddAttachment?: (att: LocalAttachment) => void;
    onRemoveAttachment?: (id: string) => void;
    disabled?: boolean;
}

export const ChecklistItemWrapper: React.FC<Props> = ({
                                                          field,
                                                          controlNode,
                                                          comment,
                                                          onChangeComment,
                                                          isViolation,
                                                          attachments = [],
                                                          onAddAttachment,
                                                          onRemoveAttachment,
                                                          disabled = false,
                                                      }) => {
    const [showCommentInput, setShowCommentInput] = useState<boolean>(Boolean(comment));

    return (
        <Box
            sx={{
                p: 2,
                bgcolor: isViolation ? '#fff5f5' : '#ffffff',
                border: '1px solid',
                borderColor: isViolation ? 'error.main' : '#e2e8f0',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                boxShadow: isViolation ? '0 0 0 2px rgba(211, 47, 47, 0.2)' : 'none'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: isViolation ? 'error.dark' : 'text.primary' }}>
                        {field.name} {field.is_required && <span style={{ color: '#d32f2f' }}>*</span>}
                    </Typography>
                </Box>

                {isViolation && (
                    <Chip
                        icon={<Warning />}
                        label="ОБНАРУЖЕН ДЕФЕКТ"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                )}
            </Box>

            <Box sx={{ mb: 1.5 }}>
                {controlNode}
            </Box>

            <Box sx={{ pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                        size="small"
                        variant="text"
                        startIcon={<ChatBubbleOutlined />}
                        onClick={() => setShowCommentInput((prev) => !prev)}
                        color={comment ? 'primary' : 'inherit'}
                        disabled={disabled}
                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                    >
                        {comment ? 'Изменить замечание' : 'Добавить замечание'}
                    </Button>

                    {onAddAttachment && onRemoveAttachment && (
                        <AttachmentManager
                            attachments={attachments}
                            onAddAttachment={onAddAttachment}
                            onRemoveAttachment={onRemoveAttachment}
                            disabled={disabled}
                        />
                    )}
                </Stack>
            </Box>

            <Collapse in={showCommentInput}>
                <Box sx={{ mt: 1.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Опишите дефект или примечание..."
                        value={comment || ''}
                        onChange={(e) => onChangeComment(e.target.value)}
                        disabled={disabled}
                        multiline
                        rows={2}
                    />
                </Box>
            </Collapse>
        </Box>
    );
};