import { JSEncrypt } from 'jsencrypt'
import { getPublicKey } from '@/api/auth'

let cachedPublicKey: string | null = null

async function fetchPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey
  const { publicKey } = await getPublicKey()
  cachedPublicKey = publicKey
  return publicKey
}

export async function encryptPassword(plain: string): Promise<string> {
  const pem = await fetchPublicKey()
  const enc = new JSEncrypt()
  enc.setPublicKey(pem)
  const result = enc.encrypt(plain)
  if (!result) throw new Error('RSA 加密失败，请刷新页面重试')
  return result
}
