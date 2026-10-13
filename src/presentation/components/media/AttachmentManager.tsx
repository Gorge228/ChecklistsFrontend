import React, { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Stack,
    Card,
    CardMedia
} from '@mui/material';
import {
    PhotoCamera,
    Close,
    Download,
    Delete,
    AttachFile
} from '@mui/icons-material';

export interface LocalAttachment {
    id: string;
    name: string;
    url: string;
    file: File;
    uploadedAt: string;
}

interface Props {
    attachments: LocalAttachment[];
    onAddAttachment: (attachment: LocalAttachment) => void;
    onRemoveAttachment: (id: string) => void;
    disabled?: boolean;
}

export const AttachmentManager: React.FC<Props> = ({
                                                       attachments,
                                                       onAddAttachment,
                                                       onRemoveAttachment,
                                                       disabled = false,
                                                   }) => {
    const [lightboxImage, setLightboxImage] = useState<LocalAttachment | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const newAttachment: LocalAttachment = {
                id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                name: file.name,
                url: reader.result as string,
                file: file,
                uploadedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            };
            onAddAttachment(newAttachment);
        };

        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDownload = (item: LocalAttachment) => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                    component="label"
                    size="small"
                    variant="outlined"
                    color={attachments.length > 0 ? 'success' : 'inherit'}
                    startIcon={<PhotoCamera />}
                    disabled={disabled}
                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                >
                    {attachments.length > 0 ? `Фото дефекта (${attachments.length})` : 'Прикрепить фото'}
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                    />
                </Button>
            </Stack>

            {attachments.length > 0 && (
                <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                    {attachments.map((item) => (
                        <Card
                            key={item.id}
                            variant="outlined"
                            sx={{
                                width: 90,
                                position: 'relative',
                                borderRadius: 1.5,
                                overflow: 'hidden',
                            }}
                        >
                            <CardMedia
                                component="img"
                                height="65"
                                image={item.url}
                                alt={item.name}
                                sx={{ objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => setLightboxImage(item)}
                            />

                            <Box sx={{ px: 0.5, py: 0.2, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                    {item.uploadedAt}
                                </Typography>
                            </Box>

                            {!disabled && (
                                <IconButton
                                    size="small"
                                    onClick={() => onRemoveAttachment(item.id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        color: '#ffffff',
                                        p: 0.3,
                                        '&:hover': { bgcolor: 'error.main' },
                                    }}
                                >
                                    <Close sx={{ fontSize: 12 }} />
                                </IconButton>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}

            <Dialog
                open={Boolean(lightboxImage)}
                onClose={() => setLightboxImage(null)}
                maxWidth="md"
                fullWidth
            >
                {lightboxImage && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <AttachFile fontSize="small" color="primary" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {lightboxImage.name}
                                </Typography>
                            </Stack>
                            <IconButton onClick={() => setLightboxImage(null)}>
                                <Close />
                            </IconButton>
                        </Box>

                        <DialogContent sx={{ p: 0, bgcolor: '#0f172a', display: 'flex', justifyContent: 'center' }}>
                            <Box
                                component="img"
                                src={lightboxImage.url}
                                alt={lightboxImage.name}
                                sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                            />
                        </DialogContent>

                        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                disabled={disabled}
                                onClick={() => {
                                    onRemoveAttachment(lightboxImage.id);
                                    setLightboxImage(null);
                                }}
                            >
                                Удалить фото
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownload(lightboxImage)}
                            >
                                Скачать оригинал
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};