#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# install.sh — GoalQuest + Istio Service Mesh
# Instalación completa desde cero con todos los fixes incorporados.
#
# PREREQUISITOS:
#   - Docker Desktop corriendo
#   - kind, kubectl, istioctl instalados y en PATH
#   - Imágenes Docker ya construidas (o se construyen en el paso 4)
#
# USO:
#   chmod +x install.sh
#   ./install.sh
# ═══════════════════════════════════════════════════════════════════════
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN} $1${NC}"; }
warn() { echo -e "${YELLOW} $1${NC}"; }
err()  { echo -e "${RED}X $1${NC}"; exit 1; }

# ── 0. Verificar prerequisitos ──────────────────────────────────────────
log "Verificando prerequisitos..."
command -v kind      >/dev/null 2>&1 || err "kind no encontrado. Instalar: https://kind.sigs.k8s.io"
command -v kubectl   >/dev/null 2>&1 || err "kubectl no encontrado."
command -v istioctl  >/dev/null 2>&1 || err "istioctl no encontrado. Instalar: https://istio.io/latest/docs/setup/getting-started/"
command -v docker    >/dev/null 2>&1 || err "docker no encontrado."
docker info >/dev/null 2>&1          || err "Docker no está corriendo."
ok "Prerequisitos OK"

# ── 1. Eliminar cluster anterior si existe ──────────────────────────────
if kind get clusters 2>/dev/null | grep -q "goalquest"; then
  warn "Eliminando cluster 'goalquest' existente..."
  kind delete cluster --name goalquest
  ok "Cluster anterior eliminado"
fi

# ── 2. Crear cluster con extraPortMappings ──────────────────────────────
log "Creando cluster kind con port mappings..."
cat <<'KIND_EOF' | kind create cluster --config=- --name=goalquest
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 30000
        hostPort: 8761
        protocol: TCP
      - containerPort: 30081
        hostPort: 8081
        protocol: TCP
      - containerPort: 30001
        hostPort: 3001
        protocol: TCP
      - containerPort: 30800
        hostPort: 8000
        protocol: TCP
      - containerPort: 30002
        hostPort: 3002
        protocol: TCP
KIND_EOF

kubectl cluster-info --context kind-goalquest
ok "Cluster creado"

# ── 3. Instalar Istio ────────────────────────────────────────────────────
log "Instalando Istio (perfil demo)..."
istioctl install --set profile=demo -y
kubectl wait --for=condition=available --timeout=180s deployment/istiod -n istio-system
ok "Istio listo"

# ── 4. Addons de observabilidad ──────────────────────────────────────────
log "Instalando Prometheus, Grafana, Jaeger, Kiali..."
ADDONS="https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons"
kubectl apply -f $ADDONS/prometheus.yaml
kubectl apply -f $ADDONS/grafana.yaml
kubectl apply -f $ADDONS/jaeger.yaml
kubectl wait --for=condition=available --timeout=120s deployment/prometheus -n istio-system
kubectl apply -f $ADDONS/kiali.yaml
ok "Addons listos"

# ── 5. Construir imágenes Docker ─────────────────────────────────────────
log "Construyendo imágenes Docker..."
docker build -t goalquest/eureka-server:latest      ./identity-service/eureka-server
docker build -t goalquest/identity-service:latest   ./identity-service/identity-service
docker build -t goalquest/task-service:latest        -f ./task-service/Dockerfile.k8s ./task-service
docker build -t goalquest/task-migrate:latest        -f ./task-service/Dockerfile.migrate ./task-service
docker build -t goalquest/gamification-service:latest ./gamification-service
docker build -t goalquest/challenge-service:latest   ./challenge-service
ok "Imágenes construidas"

log "Cargando imágenes en kind..."
for img in eureka-server identity-service task-service task-migrate gamification-service challenge-service; do
  kind load docker-image goalquest/$img:latest --name goalquest
done
ok "Imágenes cargadas"

# ── 6. Namespace con inyección automática de sidecar ────────────────────
log "Creando namespace goalquest con Istio injection..."
kubectl apply -f k8s/namespaces/namespaces.yaml
# Verificar que el namespace tiene el label de inyección
kubectl label namespace goalquest istio-injection=enabled --overwrite
ok "Namespace listo"

# ── 7. Secrets y configmaps ──────────────────────────────────────────────
log "Aplicando secrets y configmaps..."
kubectl apply -f k8s/secrets/secrets.yaml
kubectl apply -f k8s/configmaps/mongodb-init.yaml
ok "Secrets y configmaps aplicados"

