/**
 * Sales Deals Dataset Generator
 * CRM pipeline with contacts, amounts, and activities
 */

import { faker } from '@faker-js/faker'
import type { SalesDeal } from '../types'

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] as const
const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'demo'] as const

export function generateSalesDeals(count: number): SalesDeal[] {
  const deals: SalesDeal[] = []

  for (let i = 0; i < count; i++) {
    const stage = STAGES[i % STAGES.length]!

    // Probability based on stage
    const probabilityMap = {
      'lead': faker.number.int({ min: 5, max: 20 }),
      'qualified': faker.number.int({ min: 20, max: 40 }),
      'proposal': faker.number.int({ min: 40, max: 60 }),
      'negotiation': faker.number.int({ min: 60, max: 80 }),
      'closed-won': 100,
      'closed-lost': 0,
    }
    const probability = probabilityMap[stage]

    const createdAt = faker.date.recent({ days: 180 }).toISOString()
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    const closeDate = faker.date.soon({ days: 90 }).toISOString().split('T')[0]!

    // Generate activities (more activities for later stages)
    const activityCount = Math.min(Math.max(1, STAGES.indexOf(stage) + faker.number.int({ min: 0, max: 3 })), 8)
    const activities = Array.from({ length: activityCount }, () => ({
      type: ACTIVITY_TYPES[faker.number.int({ min: 0, max: ACTIVITY_TYPES.length - 1 })]!,
      date: faker.date.between({ from: createdAt, to: updatedAt }).toISOString().split('T')[0]!,
      notes: faker.lorem.sentence(),
    }))

    deals.push({
      id: `D${String(i + 1).padStart(5, '0')}`,
      name: `${faker.company.name()} - ${faker.commerce.productName()}`,
      amount: faker.number.int({ min: 5000, max: 500000 }),
      stage,
      probability,
      closeDate,
      contact: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        title: faker.person.jobTitle(),
      },
      activities,
      createdAt,
      updatedAt,
    })
  }

  return deals
}
