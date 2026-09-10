-- Update credit pack prices to new pricing structure
UPDATE "CreditPack" 
SET 
  name = 'Pack Découverte',
  price = 1500,
  "creditsCount" = 15
WHERE name = 'Pack Débutant';

UPDATE "CreditPack" 
SET 
  price = 5000,
  "creditsCount" = 60
WHERE name = 'Pack Standard';

UPDATE "CreditPack" 
SET 
  price = 10000,
  "creditsCount" = 150
WHERE name = 'Pack Pro';
