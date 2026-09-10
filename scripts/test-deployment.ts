/**
 * Script pour tester si le déploiement est à jour
 */

async function testDeployment() {
  console.log('🧪 Test du déploiement...')
  console.log('='.repeat(50))

  try {
    // Test 1: Inscription avec crédits
    const response = await fetch('https://facomptkobo.vercel.app/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Deployment',
        email: `test.deploy.${Date.now()}@gmail.com`,
        password: 'Test123456',
      }),
    })

    const data = await response.json()
    console.log('Inscription:', JSON.stringify(data, null, 2))

    if (data.credits !== undefined) {
      console.log(`✅ Code déployé: crédits retournés = ${data.credits}`)
    } else {
      console.log('❌ Code non déployé: crédits non retournés')
    }

    // Test 2: Packs
    const packsResponse = await fetch('https://facomptkobo.vercel.app/api/credits/packs')
    const packsData = await packsResponse.json()
    console.log('\nPacks:', JSON.stringify(packsData.packs, null, 2))

    const hasNewPrices = packsData.packs.some((p: any) => p.price === 1500 || p.price === 5000 || p.price === 10000)
    if (hasNewPrices) {
      console.log('✅ Nouveaux prix déployés')
    } else {
      console.log('❌ Anciens prix encore en place')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testDeployment()
