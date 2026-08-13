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

export interface UserProfile {
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

export async function fetchMe(): Promise<UserProfile> {
  const res = await request.get<UserProfile>('/api/v1/auth/me')
  return res.data
}

export async function updateProfile(username: string): Promise<UserProfile> {
  const res = await request.put<UserProfile>('/api/v1/auth/me', { username })
  return res.data
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await request.put('/api/v1/auth/password', { oldPassword, newPassword })
}
