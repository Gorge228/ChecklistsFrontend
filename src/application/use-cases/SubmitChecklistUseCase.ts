import {
    IResultRepository,
    IAttachmentRepository,
    IUserSessionService
} from '@domain/ports/repositories';
import {
    IChecklistResultCreate,
    ShiftNumber,
    IAnswerGroup,
    ChecklistType
} from '@domain/models/checklist';

export interface PendingFileItem {
    fieldId: number;
    file: File;
}

export interface SubmitChecklistCommand {
    templateId: number;
    equipmentUid: string;
    checklistType: ChecklistType;
    shiftNumber: ShiftNumber;
    groups: IAnswerGroup[];
    generalComment?: string;
    isDraft: boolean;
    autoSign?: boolean;
    pendingFiles?: PendingFileItem[];
}

export class SubmitChecklistUseCase {
    constructor(
        private readonly resultRepo: IResultRepository,
        private readonly attachmentRepo: IAttachmentRepository,
        private readonly sessionService: IUserSessionService
    ) {}

    async execute(command: SubmitChecklistCommand): Promise<{ resultId: number; isSigned: boolean; uploadedFilesCount: number }> {
        const userUid = this.sessionService.getCurrentUserUid();

        const payload: IChecklistResultCreate = {
            template: command.templateId,
            equipment_uid: command.equipmentUid,
            checklist_type: command.checklistType,
            user_uid: userUid,
            shift_number: command.shiftNumber,
            shift_time: new Date().toISOString(),
            is_draft: command.isDraft,
            general_comment: command.generalComment || '',
            groups: command.groups,
        };

        // 1. Создание записи в DRF
        const created = await this.resultRepo.create(payload);
        const resultId = Number(created.id);

        // 2. Загрузка вложений
        let uploadedFilesCount = 0;
        if (command.pendingFiles && command.pendingFiles.length > 0) {
            for (const item of command.pendingFiles) {
                try {
                    await this.attachmentRepo.upload(resultId, item.file);
                    uploadedFilesCount += 1;
                } catch (error) {
                    console.error(`Ошибка отправки файла для вопроса ${item.fieldId}:`, error);
                }
            }
        }

        // 3. Подпись автора (НИКОГДА не закрывает анкету, is_closing СТРОГО false)
        let isSigned = false;
        if (!command.isDraft && command.autoSign) {
            try {
                await this.resultRepo.sign(resultId, {
                    role: 'AUTHOR',
                    user_uid: userUid,
                    is_closing: false,
                    comment: 'Первичный осмотр завершен, смена сдана',
                });
                isSigned = true;
            } catch (err) {
                console.warn('Автоподпись автора пропущена или уже зафиксирована сервером', err);
            }
        }

        return { resultId, isSigned, uploadedFilesCount };
    }
}