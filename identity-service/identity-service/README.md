<div align="center">

# 🔐 Identity Service

**Autenticación, gestión de usuarios y auditoría**

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-Access_Token-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**Puerto:** `8081` · **Base de datos:** PostgreSQL · **ORM:** Hibernate / JPA

</div>

---

## 📖 Descripción

El Identity Service es el núcleo de seguridad de GoalQuest. Maneja el registro e inicio de sesión de usuarios, emite y valida tokens JWT, expone información de perfiles, y registra un log de auditoría de todas las acciones relevantes del sistema.

Es consumido por **todos los demás microservicios** para validar tokens a través del endpoint interno `/auth/validate-token`.

---

## 🏗️ Arquitectura interna

```
identity-service/
├── controller/
│   ├── AuthController.java        # /auth/*
│   ├── UserController.java        # /users/*
│   └── AuditController.java       # /audit/*
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   └── AuditLogService.java
├── entity/
│   ├── User.java                  # Tabla users (UUID primary key)
│   └── AuditLog.java              # Tabla audit_log
├── dto/                           # ← Patrón DTO
│   ├── RegisterRequestDTO.java
│   ├── LoginResponseDTO.java
│   ├── UserDTO.java
│   └── ValidateTokenResponseDTO.java
├── security/
│   ├── JwtService.java            # Generación y validación JWT
│   ├── JwtAuthenticationFilter.java
│   └── InternalServiceKeyFilter.java
├── config/
│   ├── SecurityConfig.java
│   ├── GamificationClient.java    # Feign client → Gamification Service
│   └── DataInitializer.java       # Crea usuario ADMIN al arrancar
└── repository/
    ├── UserRepository.java
    └── AuditLogRepository.java
```

### Patrón DTO con Hibernate/JPA

Este servicio implementa el patrón arquitectónico **DTO (Data Transfer Object)** usando **Hibernate/JPA** como ORM para la capa de persistencia relacional:

- Las **Entidades JPA** (`User`, `AuditLog`) representan el modelo de base de datos
- Los **DTOs** (`UserDTO`, `RegisterRequestDTO`, `LoginResponseDTO`, etc.) desacoplan la representación externa de los datos del modelo interno
- Hibernate maneja automáticamente el mapeo objeto-relacional y la creación del esquema (`ddl-auto: update`)

---

## 🗄️ Modelo de datos

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    hash_password VARCHAR(255) NOT NULL,
    rol           VARCHAR(20) DEFAULT 'USER',     -- 'USER' | 'ADMIN'
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,   -- 'LOGIN' | 'LOGOUT' | etc.
    description TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 Endpoints

### Autenticación pública

| Método | Endpoint               | Auth            | Descripción                       |
| ------ | ---------------------- | --------------- | --------------------------------- |
| `POST` | `/auth/register`       | ❌              | Registrar nuevo usuario           |
| `POST` | `/auth/login`          | ❌              | Login → retorna JWT               |
| `POST` | `/auth/logout`         | ✅ Bearer       | Cerrar sesión                     |
| `POST` | `/auth/validate-token` | 🔑 Internal Key | Validar JWT (uso entre servicios) |

### Usuarios

| Método  | Endpoint          | Auth      | Descripción                |
| ------- | ----------------- | --------- | -------------------------- |
| `GET`   | `/users/profile`  | ✅ Bearer | Obtener mi perfil          |
| `PATCH` | `/users/profile`  | ✅ Bearer | Editar mi perfil           |
| `GET`   | `/users/{userId}` | ✅ Bearer | Perfil público por ID      |
| `GET`   | `/users`          | ✅ Bearer | Buscar usuarios (paginado) |

### Auditoría

| Método | Endpoint      | Auth              | Descripción                 |
| ------ | ------------- | ----------------- | --------------------------- |
| `GET`  | `/audit/logs` | ✅ Bearer (ADMIN) | Consultar logs de auditoría |
| `POST` | `/audit/logs` | 🔑 Internal Key   | Registrar log (uso interno) |

