import axios from 'axios'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>('/api/v1/auth/login', payload)
  return res.data
}
