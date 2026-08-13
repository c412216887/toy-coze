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
4. middleware
5. exception filter

- 处理全局的异常

6. guard

- 通过jwt获取完整的用户信息

7. interceptor

- 处理请求和响应

8. pipes

- 验证请求参数

9. custom decorator
