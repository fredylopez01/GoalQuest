#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# port-forward-services.sh
# Expone todos los microservicios GoalQuest al localhost.
# Ejecutar en una terminal aparte y dejar corriendo.
# ═══════════════════════════════════════════════════════════════

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Función para matar port-forwards previos al salir
cleanup() {
  warn "Cerrando port-forwards..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

log "Verificando pods listos en namespace goalquest..."
kubectl wait --for=condition=Ready pod -l app=eureka-server      -n goalquest --timeout=120s
kubectl wait --for=condition=Ready pod -l app=identity-service   -n goalquest --timeout=120s
kubectl wait --for=condition=Ready pod -l app=task-service       -n goalquest --timeout=120s
kubectl wait --for=condition=Ready pod -l app=gamification-service -n goalquest --timeout=120s
kubectl wait --for=condition=Ready pod -l app=challenge-service  -n goalquest --timeout=120s

log "Iniciando port-forwards..."

# Eureka Server (dashboard de registro de servicios)
kubectl port-forward svc/eureka-server      8761:8761 -n goalquest &
PF_EUREKA=$!

# Identity Service (Spring Boot / Swagger)
kubectl port-forward svc/identity-service   8081:8081 -n goalquest &
PF_IDENTITY=$!

# Task Service (NestJS / Swagger)
kubectl port-forward svc/task-service       3001:3001 -n goalquest &
PF_TASK=$!

# Gamification Service (FastAPI / docs)
kubectl port-forward svc/gamification-service 8000:8000 -n goalquest &
PF_GAMIF=$!

# Challenge Service (Node / Swagger)
kubectl port-forward svc/challenge-service  3002:3002 -n goalquest &
PF_CHALLENGE=$!

sleep 2
ok "Port-forwards activos:"
echo ""
echo "  Eureka:        http://localhost:8761"
echo "  Identity:      http://localhost:8081/swagger-ui.html"
echo "  Task:          http://localhost:3001/api/docs"
echo "  Gamification:  http://localhost:8000/docs"
echo "  Challenge:     http://localhost:3002/api/docs"
echo ""
echo "Presiona Ctrl+C para cerrar todos los port-forwards."
echo ""

# Mantener el script corriendo
wait