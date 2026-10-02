import { NextResponse } from 'next/server'

// Version is read at build time, update manually or via CI
const APP_VERSION = process.env.npm_package_version || '0.1.0'

// Track server start time for uptime calculation
const startTime = Date.now()

/**
 * Health check endpoint for monitoring and deployment verification.
 *
 * Returns:
 * - 200: System is healthy
 * - 503: System is unhealthy
 *
 * @example GET /api/health
 */
export async function GET() {
  const checks = []
  let isHealthy = true

  // Check 1: Environment variables are configured
  const envCheck = checkEnvironment()
  checks.push(envCheck)
  if (envCheck.status === 'fail') isHealthy = false

  // Build response
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'unknown',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

/**
 * Check that essential environment variables are configured
 */
function checkEnvironment() {
  const requiredVars = ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_APP_URL']

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
    }
  }

  return {
    name: 'environment',
    status: 'pass',
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  const response = await GET()
  const data = await response.json()

  return new NextResponse(null, {
    status: data.status === 'healthy' ? 200 : 503,
  })
}
