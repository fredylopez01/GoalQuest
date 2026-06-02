# GoalQuest — Istio Service Mesh

Guía completa de instalación y operación del Service Mesh con Istio para el proyecto GoalQuest.

---

## Qué hace Istio por GoalQuest

Sin tocar **ninguna línea de código** de los microservicios, Istio aporta:

| Característica               | Cómo lo hace Istio                    | Beneficio en GoalQuest                                                          |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| **mTLS automático**          | Sidecar Envoy negocia TLS entre pods  | Toda comunicación identity↔task↔gamification↔challenge va cifrada               |
| **Circuit Breaker**          | `outlierDetection` en DestinationRule | Si gamification-service falla, task-service no colapsa en cascada               |
| **Retry automático**         | `retries` en VirtualService           | Un fallo transitorio al completar tarea se reintenta sin que el usuario lo note |
| **Timeout controlado**       | `timeout` en VirtualService           | Las llamadas de task→gamification nunca bloquean más de 30s                     |
| **Observabilidad completa**  | Telemetry API + sidecars              | Kiali muestra el grafo en tiempo real; Jaeger traza cada request                |
| **Autorización declarativa** | AuthorizationPolicy                   | Solo task-service puede llamar a `/gamification/task-completed`                 |
| **Trazas distribuidas**      | Jaeger + Envoy headers                | Ver el camino completo: usuario → task → gamification → challenge               |

---

## Estructura de archivos

```
goalquest/
├── kind-cluster.yaml                   ← Config del cluster Kubernetes local
├── k8s/
│   ├── namespaces/namespaces.yaml      ← Namespaces con istio-injection=enabled
│   ├── secrets/secrets.yaml            ← Variables de entorno como Secrets de K8s
│   ├── configmaps/mongodb-init.yaml    ← Script de inicialización de MongoDB
│   └── deployments/
│       ├── databases.yaml              ← PostgreSQL, MongoDB, Redis
│       └── microservices.yaml          ← Los 5 microservicios con readiness/liveness probes
├── istio/
│   ├── install.sh                      ← Script de instalación completa (ejecutar primero)
│   ├── verify.sh                       ← Verificar que todo funciona
│   ├── port-forward-observability.sh   ← Abrir dashboards de observabilidad
│   ├── base/
│   │   └── gateway-virtualservices.yaml ← Gateway, VirtualServices, DestinationRules
│   ├── security/
│   │   └── mtls-authz.yaml            ← mTLS STRICT + AuthorizationPolicies
│   ├── traffic/
│   │   └── advanced-traffic.yaml      ← HPA, PDB, Fault injection (opcional)
│   └── observability/
│       └── telemetry.yaml             ← Telemetry API (métricas, trazas, logs)
└── task-service.prod.Dockerfile        ← Dockerfile de producción para task-service
```

---

## Instalación paso a paso

### Prerrequisitos

```bash
# 1. Docker (ya lo tienes)
docker --version   # >= 24.x

# 2. kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# 3. kind (Kubernetes IN Docker)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind

# 4. istioctl
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.21.0 sh -
cd istio-1.21.0
# Agregar permanentemente al PATH:
echo 'export PATH=$HOME/istio-1.21.0/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
# Verificar:
istioctl version
```

### Instalación automática (recomendada)

Desde la raíz del proyecto GoalQuest:

```bash
chmod +x istio/install.sh
chmod +x istio/verify.sh
chmod +x istio/port-forward-observability.sh

# Ejecutar instalación completa (~10-15 minutos)
./istio/install.sh
```

### Instalación manual (paso a paso)

Si prefieres entender cada paso:

