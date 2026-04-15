<div align="center">

# ⚔️ Challenge Service

**Desafíos entre usuarios y seguimiento de progreso**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=flat-square)](https://mongoosejs.com/)

**Puerto:** `3002` · **Base de datos:** MongoDB · **ODM:** Mongoose

</div>

---

## 📖 Descripción

El Challenge Service gestiona los desafíos competitivos entre usuarios de GoalQuest. Un usuario puede retar a otro a completar más tareas, alcanzar un mayor porcentaje de completación o subir más niveles dentro de un período de tiempo definido. Al finalizar el desafío, el servicio determina el ganador y notifica al Gamification Service para otorgar las recompensas de XP correspondientes.

---

## 🏗️ Arquitectura interna

```
challenge-service/
└── src/
    ├── challenges/
    │   ├── challenges.controller.ts   # 8 endpoints
    │   ├── challenges.service.ts      # Lógica de negocio central
    │   ├── challenges.module.ts
    │   ├── dto/                       # ← Capa DTO
    │   │   ├── create-challenge.dto.ts
    │   │   ├── challenge-response.dto.ts
    │   │   ├── challenge-detail-response.dto.ts
    │   │   ├── update-progress.dto.ts
    │   │   ├── update-progress-response.dto.ts
    │   │   ├── check-expired-response.dto.ts
    │   │   └── query-challenges.dto.ts
    │   ├── schemas/                   # ← Mongoose Schemas
    │   │   ├── challenge.schema.ts
    │   │   └── challenge-progress.schema.ts
    │   └── enums/
    │       ├── challenge-state.enum.ts
    │       ├── challenge-result.enum.ts
    │       └── challenge-condition.enum.ts
    ├── eureka/
    │   └── eureka.service.ts          # Registro en Eureka
    └── common/
        ├── guards/
        │   ├── auth.guard.ts          # Valida JWT via Identity Service
        │   └── internal-service.guard.ts
        ├── decorators/
        │   └── current-user.decorator.ts
        ├── pipes/
        │   └── object-id-validation.pipe.ts
        ├── filters/
        │   └── global-exception.filter.ts
        └── exceptions/
            └── business.exception.ts
```

### Patrón DTO con Mongoose

Este servicio implementa el patrón **DTO** usando **Mongoose** como ODM para MongoDB:

- Los **Schemas de Mongoose** (`ChallengeSchema`, `ChallengeProgressSchema`) definen la estructura de los documentos en MongoDB y son gestionados por `@nestjs/mongoose`
- Los **DTOs de NestJS** (`CreateChallengeDto`, `ChallengeResponseDto`, `UpdateProgressDto`) con decoradores de `class-validator` forman la capa de transporte y validación
- Los decoradores `@Schema()` y `@Prop()` de NestJS Mongoose conectan los modelos con la base de datos

---

## 🗄️ Modelo de datos (MongoDB)

```javascript
// Collection: challenges
{
  _id:          ObjectId,
  challengerId: string,    // UUID del usuario retador
  opponentId:   string,    // UUID del usuario retado
  condition:    string,    // 'percent' | 'numTasks' | 'level'
  state:        string,    // 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled'
  durationDays: number,    // Duración del desafío en días
  startDate:    Date,      // Se establece al aceptar
  endDate:      Date,      // startDate + durationDays
  result:       string,    // 'challenger_wins' | 'opponent_wins' | 'draw' | null
  createdAt:    Date,
  updatedAt:    Date
}

// Collection: challenge_progress
{
  _id:            ObjectId,
  challengeId:    ObjectId,   // ref: challenges
  userId:         string,     // UUID del participante
  tasksCompleted: number,     // Tareas completadas durante el desafío
  totalTasks:     number,     // Total de tareas creadas durante el desafío
  xpEarned:       number,     // XP ganado durante el desafío
  updatedAt:      Date
}
```

### Índices creados

```javascript
// challenges
{ challengerId: 1, state: 1 }
{ opponentId: 1, state: 1 }
{ state: 1, endDate: 1 }
{ challengerId: 1, opponentId: 1, state: 1 }  // Para detectar desafíos activos entre pares

// challenge_progress
{ challengeId: 1, userId: 1 }  // unique: true
{ userId: 1 }
```

---

## 🔌 Endpoints

| Método  | Endpoint                      | Auth        | Descripción                              |
| ------- | ----------------------------- | ----------- | ---------------------------------------- |
| `POST`  | `/challenges`                 | ✅ Bearer   | Crear desafío contra otro usuario        |
| `GET`   | `/challenges`                 | ✅ Bearer   | Listar desafíos (con filtros)            |
| `GET`   | `/challenges/:id`             | ✅ Bearer   | Detalle con progreso de ambos            |
| `PATCH` | `/challenges/:id/accept`      | ✅ Bearer   | Aceptar desafío pendiente                |
| `PATCH` | `/challenges/:id/reject`      | ✅ Bearer   | Rechazar desafío                         |
| `PATCH` | `/challenges/:id/cancel`      | ✅ Bearer   | Cancelar desafío (solo retador)          |
| `POST`  | `/challenges/update-progress` | 🔑 Internal | Actualizar progreso (desde Task Service) |
| `POST`  | `/challenges/check-expired`   | 🔑 Internal | Verificar y cerrar desafíos expirados    |

### Filtros disponibles en `GET /challenges`

| Query Param | Opciones                                          | Descripción                        |
| ----------- | ------------------------------------------------- | ---------------------------------- |
| `state`     | `pending\|active\|completed\|rejected\|cancelled` | Filtrar por estado                 |
| `role`      | `challenger\|opponent\|all`                       | Filtrar por rol del usuario        |
| `page`      | `int`                                             | Paginación (default: 1)            |
| `limit`     | `int`                                             | Elementos por página (default: 10) |

---

## 🎮 Condiciones de victoria

| Condición  | Valor            | Criterio de victoria                        |
| ---------- | ---------------- | ------------------------------------------- |
| `percent`  | Porcentaje       | Mayor `(tasksCompleted / totalTasks) × 100` |
| `numTasks` | Número de tareas | Mayor cantidad de `tasksCompleted`          |
| `level`    | Nivel            | Mayor `xpEarned` durante el desafío         |

### Recompensas XP

| Resultado | XP recibido                          |
| --------- | ------------------------------------ |
| Ganador   | `XP_REWARD_WINNER` (default: 100)    |
| Perdedor  | `XP_REWARD_LOSER` (default: 25)      |
| Empate    | `XP_REWARD_DRAW` (default: 50) ambos |

---

## 🔄 Ciclo de vida de un desafío

```
     Usuario A              Challenge Service           Usuario B
         │                        │                         │
         │── POST /challenges ──→ │                         │
         │                        │─── GET /users/{B} ──→  Identity Service
         │                        │   (verifica que B existe)
         │                        │ state: 'pending'        │
         │ ←── 201 Created ───────│                         │
         │                        │                         │
         │                        │ ←── PATCH /:id/accept ──│
         │                        │ state: 'active'         │
         │                        │ startDate = now()       │
         │                        │ endDate = now() + days  │
         │                        │                         │
         │   (durante el desafío, Task Service llama periódicamente)
         │                        │                         │
         │                   Task Service ──→ POST /challenges/update-progress
         │                        │ Actualiza challenge_progress para ambos
         │                        │                         │
         │   (al expirar endDate)                           │
         │                        │                         │
         │                   POST /challenges/check-expired │
         │                        │ Calcula ganador         │
         │                        │── POST /gamification/challenge-completed
         │                        │   (para ganador y perdedor)
         │                        │ state: 'completed'      │
```

---

## ⚙️ Configuración

### Variables de entorno

| Variable                   | Descripción                   | Ejemplo                                              |
| -------------------------- | ----------------------------- | ---------------------------------------------------- |
| `PORT`                     | Puerto del servicio           | `3002`                                               |
| `NODE_ENV`                 | Entorno                       | `development`                                        |
| `MONGODB_URI`              | URI de conexión MongoDB       | `mongodb://user:pass@host:27017/db?authSource=admin` |
| `EUREKA_HOST`              | Host del servidor Eureka      | `eureka-server`                                      |
| `EUREKA_PORT`              | Puerto de Eureka              | `8761`                                               |
| `EUREKA_SERVICE_NAME`      | Nombre en Eureka              | `challenge-service`                                  |
| `EUREKA_INSTANCE_HOST`     | Hostname propio               | `challenge-service`                                  |
| `EUREKA_INSTANCE_PORT`     | Puerto propio                 | `3002`                                               |
| `INTERNAL_SERVICE_KEY`     | Clave para llamadas internas  | `goalquest-internal-...`                             |
| `IDENTITY_SERVICE_URL`     | URL fallback Identity Service | `http://identity-service:8081`                       |
| `GAMIFICATION_SERVICE_URL` | URL fallback Gamification     | `http://gamification-service:8000`                   |
| `XP_REWARD_WINNER`         | XP al ganador del desafío     | `100`                                                |
| `XP_REWARD_LOSER`          | XP al perdedor del desafío    | `25`                                                 |
| `XP_REWARD_DRAW`           | XP en empate                  | `50`                                                 |

---

## 🚀 Ejecución

### Con Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up challenge-service -d
```

### Local (desarrollo)

```bash
cd challenge-service
cp .env.example .env   # Editar con tu configuración local

npm install
npm run start:dev
```

---

## 🧪 Ejemplos de uso

### Crear un desafío

```bash
curl -X POST http://localhost:3002/challenges \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "opponentId": "uuid-del-oponente",
    "condition": "numTasks",
    "durationDays": 7
  }'
