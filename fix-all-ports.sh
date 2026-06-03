#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# fix-all-ports.sh
# 
# Problema real: al excluir solo 8761, Envoy empezó a interceptar
# las conexiones a las bases de datos (5432, 27017, 6379) con mTLS
# y las resetea → "Connection reset by peer".
#
# Solución: excluir todos los puertos internos que NO deben pasar
# por el proxy Envoy: bases de datos + Eureka.
# ═══════════════════════════════════════════════════════════════

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Puertos a excluir del proxy Envoy (outbound):
#   8761 = Eureka
#   5432 = PostgreSQL (identity-db, tasks-db)
#   27017 = MongoDB (mongodb-challenges, mongodb-gamification)
#   6379  = Redis
EXCLUDE_OUT="8761,5432,27017,6379"

# ── eureka-server: excluir inbound 8761 (el sidecar no debe interceptarlo)
# También fijar las probes para que usen rewriteAppHTTPProbers
log "Parcheando eureka-server..."
kubectl patch deployment eureka-server -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "traffic.sidecar.istio.io/excludeInboundPorts": "8761",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761",
      "proxy.istio.io/config": "{\"holdApplicationUntilProxyStarts\": true}"
    }
  }
]'

# ── identity-service: necesita salida a 5432 (postgres) + 8761 (eureka)
log "Parcheando identity-service..."
kubectl patch deployment identity-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "8081",
      "prometheus.io/path": "/actuator/prometheus",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "'"$EXCLUDE_OUT"'"
    }
  }
]'

# ── task-service: necesita salida a 5432 (postgres) + 8761 (eureka)
log "Parcheando task-service..."
kubectl patch deployment task-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "'"$EXCLUDE_OUT"'"
    }
  }
]'

# ── gamification-service: necesita salida a 27017 (mongo) + 6379 (redis) + 8761
log "Parcheando gamification-service..."
kubectl patch deployment gamification-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "8000",
      "prometheus.io/path": "/metrics",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "'"$EXCLUDE_OUT"'"
    }
  }
]'

# ── challenge-service: necesita salida a 27017 (mongo) + 8761
log "Parcheando challenge-service..."
kubectl patch deployment challenge-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "prometheus.io/scrape": "true",
      "prometheus.io/port": "3002",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "'"$EXCLUDE_OUT"'"
    }
  }
]'

# ── Esperar rollout ────────────────────────────────────────────
log "Esperando rollout..."
kubectl rollout status deployment/eureka-server        -n goalquest --timeout=180s
kubectl rollout status deployment/identity-service     -n goalquest --timeout=180s
kubectl rollout status deployment/task-service         -n goalquest --timeout=240s
kubectl rollout status deployment/gamification-service -n goalquest --timeout=180s
kubectl rollout status deployment/challenge-service    -n goalquest --timeout=180s

echo ""
ok "Rollout completo."
kubectl get pods -n goalquest
echo ""
warn "Esperando 60s para que los servicios se registren en Eureka..."
sleep 60

log "Verificando registro en Eureka..."
kubectl exec -n goalquest \
  $(kubectl get pod -n goalquest -l app=eureka-server -o jsonpath='{.items[0].metadata.name}') \
  -c eureka-server -- \
  wget -qO- http://localhost:8761/eureka/apps | grep -o '<application>.*</application>' | grep -o '<name>[^<]*</name>' || \
  echo "(Sin respuesta - el pod puede estar aún iniciando)"

echo ""
ok "Listo. Para acceder a los servicios ejecuta:"
echo "  kubectl port-forward svc/eureka-server      8761:8761 -n goalquest &"
echo "  kubectl port-forward svc/identity-service   8081:8081 -n goalquest &"
echo "  kubectl port-forward svc/task-service       3001:3001 -n goalquest &"
echo "  kubectl port-forward svc/gamification-service 8000:8000 -n goalquest &"
echo "  kubectl port-forward svc/challenge-service  3002:3002 -n goalquest &"