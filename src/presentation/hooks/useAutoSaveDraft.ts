import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions {
    intervalMs?: number; // Интервал сохранения в миллисекундах (по умолчанию 30 сек)
    enabled?: boolean;
    onSave: () => Promise<void>;
    isDirty: boolean; // Есть ли несохраненные изменения
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useAutoSaveDraft = ({
                                     intervalMs = 30000,
                                     enabled = true,
                                     onSave,
                                     isDirty,
                                 }: AutoSaveOptions) => {
    const [status, setStatus] = useState<AutoSaveStatus>('idle');
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    const isSavingRef = useRef(false);

    // Функция сохранения черновика
    const triggerSave = useCallback(async () => {
        if (isSavingRef.current || !isDirtyRef.current) return;

        try {
            isSavingRef.current = true;
            setStatus('saving');
            await onSaveRef.current();

            const timeStr = new Date().toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
            });
            setLastSavedTime(timeStr);
            setStatus('saved');
        } catch {
            setStatus('error');
        } finally {
            isSavingRef.current = false;
        }
    }, []);

    // 1. Таймер периодического автосохранения
    useEffect(() => {
        if (!enabled) return;

        const intervalId = setInterval(() => {
            if (isDirtyRef.current && !isSavingRef.current) {
                triggerSave();
            }
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [enabled, intervalMs, triggerSave]);

    // 2. Защита от закрытия страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    return {
        status,
        lastSavedTime,
        triggerSave,
    };
};