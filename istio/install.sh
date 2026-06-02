#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  GoalQuest — Script de instalación completa con Istio Service Mesh
#  Ejecutar desde la RAÍZ del proyecto GoalQuest
#  Uso: chmod +x istio/install.sh && ./istio/install.sh
# ═══════════════════════════════════════════════════════════════════

set -e   # salir si cualquier comando falla
set -u   # error si se usa variable no definida

# ── Colores para los logs ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_step()  { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${CYAN}▶ $1${NC}"; }
log_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Verificar prerrequisitos ─────────────────────────────────────────
log_step "Verificando prerrequisitos"

command -v docker   >/dev/null 2>&1 || log_error "Docker no encontrado. Instálalo primero."
command -v kubectl  >/dev/null 2>&1 || log_error "kubectl no encontrado."
command -v kind     >/dev/null 2>&1 || log_error "kind no encontrado. Instala: curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64 && chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind"
command -v istioctl >/dev/null 2>&1 || log_error "istioctl no encontrado. Instala: curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.21.0 sh - && export PATH=\$PWD/istio-1.21.0/bin:\$PATH"

log_ok "Todos los prerrequisitos presentes"

# ── Variables ────────────────────────────────────────────────────────
CLUSTER_NAME="goalquest"
REGISTRY="goalquest"   # prefijo para las imágenes Docker
ISTIO_DIR="$(pwd)/istio"

# ════════════════════════════════════════════════════════════════════
# PASO 1: Crear cluster Kind
# ════════════════════════════════════════════════════════════════════
log_step "PASO 1: Crear cluster Kubernetes local con kind"

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    log_warn "Cluster '${CLUSTER_NAME}' ya existe. Omitiendo creación."
else
    kind create cluster --config="${ISTIO_DIR}/../kind-cluster.yaml" --name="${CLUSTER_NAME}"
    log_ok "Cluster creado"
fi

kubectl cluster-info --context "kind-${CLUSTER_NAME}"

# ════════════════════════════════════════════════════════════════════
# PASO 2: Construir e importar imágenes Docker a kind
# ════════════════════════════════════════════════════════════════════
log_step "PASO 2: Construir imágenes Docker"

# Eureka Server
log_step "  Construyendo eureka-server..."
docker build -t ${REGISTRY}/eureka-server:latest ./identity-service/eureka-server
kind load docker-image ${REGISTRY}/eureka-server:latest --name ${CLUSTER_NAME}

# Identity Service
log_step "  Construyendo identity-service..."
docker build -t ${REGISTRY}/identity-service:latest ./identity-service/identity-service
kind load docker-image ${REGISTRY}/identity-service:latest --name ${CLUSTER_NAME}

# Task Service
log_step "  Construyendo task-service..."
# El Dockerfile de task-service usa un entrypoint dev. Para K8s necesitamos producción:
# cat > /tmp/task-service-k8s.dockerfile << 'DOCKERFILE'
# FROM node:20-alpine
# WORKDIR /app
# RUN apk add --no-cache openssl
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npx prisma generate
# RUN npm run build
# EXPOSE 3001
# CMD ["npm", "run", "start:prod"]
# DOCKERFILE
docker build -t ${REGISTRY}/task-service:latest \
  -f ./task-service/Dockerfile.prod ./task-service
# docker build -t ${REGISTRY}/task-service:latest -f /tmp/task-service-k8s.dockerfile ./task-service
kind load docker-image ${REGISTRY}/task-service:latest --name ${CLUSTER_NAME}

# Gamification Service
log_step "  Construyendo gamification-service..."
docker build -t ${REGISTRY}/gamification-service:latest ./gamification-service
kind load docker-image ${REGISTRY}/gamification-service:latest --name ${CLUSTER_NAME}

# Challenge Service
log_step "  Construyendo challenge-service..."
docker build -t ${REGISTRY}/challenge-service:latest ./challenge-service
kind load docker-image ${REGISTRY}/challenge-service:latest --name ${CLUSTER_NAME}

log_ok "Imágenes construidas e importadas a kind"

# ════════════════════════════════════════════════════════════════════
# PASO 3: Instalar Istio con perfil 'demo'
# ════════════════════════════════════════════════════════════════════
log_step "PASO 3: Instalar Istio (perfil demo con todos los addons)"

# El perfil 'demo' incluye: istiod, ingress-gateway, egress-gateway
# En producción usa el perfil 'default' o un IstioOperator personalizado
istioctl install --set profile=demo -y

log_ok "Istio instalado"

# Verificar que istiod esté corriendo
kubectl wait --for=condition=available --timeout=120s deployment/istiod -n istio-system
log_ok "istiod listo"

# ════════════════════════════════════════════════════════════════════
# PASO 4: Instalar addons de observabilidad
# ════════════════════════════════════════════════════════════════════
log_step "PASO 4: Instalar Prometheus, Grafana, Jaeger y Kiali"

ISTIO_SAMPLES="https://raw.githubusercontent.com/istio/istio/release-1.21/samples/addons"

kubectl apply -f "${ISTIO_SAMPLES}/prometheus.yaml"
kubectl apply -f "${ISTIO_SAMPLES}/grafana.yaml"
kubectl apply -f "${ISTIO_SAMPLES}/jaeger.yaml"

