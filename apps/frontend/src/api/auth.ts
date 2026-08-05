import request from './request'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await request.post<LoginResponse>('/api/v1/auth/login', payload)
  return res.data
}
