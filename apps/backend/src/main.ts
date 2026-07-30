import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Coze API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
