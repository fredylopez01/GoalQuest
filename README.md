<div align="center">

<img src="https://img.shields.io/badge/GoalQuest-v1.0.0-1F4E79?style=for-the-badge" alt="GoalQuest" />

# 🎯 GoalQuest

**Plataforma gamificada de gestión de metas personales**

_Completa metas, acumula XP, desbloquea logros y desafía a otros usuarios_

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Spring Eureka](https://img.shields.io/badge/Spring_Eureka-2023.0-6DB33F?style=flat-square&logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud-netflix)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)

</div>

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Microservicios](#-microservicios)
- [Requisitos previos](#-requisitos-previos)
- [Inicio rápido](#-inicio-rápido)
- [Variables de entorno](#-variables-de-entorno)
- [Endpoints principales](#-endpoints-principales)
- [Flujos clave del sistema](#-flujos-clave-del-sistema)
- [Herramientas de administración](#-herramientas-de-administración)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Equipo](#-equipo)

---

## 📖 Descripción

GoalQuest es un sistema de información construido sobre una **arquitectura de microservicios** que permite a los usuarios gestionar sus metas personales de forma gamificada. El sistema integra:

- ✅ **Gestión de metas y tareas** con seguimiento de progreso
- 🏆 **Sistema de gamificación** con XP, niveles, logros y rachas diarias
- ⚔️ **Desafíos entre usuarios** con métricas de competencia
- 📊 **Reportes semanales** y análisis de tendencias de productividad
- 🔐 **Autenticación JWT** con auditoría de acciones

> Proyecto desarrollado para el **Reto Primer Corte – Ingeniería de Software II**  
> Universidad Pedagógica y Tecnológica de Colombia – Escuela de Ingeniería de Sistemas

---

## 🏛️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EUREKA SERVER  :8761                              │
│              Service Registry + Service Discovery                    │
│                     (Spring Cloud Netflix)                           │
└──────┬───────────────┬───────────────┬──────────────────┬───────────┘
       │               │               │                  │
       ▼               ▼               ▼                  ▼
  ┌─────────┐    ┌──────────┐   ┌────────────┐    ┌───────────┐
  │Identity │    │  Task    │   │Gamification│    │ Challenge │
  │Service  │    │ Service  │   │  Service   │    │  Service  │
  │  :8081  │    │  :3001   │   │   :8000    │    │   :3002   │
  │ Java/SB │    │  NestJS  │   │  FastAPI   │    │  NestJS   │
  └────┬────┘    └────┬─────┘   └─────┬──────┘    └─────┬─────┘
       │              │               │                  │
       ▼              ▼               ▼                  ▼
  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  ┌──────────┐
  │PostgreSQL│  │PostgreSQL│  │ Redis + MongoDB │  │ MongoDB  │
  │  :5432   │  │  :5433   │  │ :6379 + :27017  │  │  :27018  │
  └──────────┘  └──────────┘  └─────────────────┘  └──────────┘
```

### Stack tecnológico

| Microservicio         | Lenguaje / Framework | Base de Datos   | Puerto | ORM / ODM         |
| --------------------- | -------------------- | --------------- | ------ | ----------------- |
| **Eureka Server**     | Java Spring Boot     | —               | 8761   | —                 |
| **Identity Service**  | Java Spring Boot     | PostgreSQL      | 8081   | Hibernate / JPA   |
| **Task Service**      | TypeScript / NestJS  | PostgreSQL      | 3001   | Prisma            |
| **Gamification Svc**  | Python / FastAPI     | Redis + MongoDB | 8000   | redis-py + Beanie |
| **Challenge Service** | TypeScript / NestJS  | MongoDB         | 3002   | Mongoose          |

---

## 🔧 Microservicios

| Servicio                                          | Descripción                                        | README                                                     |
| ------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| [`identity-service`](./identity-service/)         | Autenticación JWT, gestión de usuarios y auditoría | [📄 README](./identity-service/identity-service/README.md) |
| [`task-service`](./task-service/)                 | Gestión de metas, tareas y completaciones          | [📄 README](./task-service/README.md)                      |
| [`gamification-service`](./gamification-service/) | XP, niveles, logros, rachas y leaderboard          | [📄 README](./gamification-service/README.md)              |
| [`challenge-service`](./challenge-service/)       | Desafíos entre usuarios y seguimiento de progreso  | [📄 README](./challenge-service/README.md)                 |

---

## 📦 Requisitos previos

Asegúrate de tener instalado:

| Herramienta    | Versión mínima | Verificar                |
| -------------- | -------------- | ------------------------ |
| Docker         | 24.x           | `docker --version`       |
| Docker Compose | 2.x            | `docker compose version` |
| Git            | 2.x            | `git --version`          |

> **Nota:** No necesitas tener Java, Node.js ni Python instalados localmente. Todo corre dentro de contenedores Docker.

---

## 🚀 Inicio rápido

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd goalquest
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

> Para desarrollo local, los valores por defecto en `.env.example` son suficientes. En producción, **cambia todas las contraseñas y secretos**.

### 3. Levantar el sistema completo

```bash
docker compose up --build -d
```

Este comando levanta **10 contenedores**:

- 1 Eureka Server
- 4 Microservicios
- 2 instancias PostgreSQL
- 2 instancias MongoDB
- 1 Redis
- 1 Mongo Express (herramienta de admin)

### 4. Verificar que todo esté corriendo

```bash
docker compose ps
```

Todos los contenedores deben mostrar estado `Up` o `healthy`.

### 5. Confirmar registro en Eureka

Abre **http://localhost:8761** — deberías ver los 4 microservicios registrados:

```
CHALLENGE-SERVICE    ✅ UP
GAMIFICATION-SERVICE ✅ UP
IDENTITY-SERVICE     ✅ UP
TASK-SERVICE         ✅ UP
```

### 6. Crear tu primer usuario

```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Tu Nombre", "email": "tu@email.com", "password": "password123"}'
```

---

## 🔌 Endpoints

### Identity Service (:8081)

| Método  | Endpoint               | Descripción             |
| ------- | ---------------------- | ----------------------- |
| `POST`  | `/auth/register`       | Registro                |
| `POST`  | `/auth/login`          | Login → JWT             |
| `POST`  | `/auth/logout`         | Logout                  |
| `POST`  | `/auth/validate-token` | Validar token (interno) |
| `GET`   | `/users/profile`       | Mi perfil               |
| `PATCH` | `/users/profile`       | Editar perfil           |
| `GET`   | `/users/{id}`          | Usuario por ID          |
| `GET`   | `/users`               | Buscar usuarios         |
| `GET`   | `/audit/logs`          | Logs (admin)            |
| `POST`  | `/audit/logs`          | Registrar log (interno) |

### Task Service (:3001)

| Método   | Endpoint               | Descripción              |
| -------- | ---------------------- | ------------------------ |
| `POST`   | `/goals`               | Crear meta               |
| `GET`    | `/goals`               | Listar metas             |
| `GET`    | `/goals/:id`           | Detalle meta             |
| `PATC`   | `/goals/:id`           | Editar meta              |
| `DELETE` | `/goals/:id`           | Eliminar meta            |
| `PATC`   | `/goals/:id/reopen`    | Reabrir meta             |
| `POST`   | `/tasks`               | Crear tarea              |
| `GET`    | `/tasks`               | Listar tareas            |
| `GET`    | `/tasks/:id`           | Detalle tarea            |
| `PATC`   | `/tasks/:id`           | Editar tarea             |
| `DELETE` | `/tasks/:id`           | Eliminar tarea           |
| `PATC`   | `/tasks/:id/complete`  | Completar tarea          |
| `GET`    | `/tasks/daily-summary` | Resumen diario           |
| `GET`    | `/tasks/completions`   | Historial completaciones |

### Gamification Service (:8000)

| Método | Endpoint                                 | Descripción                |
| ------ | ---------------------------------------- | -------------------------- |
| `POST` | `/gamification/profile`                  | Crear perfil (interno)     |
| `GET`  | `/gamification/profile/{user_id}`        | Perfil de progreso         |
| `POST` | `/gamification/task-completed`           | Procesar tarea (interno)   |
| `POST` | `/gamification/challenge-completed`      | Procesar desafío (interno) |
| `GET`  | `/gamification/achievements/catalog`     | Catálogo logros            |
| `POST` | `/gamification/achievements`             | Crear logro (admin)        |
| `GET`  | `/gamification/achievements/{user_id}`   | Logros del usuario         |
| `GET`  | `/gamification/xp-history/{user_id}`     | Historial XP               |
| `GET`  | `/gamification/streak/{user_id}`         | Info racha                 |
| `POST` | `/gamification/streak/check-reset`       | Reset rachas (cron)        |
| `GET`  | `/gamification/leaderboard`              | Ranking                    |
| `POST` | `/gamification/reports/weekly`           | Generar reporte (cron)     |
| `GET`  | `/gamification/reports/weekly/{user_id}` | Reportes semanales         |
| `GET`  | `/gamification/trends/{user_id}`         | Tendencias                 |

### Challenge Service (:3002)

| Método  | Endpoint                      | Descripción                   |
| ------- | ----------------------------- | ----------------------------- |
| `POST`  | `/challenges`                 | Crear desafío                 |
| `GET`   | `/challenges`                 | Listar desafíos               |
| `GET`   | `/challenges/:id`             | Detalle desafío               |
| `PATCH` | `/challenges/:id/accept`      | Aceptar                       |
| `PATCH` | `/challenges/:id/reject`      | Rechazar                      |
| `PATCH` | `/challenges/:id/cancel`      | Cancelar                      |
| `POST`  | `/challenges/update-progress` | Actualizar progreso (interno) |
| `POST`  | `/challenges/check-expired`   | Verificar expirados (cron)    |

> 📚 Documentación Swagger completa disponible en:
>
> - Identity Service: `http://localhost:8081/swagger-ui.html`
> - Task Service: `http://localhost:3001/api/docs`
> - Gamification Service: `http://localhost:8000/docs`
> - Challenge Service: `http://localhost:3002/api/docs`

---

## 🛠️ Herramientas de administración

Una vez levantado el sistema con Docker Compose:

| Herramienta                | URL                                   | Descripción                        |
| -------------------------- | ------------------------------------- | ---------------------------------- |
| **Eureka Dashboard**       | http://localhost:8761                 | Estado de todos los microservicios |
| **Mongo Express**          | http://localhost:8082                 | Explorador visual para MongoDB     |
| **Swagger – Identity**     | http://localhost:8081/swagger-ui.html | API docs Identity Service          |
| **Swagger – Tasks**        | http://localhost:3001/api/docs        | API docs Task Service              |
| **Swagger – Gamification** | http://localhost:8000/docs            | API docs Gamification Service      |
| **Swagger – Challenges**   | http://localhost:3002/api/docs        | API docs Challenge Service         |

---

## 📁 Estructura del repositorio

```
goalquest/
│
├── 📄 docker-compose.yml          # Orquestación de todos los contenedores
├── 📄 .env.example                # Plantilla de variables de entorno
├── 📄 .gitignore
│
├── 📂 identity-service/
│   ├── eureka-server/             # Spring Eureka Server (:8761)
│   └── identity-service/         # Auth, usuarios y auditoría (:8081)
│
├── 📂 task-service/               # Metas y tareas (:3001)
│   ├── prisma/                    # Schema y migraciones
│   └── src/
│       ├── goals/                 # Módulo de metas
│       ├── tasks/                 # Módulo de tareas
│       ├── clients/               # Clientes HTTP (Gamification, Challenge, Identity)
│       └── eureka/                # Registro en Eureka
│
├── 📂 gamification-service/       # XP, logros, rachas (:8000)
│   └── app/
│       ├── models/                # Documentos Beanie (MongoDB)
│       ├── routers/               # Endpoints FastAPI
│       ├── services/              # Lógica de negocio
│       └── schemas/               # DTOs Pydantic
│
└── 📂 challenge-service/          # Desafíos entre usuarios (:3002)
    └── src/
        ├── challenges/            # Módulo de desafíos
        └── eureka/                # Registro en Eureka
```

---

## 👥 Equipo

| Desarrollador | Servicios responsable            | Tecnología          |
| ------------- | -------------------------------- | ------------------- |
| **Dev A**     | Eureka Server + Identity Service | Java / Spring Boot  |
| **Dev B**     | Task Service + Challenge Service | TypeScript / NestJS |
| **Dev C**     | Gamification Service             | Python / FastAPI    |

---

## 📜 Comandos útiles

```bash
# Ver logs de un servicio específico
docker compose logs -f identity-service

# Reiniciar un servicio sin bajar los demás
docker compose restart gamification-service

# Detener todo el sistema
docker compose down

# Detener y eliminar volúmenes (BORRA los datos)
docker compose down -v

# Ver el estado de los contenedores
docker compose ps

# Acceder a la shell de un contenedor
docker exec -it goalquest-identity bash
```

---

<div align="center">

**GoalQuest** · Ingeniería de Software II · UPTC 2025

</div>

## Convenciones

- **IDs de usuario:** UUID (string)
- **Fechas:** ISO 8601
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`)
- **Branches:** `feature/<servicio>/<descripcion>`
