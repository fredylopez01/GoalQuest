#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  GoalQuest — Vincular ServiceAccounts a los Deployments
#  Istio usa los ServiceAccounts para generar identidades SPIFFE/SVID
#  (certificados mTLS únicos por microservicio)
#
#  Los AuthorizationPolicies usan:
#    cluster.local/ns/goalquest/sa/<nombre-del-serviceaccount>
#
#  Ejecutar DESPUÉS de apply de microservices.yaml y security/mtls-authz.yaml
#  Uso: chmod +x istio/patch-serviceaccounts.sh && ./istio/patch-serviceaccounts.sh
# ═══════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}▶ $1${NC}"; }
ok()  { echo -e "${GREEN}✅ $1${NC}"; }

log "Vinculando ServiceAccounts a Deployments..."

# identity-service → identity-service-sa
kubectl patch deployment identity-service -n goalquest --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/serviceAccountName",
    "value": "identity-service-sa"
  }
]'
ok "identity-service → identity-service-sa"

# task-service → task-service-sa
kubectl patch deployment task-service -n goalquest --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/serviceAccountName",
    "value": "task-service-sa"
  }
]'
ok "task-service → task-service-sa"

# gamification-service → gamification-service-sa
kubectl patch deployment gamification-service -n goalquest --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/serviceAccountName",
    "value": "gamification-service-sa"
  }
]'
ok "gamification-service → gamification-service-sa"

# challenge-service → challenge-service-sa
kubectl patch deployment challenge-service -n goalquest --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/serviceAccountName",
    "value": "challenge-service-sa"
  }
]'
ok "challenge-service → challenge-service-sa"

log "Reiniciando deployments para aplicar cambios..."
kubectl rollout restart deployment \
  identity-service \
  task-service \
  gamification-service \
  challenge-service \
  -n goalquest

log "Esperando a que los pods estén listos con los nuevos ServiceAccounts..."
kubectl rollout status deployment/identity-service   -n goalquest --timeout=120s
kubectl rollout status deployment/task-service       -n goalquest --timeout=120s
kubectl rollout status deployment/gamification-service -n goalquest --timeout=120s
kubectl rollout status deployment/challenge-service  -n goalquest --timeout=120s

echo ""
ok "ServiceAccounts vinculados. Istio generará certificados SPIFFE únicos por servicio."
echo ""
echo "Verificar identidades SPIFFE:"
echo "  istioctl proxy-config secret deployment/task-service -n goalquest"
echo "  istioctl proxy-config secret deployment/identity-service -n goalquest"
