<div align="center">

# 📋 Task Service

**Gestión de metas, tareas y completaciones**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**Puerto:** `3001` · **Base de datos:** PostgreSQL · **ORM:** Prisma

</div>

---

## 📖 Descripción

El Task Service es el núcleo funcional de GoalQuest. Permite a los usuarios crear **metas** (objetivos a largo plazo) y asociarles **tareas** concretas. Cuando se completa una tarea, este servicio orquesta la notificación al Gamification Service para otorgar XP y al Challenge Service para actualizar el progreso en desafíos activos.

Es el **endpoint más crítico** del sistema: `PATCH /tasks/:id/complete` dispara una cadena de eventos que actualiza el perfil de gamificación y los desafíos del usuario.

---

## 🏗️ Arquitectura interna

```
task-service/
├── src/
│   ├── goals/
│   │   ├── goals.controller.ts     # CRUD de metas
│   │   ├── goals.service.ts
│   │   └── dto/                    # ← Capa DTO
│   │       ├── create-goal.dto.ts
│   │       ├── goal-response.dto.ts
│   │       └── ...
│   ├── tasks/
│   │   ├── tasks.controller.ts     # CRUD de tareas + completación
│   │   ├── tasks.service.ts        # Lógica de negocio central
│   │   └── dto/                    # ← Capa DTO
│   │       ├── create-task.dto.ts
│   │       ├── complete-task-response.dto.ts
│   │       ├── daily-summary.dto.ts
│   │       └── ...
│   ├── clients/
│   │   ├── identitiy.client.ts     # HTTP → Identity Service
│   │   ├── gamification.client.ts  # HTTP → Gamification Service
│   │   └── challange.client.ts     # HTTP → Challenge Service
│   ├── prisma/
│   │   └── prisma.service.ts       # Conexión a PostgreSQL via Prisma
│   ├── eureka/
│   │   └── eureka.service.ts       # Registro en Eureka
│   └── common/
│       ├── guards/jwt-auth.guard.ts
│       ├── decorators/
│       └── filters/
└── prisma/
    ├── schema.prisma               # Modelos de base de datos
    └── migrations/                 # Historial de migraciones SQL
```

### Patrón DTO con Prisma

Este servicio implementa el patrón **DTO** usando **Prisma** como ORM para la capa de persistencia relacional:

- Los **modelos Prisma** (`Goal`, `Task`, `TaskCompletion`) definen el esquema de base de datos y generan el cliente tipado
- Los **DTOs de NestJS** (`CreateGoalDto`, `TaskResponseDto`, `CompleteTaskResponseDto`) forman la capa de transporte y validación con `class-validator`
- El mapeo entre modelos Prisma y DTOs se realiza en la capa de servicios, manteniendo el desacoplamiento

---

## 🗄️ Modelo de datos

```prisma
model Goal {
  id           Int       @id @default(autoincrement())
  userId       String    @map("user_id")        // UUID del usuario (Identity Service)
  name         String    @db.VarChar(200)
  description  String?
  endDate      DateTime? @map("end_date")
  state        StateGoal @default(pending)       // pending | completed | expired
  maxDaysLater Int?      @map("max_days_later")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  tasks        Task[]
}

model Task {
  id              Int             @id @default(autoincrement())
  goalId          Int
  goal            Goal            @relation(onDelete: Cascade)
  userId          String          @map("user_id")
  name            String          @db.VarChar(200)
  state           StateGoal       @default(pending)
  difficultyLevel DifficultyLevel  // easy | middle | high
  limitDate       DateTime?
  frequency       Int             @default(0)    // 0 = única vez, >0 = recurrente
  completions     TaskCompletion[]
}

model TaskCompletion {
  id          Int      @id @default(autoincrement())
  taskId      Int
  task        Task     @relation(onDelete: Cascade)
  userId      String
  xpAwarded   Int      @default(0)
  completedAt DateTime @default(now())
}
```

---

## 🔌 Endpoints

### Metas (Goals)

| Método   | Endpoint            | Descripción                      |
| -------- | ------------------- | -------------------------------- |
| `POST`   | `/goals`            | Crear nueva meta                 |
| `GET`    | `/goals`            | Listar metas del usuario         |
| `GET`    | `/goals/:id`        | Detalle de meta con tareas       |
| `PATCH`  | `/goals/:id`        | Editar meta                      |
| `DELETE` | `/goals/:id`        | Eliminar meta (cascada)          |
| `PATCH`  | `/goals/:id/reopen` | Reabrir meta completada/expirada |

### Tareas (Tasks)

| Método   | Endpoint               | Descripción                     |
| -------- | ---------------------- | ------------------------------- |
| `POST`   | `/tasks`               | Crear tarea asociada a una meta |
| `GET`    | `/tasks`               | Listar tareas (con filtros)     |
| `GET`    | `/tasks/:id`           | Detalle de tarea con historial  |
| `PATCH`  | `/tasks/:id`           | Editar tarea                    |
| `DELETE` | `/tasks/:id`           | Eliminar tarea                  |
| `PATCH`  | `/tasks/:id/complete`  | ⭐ **Completar tarea**          |
| `GET`    | `/tasks/daily-summary` | Resumen de tareas del día       |
| `GET`    | `/tasks/completions`   | Historial de completaciones     |

### Filtros disponibles en `GET /tasks`

