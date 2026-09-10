import sharp from 'sharp'
import fs from 'fs'

const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="url(#gradient)"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">K</text>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
</svg>
`

const maskableSvgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="url(#gradient)"/>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">K</text>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
</svg>
`

async function generateIcons() {
  const sizes = [192, 512]
  
  for (const size of sizes) {
    // Regular icons
    const svgBuffer = Buffer.from(svgContent.replace('512', size.toString()).replace('220', Math.floor(size * 0.43).toString()).replace('128', Math.floor(size * 0.25).toString()))
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`)
    console.log(`Generated icon-${size}.png`)
    
    // Maskable icons
    const maskableBuffer = Buffer.from(maskableSvgContent.replace('512', size.toString()).replace('220', Math.floor(size * 0.43).toString()))
    await sharp(maskableBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/icon-maskable-${size}.png`)
    console.log(`Generated icon-maskable-${size}.png`)
  }
}

generateIcons().catch(console.error)