```bash
# ── PASO 1: Cluster ─────────────────────────────────────────────────
kind create cluster --config=kind-cluster.yaml --name=goalquest
kubectl cluster-info --context kind-goalquest

# Verificar el cluster y contexto:
kubectl cluster-info
kubectl get nodes
kubectl config current-context

# ── PASO 2: Construir imágenes ───────────────────────────────────────
# Eureka
docker build -t goalquest/eureka-server:latest ./identity-service/eureka-server
kind load docker-image goalquest/eureka-server:latest --name goalquest

# Identity
docker build -t goalquest/identity-service:latest ./identity-service/identity-service
kind load docker-image goalquest/identity-service:latest --name goalquest

# Task (usar Dockerfile de producción)
docker build -t goalquest/task-service:latest \
  -f ./task-service/Dockerfile.prod ./task-service
kind load docker-image goalquest/task-service:latest --name goalquest

# Gamification
docker build -t goalquest/gamification-service:latest ./gamification-service
kind load docker-image goalquest/gamification-service:latest --name goalquest

# Challenge
docker build -t goalquest/challenge-service:latest ./challenge-service
kind load docker-image goalquest/challenge-service:latest --name goalquest

# Verificar que las imagenes fueron cargadas correctamente
docker exec -it goalquest-control-plane crictl images

# ── PASO 3: Instalar Istio ───────────────────────────────────────────
istioctl install --set profile=demo -y

# Verificar istiod
kubectl wait --for=condition=available --timeout=120s \
  deployment/istiod -n istio-system

# ── PASO 4: Addons de observabilidad ────────────────────────────────
ADDONS="https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons"
kubectl apply -f $ADDONS/prometheus.yaml
kubectl apply -f $ADDONS/grafana.yaml
kubectl apply -f $ADDONS/jaeger.yaml
kubectl wait --for=condition=available --timeout=120s \
  deployment/prometheus -n istio-system
kubectl apply -f $ADDONS/kiali.yaml

# ── PASO 5: Namespace + Secrets ─────────────────────────────────────
kubectl apply -f k8s/namespaces/namespaces.yaml
kubectl apply -f k8s/secrets/secrets.yaml
kubectl apply -f k8s/configmaps/mongodb-init.yaml

# ── PASO 6: Bases de datos ───────────────────────────────────────────
kubectl apply -f k8s/deployments/databases.yaml
kubectl wait --for=condition=available --timeout=180s \
  deployment/identity-db deployment/tasks-db \
  deployment/mongodb-challenges deployment/mongodb-gamification \
  deployment/redis -n goalquest

# ── PASO 7: Microservicios ───────────────────────────────────────────
kubectl apply -f k8s/deployments/microservices.yaml
kubectl wait --for=condition=available --timeout=180s \
  deployment/eureka-server deployment/identity-service \
  deployment/task-service deployment/gamification-service \
  deployment/challenge-service -n goalquest

# ── PASO 8: Recursos Istio ───────────────────────────────────────────
kubectl apply -f istio/base/gateway-virtualservices.yaml
kubectl apply -f istio/security/mtls-authz.yaml
kubectl apply -f istio/observability/telemetry.yaml

# ── PASO 9: Tráfico avanzado (opcional) ─────────────────────────────
kubectl apply -f istio/traffic/advanced-traffic.yaml
```

---

## Verificar la instalación

```bash
./istio/verify.sh
```

O manualmente:

```bash
# Ver todos los pods (cada uno debe tener 2/2 containers: app + istio-proxy)
kubectl get pods -n goalquest

# Ejemplo de salida esperada:
# NAME                                    READY   STATUS    RESTARTS
# challenge-service-xxx                   2/2     Running   0
# gamification-service-xxx                2/2     Running   0
# identity-service-xxx                    2/2     Running   0
# task-service-xxx                        2/2     Running   0
# eureka-server-xxx                       2/2     Running   0
# identity-db-xxx                         2/2     Running   0
# ...

# Verificar que mTLS está activo
kubectl get peerauthentication -n goalquest

# Ver VirtualServices
kubectl get virtualservices -n goalquest

# Analizar configuración Istio
istioctl analyze -n goalquest
```

---

## Acceder a los dashboards

```bash
# Abrir todos los dashboards en paralelo
./istio/port-forward-observability.sh
```

O uno a uno:

```bash
# Kiali - mapa visual del mesh
kubectl port-forward svc/kiali -n istio-system 20001:20001
# → http://localhost:20001

# Grafana - dashboards de métricas
kubectl port-forward svc/grafana -n istio-system 3000:3000
# → http://localhost:3000
# Usuario: admin / Contraseña: admin

# Prometheus - consultas de métricas
kubectl port-forward svc/prometheus -n istio-system 9090:9090
# → http://localhost:9090

# Jaeger - trazas distribuidas
kubectl port-forward svc/tracing -n istio-system 16686:80
# → http://localhost:16686
```

---

## Dashboards recomendados en Grafana

En Grafana, importar los dashboards oficiales de Istio:

| Dashboard ID | Nombre                      | Descripción           |
| ------------ | --------------------------- | --------------------- |
| `7630`       | Istio Mesh Dashboard        | Vista global del mesh |
| `7636`       | Istio Service Dashboard     | Métricas por servicio |
| `7630`       | Istio Workload Dashboard    | Métricas por workload |
| `7642`       | Istio Performance Dashboard | Latencia y throughput |

Ir a Grafana → "+" → Import → pegar el ID → Load.

