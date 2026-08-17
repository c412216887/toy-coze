# Nest

## 核心特性

1. 原生支持typescript
2. 模块化架构(modular Architecture)
3. 依赖注入(Dependency Injection)
4. 灵活的底层HTTP引擎
5. 开箱即用的丰富生态

### 依赖注入

在NestJS中实现依赖注入，NestJS自身实现了一个IoC容器，使用`@Injectable()`将class类声明为可注入容器，IoC容器，就会自动创建实例并管理生命周期

### 底层HTTP引擎

+-------------------------------------------------------+
| NestJS (架构层：模块化、依赖注入、装饰器、规范约束) |
+-------------------------------------------------------+
| Express / Fastify (路由与 HTTP 中间件层：请求解析、路由匹配) |
+-------------------------------------------------------+
| Node.js http / net 模块 (底层传输层：TCP/IP、原始Socket处理) |
+-------------------------------------------------------+

### Nest层级架构

客户端发送请求
│
▼
[ 1. 中间件 Middleware ] <-- 拦截原始 req/res，如 cors、body-parser、日志
│
▼
[ 2. 守卫 Guards ] <-- 身份验证与权限判定（如 JWT 是否有效、是否是管理员）
│
▼
[ 3. 拦截器 Interceptors (前置)] <-- 转换请求数据/记录耗时开始
│
▼
[ 4. 管道 Pipes ] <-- 参数类型转换与 DTO 数据校验（如 string 转 number）
│
▼
[ 5. Controller & Provider ] <-- 执行真正的业务逻辑！
│
▼
[ 6. 拦截器 Interceptors (后置)] <-- 统一格式化返回给客户端的数据
│
▼
返回响应给客户端

## 关键模块

1. Controller
2. provider
3. module

- dynamic module，使用forRoot, forFeature, register, forRootAsync, forFeatureAsync, registerAsync.
  forRoot和forFeature配套使用，forRoot传递全局配置项，生成动态module，forFeature，继承并修改forRoot配置。

  | 特性          | forRoot                                      | forRootAsync                                                      |
  | ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
  | 执行方式      | 同步（Synchronous）                          | 异步/支持延迟解析（Asynchronous）                                 |
  | 传入参数      | 直接传入配置对象（Static Object）            | "传入工厂函数或类（useFactory、 useClass 、 useExisting）"        |
  | 依赖注入 (DI) | 无法注入 NestJS 的其他 Service               | 支持通过 inject 注入其他 Service（如 ConfigService）              |
  | 典型适用场景  | 配置参数固定，或直接写死/从 process.env 读取 | 配置需依赖其他服务提供，或需要异步获取（如从远端 API/密钥库加载） |

4. middleware
5. exception filter

- 处理全局的异常

6. guard

- 通过jwt获取完整的用户信息,[JWT](#jwt用户验证)

7. interceptor

- 处理请求和响应

8. pipes

- 验证请求参数

9. custom decorator

### JWT用户验证

1. 安装`@nestjs/jwt`
2. 配置secret

```typescript
import { JwtModule } from "@nestjs/jwt"
@module({
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get('app.jwtSecret'),
      signOptions: { expiresIn: config.get('app.jwtExpiresIn') },
    }),
  }),
})
export class AuthModule {}
```

3. 使用JwtService生成token

```typescript
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  signIn() {
    const payload = { sub: user.id, username: username };
    const accessToken = this.jwtService.sign(payload);
  }
}
```

4. 使用jwtGuard

```typescript
import { AuthGuard } from "@nestjs/passport";
@useGuard(AuthGuard("jwt"))
export class WorkflowsController {}
```

### swagger配置

1. 安装依赖 `@nestjs/swagger`
2. 在`main.ts`中初始化

```typescript
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 初始化Doc配置
  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("NestJS 项目服务接口描述")
    .setVersion("1.0")
    .addBearerAuth() // 如果需要 JWT 鉴权，添加此配置
    .build();

  // 创建文档对象工厂函数
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // 挂在swagger UI页面
  SwaggerModule.setup("doc", app, documentFactory);
}
bootstrap();
```
