/**
 * Usage Metrics Dataset Generator
 * SaaS user activity and engagement metrics
 */

import { faker } from '@faker-js/faker'
import type { UsageMetric } from '../types'

const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const

const FEATURES = [
  'dashboard',
  'reports',
  'exports',
  'api',
  'integrations',
  'analytics',
  'collaboration',
  'automation',
  'webhooks',
  'notifications',
]

export function generateUsageMetrics(count: number): UsageMetric[] {
  const metrics: UsageMetric[] = []
  const startDate = new Date('2025-01-01')

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const plan = PLANS[i % PLANS.length]!

    // Different usage patterns based on plan
    const sessionMultiplier = plan === 'enterprise' ? 3 : plan === 'pro' ? 2 : plan === 'starter' ? 1.5 : 1
    const sessionCount = faker.number.int({ min: 1, max: 10 }) * sessionMultiplier
    const activeMinutes = faker.number.int({ min: 10, max: 180 }) * sessionMultiplier

    const featureCount = plan === 'enterprise' ?
      faker.number.int({ min: 5, max: 10 }) :
      plan === 'pro' ?
      faker.number.int({ min: 3, max: 7 }) :
      faker.number.int({ min: 1, max: 4 })

    const featuresUsed = faker.helpers.arrayElements(FEATURES, featureCount)

    const apiCalls = plan === 'enterprise' || plan === 'pro' ?
      faker.number.int({ min: 100, max: 10000 }) :
      faker.number.int({ min: 0, max: 100 })

    const errors = faker.number.int({ min: 0, max: 20 })
    const engagement = faker.number.int({ min: 20, max: 100 })

    metrics.push({
      date: date.toISOString().split('T')[0]!,
      userId: (i % 50) + 1, // 50 unique users
      sessionCount: Math.round(sessionCount),
      activeMinutes: Math.round(activeMinutes),
      featuresUsed,
      apiCalls,
      errors,
      engagement,
      plan,
    })
  }

  return metrics
}
