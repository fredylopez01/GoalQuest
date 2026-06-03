#!/bin/bash
set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${CYAN}▶ $1${NC}"; }
ok()  { echo -e "${GREEN}✅ $1${NC}"; }

# ── 1. Crear cluster ─────────────────────────────────────
log "Creando cluster kind..."
kind create cluster --config=kind-cluster.yaml --name=goalquest
kubectl cluster-info --context kind-goalquest

# ── 2. Instalar Istio ────────────────────────────────────
log "Instalando Istio (perfil demo)..."
istioctl install --set profile=demo -y
kubectl wait --for=condition=available --timeout=120s deployment/istiod -n istio-system
ok "Istio listo"

# ── 3. Addons observabilidad ─────────────────────────────
log "Instalando Prometheus, Grafana, Jaeger, Kiali..."
ADDONS="https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons"
kubectl apply -f $ADDONS/prometheus.yaml
kubectl apply -f $ADDONS/grafana.yaml
kubectl apply -f $ADDONS/jaeger.yaml
kubectl wait --for=condition=available --timeout=120s deployment/prometheus -n istio-system
kubectl apply -f $ADDONS/kiali.yaml
ok "Addons listos"

# ── 4. Construir imágenes ────────────────────────────────
log "Construyendo imágenes Docker..."
docker build -t goalquest/eureka-server:latest ./identity-service/eureka-server
docker build -t goalquest/identity-service:latest ./identity-service/identity-service
docker build -t goalquest/task-service:latest -f ./task-service/Dockerfile.k8s ./task-service
docker build -t goalquest/task-migrate:latest -f ./task-service/Dockerfile.migrate ./task-service
docker build -t goalquest/gamification-service:latest ./gamification-service
docker build -t goalquest/challenge-service:latest ./challenge-service
ok "Imágenes construidas"

log "Cargando imágenes en kind..."
for img in eureka-server identity-service task-service task-migrate gamification-service challenge-service; do
  kind load docker-image goalquest/$img:latest --name goalquest
done
ok "Imágenes cargadas"

# ── 5. Namespace + secrets ───────────────────────────────
log "Creando namespace y secrets..."
kubectl apply -f k8s/namespaces/namespaces.yaml
kubectl apply -f k8s/secrets/secrets.yaml
kubectl apply -f k8s/configmaps/mongodb-init.yaml

# ── 6. Bases de datos ────────────────────────────────────
log "Desplegando bases de datos..."
kubectl apply -f k8s/deployments/databases.yaml
kubectl wait --for=condition=available --timeout=300s \
  deployment/identity-db deployment/tasks-db \
  deployment/mongodb-challenges deployment/mongodb-gamification \
  deployment/redis -n goalquest
ok "Bases de datos listas"

# ── 7. Microservicios ────────────────────────────────────
log "Desplegando microservicios..."
kubectl apply -f k8s/deployments/microservices.yaml
kubectl wait --for=condition=available --timeout=300s \
  deployment/eureka-server deployment/identity-service \
  deployment/gamification-service deployment/challenge-service -n goalquest
# task-service espera un poco más por las migraciones
kubectl wait --for=condition=available --timeout=360s deployment/task-service -n goalquest
ok "Microservicios listos"

# ── 8. Istio config ──────────────────────────────────────
log "Aplicando configuración Istio..."
kubectl apply -f istio/base/gateway-virtualservices.yaml
kubectl apply -f istio/security/mtls-authz.yaml
kubectl apply -f istio/observability/telemetry.yaml
ok "Istio configurado"

echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ GoalQuest + Istio instalado              ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
echo "Servicios disponibles:"
echo "  Eureka:        http://localhost:8761"
echo "  Identity:      http://localhost:8081/swagger-ui.html"
echo "  Task:          http://localhost:3001/api/docs"
echo "  Gamification:  http://localhost:8000/docs"
echo "  Challenge:     http://localhost:3002/api/docs"
echo ""
echo "Para observabilidad ejecuta:"
echo "  ./istio/port-forward-observability.sh"