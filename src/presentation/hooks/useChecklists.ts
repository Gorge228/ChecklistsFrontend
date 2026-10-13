import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDI } from '../di/DIContext';
import { IChecklistSign, ITemplate } from '@domain/models/checklist';
import { IChecklistResultItem } from '@domain/ports/repositories';

// 1. Получение списка шаблонов
export const useTemplatesQuery = () => {
    const { templateRepo } = useDI();
    return useQuery<ITemplate[]>({
        queryKey: ['checklist-templates'],
        queryFn: () => templateRepo.getList(),
    });
};

// 2. Создание нового шаблона
export const useCreateTemplateMutation = () => {
    const { templateRepo } = useDI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Partial<ITemplate>) => templateRepo.create(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            await queryClient.refetchQueries({ queryKey: ['checklist-templates'] });
        },
    });
};

// 3. Обновление шаблона
export const useUpdateTemplateMutation = () => {
    const { templateRepo } = useDI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<ITemplate> }) =>
            templateRepo.update(id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            await queryClient.refetchQueries({ queryKey: ['checklist-templates'] });
        },
    });
};

// 4. Удаление шаблона
export const useDeleteTemplateMutation = () => {
    const { templateRepo } = useDI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => templateRepo.delete(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            await queryClient.refetchQueries({ queryKey: ['checklist-templates'] });
            alert('Шаблон успешно удален');
        },
        onError: (err: any) => {
            const msg = err.message || 'Ошибка сервера при удалении';
            alert(`Не удалось удалить шаблон: ${msg}\n\n(Если к шаблону уже привязаны анкеты в БД, Django блокирует его удаление)`);
        },
    });
};

// 5. Клонирование шаблона
export const useCloneTemplateMutation = () => {
    const { templateRepo } = useDI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, targetEquipmentUid }: { id: number; targetEquipmentUid: string }) =>
            templateRepo.clone(id, targetEquipmentUid),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            await queryClient.refetchQueries({ queryKey: ['checklist-templates'] });
        },
    });
};

// 6. История шаблона
export const useTemplateHistoryQuery = (templateId: number | null) => {
    const { templateRepo } = useDI();
    return useQuery<ITemplate[]>({
        queryKey: ['checklist-template-history', templateId],
        queryFn: () => (templateId ? templateRepo.getHistory(templateId) : Promise.resolve([])),
        enabled: Boolean(templateId),
    });
};

// 7. Журнал результатов анкет
export const useResultsQuery = () => {
    const { resultRepo } = useDI();
    return useQuery<IChecklistResultItem[]>({
        queryKey: ['checklist-results'],
        queryFn: () => resultRepo.getList(),
    });
};

// 8. История анкеты
export const useResultHistoryQuery = (resultId: number | null) => {
    const { resultRepo } = useDI();
    return useQuery<IChecklistResultItem[]>({
        queryKey: ['checklist-result-history', resultId],
        queryFn: () => (resultId ? resultRepo.getHistory(resultId) : Promise.resolve([])),
        enabled: Boolean(resultId),
    });
};

// 9. Подписание анкеты с принудительным обновлением таблицы
export const useSignResultMutation = () => {
    const { resultRepo } = useDI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ resultId, payload }: { resultId: number; payload: IChecklistSign }) =>
            resultRepo.sign(resultId, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['checklist-results'] });
            await queryClient.refetchQueries({ queryKey: ['checklist-results'] });
        },
    });
};