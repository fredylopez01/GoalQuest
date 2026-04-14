## GOALQUEST — Contrato de Microservicios

---

## Arquitectura General

```
Frontend → Eureka Server/Gateway (:8761) → Microservicios
```

| Servicio             | Tech             | BD              | Puerto | ORM/ODM                 |
| -------------------- | ---------------- | --------------- | ------ | ----------------------- |
| Eureka Server        | Java Spring Boot | —               | 8761   | —                       |
| Identity Service     | Java Spring Boot | PostgreSQL      | 8081   | Hibernate/JPA           |
| Task Service         | NestJS           | PostgreSQL      | 3001   | Prisma                  |
| Gamification Service | Python FastAPI   | Redis + MongoDB | 8000   | redis-py + Beanie/Motor |
| Challenge Service    | NestJS           | MongoDB         | 3002   | Mongoose                |

## Distribución por Desarrollador

| Dev       | Servicios                        | Tech             | BD                   |
| --------- | -------------------------------- | ---------------- | -------------------- |
| **Dev A** | Eureka Server + Identity Service | Java Spring Boot | PostgreSQL           |
| **Dev B** | Task Service + Challenge Service | NestJS           | PostgreSQL + MongoDB |
| **Dev C** | Gamification Service             | FastAPI          | Redis + MongoDB      |

---

| Microservicio        | Endpoints Públicos | Endpoints Internos | Total  |
| -------------------- | ------------------ | ------------------ | ------ |
| Identity Service     | 8                  | 2                  | **10** |
| Task Service         | 12                 | 2 (llama a otros)  | **14** |
| Gamification Service | 9                  | 5                  | **14** |
| Challenge Service    | 6                  | 2                  | **8**  |
| **TOTAL**            | **35**             | **11**             | **46** |

## Convenciones Generales

```
- IDs de usuario: UUID (string)
- IDs de entidades en PostgreSQL: int (autoincrement)
- IDs de entidades en MongoDB: string (ObjectId)
- Fechas: ISO 8601 (string)
- Autenticación: Header "Authorization: Bearer <token>"
- Comunicación interna: Header "X-Internal-Service-Key: <secret>"
- Los servicios se llaman entre sí usando el nombre registrado en Eureka
```

**Formato estándar de error:**

```
{
    statusCode: int,
    error: string,
    message: string | string[]
}
```

**Formato estándar de paginación:**

```
{
    data: T[],
    pagination: {
        page: int,
        limit: int,
        total: int
    }
}
```

---

---

# MICROSERVICIO 1: IDENTITY SERVICE

**Nombre en Eureka:** `identity-service`
**Puerto:** `8081`
**Tech:** Java Spring Boot + PostgreSQL + Hibernate/JPA

---

## Modelo de Datos (PostgreSQL)

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    hash_password VARCHAR(255) NOT NULL,
    rol         VARCHAR(20) DEFAULT 'USER',
    avatar_url  VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## DTOs

```
RegisterRequestDTO {
    name:     string   (requerido, min: 2, max: 100)
    email:    string   (requerido, formato email)
    password: string   (requerido, min: 8)
}

LoginRequestDTO {
    email:    string   (requerido, formato email)
    password: string   (requerido)
}

LoginResponseDTO {
    access_token: string
    token_type:   string
    expires_in:   int
    user:         UserDTO
}

UserDTO {
    id:         string (UUID)
    name:       string
    email:      string
    rol:        string
    avatar_url: string | null
    created_at: string (ISO 8601)
}

ProfileUpdateDTO {
    name:       string | null  (opcional, min: 2, max: 100)
    avatar_url: string | null  (opcional)
}

ValidateTokenRequestDTO {
    token: string (requerido)
}

ValidateTokenResponseDTO {
    valid:   boolean
    user_id: string (UUID)
    email:   string
    rol:     string
}

AuditLogRequestDTO {
    user_id:     string (UUID, requerido)
    action:      string (requerido)
    description: string (requerido)
    ip_address:  string | null (opcional)
}

AuditLogDTO {
    id:          int
    user_id:     string (UUID)
    action:      string
    description: string
    ip_address:  string | null
    created_at:  string (ISO 8601)
}
```

---

## Endpoints

### Autenticación

---

**IS-01 | POST /auth/register**
Registrar un nuevo usuario.

```
Auth: No

Request Body: RegisterRequestDTO
{
    name:     string
    email:    string
    password: string
}

Response 201: UserDTO
{
    id:         string (UUID)
    name:       string
    email:      string
    rol:        string
    avatar_url: null
    created_at: string (ISO 8601)
}

Errores:
  400 - VALIDATION_ERROR: Datos inválidos
  409 - EMAIL_EXISTS: El email ya está registrado

Notas:
  - Hashear password con BCrypt
  - Después de crear el usuario, llamar a gamification-service:
    POST /gamification/profile { user_id: <nuevo_uuid> }
```

---

**IS-02 | POST /auth/login**
Autenticar usuario y retornar JWT.

```
Auth: No

Request Body: LoginRequestDTO
{
    email:    string
    password: string
}

Response 200: LoginResponseDTO
{
    access_token: string
    token_type:   string ("Bearer")
    expires_in:   int (segundos)
    user: {
        id:    string (UUID)
        name:  string
        email: string
        rol:   string
    }
}

Errores:
  401 - INVALID_CREDENTIALS: Email o contraseña incorrectos

Notas:
  - Registrar en audit_log: action = "LOGIN"
```

