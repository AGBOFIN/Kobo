# Orchestrateur E2E Isolation des données :
#  1. arrête le serveur de preview (verrou Prisma + port)
#  2. base de test e2e.db propre (schéma à jour)
#  3. instance Kobo de test sur :3110 (sans clés Chariow : non nécessaire ici)
#  4. exécute scripts/e2e/isolation.testrun.js
#  5. nettoyage + relance du serveur de preview (:3100)
set -e
cd "$(dirname "$0")/../.."

echo "== 1. Arrêt du serveur dev =="
for pid in $(netstat -ano | grep ":3100" | grep LISTENING | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F 2>/dev/null || true
done
for pid in $(netstat -ano | grep -E ":(3110|4599)" | grep LISTENING | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F 2>/dev/null || true
done
sleep 2

echo "== 2. Base de test =="
rm -f prisma/e2e.db
# Cache PDF vidé : un cache obsolète (index numéro de facture) fausserait le test
rm -rf storage/invoices
export DATABASE_URL="file:./e2e.db"
npx prisma db push --skip-generate 2>&1 | tail -1

echo "== 3. Instance Kobo de test (:3110) =="
NEXTAUTH_SECRET="e2e-secret-e2e-secret-e2e-secret" \
NEXTAUTH_URL="http://localhost:3110" \
PORT=3110 \
npx next dev -p 3110 > /tmp/kobo-isolation.log 2>&1 &

echo "Attente du démarrage..."
code=000
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3110/ 2>/dev/null || true)
  if [ "$code" = "200" ]; then break; fi
  sleep 2
done
echo "Kobo test ready (HTTP $code)"

echo "== 4. Scénario d'isolation =="
node scripts/e2e/isolation.testrun.js
RESULT=$?

echo "== 5. Nettoyage =="
for pid in $(netstat -ano | grep ":3110" | grep LISTENING | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F 2>/dev/null || true
done
sleep 2
rm -f prisma/e2e.db

echo "== 6. Relance du serveur de preview (:3100) =="
# stdout ET stderr redirigés : sans ça, PowerShell garde le pipe du terminal
# ouvert et le script semble ne jamais se terminer.
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3100' -WorkingDirectory 'C:\Users\Moses\Desktop\SaaS\indefini-saas' -RedirectStandardOutput 'C:\Users\Moses\Desktop\SaaS\.freebuff\preview-50488468-c49b-4b70-936a-36cdbd663d46.log' -RedirectStandardError 'C:\Users\Moses\Desktop\SaaS\.freebuff\preview-50488468-c49b-4b70-936a-36cdbd663d46.log.err' -WindowStyle Hidden -PassThru).Id" > /tmp/preview-pid.txt 2>/dev/null &
disown
sleep 1

exit $RESULT