---

## Comandos útiles de operación

```bash
# Ver logs del proxy Envoy de un pod (muy útil para debug)
kubectl logs <nombre-del-pod> -n goalquest -c istio-proxy

# Ver configuración del proxy Envoy de un servicio
istioctl proxy-config all deployment/identity-service -n goalquest

# Ver certificados mTLS activos
istioctl proxy-config secret deployment/task-service -n goalquest

# Ver las rutas configuradas en Envoy
istioctl proxy-config route deployment/task-service -n goalquest

# Ver los listeners
istioctl proxy-config listener deployment/identity-service -n goalquest

# Abrir Kiali directamente con istioctl
istioctl dashboard kiali

# Abrir Grafana
istioctl dashboard grafana

# Abrir Jaeger
istioctl dashboard jaeger

# Ver el tráfico en tiempo real entre servicios
kubectl exec deployment/task-service -n goalquest -c istio-proxy \
  -- pilot-agent request GET /stats/prometheus | grep istio_requests

# Forzar re-inyección de sidecar (si cambias la configuración)
kubectl rollout restart deployment -n goalquest

# Ver métricas de Istio desde Prometheus
# En http://localhost:9090 buscar:
#   istio_requests_total
#   istio_request_duration_milliseconds_bucket
#   istio_tcp_connections_opened_total

# Prueba de Circuit Breaker: ver si un endpoint está siendo eyectado
istioctl proxy-config cluster deployment/task-service -n goalquest \
  | grep identity-service
```

---

## Pruebas de resiliencia

### Probar Circuit Breaker

```bash
# Simular fallo en identity-service y ver cómo task-service maneja
# Escalar identity-service a 0 réplicas
kubectl scale deployment identity-service -n goalquest --replicas=0

# Hacer una petición a task-service (debería fallar rápido, no colgar)
curl -X GET http://localhost:3001/tasks \
  -H "Authorization: Bearer <token>" \
  -w "\nTiempo: %{time_total}s\n"

# Restaurar
kubectl scale deployment identity-service -n goalquest --replicas=1
```

### Probar Fault Injection (activar el bloque comentado en advanced-traffic.yaml)

```bash
# Editar advanced-traffic.yaml y descomentar el VirtualService de fault injection
kubectl apply -f istio/traffic/advanced-traffic.yaml

# Probar con header especial (50% tendrá 3s de delay)
curl -H "x-test-fault: delay" http://localhost:8081/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}' \
  -w "\nTiempo: %{time_total}s\n"

# 30% retornará 503
curl -H "x-test-fault: abort" http://localhost:8081/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}'
```

### Ver trazas de una petición completa

```bash
# Crear un usuario y ver la traza completa en Jaeger
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@test.com", "password": "password123"}'

# Abrir Jaeger: http://localhost:16686
# Service: identity-service → Find Traces
# Verás: identity-service → gamification-service (creación de perfil)
```

---

## Limpiar el entorno

```bash
# Eliminar todos los recursos de GoalQuest
kubectl delete namespace goalquest

# Desinstalar Istio
istioctl uninstall --purge -y
kubectl delete namespace istio-system

# Eliminar el cluster kind
kind delete cluster --name goalquest
```

---

## Preguntas frecuentes

**¿Por qué los pods muestran 2/2 en READY?**
El `2/2` significa que hay 2 containers corriendo: el microservicio (`1`) y el sidecar Envoy de Istio (`istio-proxy`). Eso confirma que la inyección automática funcionó.

**¿Istio reemplaza a Eureka?**
No exactamente. En K8s el DNS nativo (`identity-service.goalquest.svc.cluster.local`) ya resuelve servicios, así que Eureka es redundante. Sin embargo, como el código ya está escrito con Eureka, lo dejamos funcionando. Istio opera en la capa de red por debajo de Eureka, añadiendo mTLS, retry y observabilidad transparentemente.

**¿Cómo sé que mTLS está funcionando?**

```bash
# Debe mostrar "STRICT"
kubectl get peerauthentication goalquest-mtls-strict \
  -n goalquest -o jsonpath='{.spec.mtls.mode}'

# Los pods con sidecar no aceptan tráfico no-TLS
# Verificar con istioctl:
istioctl proxy-config secret deployment/task-service -n goalquest
```

**¿Puedo usar Docker Compose y Kubernetes al mismo tiempo?**
Sí. Docker Compose sirve para desarrollo local rápido. Kubernetes + Istio es para el entorno de integración/producción donde necesitas el service mesh. Son independientes.