---

**IS-03 | POST /auth/logout**
Cerrar sesión del usuario.

```
Auth: Bearer Token

Response 200:
{
    message: string
}

Notas:
  - Registrar en audit_log: action = "LOGOUT"
```

---

**IS-04 | POST /auth/validate-token**
Validar un JWT. Uso interno entre microservicios.

```
Auth: No (endpoint interno)

Request Body: ValidateTokenRequestDTO
{
    token: string
}

Response 200: ValidateTokenResponseDTO
{
    valid:   boolean
    user_id: string (UUID)
    email:   string
    rol:     string
}

Errores:
  401 - Token inválido o expirado → { valid: false, message: string }
```

---

### Usuarios

---

**IS-05 | GET /users/profile**
Obtener perfil del usuario autenticado.

```
Auth: Bearer Token

Response 200: UserDTO
{
    id:         string (UUID)
    name:       string
    email:      string
    rol:        string
    avatar_url: string | null
    created_at: string (ISO 8601)
}
```

---

**IS-06 | PATCH /users/profile**
Editar perfil del usuario autenticado.

```
Auth: Bearer Token

Request Body: ProfileUpdateDTO
{
    name:       string | null  (opcional)
    avatar_url: string | null  (opcional)
}

Response 200: UserDTO (actualizado)

Errores:
  400 - VALIDATION_ERROR: Datos inválidos
```

---

**IS-07 | GET /users/{userId}**
Obtener información pública de un usuario por ID.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Response 200:
{
    id:         string (UUID)
    name:       string
    avatar_url: string | null
    rol:        string
}

Errores:
  404 - USER_NOT_FOUND: El usuario no existe
```

---

**IS-08 | GET /users**
Buscar/listar usuarios.

```
Auth: Bearer Token

Query Params:
  search: string  (opcional, busca por nombre o email)
  page:   int     (default: 1)
  limit:  int     (default: 20)

Response 200:
{
    data: UserDTO[]
    pagination: {
        page:  int
        limit: int
        total: int
    }
}
```

---

### Auditoría

---

**IS-09 | GET /audit/logs**
Obtener logs de auditoría. Solo ADMIN.

```
Auth: Bearer Token (rol: ADMIN)

Query Params:
  user_id: string  (opcional)
  action:  string  (opcional)
  from:    string  (opcional, ISO date)
  to:      string  (opcional, ISO date)
  page:    int     (default: 1)
  limit:   int     (default: 50)

Response 200:
{
    data: AuditLogDTO[]
    pagination: {
        page:  int
        limit: int
        total: int
    }
}

Errores:
  403 - FORBIDDEN: No tiene permisos de administrador
```

---

**IS-10 | POST /audit/logs**
Registrar un log de auditoría. Uso interno.

```
Auth: X-Internal-Service-Key

Request Body: AuditLogRequestDTO
{
    user_id:     string (UUID)
    action:      string
    description: string
    ip_address:  string | null
}

Response 201:
{
    id:      int
    message: string
}
```

---

---

# MICROSERVICIO 2: TASK SERVICE

**Nombre en Eureka:** `task-service`
**Puerto:** `3001`
**Tech:** NestJS + PostgreSQL + Prisma

---

## Modelo de Datos (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum StateGoal {
  pending
  completed
  expired
}

enum DifficultyLevel {
  easy
  middle
  high
}

model Goal {
  id           Int       @id @default(autoincrement())
  userId       String    @map("user_id")
  name         String    @db.VarChar(200)
  description  String?
  endDate      DateTime? @map("end_date")
  state        StateGoal @default(pending)
  maxDaysLater Int?      @map("max_days_later")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  tasks        Task[]

  @@map("goals")
}

model Task {
  id              Int             @id @default(autoincrement())
  goalId          Int             @map("goal_id")
  goal            Goal            @relation(fields: [goalId], references: [id], onDelete: Cascade)
  userId          String          @map("user_id")
  name            String          @db.VarChar(200)
  state           StateGoal       @default(pending)
  difficultyLevel DifficultyLevel @map("difficulty_level")
  limitDate       DateTime?       @map("limit_date")
  frequency       Int             @default(0)
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  completions     TaskCompletion[]

  @@map("tasks")
}

model TaskCompletion {
  id          Int      @id @default(autoincrement())
  taskId      Int      @map("task_id")
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId      String   @map("user_id")
  xpAwarded   Int      @default(0) @map("xp_awarded")
  completedAt DateTime @default(now()) @map("completed_at")

  @@map("task_completions")
}
```

---

## DTOs

