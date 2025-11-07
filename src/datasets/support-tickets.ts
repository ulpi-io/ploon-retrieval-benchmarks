/**
 * Support Tickets Dataset Generator
 * Customer support tickets with status, priority, and messages
 */

import { faker } from '@faker-js/faker'
import type { SupportTicket } from '../types'

const STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const TAGS = ['bug', 'feature-request', 'question', 'billing', 'technical', 'documentation', 'needs-info']

export function generateSupportTickets(count: number): SupportTicket[] {
  const tickets: SupportTicket[] = []

  for (let i = 0; i < count; i++) {
    const createdAt = faker.date.recent({ days: 90 }).toISOString()
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() }).toISOString()

    const status = STATUSES[i % STATUSES.length]!
    const isResolved = status === 'resolved' || status === 'closed'
    const resolvedAt = isResolved ? faker.date.between({ from: updatedAt, to: new Date() }).toISOString() : null

    const messageCount = faker.number.int({ min: 1, max: 8 })
    const messages: string[] = []
    for (let j = 0; j < messageCount; j++) {
      messages.push(faker.lorem.sentence())
    }

    const tagCount = faker.number.int({ min: 1, max: 4 })
    const tags: string[] = faker.helpers.arrayElements(TAGS, tagCount)

    tickets.push({
      id: `T${String(i + 1).padStart(4, '0')}`,
      status,
      priority: PRIORITIES[i % PRIORITIES.length]!,
      subject: faker.company.catchPhrase(),
      customer: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        company: faker.company.name(),
      },
      assignee: status === 'open' ? null : faker.person.fullName(),
      messages,
      tags,
      createdAt,
      updatedAt,
      resolvedAt,
    })
  }

  return tickets
}
