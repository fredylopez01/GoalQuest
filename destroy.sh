#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# destroy.sh — Elimina el cluster y limpia el entorno
# ═══════════════════════════════════════════════════════════════
YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${YELLOW}  Esto eliminará el cluster 'goalquest' y todos sus datos.${NC}"
read -p "¿Continuar? (s/N): " confirm
[[ "$confirm" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }

# Matar port-forwards activos relacionados con goalquest
echo "Cerrando port-forwards activos..."
pkill -f "port-forward.*goalquest" 2>/dev/null || true
pkill -f "port-forward svc/kiali"  2>/dev/null || true
pkill -f "port-forward svc/grafana" 2>/dev/null || true

# Eliminar cluster
echo "Eliminando cluster kind 'goalquest'..."
kind delete cluster --name goalquest

echo -e "${GREEN} Cluster eliminado. Para reinstalar ejecuta: ./install.sh${NC}"