# ── 8. Bases de datos ────────────────────────────────────────────────────
log "Desplegando bases de datos..."
kubectl apply -f k8s/deployments/databases.yaml
kubectl wait --for=condition=available --timeout=300s \
  deployment/identity-db deployment/tasks-db \
  deployment/mongodb-challenges deployment/mongodb-gamification \
  deployment/redis -n goalquest
ok "Bases de datos listas"

# ── 9. DestinationRules CRÍTICAS — deben aplicarse ANTES de los servicios
#    Sin esto, Envoy intercepta conexiones a DBs con mTLS y las resetea ──
log "Aplicando DestinationRules para bases de datos (DISABLE mTLS)..."
kubectl apply -f - <<'DR_EOF'
# PostgreSQL
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: identity-db-dr
  namespace: goalquest
spec:
  host: identity-db.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: tasks-db-dr
  namespace: goalquest
spec:
  host: tasks-db.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
# MongoDB
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: mongodb-gamification-dr
  namespace: goalquest
spec:
  host: mongodb-gamification.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: mongodb-challenges-dr
  namespace: goalquest
spec:
  host: mongodb-challenges.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
# Redis
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: redis-dr
  namespace: goalquest
spec:
  host: redis.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
# Eureka — plain TCP (los clientes Node/Python no hablan mTLS nativamente)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: eureka-server-dr
  namespace: goalquest
spec:
  host: eureka-server.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
---
# Microservicios entre sí — mTLS para que Kiali vea el grafo
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: identity-service-dr
  namespace: goalquest
spec:
  host: identity-service.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: task-service-dr
  namespace: goalquest
spec:
  host: task-service.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: gamification-service-dr
  namespace: goalquest
spec:
  host: gamification-service.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: challenge-service-dr
  namespace: goalquest
spec:
  host: challenge-service.goalquest.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
DR_EOF
ok "DestinationRules aplicadas"

# ── 10. PeerAuthentication PERMISSIVE ────────────────────────────────────
log "Aplicando PeerAuthentication PERMISSIVE..."
kubectl apply -f - <<'PA_EOF'
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: goalquest-permissive
  namespace: goalquest
spec:
  mtls:
    mode: PERMISSIVE
PA_EOF
ok "PeerAuthentication aplicada"

# ── 11. Microservicios ───────────────────────────────────────────────────
log "Desplegando microservicios..."
kubectl apply -f k8s/deployments/microservices.yaml

log "Esperando eureka-server (puede tardar ~60s)..."
kubectl wait --for=condition=available --timeout=180s deployment/eureka-server -n goalquest
ok "Eureka listo"

log "Esperando demás microservicios..."
kubectl wait --for=condition=available --timeout=300s \
  deployment/identity-service \
  deployment/gamification-service \
  deployment/challenge-service -n goalquest
kubectl wait --for=condition=available --timeout=360s deployment/task-service -n goalquest
ok "Microservicios listos"

# ── 12. Configuración Istio (gateway, virtual services, telemetría) ───────
log "Aplicando configuración Istio..."
kubectl apply -f istio/base/gateway-virtualservices.yaml
kubectl apply -f istio/security/mtls-authz.yaml
kubectl apply -f istio/observability/telemetry.yaml
ok "Istio configurado"

# ── 13. Resumen final ────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     GoalQuest + Istio instalado correctamente        ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
kubectl get pods -n goalquest
echo ""
echo "Servicios (accesibles por NodePort gracias a extraPortMappings):"
echo "  Eureka:        http://localhost:8761"
echo "  Identity:      http://localhost:8081/swagger-ui.html"
echo "  Task:          http://localhost:3001/api/docs"
echo "  Gamification:  http://localhost:8000/docs"
echo "  Challenge:     http://localhost:3002/api/docs"
echo ""
echo "Observabilidad (ejecutar en terminales separadas):"
echo "  Kiali:    kubectl port-forward svc/kiali      20001:20001 -n istio-system"
echo "  Grafana:  kubectl port-forward svc/grafana    3000:3000   -n istio-system"
echo "  Jaeger:   kubectl port-forward svc/tracing    16686:16686 -n istio-system"
echo ""
warn "Espera 2-3 minutos y haz algunas peticiones antes de revisar Kiali"
echo "para que acumule suficientes métricas y aparezca el grafo completo."