export type UserRole = 'OPERATOR' | 'FOREMAN' | 'ADMIN' | 'VIEWER';

export interface IUser {
    id: number;
    user_uid: string;
    username: string;
    full_name: string;
    role: UserRole;
}

export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ILoginResponse {
    access: string;
    refresh: string;
    user: IUser;
}

export interface IRefreshResponse {
    access: string;
}

// Матрица прав доступа по ТЗ
export const PERMISSIONS = {
    CAN_MANAGE_TEMPLATES: ['ADMIN'] as UserRole[],
    CAN_VIEW_TEMPLATES: ['OPERATOR', 'FOREMAN', 'ADMIN', 'VIEWER'] as UserRole[],
    CAN_FILL_CHECKLIST: ['OPERATOR', 'FOREMAN', 'ADMIN'] as UserRole[],
    CAN_SIGN_AUTHOR: ['OPERATOR', 'FOREMAN', 'ADMIN'] as UserRole[],
    CAN_SIGN_READER: ['OPERATOR', 'FOREMAN', 'ADMIN'] as UserRole[],
    CAN_SIGN_APPROVER: ['FOREMAN', 'ADMIN'] as UserRole[],
    CAN_DELETE_RECORDS: ['ADMIN'] as UserRole[],
};

export const hasPermission = (role: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
};