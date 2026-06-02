#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  GoalQuest — Verificar estado del Istio Service Mesh
#  Uso: chmod +x istio/verify.sh && ./istio/verify.sh
# ═══════════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✅ $1${NC}"; }
fail() { echo -e "  ${RED}❌ $1${NC}"; }
info() { echo -e "  ${CYAN}ℹ️  $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  GoalQuest — Verificación Istio Service Mesh${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

# ── 1. Istio instalado ───────────────────────────────────────────────
echo ""
echo -e "${CYAN}[1] Componentes de Istio${NC}"
if kubectl get namespace istio-system &>/dev/null; then
    pass "Namespace istio-system existe"
else
    fail "Namespace istio-system NO existe — Istio no instalado"
    exit 1
fi

ISTIOD_READY=$(kubectl get deployment istiod -n istio-system -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
if [ "$ISTIOD_READY" -gt 0 ] 2>/dev/null; then
    pass "istiod corriendo ($ISTIOD_READY réplicas)"
else
    fail "istiod NO está listo"
fi

GATEWAY_READY=$(kubectl get deployment istio-ingressgateway -n istio-system -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
if [ "$GATEWAY_READY" -gt 0 ] 2>/dev/null; then
    pass "istio-ingressgateway corriendo ($GATEWAY_READY réplicas)"
else
    fail "istio-ingressgateway NO está listo"
fi

# ── 2. Namespace con injection ───────────────────────────────────────
echo ""
echo -e "${CYAN}[2] Namespace GoalQuest${NC}"
INJECTION=$(kubectl get namespace goalquest -o jsonpath='{.metadata.labels.istio-injection}' 2>/dev/null || echo "")
if [ "$INJECTION" = "enabled" ]; then
    pass "istio-injection habilitado en namespace goalquest"
else
    fail "istio-injection NO habilitado. Ejecuta: kubectl label namespace goalquest istio-injection=enabled"
fi

# ── 3. Sidecars inyectados ───────────────────────────────────────────
echo ""
echo -e "${CYAN}[3] Sidecars Envoy inyectados${NC}"
for SVC in identity-service task-service gamification-service challenge-service eureka-server; do
    POD=$(kubectl get pod -n goalquest -l app=$SVC -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -z "$POD" ]; then
        warn "$SVC — pod no encontrado"
        continue
    fi
    CONTAINERS=$(kubectl get pod $POD -n goalquest -o jsonpath='{.spec.containers[*].name}' 2>/dev/null || echo "")
    if echo "$CONTAINERS" | grep -q "istio-proxy"; then
        pass "$SVC — sidecar Envoy inyectado ($POD)"
    else
        fail "$SVC — sidecar Envoy NO inyectado ($POD)"
    fi
done

# ── 4. Estado de los pods ────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4] Estado de los pods${NC}"
kubectl get pods -n goalquest --no-headers 2>/dev/null | while read line; do
    NAME=$(echo $line | awk '{print $1}')
    STATUS=$(echo $line | awk '{print $3}')
    READY=$(echo $line | awk '{print $2}')
    if [ "$STATUS" = "Running" ]; then
        pass "$NAME ($READY) — $STATUS"
    else
        fail "$NAME ($READY) — $STATUS"
    fi
done

# ── 5. mTLS verificación ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}[5] Configuración mTLS${NC}"
PA=$(kubectl get peerauthentication goalquest-mtls-strict -n goalquest -o jsonpath='{.spec.mtls.mode}' 2>/dev/null || echo "")
if [ "$PA" = "STRICT" ]; then
    pass "PeerAuthentication STRICT configurado"
else
    fail "PeerAuthentication STRICT NO configurado (actual: $PA)"
fi

# ── 6. Istioctl análisis ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}[6] Análisis de configuración Istio${NC}"
if command -v istioctl &>/dev/null; then
    ISSUES=$(istioctl analyze -n goalquest 2>&1)
    if echo "$ISSUES" | grep -q "No validation issues found"; then
        pass "Análisis Istio: sin problemas"
    else
        warn "Análisis Istio:"
        echo "$ISSUES" | grep -E "Warning|Error" | while read line; do
            warn "  $line"
        done
    fi
else
    warn "istioctl no disponible para análisis"
fi

# ── 7. Addons de observabilidad ──────────────────────────────────────
echo ""
echo -e "${CYAN}[7] Herramientas de observabilidad${NC}"
for ADDON in prometheus grafana kiali; do
    READY=$(kubectl get deployment $ADDON -n istio-system -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$READY" -gt 0 ] 2>/dev/null; then
        pass "$ADDON instalado y listo"
    else
        warn "$ADDON no disponible"
    fi
done

TRACING=$(kubectl get deployment jaeger -n istio-system -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
if [ "$TRACING" -gt 0 ] 2>/dev/null; then
    pass "jaeger (tracing) instalado y listo"
else
    warn "jaeger no disponible"
fi

# ── 8. Probar mTLS entre servicios ───────────────────────────────────
echo ""
echo -e "${CYAN}[8] Prueba de conectividad mTLS (desde task-service → identity-service)${NC}"
TASK_POD=$(kubectl get pod -n goalquest -l app=task-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$TASK_POD" ]; then
    RESULT=$(kubectl exec $TASK_POD -n goalquest -c task-service -- \
        curl -s -o /dev/null -w "%{http_code}" \
        http://identity-service:8081/actuator/health 2>/dev/null || echo "error")
    if [ "$RESULT" = "200" ]; then
        pass "Conectividad task-service → identity-service OK (HTTP $RESULT)"
    else
        warn "Conectividad task-service → identity-service: HTTP $RESULT"
    fi
else
    warn "task-service pod no encontrado para prueba de conectividad"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Verificación completa${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
info "Para ver el tráfico en tiempo real: istioctl dashboard kiali"
info "Para ver logs del proxy: kubectl logs <pod> -n goalquest -c istio-proxy"
info "Para ver certificados mTLS: istioctl proxy-config secret <pod> -n goalquest"
echo ""