```
CreateGoalDTO {
    name:         string          (requerido, min: 1, max: 200)
    description:  string | null   (opcional)
    endDate:      string | null   (opcional, ISO 8601)
    maxDaysLater: int | null      (opcional, min: 0)
}

UpdateGoalDTO {
    name:         string | null   (opcional, min: 1, max: 200)
    description:  string | null   (opcional)
    endDate:      string | null   (opcional, ISO 8601)
    maxDaysLater: int | null      (opcional, min: 0)
}

GoalResponseDTO {
    id:           int
    userId:       string (UUID)
    name:         string
    description:  string | null
    endDate:      string | null (ISO 8601)
    state:        string (enum: pending, completed, expired)
    maxDaysLater: int | null
    progress:     float (0.0 - 1.0)
    createdAt:    string (ISO 8601)
    updatedAt:    string (ISO 8601)
    tasks:        TaskSummaryDTO[]
}

TaskSummaryDTO {
    id:              int
    name:            string
    state:           string (enum: pending, completed, expired)
    difficultyLevel: string (enum: easy, middle, high)
    frequency:       int
}

CreateTaskDTO {
    goalId:          int            (requerido)
    name:            string         (requerido, min: 1, max: 200)
    difficultyLevel: string         (requerido, enum: easy, middle, high)
    limitDate:       string | null  (opcional, ISO 8601)
    frequency:       int            (requerido, min: 0)
}

UpdateTaskDTO {
    name:            string | null  (opcional, min: 1, max: 200)
    difficultyLevel: string | null  (opcional, enum: easy, middle, high)
    limitDate:       string | null  (opcional, ISO 8601)
    frequency:       int | null     (opcional, min: 0)
}

TaskResponseDTO {
    id:              int
    goalId:          int
    goalName:        string
    userId:          string (UUID)
    name:            string
    state:           string (enum: pending, completed, expired)
    difficultyLevel: string (enum: easy, middle, high)
    limitDate:       string | null (ISO 8601)
    frequency:       int
    createdAt:       string (ISO 8601)
    updatedAt:       string (ISO 8601)
    lastCompletedAt: string | null (ISO 8601)
}

CompleteTaskResponseDTO {
    task: {
        id:          int
        name:        string
        state:       string
        completedAt: string (ISO 8601)
    }
    gamification: {
        xpAwarded:    int
        totalXp:      int
        currentLevel: int
        streak: {
            consecutiveDays: int
            increased:       boolean
        }
        newAchievements: AchievementDTO[]
        leveledUp:       boolean
    }
    nextInstance: TaskResponseDTO | null
}

DailySummaryDTO {
    date:                 string (ISO date)
    totalTasks:           int
    completedTasks:       int
    pendingTasks:         int
    completionPercentage: float
    tasks:                TaskSummaryDTO[]
}

TaskCompletionDTO {
    id:          int
    taskId:      int
    taskName:    string
    xpAwarded:   int
    completedAt: string (ISO 8601)
}

CompletionHistoryDTO {
    data: TaskCompletionDTO[]
    summary: {
        totalCompleted: int
        totalXpEarned:  int
    }
}
```

---

## Endpoints

### Metas (Goals)

---

**TS-01 | POST /goals**
Crear una nueva meta.

```
Auth: Bearer Token

Request Body: CreateGoalDTO
{
    name:         string
    description:  string | null
    endDate:      string | null
    maxDaysLater: int | null
}

Response 201: GoalResponseDTO

Errores:
  400 - VALIDATION_ERROR
  401 - UNAUTHORIZED
```

---

**TS-02 | GET /goals**
Listar metas del usuario autenticado.

```
Auth: Bearer Token

Query Params:
  state: string  (opcional, enum: pending, completed, expired)
  page:  int     (default: 1)
  limit: int     (default: 10)

Response 200:
{
    data: GoalResponseDTO[]
    pagination: { page: int, limit: int, total: int }
}
```

---

**TS-03 | GET /goals/:id**
Obtener detalle de una meta con sus tareas.

```
Auth: Bearer Token

Path Params:
  id: int

Response 200: GoalResponseDTO (con tasks completo)

Errores:
  404 - GOAL_NOT_FOUND
  403 - FORBIDDEN (no es dueño)
```

---

**TS-04 | PATCH /goals/:id**
Editar una meta.

```
Auth: Bearer Token

Path Params:
  id: int

Request Body: UpdateGoalDTO
{
    name:         string | null
    description:  string | null
    endDate:      string | null
    maxDaysLater: int | null
}

Response 200: GoalResponseDTO (actualizado)

Errores:
  400 - VALIDATION_ERROR
  404 - GOAL_NOT_FOUND
  403 - FORBIDDEN
```

---

**TS-05 | DELETE /goals/:id**
Eliminar una meta y todas sus tareas asociadas.

```
Auth: Bearer Token

Path Params:
  id: int

Response 200:
{
    message: string
}

Errores:
  404 - GOAL_NOT_FOUND
  403 - FORBIDDEN

Notas:
  - Elimina en cascada todas las tareas y task_completions
  - Registrar en audit_log vía identity-service
```

---

**TS-06 | PATCH /goals/:id/reopen**
Reabrir una meta en estado completed o expired.

```
Auth: Bearer Token

Path Params:
  id: int

Response 200: GoalResponseDTO (con state: "pending")

Errores:
  404 - GOAL_NOT_FOUND
  400 - INVALID_STATE (ya está en pending)
  403 - FORBIDDEN
```

---

### Tareas (Tasks)

---

**TS-07 | POST /tasks**
Crear una tarea asociada a una meta.

```
Auth: Bearer Token

Request Body: CreateTaskDTO
{
    goalId:          int
    name:            string
    difficultyLevel: string
    limitDate:       string | null
    frequency:       int
}

Response 201: TaskResponseDTO

Errores:
  400 - VALIDATION_ERROR
  404 - GOAL_NOT_FOUND
  403 - FORBIDDEN (la meta no pertenece al usuario)
```

