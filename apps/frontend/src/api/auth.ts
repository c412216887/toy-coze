import request from './request'

export interface PublicKeyResponse {
  publicKey: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: string
  username: string
  email: string
}

export async function getPublicKey(): Promise<PublicKeyResponse> {
  const res = await request.get<PublicKeyResponse>('/api/v1/auth/public-key')
  return res.data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await request.post<LoginResponse>('/api/v1/auth/login', payload)
  return res.data
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await request.post<RegisterResponse>('/api/v1/auth/register', payload)
  return res.data
}
