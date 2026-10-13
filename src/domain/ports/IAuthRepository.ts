import { ILoginRequest, ILoginResponse, IRefreshResponse, IUser } from '../models/auth';

export interface IAuthRepository {
    login(credentials: ILoginRequest): Promise<ILoginResponse>;
    refreshToken(refreshToken: string): Promise<IRefreshResponse>;
    getMe(): Promise<IUser>;
    logout(): Promise<void>;
}
