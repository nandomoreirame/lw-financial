#!/bin/sh
set -e

echo "🔍 Verificando migrações falhadas..."
if bun run prisma:resolve; then
  echo "✅ Migrações verificadas/resolvidas"
else
  echo "⚠️ Aviso: Algumas migrações podem precisar de atenção manual"
fi

echo ""
echo "🚀 Executando migrações do banco de dados..."
if bun run prisma:deploy; then
  echo "✅ Migrações aplicadas com sucesso"
else
  echo "❌ Erro ao aplicar migrações"
  echo "💡 Dica: Execute 'bun run prisma:resolve' para verificar migrações falhadas"
  exit 1
fi

echo ""
echo "🚀 Iniciando servidor..."
exec bun run start