---

**TS-08 | GET /tasks**
Listar tareas del usuario autenticado.

```
Auth: Bearer Token

Query Params:
  goalId:    int     (opcional)
  state:     string  (opcional, enum: pending, completed, expired)
  frequency: int     (opcional)
  date:      string  (opcional, ISO date, filtra tareas activas para ese día)
  page:      int     (default: 1)
  limit:     int     (default: 20)

Response 200:
{
    data: TaskResponseDTO[]
    pagination: { page: int, limit: int, total: int }
}
```

---

**TS-09 | GET /tasks/:id**
Obtener detalle de una tarea con su historial de completaciones.

```
Auth: Bearer Token

Path Params:
  id: int

Response 200: TaskResponseDTO (extendido con completions: TaskCompletionDTO[])

Errores:
  404 - TASK_NOT_FOUND
  403 - FORBIDDEN
```

---

**TS-10 | PATCH /tasks/:id**
Editar una tarea.

```
Auth: Bearer Token

Path Params:
  id: int

Request Body: UpdateTaskDTO
{
    name:            string | null
    difficultyLevel: string | null
    limitDate:       string | null
    frequency:       int | null
}

Response 200: TaskResponseDTO (actualizado)

Errores:
  400 - VALIDATION_ERROR
  404 - TASK_NOT_FOUND
  403 - FORBIDDEN
```

---

**TS-11 | DELETE /tasks/:id**
Eliminar una tarea.

```
Auth: Bearer Token

Path Params:
  id: int

Response 200:
{
    message: string
}

Errores:
  404 - TASK_NOT_FOUND
  403 - FORBIDDEN

Notas:
  - Elimina en cascada las task_completions
  - Registrar en audit_log vía identity-service
```

---

**TS-12 | PATCH /tasks/:id/complete**
Marcar una tarea como completada. **Endpoint más crítico del sistema.**

```
Auth: Bearer Token

Path Params:
  id: int

Request Body: (vacío)

Lógica interna:
  1. Verificar que la tarea existe y pertenece al usuario
  2. Verificar elegibilidad (no completada hoy si es recurrente)
  3. Actualizar state → completed
  4. Guardar TaskCompletion
  5. Verificar si TODAS las tareas diarias (frequency=1) del usuario están completadas hoy
  6. Llamar a gamification-service (Eureka):
     POST /gamification/task-completed
     Body: {
         user_id: string (UUID),
         task_id: int,
         difficulty: string,
         frequency: int,
         all_daily_tasks_completed: boolean
     }
  7. Llamar a challenge-service (Eureka):
     POST /challenges/update-progress
     Body: {
         user_id: string (UUID),
         tasks_completed_today: int,
         total_tasks_today: int,
         xp_earned: int
     }
  8. Si frequency > 0 → crear nueva instancia de tarea con state: pending
  9. Actualizar xpAwarded en TaskCompletion con lo que retornó gamification

Response 200: CompleteTaskResponseDTO

Errores:
  400 - TASK_ALREADY_COMPLETED
  404 - TASK_NOT_FOUND
  403 - FORBIDDEN
```

---

**TS-13 | GET /tasks/daily-summary**
Obtener resumen de tareas del día actual.

```
Auth: Bearer Token

Response 200: DailySummaryDTO
{
    date:                 string
    totalTasks:           int
    completedTasks:       int
    pendingTasks:         int
    completionPercentage: float
    tasks:                TaskSummaryDTO[]
}
```

---

**TS-14 | GET /tasks/completions**
Historial de completaciones para un rango de fechas.

```
Auth: Bearer Token

Query Params:
  from:   string  (requerido, ISO date)
  to:     string  (requerido, ISO date)
  taskId: int     (opcional)

Response 200: CompletionHistoryDTO
{
    data: TaskCompletionDTO[]
    summary: {
        totalCompleted: int
        totalXpEarned:  int
    }
}
```

---

---

# MICROSERVICIO 3: GAMIFICATION SERVICE

**Nombre en Eureka:** `gamification-service`
**Puerto:** `8000`
**Tech:** Python FastAPI + Redis + MongoDB + Beanie/Motor

---

## Modelo de Datos

### Redis (datos en tiempo real)

```
KEY: user:{userId}:profile
TYPE: Hash
FIELDS:
  xp_total:      int
  current_level: int
  updated_at:    string (ISO 8601)

KEY: user:{userId}:streak
TYPE: Hash
FIELDS:
  consecutive_days: int
  last_day:         string (ISO date)
  max_streak:       int

KEY: leaderboard:xp
TYPE: Sorted Set
MEMBERS: userId (string UUID)
SCORE: xp_total (int)

KEY: user:{userId}:tasks_completed
TYPE: String (int counter)
```

### MongoDB (datos históricos)

