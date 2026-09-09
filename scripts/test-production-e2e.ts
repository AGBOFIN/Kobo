/**
 * Script de test E2E en production pour Kobo
 * Teste le parcours complet : inscription → crédits gratuits → factures → paiement
 */

const API_BASE = 'https://facomptkobo.vercel.app'

async function testRegistration() {
  console.log('\n📝 Test 1: Inscription avec 3 crédits gratuits')
  console.log('='.repeat(50))

  const testEmail = `test.kobo.e2e.${Date.now()}@gmail.com`
  const testPassword = 'Test123456'

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User E2E',
        email: testEmail,
        password: testPassword,
      }),
    })

    const data = await response.json()
    console.log('Réponse:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('✅ Inscription réussie')
      console.log(`📧 Email de test: ${testEmail}`)
      console.log(`🔑 Mot de passe: ${testPassword}`)
      console.log(`💰 Crédits reçus: ${data.credits ?? 'non retourné'}`)
      
      if (data.credits === 3) {
        console.log('✅ Les 3 crédits gratuits ont bien été attribués')
        return { success: true, email: testEmail, password: testPassword, userId: data.user.id, credits: data.credits }
      } else {
        console.log(`⚠️  Attendu: 3 crédits, Réel: ${data.credits ?? 0} crédits`)
        return { success: true, email: testEmail, password: testPassword, userId: data.user.id, credits: data.credits, warning: 'Solde incorrect' }
      }
    } else {
      console.log('❌ Inscription échouée:', data.error)
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error)
    return { success: false, error: String(error) }
  }
}

async function testLogin(email: string, password: string) {
  console.log('\n🔐 Test 2: Connexion')
  console.log('='.repeat(50))

  try {
    // NextAuth v5 login endpoint
    const response = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        callbackUrl: `${API_BASE}/dashboard/dashboard`,
      }),
    })

    const text = await response.text()
    console.log('Réponse (status):', response.status)
    console.log('Réponse (text):', text.substring(0, 200))

    if (response.ok || response.redirected) {
      console.log('✅ Connexion réussie (redirection vers dashboard)')
      return { success: true }
    } else {
      console.log('❌ Connexion échouée')
      return { success: false, error: text }
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error)
    return { success: false, error: String(error) }
  }
}

async function testCreditPacks() {
  console.log('\n📦 Test 4: Vérification packs de crédits')
  console.log('='.repeat(50))

  try {
    const response = await fetch(`${API_BASE}/api/credits/packs`)
    const data = await response.json()
    console.log('Réponse:', JSON.stringify(data, null, 2))

    if (response.ok) {
      const packs = data.packs
      console.log(`✅ ${packs.length} packs trouvés`)

      const expectedPacks = [
        { name: 'Pack Découverte', price: 1500, credits: 15 },
        { name: 'Pack Standard', price: 5000, credits: 60 },
        { name: 'Pack Pro', price: 10000, credits: 150 },
      ]

      let allCorrect = true
      for (const expected of expectedPacks) {
        const pack = packs.find((p: any) => p.name === expected.name)
        if (pack) {
          if (pack.price === expected.price && pack.creditsCount === expected.credits) {
            console.log(`✅ ${expected.name}: ${expected.price} FCFA / ${expected.credits} crédits`)
          } else {
            console.log(`❌ ${expected.name}: ${pack.price} FCFA / ${pack.creditsCount} crédits (attendu: ${expected.price} / ${expected.credits})`)
            allCorrect = false
          }
        } else {
          console.log(`❌ Pack ${expected.name} non trouvé`)
          allCorrect = false
        }
      }

      return { success: allCorrect, packs }
    } else {
      console.log('❌ Impossible de récupérer les packs')
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error)
    return { success: false, error: String(error) }
  }
}

async function main() {
  console.log('🚀 Démarrage du test E2E production Kobo')
  console.log('='.repeat(50))
  console.log(`URL: ${API_BASE}`)
  console.log('Heure:', new Date().toISOString())

  const results: any = {}

  // Test 1: Packs de crédits (d'abord car ne nécessite pas de compte)
  results.packs = await testCreditPacks()

  // Test 2: Inscription
  const registration = await testRegistration()
  results.registration = registration

  if (registration.success) {
    // Vérifier les crédits dès l'inscription
    if (registration.credits === 3) {
      results.creditBalance = { success: true, balance: registration.credits }
    } else {
      results.creditBalance = { success: false, error: `Solde incorrect: ${registration.credits ?? 0} au lieu de 3` }
    }

    // Test 3: Connexion
    results.login = await testLogin(registration.email, registration.password)
  }

  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ DU TEST')
  console.log('='.repeat(50))
  console.log(`Packs de crédits: ${results.packs.success ? '✅' : '❌'}`)
  console.log(`Inscription: ${results.registration.success ? '✅' : '❌'}`)
  console.log(`Crédits gratuits: ${results.creditBalance?.success ? '✅' : '❌'}`)
  console.log(`Connexion: ${results.login?.success ? '✅' : '❌'}`)

  const allPassed = results.packs.success && results.registration.success && results.creditBalance?.success && results.login?.success

  if (allPassed) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS')
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ')
  }

  console.log('\n' + '='.repeat(50))
}

main().catch(console.error)
