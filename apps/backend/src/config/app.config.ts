import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'Coze API',
  port: parseInt(process.env.PORT ?? '3000', 10),
  debug: process.env.DEBUG === 'true',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'],
  knowledgeServiceUrl: process.env.KNOWLEDGE_SERVICE_URL ?? 'http://localhost:8001',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  defaultLlmModel: process.env.DEFAULT_LLM_MODEL ?? 'gpt-4o',
  temporalAddress: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  temporalNamespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
}))