```
Collection: xp_history
{
    _id:          ObjectId
    user_id:      string (UUID)
    xp_awarded:   int
    source:       string (enum: task_completion, achievement, challenge_win)
    source_id:    string
    difficulty:   string | null
    streak_bonus: int
    created_at:   datetime
}

Collection: achievements
{
    _id:             ObjectId
    code:            string (unique)
    name:            string
    description:     string
    condition_type:  string (enum: streak, tasks_completed, level)
    threshold_value: int
    xp_reward:       int
}

Collection: user_achievements
{
    _id:              ObjectId
    user_id:          string (UUID)
    achievement_id:   ObjectId (ref: achievements)
    achievement_code: string
    rewarded_at:      datetime
}

Collection: weekly_reports
{
    _id:                   ObjectId
    user_id:               string (UUID)
    start_week:            string (ISO date)
    end_week:              string (ISO date)
    completed_tasks:       int
    total_tasks:           int
    completion_percentage: float
    xp_earned:             int
    level_reached:         int
    trend:                 string (enum: increasing, stable, decreasing)
    created_at:            datetime
}
```

---

## DTOs

```
CreateProfileDTO {
    user_id: string (UUID, requerido)
}

ProfileResponseDTO {
    user_id:                string (UUID)
    xp_total:               int
    current_level:          int
    xp_to_next_level:       int
    xp_progress_percentage: float
    streak: {
        consecutive_days: int
        max_streak:       int
        last_day:         string (ISO date)
    }
    achievements_count:  int
    total_achievements:  int
}

TaskCompletedEventDTO {
    user_id:                  string (UUID, requerido)
    task_id:                  int (requerido)
    difficulty:               string (requerido, enum: easy, middle, high)
    frequency:                int (requerido)
    all_daily_tasks_completed: boolean (requerido)
}

GamificationResultDTO {
    xp_awarded:   int
    xp_breakdown: {
        base:              int
        streak_bonus:      int
        achievement_bonus: int
    }
    total_xp:       int
    current_level:  int
    previous_level: int
    leveled_up:     boolean
    streak: {
        consecutive_days: int
        increased:        boolean
        max_streak:       int
    }
    new_achievements: AchievementDTO[]
}

ChallengeCompletedEventDTO {
    user_id:      string (UUID, requerido)
    challenge_id: string (requerido)
    result:       string (requerido, enum: win, lose, draw)
    xp_reward:    int (requerido)
}

ChallengeXpResultDTO {
    xp_awarded:    int
    total_xp:      int
    current_level: int
    leveled_up:    boolean
    new_achievements: AchievementDTO[]
}

AchievementDTO {
    id:          string (ObjectId)
    code:        string
    name:        string
    description: string
    xp_reward:   int
}

UserAchievementDTO {
    id:          string (ObjectId)
    code:        string
    name:        string
    description: string
    xp_reward:   int
    rewarded_at: string (ISO 8601)
}

LockedAchievementDTO {
    id:          string (ObjectId)
    code:        string
    name:        string
    description: string
    xp_reward:   int
    progress:    int
    threshold:   int
}

CreateAchievementDTO {
    code:            string (requerido, unique)
    name:            string (requerido)
    description:     string (requerido)
    condition_type:  string (requerido, enum: streak, tasks_completed, level)
    threshold_value: int    (requerido, min: 1)
    xp_reward:       int    (requerido, min: 1)
}

StreakResponseDTO {
    user_id:          string (UUID)
    consecutive_days: int
    max_streak:       int
    last_day:         string (ISO date)
    streak_active:    boolean
}

XpHistoryEntryDTO {
    id:           string (ObjectId)
    xp_awarded:   int
    source:       string
    source_id:    string
    difficulty:   string | null
    streak_bonus: int
    created_at:   string (ISO 8601)
}

LeaderboardEntryDTO {
    rank:          int
    user_id:       string (UUID)
    xp_total:      int
    current_level: int
}

WeeklyReportRequestDTO {
    user_id:         string (UUID, requerido)
    start_week:      string (ISO date, requerido)
    end_week:        string (ISO date, requerido)
    completed_tasks: int (requerido)
    total_tasks:     int (requerido)
}

WeeklyReportDTO {
    id:                    string (ObjectId)
    user_id:               string (UUID)
    start_week:            string (ISO date)
    end_week:              string (ISO date)
    completed_tasks:       int
    total_tasks:           int
    completion_percentage: float
    xp_earned:             int
    level_reached:         int
    trend:                 string (enum: increasing, stable, decreasing)
}

TrendResponseDTO {
    user_id:       string (UUID)
    current_trend: string (enum: increasing, stable, decreasing)
    trend_data: [{
        week:                  string (ISO date)
        completion_percentage: float
        xp_earned:             int
    }]
    analysis: {
        avg_completion: float
        best_week:      string (ISO date)
        worst_week:     string (ISO date)
    }
}

CheckResetRequestDTO {
    user_ids: string[] (UUID[])
}

CheckResetResponseDTO {
    reset_count: int
    reset_users: string[] (UUID[])
}
```

---

## Endpoints

### Perfil de Progreso

---

**GS-01 | POST /gamification/profile**
Crear perfil de gamificación para un nuevo usuario.

```
Auth: X-Internal-Service-Key

Request Body: CreateProfileDTO
{
    user_id: string (UUID)
}

Lógica:
  1. Crear hash en Redis: user:{userId}:profile → { xp_total: 0, current_level: 1 }
  2. Crear hash en Redis: user:{userId}:streak → { consecutive_days: 0, last_day: "", max_streak: 0 }
  3. Inicializar counter: user:{userId}:tasks_completed → 0
  4. Agregar al sorted set: leaderboard:xp → userId con score 0

Response 201: ProfileResponseDTO

Errores:
  409 - PROFILE_EXISTS
```

