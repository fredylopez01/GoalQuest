<div align="center">

# 🏆 Gamification Service

**XP, niveles, logros, rachas y leaderboard**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Beanie](https://img.shields.io/badge/Beanie-ODM-47A248?style=flat-square)](https://roman-right.github.io/beanie/)

**Puerto:** `8000` · **Bases de datos:** Redis (tiempo real) + MongoDB (histórico) · **ODM:** Beanie / Motor

</div>

---

## 📖 Descripción

El Gamification Service es el motor de recompensas de GoalQuest. Procesa eventos del sistema (tareas completadas, desafíos ganados) y transforma esas acciones en una experiencia gamificada: puntos de XP, subidas de nivel, rachas consecutivas, desbloqueo de logros y un leaderboard global.

Utiliza **Redis** para mantener datos en tiempo real (XP actual, racha, leaderboard) y **MongoDB** para persistir el historial de eventos y los reportes semanales.

---

## 🏗️ Arquitectura interna

```
gamification-service/
└── app/
    ├── main.py                   # Arranque FastAPI + registro Eureka
    ├── config.py                 # Variables de entorno (Pydantic Settings)
    ├── dependencies.py           # Guards: verify_internal_key, get_current_user_id
    ├── eureka_client.py          # Registro en Eureka Server
    │
    ├── db/
    │   ├── mongodb.py            # Inicialización Beanie con los Document models
    │   └── redis.py              # Conexión asyncio a Redis
    │
    ├── models/                   # ← Documentos Beanie (MongoDB)
    │   ├── achievement.py        # Catálogo de logros
    │   ├── user_achievement.py   # Logros desbloqueados por usuario
    │   ├── xp_history.py         # Historial de XP ganado
    │   └── weekly_report.py      # Reportes semanales de productividad
    │
    ├── schemas/                  # ← DTOs Pydantic
    │   ├── gamification.py       # TaskCompletedEventDTO, GamificationResultDTO, etc.
    │   ├── profile.py            # ProfileResponseDTO, CreateProfileDTO
    │   ├── achievement.py        # AchievementDTO, CreateAchievementDTO
    │   ├── streak.py             # StreakResponseDTO
    │   ├── leaderboard.py        # LeaderboardEntryDTO
    │   └── report.py             # WeeklyReportDTO, TrendResponseDTO
    │
    ├── services/                 # ← Lógica de negocio
    │   ├── gamification_service.py  # Procesamiento de eventos XP
    │   ├── profile_service.py    # Gestión de perfiles Redis
    │   ├── achievement_service.py# Evaluación y desbloqueo de logros
    │   └── report_service.py     # Generación de reportes y tendencias
    │
    └── routers/                  # ← Endpoints FastAPI
        ├── profile.py
        ├── events.py
        ├── achievements.py
        ├── streak.py
        ├── leaderboard.py
        ├── reports.py
        └── xp_history.py
```

### Patrón DTO con Beanie/Motor

Este servicio implementa el patrón **DTO** en Python usando:

- **Documentos Beanie** (heredan de `Document`) como capa de modelo ODM para MongoDB
- **Schemas Pydantic** (`BaseModel`) como capa DTO para validación, serialización y comunicación entre servicios
- El desacoplamiento entre la representación en MongoDB y la respuesta de la API se logra mapeando explícitamente en la capa de servicios

---

## 💾 Modelo de datos

### Redis (datos en tiempo real)

```
KEY: user:{userId}:profile     TYPE: Hash
  xp_total        → int        (XP acumulado total)
  current_level   → int        (Nivel calculado: floor(xp/100) + 1)
  updated_at      → string     (ISO 8601)

KEY: user:{userId}:streak      TYPE: Hash
  consecutive_days → int       (Días consecutivos con tareas completadas)
  last_day         → string    (Última fecha en que se completaron todas las tareas)
  max_streak       → int       (Máxima racha alcanzada)

KEY: user:{userId}:tasks_completed  TYPE: String (counter)
  Incrementa con cada tarea completada (para evaluar logros)

KEY: leaderboard:xp            TYPE: Sorted Set
  Member: userId · Score: xp_total
```

### MongoDB (histórico y configuración)

```python
class XpHistory(Document):        # xp_history
    user_id: str
    xp_awarded: int
    source: Literal["task_completion", "achievement", "challenge_win"]
    source_id: str
    difficulty: Optional[str]
    streak_bonus: int
    created_at: datetime

class Achievement(Document):      # achievements
    code: str                     # Unique identifier
    name: str
    description: str
    condition_type: Literal["streak", "tasks_completed", "level"]
    threshold_value: int
    xp_reward: int

class UserAchievement(Document):  # user_achievements
    user_id: str
    achievement_id: PydanticObjectId
    achievement_code: str
    rewarded_at: datetime

class WeeklyReport(Document):     # weekly_reports
    user_id: str
    start_week: str
    end_week: str
    completed_tasks: int
    total_tasks: int
    completion_percentage: float
    xp_earned: int
    level_reached: int
    trend: Literal["increasing", "stable", "decreasing"]
```

---

## 🔌 Endpoints

### Perfil de progreso

| Método | Endpoint                         | Auth        | Descripción                   |
| ------ | -------------------------------- | ----------- | ----------------------------- |
| `POST` | `/gamification/profile`          | 🔑 Internal | Crear perfil de nuevo usuario |
| `GET`  | `/gamification/profile/{userId}` | ✅ Bearer   | Obtener perfil completo       |

### Eventos internos

| Método | Endpoint                            | Auth        | Descripción                  |
| ------ | ----------------------------------- | ----------- | ---------------------------- |
| `POST` | `/gamification/task-completed`      | 🔑 Internal | ⭐ Procesar tarea completada |
| `POST` | `/gamification/challenge-completed` | 🔑 Internal | Procesar desafío completado  |

### Logros

| Método | Endpoint                              | Auth              | Descripción        |
| ------ | ------------------------------------- | ----------------- | ------------------ |
| `GET`  | `/gamification/achievements/catalog`  | ✅ Bearer         | Catálogo de logros |
| `POST` | `/gamification/achievements`          | ✅ Bearer (ADMIN) | Crear nuevo logro  |
| `GET`  | `/gamification/achievements/{userId}` | ✅ Bearer         | Logros del usuario |

### Historial y racha

| Método | Endpoint                            | Auth        | Descripción             |
| ------ | ----------------------------------- | ----------- | ----------------------- |
| `GET`  | `/gamification/xp-history/{userId}` | ✅ Bearer   | Historial de XP         |
| `GET`  | `/gamification/streak/{userId}`     | ✅ Bearer   | Información de racha    |
| `POST` | `/gamification/streak/check-reset`  | 🔑 Internal | Reiniciar rachas (CRON) |

### Leaderboard y reportes

| Método | Endpoint                                | Auth        | Descripción                 |
| ------ | --------------------------------------- | ----------- | --------------------------- |
| `GET`  | `/gamification/leaderboard`             | ✅ Bearer   | Ranking global por XP       |
| `POST` | `/gamification/reports/weekly`          | 🔑 Internal | Generar reporte semanal     |
| `GET`  | `/gamification/reports/weekly/{userId}` | ✅ Bearer   | Reportes del usuario        |
| `GET`  | `/gamification/trends/{userId}`         | ✅ Bearer   | Tendencias de productividad |

---

## 🎮 Lógica de XP

### Tabla de XP base por dificultad

| Dificultad | XP base |
| ---------- | ------- |
| `easy`     | 10 XP   |
| `middle`   | 25 XP   |
| `high`     | 50 XP   |

### Fórmula de XP total

```
xp_awarded = base_xp + streak_bonus + achievement_bonus

streak_bonus     = consecutive_days × 2
achievement_bonus = Σ xp_reward de nuevos logros desbloqueados
```

### Fórmula de nivel

```
current_level = floor(xp_total / 100) + 1

Nivel 1: 0 - 99 XP
Nivel 2: 100 - 199 XP
Nivel 3: 200 - 299 XP
...
```

### Condiciones de logros

| Tipo              | Condición                                  |
| ----------------- | ------------------------------------------ |
| `streak`          | `consecutive_days >= threshold_value`      |
| `tasks_completed` | `total_tasks_completed >= threshold_value` |
| `level`           | `current_level >= threshold_value`         |

---

## ⚙️ Configuración

### Variables de entorno

| Variable               | Descripción                  | Ejemplo                                |
| ---------------------- | ---------------------------- | -------------------------------------- |
| `MONGODB_URL`          | URL de conexión MongoDB      | `mongodb://mongodb-gamification:27017` |
| `MONGODB_DB`           | Nombre de la base de datos   | `gamification_db`                      |
| `REDIS_URL`            | URL de conexión Redis        | `redis://redis:6379`                   |
| `INTERNAL_SERVICE_KEY` | Clave para llamadas internas | `goalquest-internal-...`               |
| `PORT`                 | Puerto del servicio          | `8000`                                 |
| `EUREKA_SERVER`        | URL del servidor Eureka      | `http://eureka-server:8761/eureka`     |
| `EUREKA_SERVICE_NAME`  | Nombre en Eureka             | `gamification-service`                 |
| `EUREKA_INSTANCE_HOST` | Hostname propio              | `gamification-service`                 |

---

## 🚀 Ejecución

### Con Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up gamification-service -d
```

### Local (desarrollo)

```bash
cd gamification-service
cp .env.example .env   # Editar con tu configuración local

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Ejemplos de uso

### Obtener perfil de gamificación

```bash
curl http://localhost:8000/gamification/profile/{userId} \
  -H "X-User-Id: {userId}"
```

Respuesta:

```json
{
  "user_id": "550e8400-...",
  "xp_total": 285,
  "current_level": 3,
  "xp_to_next_level": 15,
  "xp_progress_percentage": 85.0,
  "streak": {
    "consecutive_days": 4,
    "max_streak": 7,
    "last_day": "2025-06-15"
  },
  "achievements_count": 3,
  "total_achievements": 12
}
```

### Consultar el leaderboard

```bash
curl "http://localhost:8000/gamification/leaderboard?limit=10" \
  -H "X-User-Id: {userId}"
```

---

## 📦 Dependencias principales

| Dependencia       | Versión | Uso                                    |
| ----------------- | ------- | -------------------------------------- |
| fastapi           | 0.135.3 | Framework web async                    |
| uvicorn           | 0.44.0  | Servidor ASGI                          |
| beanie            | 1.25.0  | ODM para MongoDB (async)               |
| motor             | 3.3.2   | Driver async para MongoDB              |
| redis             | 7.4.0   | Cliente async para Redis               |
| pydantic          | 2.12.5  | Validación de datos y DTOs             |
| pydantic-settings | 2.13.1  | Configuración por variables de entorno |
| requests          | 2.33.1  | Registro en Eureka (síncrono)          |

---

[← Volver al README principal](../README.md)