# Kiali necesita que Prometheus esté corriendo primero
kubectl wait --for=condition=available --timeout=120s deployment/prometheus -n istio-system
kubectl apply -f "${ISTIO_SAMPLES}/kiali.yaml"

log_ok "Addons de observabilidad instalados"

# ════════════════════════════════════════════════════════════════════
# PASO 5: Crear namespaces con Istio injection
# ════════════════════════════════════════════════════════════════════
log_step "PASO 5: Crear namespaces"

kubectl apply -f "${ISTIO_DIR}/../k8s/namespaces/namespaces.yaml"
log_ok "Namespaces creados con istio-injection=enabled"

# ════════════════════════════════════════════════════════════════════
# PASO 6: Crear Secrets y ConfigMaps
# ════════════════════════════════════════════════════════════════════
log_step "PASO 6: Crear Secrets y ConfigMaps"

kubectl apply -f "${ISTIO_DIR}/../k8s/secrets/secrets.yaml"
kubectl apply -f "${ISTIO_DIR}/../k8s/configmaps/mongodb-init.yaml"
log_ok "Secrets y ConfigMaps creados"

# ════════════════════════════════════════════════════════════════════
# PASO 7: Desplegar bases de datos
# ════════════════════════════════════════════════════════════════════
log_step "PASO 7: Desplegar bases de datos"

kubectl apply -f "${ISTIO_DIR}/../k8s/deployments/databases.yaml"

echo "Esperando a que las bases de datos estén listas..."
kubectl wait --for=condition=available --timeout=180s deployment/identity-db -n goalquest
kubectl wait --for=condition=available --timeout=180s deployment/tasks-db -n goalquest
kubectl wait --for=condition=available --timeout=180s deployment/mongodb-challenges -n goalquest
kubectl wait --for=condition=available --timeout=180s deployment/mongodb-gamification -n goalquest
kubectl wait --for=condition=available --timeout=60s deployment/redis -n goalquest

log_ok "Bases de datos listas"

# ════════════════════════════════════════════════════════════════════
# PASO 8: Desplegar microservicios
# ════════════════════════════════════════════════════════════════════
log_step "PASO 8: Desplegar microservicios"

kubectl apply -f "${ISTIO_DIR}/../k8s/deployments/microservices.yaml"

echo "Esperando a que Eureka esté listo..."
kubectl wait --for=condition=available --timeout=180s deployment/eureka-server -n goalquest

echo "Esperando a que Identity Service esté listo..."
kubectl wait --for=condition=available --timeout=180s deployment/identity-service -n goalquest

echo "Esperando a que los demás servicios estén listos..."
kubectl wait --for=condition=available --timeout=180s deployment/task-service -n goalquest
kubectl wait --for=condition=available --timeout=180s deployment/gamification-service -n goalquest
kubectl wait --for=condition=available --timeout=180s deployment/challenge-service -n goalquest

log_ok "Todos los microservicios desplegados"

# ════════════════════════════════════════════════════════════════════
# PASO 9: Aplicar recursos Istio
# ════════════════════════════════════════════════════════════════════
log_step "PASO 9: Aplicar configuración Istio (Gateway, VirtualServices, DestinationRules)"

kubectl apply -f "${ISTIO_DIR}/base/gateway-virtualservices.yaml"
log_ok "Gateway y VirtualServices aplicados"

# ════════════════════════════════════════════════════════════════════
# PASO 10: Aplicar seguridad mTLS y AuthorizationPolicies
# ════════════════════════════════════════════════════════════════════
log_step "PASO 10: Aplicar seguridad mTLS y políticas de autorización"

kubectl apply -f "${ISTIO_DIR}/security/mtls-authz.yaml"
log_ok "mTLS estricto y AuthorizationPolicies aplicados"

# ════════════════════════════════════════════════════════════════════
# PASO 11: Aplicar observabilidad (Telemetry API)
# ════════════════════════════════════════════════════════════════════
log_step "PASO 11: Configurar Telemetry (métricas, trazas, logs)"

kubectl apply -f "${ISTIO_DIR}/observability/telemetry.yaml"
log_ok "Telemetry configurada"

# ════════════════════════════════════════════════════════════════════
# RESUMEN Y URLs
# ════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ GoalQuest + Istio instalado correctamente${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🔗 URLs de acceso (agrega a /etc/hosts: 127.0.0.1 goalquest.local):${NC}"
echo ""
echo -e "  📋 Eureka Dashboard:       http://localhost:8761"
echo -e "  🔐 Identity Service:       http://localhost:8081/swagger-ui.html"
echo -e "  📝 Task Service:           http://localhost:3001/api/docs"
echo -e "  🏆 Gamification Service:   http://localhost:8000/docs"
echo -e "  ⚔️  Challenge Service:      http://localhost:3002/api/docs"
echo ""
echo -e "${CYAN}📊 Herramientas de observabilidad (port-forward necesario):${NC}"
echo ""
echo -e "  Kiali:      kubectl port-forward svc/kiali -n istio-system 20001:20001"
echo -e "  Grafana:    kubectl port-forward svc/grafana -n istio-system 3000:3000"
echo -e "  Prometheus: kubectl port-forward svc/prometheus -n istio-system 9090:9090"
echo -e "  Jaeger:     kubectl port-forward svc/tracing -n istio-system 16686:80"
echo ""
echo -e "${YELLOW}▶ Ejecuta: ./istio/port-forward-observability.sh${NC}"
echo ""