```

### Aceptar un desafío

```bash
curl -X PATCH http://localhost:3002/challenges/{challengeId}/accept \
  -H "Authorization: Bearer <token-del-oponente>"
```

### Ver el detalle con progreso

```bash
curl http://localhost:3002/challenges/{challengeId} \
  -H "Authorization: Bearer <token>"
```

Respuesta:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "challengerId": "uuid-a",
  "challengerName": "María García",
  "opponentId": "uuid-b",
  "opponentName": "Carlos López",
  "condition": "numTasks",
  "state": "active",
  "durationDays": 7,
  "startDate": "2025-06-10T00:00:00.000Z",
  "endDate": "2025-06-17T00:00:00.000Z",
  "daysRemaining": 3,
  "result": null,
  "myRole": "challenger",
  "progress": {
    "challenger": {
      "userId": "uuid-a",
      "name": "María García",
      "tasksCompleted": 12,
      "totalTasks": 15,
      "completionPercentage": 80.0,
      "xpEarned": 380
    },
    "opponent": {
      "userId": "uuid-b",
      "name": "Carlos López",
      "tasksCompleted": 8,
      "totalTasks": 10,
      "completionPercentage": 80.0,
      "xpEarned": 250
    }
  }
}
```

---

## 📦 Dependencias principales

| Dependencia       | Versión | Uso                                          |
| ----------------- | ------- | -------------------------------------------- |
| @nestjs/common    | 11      | Framework NestJS                             |
| @nestjs/mongoose  | 11      | Integración Mongoose con NestJS              |
| mongoose          | 9.4     | ODM para MongoDB                             |
| @nestjs/axios     | 4.0     | Cliente HTTP para llamadas a otros servicios |
| class-validator   | 0.15    | Validación de DTOs                           |
| class-transformer | 0.5     | Transformación de objetos                    |
| eureka-js-client  | 4.5     | Registro en Eureka                           |
| @nestjs/swagger   | 11.2    | Documentación automática de la API           |
| helmet            | 8.1     | Headers de seguridad HTTP                    |

---

[← Volver al README principal](../README.md)
