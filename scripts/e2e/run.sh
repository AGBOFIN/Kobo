# Orchestrateur E2E Chariow (bash) :
#  1. arrête le serveur de preview (libère le verrou Prisma + le port)
#  2. crée prisma/e2e.db (copie du schéma, vide)
#  3. lance la fake API Chariow (:4599) et l'app Kobo de test (:3110)
#  4. exécute le scénario complet puis affiche le bilan
#  5. arrête tout et relance le serveur de preview sur :3100
set -e
cd indefini-saas

echo "== 1. Arrêt du serveur dev =="
for pid in $(netstat -ano | grep ":3100" | grep LISTENING | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F 2>/dev/null || true
done
sleep 2

echo "== 2. Base de test e2e.db =="
rm -f prisma/e2e.db
rm -rf prisma/prisma
# Cache PDF vidé : la base de test repart de zéro, le cache ne doit pas survivre
rm -rf storage/invoices
export DATABASE_URL="file:./e2e.db"
npx prisma db push --skip-generate 2>&1 | tail -2

echo "== 3. Fake API Chariow (:4599) =="
node scripts/e2e/fake-chariow.js > /tmp/fake-chariow.log 2>&1 &
FAKE_PID=$!
sleep 1

echo "== 4. Instance Kobo de test (:3110) =="
CHARIOW_API_KEY="sk_test_e2e_key" \
CHARIOW_PULSE_SECRET="whsec_e2e_0123456789abcdef" \
CHARIOW_API_URL="http://localhost:4599/v1" \
NEXTAUTH_SECRET="e2e-secret-e2e-secret-e2e-secret" \
NEXTAUTH_URL="http://localhost:3110" \
PORT=3110 \
npx next dev -p 3110 > /tmp/kobo-e2e.log 2>&1 &
E2E_PID=$!

echo "Attente du démarrage..."
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3110/ 2>/dev/null || true)
  if [ "$code" = "200" ]; then break; fi
  sleep 2
done
echo "Kobo test ready (HTTP $code)"

echo "== 5. Scénario E2E =="
node scripts/e2e/chariow-flow.testrun.js
E2E_RESULT=$?

echo "== 6. Nettoyage =="
kill $E2E_PID 2>/dev/null || true
kill $FAKE_PID 2>/dev/null || true
sleep 2
for pid in $(netstat -ano | grep -E ":(3110|4599)" | grep LISTENING | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F 2>/dev/null || true
done
rm -f prisma/e2e.db
# Restaure la base dev : le runner avait pu y toucher avant le correctif
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.creditPack.updateMany({where:{chariowProductId:'prd_e2e_standard'},data:{chariowProductId:null}}).then(r=>{console.log('dev packs restaurés');return p.\$disconnect()})" 2>/dev/null || true

echo "== 7. Relance du serveur de preview (:3100) =="
# stdout ET stderr redirigés : sans ça, PowerShell garde le pipe du terminal ouvert
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','3100' -WorkingDirectory 'C:\Users\Moses\Desktop\SaaS\indefini-saas' -RedirectStandardOutput 'C:\Users\Moses\Desktop\SaaS\.freebuff\preview-50488468-c49b-4b70-936a-36cdbd663d46.log' -RedirectStandardError 'C:\Users\Moses\Desktop\SaaS\.freebuff\preview-50488468-c49b-4b70-936a-36cdbd663d46.log.err' -WindowStyle Hidden -PassThru).Id" > /tmp/preview-pid.txt 2>/dev/null &
disown
sleep 1
cat /tmp/preview-pid.txt

exit $E2E_RESULT