---

**GS-02 | GET /gamification/profile/{userId}**
Obtener perfil de progreso completo.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Lógica:
  1. Leer de Redis: user:{userId}:profile + user:{userId}:streak
  2. Calcular xp_to_next_level y xp_progress_percentage
  3. Contar achievements de MongoDB

Response 200: ProfileResponseDTO

Errores:
  404 - PROFILE_NOT_FOUND
```

---

### Eventos (endpoints internos)

---

**GS-03 | POST /gamification/task-completed**
Procesar tarea completada. Calcula XP, actualiza racha, evalúa logros.

```
Auth: X-Internal-Service-Key

Request Body: TaskCompletedEventDTO
{
    user_id:                   string (UUID)
    task_id:                   int
    difficulty:                string (enum: easy, middle, high)
    frequency:                 int
    all_daily_tasks_completed: boolean
}

Lógica:
  1. XP base según dificultad: easy=10, middle=25, high=50
  2. Leer racha de Redis: user:{userId}:streak
  3. Si all_daily_tasks_completed == true:
     - Si last_day == ayer → consecutive_days += 1
     - Si last_day == hoy → sin cambio
     - Si last_day < ayer → consecutive_days = 1
     - Actualizar last_day = hoy
  4. streak_bonus = consecutive_days * 2
  5. Incrementar counter: user:{userId}:tasks_completed
  6. Evaluar logros no desbloqueados en MongoDB:
     - condition_type "streak" → comparar consecutive_days >= threshold
     - condition_type "tasks_completed" → comparar counter >= threshold
     - condition_type "level" → comparar current_level >= threshold
  7. achievement_bonus = suma de xp_reward de nuevos logros
  8. xp_awarded = base + streak_bonus + achievement_bonus
  9. Actualizar Redis: xp_total += xp_awarded
  10. Calcular nivel: floor(xp_total / 100) + 1
  11. Actualizar Redis: current_level, leaderboard:xp
  12. Guardar en MongoDB: xp_history
  13. Guardar en MongoDB: user_achievements (si hay nuevos)

Response 200: GamificationResultDTO

Errores:
  400 - INVALID_REQUEST
```

---

**GS-04 | POST /gamification/challenge-completed**
Procesar desafío completado. Otorga XP al ganador.

```
Auth: X-Internal-Service-Key

Request Body: ChallengeCompletedEventDTO
{
    user_id:      string (UUID)
    challenge_id: string
    result:       string (enum: win, lose, draw)
    xp_reward:    int
}

Lógica:
  1. Actualizar Redis: xp_total += xp_reward
  2. Recalcular nivel
  3. Actualizar leaderboard
  4. Guardar en xp_history con source: "challenge_win"
  5. Evaluar logros

Response 200: ChallengeXpResultDTO
```

---

### Logros

---

**GS-05 | GET /gamification/achievements/catalog**
Obtener catálogo completo de logros.

```
Auth: Bearer Token

Response 200:
{
    achievements: AchievementDTO[]
}
```

---

**GS-06 | POST /gamification/achievements**
Crear un nuevo logro en el catálogo. Solo ADMIN.

```
Auth: Bearer Token (rol: ADMIN)

Request Body: CreateAchievementDTO
{
    code:            string
    name:            string
    description:     string
    condition_type:  string (enum: streak, tasks_completed, level)
    threshold_value: int
    xp_reward:       int
}

Response 201: AchievementDTO

Errores:
  400 - VALIDATION_ERROR
  403 - FORBIDDEN
  409 - CODE_EXISTS
```

---

**GS-07 | GET /gamification/achievements/{userId}**
Obtener logros desbloqueados y bloqueados del usuario.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Query Params:
  unlocked: boolean (opcional, filtrar solo desbloqueados o bloqueados)

Response 200:
{
    unlocked: UserAchievementDTO[]
    locked:   LockedAchievementDTO[]
}
```

---

### Historial y Racha

---

**GS-08 | GET /gamification/xp-history/{userId}**
Historial de experiencia obtenida.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Query Params:
  from:   string  (opcional, ISO date)
  to:     string  (opcional, ISO date)
  source: string  (opcional, enum: task_completion, achievement, challenge_win)
  page:   int     (default: 1)
  limit:  int     (default: 20)

Response 200:
{
    data: XpHistoryEntryDTO[]
    pagination: { page: int, limit: int, total: int }
}
```

---

**GS-09 | GET /gamification/streak/{userId}**
Obtener información de racha actual.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Lógica:
  - Leer de Redis: user:{userId}:streak
  - streak_active = (last_day == hoy || last_day == ayer)

Response 200: StreakResponseDTO
```

---

**GS-10 | POST /gamification/streak/check-reset**
Reiniciar rachas de usuarios que no completaron tareas. Para CRON job.

```
Auth: X-Internal-Service-Key

Request Body: CheckResetRequestDTO
{
    user_ids: string[] (UUID[])
}

Lógica:
  - Para cada userId: consecutive_days = 0 en Redis

Response 200: CheckResetResponseDTO
```

---

### Leaderboard

---