| Query Param | Tipo                          | Descripción                              |
| ----------- | ----------------------------- | ---------------------------------------- |
| `goalId`    | `int`                         | Filtrar por meta                         |
| `state`     | `pending\|completed\|expired` | Filtrar por estado                       |
| `frequency` | `int`                         | Filtrar por frecuencia                   |
| `date`      | `ISO date`                    | Tareas activas para una fecha específica |
| `page`      | `int`                         | Paginación (default: 1)                  |
| `limit`     | `int`                         | Elementos por página (default: 20)       |

---

## 🔄 Flujo de completación de tarea

El endpoint `PATCH /tasks/:id/complete` es el más crítico del sistema y orquesta múltiples servicios:

```
1. Validar que la tarea existe y pertenece al usuario autenticado
2. Validar elegibilidad (no completada hoy si es recurrente, no completada si es única)
3. Actualizar state → 'completed' + crear TaskCompletion (transacción)
4. Verificar si TODAS las tareas diarias del usuario están completadas hoy
5. → POST /gamification/task-completed (Gamification Service)
        Recibe: { user_id, task_id, difficulty, frequency, all_daily_tasks_completed }
        Retorna: { xp_awarded, total_xp, current_level, streak, new_achievements, ... }
6. Actualizar xpAwarded en TaskCompletion con el XP otorgado
7. → POST /challenges/update-progress (Challenge Service)
        Envía: { user_id, tasks_completed_today, total_tasks_today, xp_earned }
8. Si frequency > 0: crear nueva instancia pendiente de la tarea
9. Registrar en audit_log vía Identity Service
10. Retornar CompleteTaskResponseDTO
```

---

## ⚙️ Configuración

### Variables de entorno

| Variable                   | Descripción                   | Ejemplo                               |
| -------------------------- | ----------------------------- | ------------------------------------- |
| `DATABASE_URL`             | Cadena de conexión Prisma     | `postgresql://user:pass@host:5432/db` |
| `PORT`                     | Puerto del servicio           | `3001`                                |
| `NODE_ENV`                 | Entorno                       | `development`                         |
| `EUREKA_HOST`              | Host del servidor Eureka      | `eureka-server`                       |
| `EUREKA_PORT`              | Puerto de Eureka              | `8761`                                |
| `EUREKA_SERVICE_NAME`      | Nombre en Eureka              | `task-service`                        |
| `EUREKA_INSTANCE_HOST`     | Hostname propio               | `task-service`                        |
| `EUREKA_INSTANCE_PORT`     | Puerto propio                 | `3001`                                |
| `INTERNAL_SERVICE_KEY`     | Clave para llamadas internas  | `goalquest-internal-...`              |
| `IDENTITY_SERVICE_URL`     | URL fallback Identity Service | `http://identity-service:8081`        |
| `GAMIFICATION_SERVICE_URL` | URL fallback Gamification     | `http://gamification-service:8000`    |
| `CHALLENGE_SERVICE_URL`    | URL fallback Challenge        | `http://challenge-service:3002`       |

---

## 🚀 Ejecución

### Con Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up task-service -d
```

### Local (desarrollo)

```bash
cd task-service
cp .env.example .env   # Editar con tu configuración local

npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Comandos Prisma útiles

```bash
# Ver el estado de migraciones
npx prisma migrate status

# Abrir Prisma Studio (GUI para la base de datos)
npx prisma studio

# Generar cliente Prisma tras cambios en schema
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name nombre_de_la_migracion
```

---

## 🧪 Ejemplos de uso

### Crear una meta

```bash
curl -X POST http://localhost:3001/goals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aprender inglés",
    "description": "Estudiar 30 minutos diarios",
    "endDate": "2025-12-31",
    "maxDaysLater": 3
  }'
```

### Crear una tarea recurrente

```bash
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": 1,
    "name": "Leer 30 minutos en inglés",
    "difficultyLevel": "middle",
    "frequency": 1
  }'
```

> `frequency: 1` significa que la tarea se puede completar una vez por día y luego se crea automáticamente una nueva instancia.

### Completar una tarea

```bash
curl -X PATCH http://localhost:3001/tasks/1/complete \
  -H "Authorization: Bearer <token>"
```

Respuesta:

```json
{
  "task": { "id": 1, "name": "Leer 30 minutos", "state": "completed", "completedAt": "..." },
  "gamification": {
    "xpAwarded": 29,
    "xpBreakdown": { "base": 25, "streak_bonus": 4, "achievement_bonus": 0 },
    "totalXp": 150,
    "currentLevel": 2,
    "streak": { "consecutiveDays": 2, "increased": true },
    "newAchievements": [],
    "leveledUp": false
  },
  "nextInstance": { "id": 2, "name": "Leer 30 minutos", "state": "pending", ... }
}
```

---

## 📦 Dependencias principales

| Dependencia        | Versión | Uso                                          |
| ------------------ | ------- | -------------------------------------------- |
| @nestjs/common     | 11      | Framework NestJS                             |
| @prisma/client     | 7.6     | ORM + cliente de base de datos               |
| @prisma/adapter-pg | 7.6     | Adaptador PostgreSQL para Prisma             |
| @nestjs/axios      | 4.0     | Cliente HTTP para llamadas a otros servicios |
| class-validator    | 0.15    | Validación de DTOs                           |
| class-transformer  | 0.5     | Transformación de objetos                    |
| eureka-js-client   | 4.5     | Registro en Eureka                           |
| @nestjs/swagger    | 11.2    | Documentación automática de la API           |

---

[← Volver al README principal](../README.md)
