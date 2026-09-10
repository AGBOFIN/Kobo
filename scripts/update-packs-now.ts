/**
 * Script pour mettre à jour les packs de crédits en production
 */

async function updatePacks() {
  console.log('🔄 Mise à jour des packs de crédits en production...')

  try {
    const response = await fetch('https://facomptkobo.vercel.app/api/temp-update-packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()
    console.log('Réponse:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('✅ Packs mis à jour avec succès')
      return data
    } else {
      console.log('❌ Erreur:', data.error)
      return null
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error)
    return null
  }
}

updatePacks()
