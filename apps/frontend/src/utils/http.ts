import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000
})

http.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  response => response.data,
  error => {
    return Promise.reject(error)
  }
)

export default http
