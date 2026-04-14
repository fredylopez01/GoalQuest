#!/bin/sh
set -e

echo "══════════════════════════════════════════"
echo "  Task Service - Inicializando..."
echo "══════════════════════════════════════════"

echo "→ Instalando dependencias..."
npm install

echo "→ Generando cliente Prisma..."
npx prisma generate

echo "→ Ejecutando migraciones..."
npx prisma migrate deploy

echo "→ Arrancando en modo desarrollo (ts-node)..."
echo "══════════════════════════════════════════"
npm run start:dev