**GS-11 | GET /gamification/leaderboard**
Ranking global de usuarios por XP.

```
Auth: Bearer Token

Query Params:
  limit: int (default: 10, max: 50)

Lógica:
  - Leer de Redis sorted set: leaderboard:xp (ZREVRANGE con scores)

Response 200:
{
    leaderboard: LeaderboardEntryDTO[]
}
```

---

### Reportes

---

**GS-12 | POST /gamification/reports/weekly**
Generar reporte semanal. Para CRON job o llamada manual.

```
Auth: X-Internal-Service-Key

Request Body: WeeklyReportRequestDTO
{
    user_id:         string (UUID)
    start_week:      string (ISO date)
    end_week:        string (ISO date)
    completed_tasks: int
    total_tasks:     int
}

Lógica:
  1. completion_percentage = (completed_tasks / total_tasks) * 100
  2. xp_earned = sumar xp_history del período desde MongoDB
  3. level_reached = leer de Redis
  4. Buscar reporte anterior en MongoDB para calcular trend:
     - Si porcentaje actual > anterior + 5 → "increasing"
     - Si porcentaje actual < anterior - 5 → "decreasing"
     - Else → "stable"
  5. Guardar en MongoDB: weekly_reports

Response 201: WeeklyReportDTO
```

---

**GS-13 | GET /gamification/reports/weekly/{userId}**
Obtener reportes semanales del usuario.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Query Params:
  last: int (opcional, default: 4, últimos N reportes)

Response 200:
{
    reports: WeeklyReportDTO[]
}
```

---

**GS-14 | GET /gamification/trends/{userId}**
Obtener tendencia de productividad.

```
Auth: Bearer Token

Path Params:
  userId: string (UUID)

Query Params:
  weeks: int (default: 4)

Response 200: TrendResponseDTO
```

---

---

# MICROSERVICIO 4: CHALLENGE SERVICE

**Nombre en Eureka:** `challenge-service`
**Puerto:** `3002`
**Tech:** NestJS + MongoDB + Mongoose

---

## Modelo de Datos (MongoDB)

```javascript
// Collection: challenges
{
    _id:          ObjectId,
    challengerId: string (UUID),
    opponentId:   string (UUID),
    condition:    string (enum: percent, numTasks, level),
    state:        string (enum: pending, active, completed, rejected, cancelled),
    durationDays: int,
    startDate:    Date | null,
    endDate:      Date | null,
    result:       string | null (enum: challenger_wins, opponent_wins, draw),
    createdAt:    Date,
    updatedAt:    Date
}

// Collection: challenge_progress
{
    _id:            ObjectId,
    challengeId:    ObjectId (ref: challenges),
    userId:         string (UUID),
    tasksCompleted: int,
    totalTasks:     int,
    xpEarned:       int,
    updatedAt:      Date
}
```

---

## DTOs

```
CreateChallengeDTO {
    opponentId:   string (UUID, requerido)
    condition:    string (requerido, enum: percent, numTasks, level)
    durationDays: int    (requerido, min: 1)
}

ChallengeResponseDTO {
    id:             string (ObjectId)
    challengerId:   string (UUID)
    challengerName: string
    opponentId:     string (UUID)
    opponentName:   string
    condition:      string (enum: percent, numTasks, level)
    state:          string (enum: pending, active, completed, rejected, cancelled)
    durationDays:   int
    startDate:      string | null (ISO 8601)
    endDate:        string | null (ISO 8601)
    daysRemaining:  int | null
    result:         string | null (enum: challenger_wins, opponent_wins, draw)
    myRole:         string (enum: challenger, opponent)
    createdAt:      string (ISO 8601)
}

ChallengeDetailResponseDTO extends ChallengeResponseDTO {
    progress: {
        challenger: ProgressDTO
        opponent:   ProgressDTO
    }
}

ProgressDTO {
    userId:               string (UUID)
    name:                 string
    tasksCompleted:       int
    totalTasks:           int
    completionPercentage: float
    xpEarned:             int
}

UpdateProgressDTO {
    user_id:               string (UUID, requerido)
    tasks_completed_today: int (requerido)
    total_tasks_today:     int (requerido)
    xp_earned:             int (requerido)
}

UpdateProgressResponseDTO {
    updated_challenges: string[] (ObjectId[])
    completed_challenges: [{
        id:               string (ObjectId)
        result:           string (enum: challenger_wins, opponent_wins, draw)
        xp_reward_winner: int
        xp_reward_loser:  int
    }]
}

CheckExpiredResponseDTO {
    processed: int
    results: [{
        challengeId: string (ObjectId)
        result:      string (enum: challenger_wins, opponent_wins, draw)
        winnerId:    string (UUID)
        loserId:     string (UUID)
    }]
}
```

---

## Endpoints

---

**CS-01 | POST /challenges**
Crear un desafío contra otro usuario.

```
Auth: Bearer Token

Request Body: CreateChallengeDTO
{
    opponentId:   string (UUID)
    condition:    string (enum: percent, numTasks, level)
    durationDays: int
}

Lógica:
  1. Llamar identity-service (Eureka): GET /users/{opponentId} → verificar existe
  2. Verificar no hay desafío activo o pendiente entre ambos
  3. Crear desafío con state: "pending"

Response 201: ChallengeResponseDTO

