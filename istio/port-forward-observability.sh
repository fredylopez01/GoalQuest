#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  GoalQuest — Port-forward para herramientas de observabilidad
#  Abre Kiali, Grafana, Prometheus y Jaeger en paralelo
#  Uso: chmod +x istio/port-forward-observability.sh
#       ./istio/port-forward-observability.sh
# ═══════════════════════════════════════════════════════════════════

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}Iniciando port-forwards de observabilidad...${NC}"
echo -e "${CYAN}Presiona Ctrl+C para detener todos${NC}"
echo ""

# Matar port-forwards anteriores si existen
pkill -f "kubectl port-forward svc/kiali" 2>/dev/null || true
pkill -f "kubectl port-forward svc/grafana" 2>/dev/null || true
pkill -f "kubectl port-forward svc/prometheus" 2>/dev/null || true
pkill -f "kubectl port-forward svc/tracing" 2>/dev/null || true

sleep 1

# Iniciar port-forwards en background
kubectl port-forward svc/kiali      -n istio-system 20001:20001 &
PID_KIALI=$!

kubectl port-forward svc/grafana    -n istio-system 3000:3000 &
PID_GRAFANA=$!

kubectl port-forward svc/prometheus -n istio-system 9090:9090 &
PID_PROMETHEUS=$!

kubectl port-forward svc/tracing    -n istio-system 16686:80 &
PID_JAEGER=$!

sleep 2

echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Herramientas de observabilidad disponibles:${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🗺️  Kiali (mapa del mesh):  http://localhost:20001"
echo -e "  📈 Grafana (dashboards):    http://localhost:3000"
echo -e "  🔬 Prometheus (métricas):   http://localhost:9090"
echo -e "  🔍 Jaeger (trazas):         http://localhost:16686"
echo ""
echo -e "  🔐 Identity Swagger:        http://localhost:8081/swagger-ui.html"
echo -e "  📋 Task Swagger:            http://localhost:3001/api/docs"
echo -e "  🏆 Gamification Swagger:    http://localhost:8000/docs"
echo -e "  ⚔️  Challenge Swagger:       http://localhost:3002/api/docs"
echo ""
echo "Presiona Ctrl+C para detener todos los port-forwards"

# Función de limpieza al salir
cleanup() {
    echo -e "\n${CYAN}Deteniendo port-forwards...${NC}"
    kill $PID_KIALI $PID_GRAFANA $PID_PROMETHEUS $PID_JAEGER 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Mantener el script corriendo
wait
