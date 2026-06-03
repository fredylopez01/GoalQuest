#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# fix-eureka-envoy.sh
# Problema raíz: el sidecar Envoy intercepta el puerto 8761 y
# rechaza conexiones con 503 antes de que lleguen a Spring.
# Las anotaciones excludeInboundPorts estaban vacías → no hacían nada.
# ═══════════════════════════════════════════════════════════════

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# ── 1. Parchar eureka-server: excluir puerto 8761 del proxy Envoy ──────────
log "Parcheando eureka-server para excluir puerto 8761 de Envoy..."
kubectl patch deployment eureka-server -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "traffic.sidecar.istio.io/excludeInboundPorts": "8761",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761"
    }
  }
]'

# ── 2. Parchar task-service: excluir salida hacia 8761 ─────────────────────
log "Parcheando task-service..."
kubectl patch deployment task-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761"
    }
  }
]'

# ── 3. Parchar challenge-service ───────────────────────────────────────────
log "Parcheando challenge-service..."
kubectl patch deployment challenge-service -n goalquest --type=json -p='[
  {
    "op": "replace",
    "path": "/spec/template/metadata/annotations",
    "value": {
      "sidecar.istio.io/inject": "true",
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761"
    }
  }
]'

# ── 4. Parchar gamification-service ───────────────────────────────────────
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
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761"
    }
  }
]'

# ── 5. Parchar identity-service ────────────────────────────────────────────
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
      "traffic.sidecar.istio.io/excludeOutboundPorts": "8761"
    }
  }
]'

# ── 6. Esperar rollout ─────────────────────────────────────────────────────
log "Esperando rollout de todos los deployments..."
kubectl rollout status deployment/eureka-server        -n goalquest --timeout=120s
kubectl rollout status deployment/task-service         -n goalquest --timeout=180s
kubectl rollout status deployment/challenge-service    -n goalquest --timeout=120s
kubectl rollout status deployment/gamification-service -n goalquest --timeout=120s
kubectl rollout status deployment/identity-service     -n goalquest --timeout=180s

ok "Rollout completo. Verificando pods..."
kubectl get pods -n goalquest

echo ""
warn "Espera ~60s y luego verifica el registro en Eureka:"
echo "  kubectl port-forward svc/eureka-server 8761:8761 -n goalquest &"
echo "  # Luego abre: http://localhost:8761"
echo ""
warn "Si ves los servicios listados en Eureka = problema resuelto."