Errores:
  400 - VALIDATION_ERROR
  404 - OPPONENT_NOT_FOUND
  409 - ACTIVE_CHALLENGE_EXISTS
```

---

**CS-02 | GET /challenges**
Listar desafíos del usuario autenticado.

```
Auth: Bearer Token

Query Params:
  state: string  (opcional, enum: pending, active, completed, rejected, cancelled)
  role:  string  (opcional, enum: challenger, opponent, all)
  page:  int     (default: 1)
  limit: int     (default: 10)

Response 200:
{
    data: ChallengeResponseDTO[]
    pagination: { page: int, limit: int, total: int }
}

Notas:
  - Para obtener challengerName/opponentName, llamar identity-service: GET /users/{id}
```

---

**CS-03 | GET /challenges/:id**
Obtener detalle de un desafío con progreso de ambos participantes.

```
Auth: Bearer Token

Path Params:
  id: string (ObjectId)

Response 200: ChallengeDetailResponseDTO

Errores:
  404 - CHALLENGE_NOT_FOUND
  403 - FORBIDDEN (no es participante)
```

---

**CS-04 | PATCH /challenges/:id/accept**
Aceptar un desafío pendiente.

```
Auth: Bearer Token

Path Params:
  id: string (ObjectId)

Lógica:
  1. Verificar que el usuario autenticado es el opponent
  2. Verificar state == "pending"
  3. state → "active"
  4. startDate = now()
  5. endDate = now() + durationDays
  6. Crear ChallengeProgress para challenger y opponent (ambos en 0)

Response 200: ChallengeResponseDTO (actualizado)

Errores:
  403 - NOT_OPPONENT
  400 - INVALID_STATE (no está en pending)
```

---

**CS-05 | PATCH /challenges/:id/reject**
Rechazar un desafío pendiente.

```
Auth: Bearer Token

Path Params:
  id: string (ObjectId)

Lógica:
  1. Verificar que el usuario es el opponent
  2. state → "rejected"

Response 200:
{
    id:      string
    state:   string ("rejected")
    message: string
}

Errores:
  403 - NOT_OPPONENT
  400 - INVALID_STATE
```

---

**CS-06 | PATCH /challenges/:id/cancel**
Cancelar un desafío. Solo el challenger y solo si está en pending.

```
Auth: Bearer Token

Path Params:
  id: string (ObjectId)

Lógica:
  1. Verificar que el usuario es el challenger
  2. Verificar state == "pending"
  3. state → "cancelled"

Response 200:
{
    id:      string
    state:   string ("cancelled")
    message: string
}

Errores:
  403 - NOT_CHALLENGER
  400 - INVALID_STATE
```

---

**CS-07 | POST /challenges/update-progress**
Actualizar progreso de desafíos activos. Uso interno (llamado por task-service).

```
Auth: X-Internal-Service-Key

Request Body: UpdateProgressDTO
{
    user_id:               string (UUID)
    tasks_completed_today: int
    total_tasks_today:     int
    xp_earned:             int
}

Lógica:
  1. Buscar todos los challenges activos donde participa user_id
  2. Para cada uno, actualizar ChallengeProgress:
     tasksCompleted += tasks_completed_today
     totalTasks += total_tasks_today
     xpEarned += xp_earned
  3. Si algún challenge alcanzó endDate:
     - Calcular ganador según condition
     - Llamar gamification-service: POST /gamification/challenge-completed
     - state → "completed"

Response 200: UpdateProgressResponseDTO
```

---

**CS-08 | POST /challenges/check-expired**
Verificar y cerrar desafíos expirados. Para CRON job.

```
Auth: X-Internal-Service-Key

Request Body: (vacío)

Lógica:
  1. Buscar challenges: state == "active" AND endDate <= now()
  2. Para cada uno:
     - Comparar progress según condition:
       * percent: mayor completionPercentage gana
       * numTasks: mayor tasksCompleted gana
       * level: obtener nivel de gamification-service
     - Calcular xp_reward_winner y xp_reward_loser
     - Llamar gamification-service: POST /gamification/challenge-completed (para ambos)
     - state → "completed"

Response 200: CheckExpiredResponseDTO
```

---

## Comunicación entre Servicios (vía Eureka)

```
┌─────────────────────────────────────────────────┐
│              EUREKA SERVER (:8761)                │
│   Registrados:                                   │
│     - identity-service                           │
│     - task-service                               │
│     - gamification-service                       │
│     - challenge-service                          │
└─────────────────────────────────────────────────┘

FLUJO 1 — Registro de usuario:
  identity-service → gamification-service
    POST /gamification/profile

FLUJO 2 — Completar tarea:
  task-service → gamification-service
    POST /gamification/task-completed
  task-service → challenge-service
    POST /challenges/update-progress

FLUJO 3 — Crear desafío:
  challenge-service → identity-service
    GET /users/{opponentId}

FLUJO 4 — Desafío expira:
  challenge-service → gamification-service
    POST /gamification/challenge-completed

FLUJO 5 — Validar token:
  task-service → identity-service
    POST /auth/validate-token
  challenge-service → identity-service
    POST /auth/validate-token

FLUJO 6 — Obtener nombres para desafíos:
  challenge-service → identity-service
    GET /users/{userId}
```
