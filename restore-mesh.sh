#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# restore-mesh.sh
#
# Restaura el service mesh eliminando los excludeOutboundPorts
# de los microservicios (que rompían las métricas), y aplica
# DestinationRules correctas para que las bases de datos
# funcionen sin mTLS pero el tráfico entre servicios sí pase
# por Envoy.
# ═══════════════════════════════════════════════════════════════

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# ── 1. Aplicar DestinationRules para bases de datos ────────────
log "Aplicando DestinationRules (DISABLE mTLS solo en bases de datos)..."
kubectl apply -f istio-db-destinationrules.yaml
ok "DestinationRules aplicadas"

# ── 2. Restaurar anotaciones: quitar excludeOutboundPorts de DBs
#    Solo conservar la exclusión de 8761 en eureka-server ────────

log "Restaurando identity-service (quitar exclude de puertos de DB)..."
kubectl patch deployment identity-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "8081",
      "prometheus.io/path": "/actuator/prometheus"
    }
  }
]'

log "Restaurando task-service..."
kubectl patch deployment task-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true"
    }
  }
]'

log "Restaurando gamification-service..."
kubectl patch deployment gamification-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "8000",
      "prometheus.io/path": "/metrics"
    }
  }
]'

log "Restaurando challenge-service..."
kubectl patch deployment challenge-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "3002"
    }
  }
]'

# eureka-server mantiene su exclusión de 8761 — no se toca

# ── 3. Esperar rollout ─────────────────────────────────────────
log "Esperando rollout..."
kubectl rollout status deployment/identity-service     -n goalquest --timeout=180s
kubectl rollout status deployment/task-service         -n goalquest --timeout=240s
kubectl rollout status deployment/gamification-service -n goalquest --timeout=180s
kubectl rollout status deployment/challenge-service    -n goalquest --timeout=180s

echo ""
ok "Rollout completo."
echo ""
kubectl get pods -n goalquest
echo ""

# ── 4. Verificar que el proxy está activo en los pods ──────────
log "Verificando sidecars activos (deben mostrar 2/2 READY)..."
kubectl get pods -n goalquest -l 'app in (identity-service,task-service,gamification-service,challenge-service)' \
  --no-headers | awk '{print $1, $2, $3}'

echo ""
warn "Espera 2-3 minutos y luego abre Kiali para ver el grafo:"
echo "  kubectl port-forward svc/kiali 20001:20001 -n istio-system &"
echo "  # Abrir: http://localhost:20001"
echo ""
warn "Y verifica que los servicios siguen respondiendo:"
echo "  kubectl port-forward svc/identity-service 8081:8081 -n goalquest &"
echo "  curl http://localhost:8081/actuator/health"