export class DomainError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ValidationError extends DomainError {
    constructor(public readonly errors: Record<string, string[] | string>) {
        super('Ошибка валидации данных анкеты', 400);
        this.name = 'ValidationError';
    }
}

export class LockedChecklistError extends DomainError {
    constructor(message: string = 'Анкета заблокирована от изменений, так как уже утверждена мастером') {
        super(message, 403);
        this.name = 'LockedChecklistError';
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string = 'Запрашиваемый ресурс не найден') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}