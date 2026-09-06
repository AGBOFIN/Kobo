import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({ packs })
  } catch (error) {
    console.error('Credit packs fetch error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}