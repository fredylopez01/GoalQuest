# 🎯 GoalQuest

Plataforma gamificada de gestión de metas personales con arquitectura de microservicios.

## Arquitectura

```
Cliente → API Gateway (8080) → Microservicios
```

| Servicio             | Tech                 | BD         | Puerto | ORM           |
| -------------------- | -------------------- | ---------- | ------ | ------------- |
| API Gateway          | Spring Cloud Gateway | —          | 8080   | —             |
| Identity Service     | Java Spring Boot     | MySQL      | 8081   | Hibernate/JPA |
| Task Service         | NestJS               | PostgreSQL | 3001   | Prisma        |
| Gamification Service | FastAPI              | MongoDB    | 8000   | Beanie/Motor  |
| Challenge Service    | NestJS               | PostgreSQL | 3002   | Prisma        |

## Estructura

```
goalquest/
├── docker-compose.yml
├── .env
├── api-gateway/          # Java - Spring Cloud Gateway
├── identity-service/     # Java - Spring Boot
├── task-service/         # NestJS
├── gamification-service/ # Python - FastAPI
├── challenge-service/    # NestJS
└── frontend/
```

## Endpoints

### Identity Service (:8081)

| Método | Endpoint             | Descripción             |
| ------ | -------------------- | ----------------------- |
| POST   | /auth/register       | Registro                |
| POST   | /auth/login          | Login → JWT             |
| POST   | /auth/logout         | Logout                  |
| POST   | /auth/validate-token | Validar token (interno) |
| GET    | /users/profile       | Mi perfil               |
| PATCH  | /users/profile       | Editar perfil           |
| GET    | /users/{id}          | Usuario por ID          |
| GET    | /users               | Buscar usuarios         |
| GET    | /audit/logs          | Logs (admin)            |
| POST   | /audit/logs          | Registrar log (interno) |

### Task Service (:3001)

| Método | Endpoint             | Descripción              |
| ------ | -------------------- | ------------------------ |
| POST   | /goals               | Crear meta               |
| GET    | /goals               | Listar metas             |
| GET    | /goals/:id           | Detalle meta             |
| PATCH  | /goals/:id           | Editar meta              |
| DELETE | /goals/:id           | Eliminar meta            |
| PATCH  | /goals/:id/reopen    | Reabrir meta             |
| POST   | /tasks               | Crear tarea              |
| GET    | /tasks               | Listar tareas            |
| GET    | /tasks/:id           | Detalle tarea            |
| PATCH  | /tasks/:id           | Editar tarea             |
| DELETE | /tasks/:id           | Eliminar tarea           |
| PATCH  | /tasks/:id/complete  | Completar tarea          |
| GET    | /tasks/daily-summary | Resumen diario           |
| GET    | /tasks/completions   | Historial completaciones |

### Gamification Service (:8000)

| Método | Endpoint                               | Descripción                |
| ------ | -------------------------------------- | -------------------------- |
| POST   | /gamification/profile                  | Crear perfil (interno)     |
| GET    | /gamification/profile/{user_id}        | Perfil de progreso         |
| POST   | /gamification/task-completed           | Procesar tarea (interno)   |
| POST   | /gamification/challenge-completed      | Procesar desafío (interno) |
| GET    | /gamification/achievements/catalog     | Catálogo logros            |
| POST   | /gamification/achievements             | Crear logro (admin)        |
| GET    | /gamification/achievements/{user_id}   | Logros del usuario         |
| GET    | /gamification/xp-history/{user_id}     | Historial XP               |
| GET    | /gamification/streak/{user_id}         | Info racha                 |
| POST   | /gamification/streak/check-reset       | Reset rachas (cron)        |
| GET    | /gamification/leaderboard              | Ranking                    |
| POST   | /gamification/reports/weekly           | Generar reporte (cron)     |
| GET    | /gamification/reports/weekly/{user_id} | Reportes semanales         |
| GET    | /gamification/trends/{user_id}         | Tendencias                 |

### Challenge Service (:3002)

| Método | Endpoint                    | Descripción                   |
| ------ | --------------------------- | ----------------------------- |
| POST   | /challenges                 | Crear desafío                 |
| GET    | /challenges                 | Listar desafíos               |
| GET    | /challenges/:id             | Detalle desafío               |
| PATCH  | /challenges/:id/accept      | Aceptar                       |
| PATCH  | /challenges/:id/reject      | Rechazar                      |
| PATCH  | /challenges/:id/cancel      | Cancelar                      |
| POST   | /challenges/update-progress | Actualizar progreso (interno) |
| POST   | /challenges/check-expired   | Verificar expirados (cron)    |

## Rutas del Gateway

| Ruta                   | Destino      | Auth     |
| ---------------------- | ------------ | -------- |
| /api/auth/\*\*         | Identity     | ❌       |
| /api/users/\*\*        | Identity     | ✅       |
| /api/audit/\*\*        | Identity     | ✅ Admin |
| /api/goals/\*\*        | Task Service | ✅       |
| /api/tasks/\*\*        | Task Service | ✅       |
| /api/challenges/\*\*   | Challenge    | ✅       |
| /api/gamification/\*\* | Gamification | ✅       |

## Convenciones

- **IDs de usuario:** UUID (string)
- **Fechas:** ISO 8601
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`)
- **Branches:** `feature/<servicio>/<descripcion>`

## Equipo

| Dev   | Servicios          | Tech             |
| ----- | ------------------ | ---------------- |
| Dev A | Gateway + Identity | Java/Spring Boot |
| Dev B | Task + Challenge   | NestJS           |
| Dev C | Gamification       | FastAPI          |