---

## ⚙️ Configuración

### Variables de entorno

| Variable               | Descripción                             | Ejemplo                  |
| ---------------------- | --------------------------------------- | ------------------------ |
| `DB_HOST`              | Host de PostgreSQL                      | `identity-db`            |
| `DB_PORT`              | Puerto de PostgreSQL                    | `5432`                   |
| `DB_NAME`              | Nombre de la base de datos              | `goalquest_identity`     |
| `DB_USER`              | Usuario de PostgreSQL                   | `postgres`               |
| `DB_PASSWORD`          | Contraseña                              | `postgres_secret`        |
| `JWT_SECRET`           | Secreto para firmar JWT (mín. 32 chars) | `my-super-secret-key...` |
| `JWT_EXPIRATION`       | Tiempo de expiración en segundos        | `86400`                  |
| `INTERNAL_SERVICE_KEY` | Clave compartida entre microservicios   | `goalquest-internal-...` |
| `EUREKA_HOST`          | Host del servidor Eureka                | `eureka-server`          |
| `EUREKA_INSTANCE_HOST` | Hostname propio del servicio            | `identity-service`       |
| `ADMIN_EMAIL`          | Email del usuario admin inicial         | `admin@goalquest.com`    |
| `ADMIN_PASSWORD`       | Contraseña del usuario admin inicial    | `admin12345`             |
| `ADMIN_NAME`           | Nombre del usuario admin inicial        | `Admin GoalQuest`        |

### Archivo de configuración

```
identity-service/src/main/resources/application.yml
```

---

## 🚀 Ejecución

### Con Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up identity-service -d
```

### Local (desarrollo)

```bash
cd identity-service/identity-service

# Requiere Java 17 y Maven instalados
mvn clean install -DskipTests
mvn spring-boot:run
```

### Compilar JAR

```bash
mvn clean package -DskipTests
java -jar target/identity-service-1.0.0.jar
```

---

## 🔒 Seguridad

### Autenticación Bearer Token

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <jwt_token>
```

### Clave interna entre microservicios

Los endpoints internos (`/auth/validate-token`, `POST /audit/logs`) requieren:

```
X-Internal-Service-Key: <INTERNAL_SERVICE_KEY>
```

### Flujo de validación de token

Cuando otro microservicio recibe una petición con un JWT, llama a:

```bash
POST /auth/validate-token
Content-Type: application/json
X-Internal-Service-Key: <clave>

{ "token": "<jwt>" }
```

Respuesta:

```json
{
  "valid": true,
  "user_id": "uuid-del-usuario",
  "email": "usuario@email.com",
  "rol": "USER"
}
```

---

## 🧪 Ejemplos de uso

### Registro

```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "password123"
  }'
```

Respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "María García",
    "email": "maria@example.com",
    "rol": "USER"
  }
}
```

### Verificar salud del servicio

```bash
curl http://localhost:8081/actuator/health
```

---

## 📦 Dependencias principales

| Dependencia                        | Versión  | Uso                         |
| ---------------------------------- | -------- | --------------------------- |
| Spring Boot Starter Web            | 3.2.5    | Framework web               |
| Spring Boot Starter Data JPA       | 3.2.5    | ORM + Hibernate             |
| Spring Boot Starter Security       | 3.2.5    | Seguridad                   |
| Spring Cloud Netflix Eureka Client | 2023.0.1 | Service discovery           |
| Spring Cloud OpenFeign             | 2023.0.1 | Cliente HTTP declarativo    |
| jjwt (io.jsonwebtoken)             | 0.11.5   | Generación y validación JWT |
| PostgreSQL Driver                  | runtime  | Conexión a PostgreSQL       |
| Lombok                             | optional | Reducción de boilerplate    |

---

[← Volver al README principal](../../README.md)
