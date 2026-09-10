-- COMMANDES SQL À EXÉCUTER MANUELLEMENT DANS SUPABASE
-- Ouvrez le SQL Editor dans Supabase et exécutez ces commandes

-- 1. Mettre à jour le pack Débutant → Découverte
UPDATE "CreditPack"
SET name = 'Pack Découverte', price = 1500, creditsCount = 15
WHERE name = 'Pack Débutant';

-- 2. Mettre à jour le pack Standard
UPDATE "CreditPack"
SET price = 5000, creditsCount = 60
WHERE name = 'Pack Standard';

-- 3. Mettre à jour le pack Pro
UPDATE "CreditPack"
SET price = 10000, creditsCount = 150
WHERE name = 'Pack Pro';

-- 4. Vérifier les mises à jour
SELECT * FROM "CreditPack";

-- Si vous avez des erreurs de contrainte, vous pouvez d'abord désactiver temporairement
-- (mais normalement ce n'est pas nécessaire car ce sont des updates simples)
