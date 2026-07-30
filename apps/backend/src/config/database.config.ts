import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? 'postgresql://coze:coze123@localhost:5432/coze_db',
}))
