import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  traceId?: string
}

const request: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('coze_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data
    if (code !== 200) {
      return Promise.reject(new BizError(code, message))
    }
    return { ...response, data: data as unknown } as AxiosResponse
  },
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response
    ) {
      const body = error.response.data as ApiResponse
      return Promise.reject(new BizError(body.code ?? error.response.status, body.message ?? '请求失败'))
    }
    return Promise.reject(error)
  },
)

export class BizError extends Error {
  public readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'BizError'
  }
}

export default request
