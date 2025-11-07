/**
 * Error Logs Dataset Generator
 * Application error logs with stack traces and metadata
 */

import { faker } from '@faker-js/faker'
import type { ErrorLog } from '../types'

const LEVELS = ['error', 'critical'] as const
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const
const ENDPOINTS = [
  '/api/users',
  '/api/products',
  '/api/orders',
  '/api/auth/login',
  '/api/auth/register',
  '/api/payments',
  '/api/settings',
  '/api/analytics',
]

const ERROR_MESSAGES = [
  'Database connection timeout',
  'Null pointer exception',
  'Authentication failed',
  'Invalid request parameters',
  'Resource not found',
  'Permission denied',
  'Rate limit exceeded',
  'Internal server error',
  'Failed to process payment',
  'Network error',
]

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Mobile Safari']
const OS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android']

const ERROR_TAGS = ['backend', 'frontend', 'database', 'auth', 'payment', 'api', 'critical', 'needs-investigation']

export function generateErrorLogs(count: number): ErrorLog[] {
  const logs: ErrorLog[] = []

  for (let i = 0; i < count; i++) {
    const timestamp = faker.date.recent({ days: 30 }).toISOString()
    const level = LEVELS[i % LEVELS.length]!
    const message = ERROR_MESSAGES[i % ERROR_MESSAGES.length]!
    const method = METHODS[i % METHODS.length]!
    const endpoint = ENDPOINTS[i % ENDPOINTS.length]!

    // Generate realistic stack trace
    const stackDepth = faker.number.int({ min: 3, max: 8 })
    const stackLines: string[] = []
    for (let j = 0; j < stackDepth; j++) {
      const fileName = faker.system.fileName()
      const lineNumber = faker.number.int({ min: 1, max: 500 })
      const functionName = faker.hacker.verb() + faker.string.alpha({ length: 5, casing: 'upper' })
      stackLines.push(`  at ${functionName} (${fileName}:${lineNumber})`)
    }
    const stackTrace = stackLines.join('\n')

    const tagCount = faker.number.int({ min: 1, max: 3 })
    const tags = faker.helpers.arrayElements(ERROR_TAGS, tagCount)

    // Status codes more likely for errors
    const statusCodes = [400, 401, 403, 404, 500, 502, 503]
    const statusCode = statusCodes[i % statusCodes.length]!

    logs.push({
      id: `E${String(i + 1).padStart(6, '0')}`,
      timestamp,
      level,
      message,
      stackTrace,
      userId: faker.datatype.boolean(0.7) ? faker.number.int({ min: 1, max: 10000 }) : null,
      endpoint,
      method,
      statusCode,
      context: {
        browser: BROWSERS[i % BROWSERS.length]!,
        os: OS[i % OS.length]!,
        version: `${faker.number.int({ min: 1, max: 120 })}.${faker.number.int({ min: 0, max: 9 })}`,
      },
      tags,
      resolved: level === 'error' ? faker.datatype.boolean(0.6) : faker.datatype.boolean(0.3),
    })
  }

  return logs
}
