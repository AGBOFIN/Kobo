import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db/health-check'

export async function GET() {
  const healthCheck = await checkDatabaseConnection()
  
  if (healthCheck.status === 'healthy') {
    return NextResponse.json(healthCheck, { status: 200 })
  } else {
    return NextResponse.json(healthCheck, { status: 500 })
  }
}
