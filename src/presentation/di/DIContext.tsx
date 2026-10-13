import React, { createContext, useContext, useMemo } from 'react';
import { HttpClient } from '@infrastructure/api/HttpClient';
import {
    HttpTemplateRepository,
    HttpResultRepository,
    HttpAttachmentRepository,
    HttpAuthRepository,
    LocalUserSessionService
} from '@infrastructure/repositories/HttpRepositories';
import {
    MockTemplateRepository,
    MockResultRepository,
    MockAttachmentRepository,
    MockAuthRepository
} from '@infrastructure/repositories/MockRepositories';
import { SubmitChecklistUseCase } from '@application/use-cases/SubmitChecklistUseCase';
import {
    ITemplateRepository,
    IResultRepository,
    IAttachmentRepository,
    IUserSessionService
} from '@domain/ports/repositories';
import { IAuthRepository } from '@domain/ports/IAuthRepository';
import { APP_CONFIG } from '../../config/api.config';

export interface IDIContext {
    authRepo: IAuthRepository;
    templateRepo: ITemplateRepository;
    resultRepo: IResultRepository;
    attachmentRepo: IAttachmentRepository;
    sessionService: IUserSessionService;
    submitChecklistUseCase: SubmitChecklistUseCase;
}

const DIContext = createContext<IDIContext | null>(null);

export const DIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const services = useMemo<IDIContext>(() => {
        const http = new HttpClient();

        const authRepo: IAuthRepository = APP_CONFIG.USE_MOCKS
            ? new MockAuthRepository()
            : new HttpAuthRepository(http);

        const templateRepo: ITemplateRepository = APP_CONFIG.USE_MOCKS
            ? new MockTemplateRepository()
            : new HttpTemplateRepository(http);

        const resultRepo: IResultRepository = APP_CONFIG.USE_MOCKS
            ? new MockResultRepository()
            : new HttpResultRepository(http);

        const attachmentRepo: IAttachmentRepository = APP_CONFIG.USE_MOCKS
            ? new MockAttachmentRepository()
            : new HttpAttachmentRepository(http);

        const sessionService: IUserSessionService = new LocalUserSessionService();
        const submitChecklistUseCase = new SubmitChecklistUseCase(resultRepo, attachmentRepo, sessionService);

        return {
            authRepo,
            templateRepo,
            resultRepo,
            attachmentRepo,
            sessionService,
            submitChecklistUseCase,
        };
    }, []);

    return <DIContext.Provider value={services}>{children}</DIContext.Provider>;
};

export const useDI = (): IDIContext => {
    const ctx = useContext(DIContext);
    if (!ctx) {
        throw new Error('useDI must be used within DIProvider');
    }
    return ctx;
};