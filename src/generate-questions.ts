/**
 * Generate questions for each dataset
 * Usage: npm run generate-questions
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { CONFIG } from './config'
import { QUESTION_THRESHOLDS } from './question-constants'
import type { Question, SupportTicket, Product, UsageMetric, SalesDeal, ErrorLog, DatasetName } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')

/**
 * Generate questions for support-tickets dataset
 */
function generateSupportTicketsQuestions(data: SupportTicket[]): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  const targetCount = CONFIG.dataSize.questionCount
  const fieldRetrievalCount = Math.ceil(targetCount * 0.4) // 40%
  const aggregationCount = Math.ceil(targetCount * 0.3)     // 30%
  const filteringCount = Math.ceil(targetCount * 0.3)       // 30%

  // Field retrieval questions (40%)
  for (let i = 0; i < Math.min(fieldRetrievalCount, data.length * 2); i++) {
    const ticket = data[i * 2] || data[i]
    if (!ticket) continue

    if (i % 5 === 0) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the status of ticket ${ticket.id}?`,
        groundTruth: ticket.status,
        type: 'field-retrieval',
        dataset: 'support-tickets',
      })
    } else if (i % 5 === 1) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the priority of ticket ${ticket.id}?`,
        groundTruth: ticket.priority,
        type: 'field-retrieval',
        dataset: 'support-tickets',
      })
    } else if (i % 5 === 2) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `Who is the customer for ticket ${ticket.id}?`,
        groundTruth: ticket.customer.name,
        type: 'field-retrieval',
        dataset: 'support-tickets',
      })
    } else if (i % 5 === 3) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the customer email for ticket ${ticket.id}?`,
        groundTruth: ticket.customer.email,
        type: 'field-retrieval',
        dataset: 'support-tickets',
      })
    } else {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What company does the customer of ticket ${ticket.id} work for?`,
        groundTruth: ticket.customer.company,
        type: 'field-retrieval',
        dataset: 'support-tickets',
      })
    }
  }

  // Aggregation questions (30%) - Dynamic generation
  let aggCount = 0

  // 1. Total count
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many support tickets are in the dataset?',
      groundTruth: String(data.length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // 2. Count by status (dynamic based on actual statuses in data)
  const statuses = [...new Set(data.map(t => t.status))]
  for (const status of statuses.slice(0, Math.min(4, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many tickets have status "${status}"?`,
      groundTruth: String(data.filter(t => t.status === status).length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // 3. Count by priority (dynamic based on actual priorities in data)
  const priorities = [...new Set(data.map(t => t.priority))]
  for (const priority of priorities.slice(0, Math.min(4, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many tickets have priority "${priority}"?`,
      groundTruth: String(data.filter(t => t.priority === priority).length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // 4. Message count thresholds (using constants)
  for (const threshold of QUESTION_THRESHOLDS['support-tickets'].messageCount.slice(0, Math.min(8, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many tickets have more than ${threshold} messages?`,
      groundTruth: String(data.filter(t => t.messages.length > threshold).length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // 5. With/without assignee
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many tickets have an assignee?',
      groundTruth: String(data.filter(t => t.assignee !== null).length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many tickets do not have an assignee?',
      groundTruth: String(data.filter(t => t.assignee === null).length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // 6. Resolved/unresolved
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many tickets are resolved or closed?',
      groundTruth: String(data.filter(t => t.status === 'resolved' || t.status === 'closed').length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many tickets are unresolved (open or in-progress)?',
      groundTruth: String(data.filter(t => t.status === 'open' || t.status === 'in-progress').length),
      type: 'aggregation',
      dataset: 'support-tickets',
    })
    aggCount++
  }

  // Filtering questions (30%) - Dynamic multi-condition queries
  let filterCount = 0

  // 1. Status + Priority combinations (using constants)
  for (const combo of QUESTION_THRESHOLDS['support-tickets'].statusPriorityCombos.slice(0, Math.min(12, filteringCount - filterCount))) {
    const count = data.filter(t => t.status === combo.status && t.priority === combo.priority).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many tickets have status "${combo.status}" AND priority "${combo.priority}"?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'support-tickets',
    })
    filterCount++
  }

  // 2. Priority + Assignee status
  for (const priority of QUESTION_THRESHOLDS['support-tickets'].priorityWithAssignee.slice(0, Math.min(4, filteringCount - filterCount))) {
    const count = data.filter(t => t.priority === priority && t.assignee !== null).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many ${priority} priority tickets have an assignee?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'support-tickets',
    })
    filterCount++
  }

  // 3. Status + Message count
  for (const status of ['open', 'in-progress'].slice(0, Math.min(2, filteringCount - filterCount))) {
    for (const threshold of QUESTION_THRESHOLDS['support-tickets'].messageThresholdsFiltering.slice(0, Math.min(3, filteringCount - filterCount))) {
      const count = data.filter(t => t.status === status && t.messages.length > threshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many ${status} tickets have more than ${threshold} messages?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'support-tickets',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  // 4. Priority + Unresolved status
  for (const priority of ['high', 'urgent'].slice(0, Math.min(2, filteringCount - filterCount))) {
    const count = data.filter(t =>
      t.priority === priority &&
      (t.status === 'open' || t.status === 'in-progress')
    ).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many ${priority} priority tickets are unresolved (open or in-progress)?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'support-tickets',
    })
    filterCount++
    if (filterCount >= filteringCount) break
  }

  // 5. Priority + No assignee
  for (const priority of ['low', 'medium'].slice(0, Math.min(2, filteringCount - filterCount))) {
    const count = data.filter(t => t.priority === priority && t.assignee === null).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many ${priority} priority tickets do not have an assignee?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'support-tickets',
    })
    filterCount++
    if (filterCount >= filteringCount) break
  }

  return questions.slice(0, targetCount)
}

/**
 * Generate questions for products dataset
 */
function generateProductsQuestions(data: Product[]): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  const targetCount = CONFIG.dataSize.questionCount
  const fieldRetrievalCount = Math.ceil(targetCount * 0.4)
  const aggregationCount = Math.ceil(targetCount * 0.3)
  const filteringCount = Math.ceil(targetCount * 0.3)

  // Field retrieval questions - query nested color/size data
  for (let i = 0; i < Math.min(fieldRetrievalCount, data.length * 2); i++) {
    const product = data[i * 2] || data[i]
    if (!product) continue

    if (i % 5 === 0 && product.colors.length > 0) {
      const color = product.colors[0]!
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What colors are available for ${product.name}?`,
        groundTruth: product.colors.map(c => c.name).join(', '),
        type: 'field-retrieval',
        dataset: 'products',
      })
    } else if (i % 5 === 1 && product.colors.length > 0 && product.colors[0]!.sizes.length > 0) {
      const color = product.colors[0]!
      const size = color.sizes[0]!
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the SKU for ${product.name} in ${color.name}, size ${size.size}?`,
        groundTruth: size.sku,
        type: 'field-retrieval',
        dataset: 'products',
      })
    } else if (i % 5 === 2 && product.colors.length > 0 && product.colors[0]!.sizes.length > 0) {
      const color = product.colors[0]!
      const size = color.sizes[0]!
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many units of ${product.name} in ${color.name}, size ${size.size} are in stock?`,
        groundTruth: String(size.inStock),
        type: 'field-retrieval',
        dataset: 'products',
      })
    } else if (i % 5 === 3) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What category is ${product.name} in?`,
        groundTruth: product.category,
        type: 'field-retrieval',
        dataset: 'products',
      })
    } else {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the rating of ${product.name}?`,
        groundTruth: String(product.rating),
        type: 'field-retrieval',
        dataset: 'products',
      })
    }
  }

  // Aggregation questions (30%) - Dynamic generation
  let aggCount = 0

  // 1. Total count
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many products are in the catalog?',
      groundTruth: String(data.length),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 2. Average base price
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the average base price across all products?',
      groundTruth: (data.reduce((sum, p) => sum + p.basePrice, 0) / data.length).toFixed(2),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 3. Total color options
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total number of color options across all products?',
      groundTruth: String(data.reduce((sum, p) => sum + p.colors.length, 0)),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 4. Count by category (dynamic based on actual categories in data)
  const categories = [...new Set(data.map(p => p.category))]
  for (const category of categories.slice(0, Math.min(3, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products are in the ${category} category?`,
      groundTruth: String(data.filter(p => p.category === category).length),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 5. Price range thresholds
  for (const price of QUESTION_THRESHOLDS['products'].priceRanges.slice(0, Math.min(8, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products have a base price over $${price}?`,
      groundTruth: String(data.filter(p => p.basePrice > price).length),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 6. Rating thresholds
  for (const rating of QUESTION_THRESHOLDS['products'].ratingThresholds.slice(0, Math.min(6, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products have a rating above ${rating}?`,
      groundTruth: String(data.filter(p => p.rating > rating).length),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // 7. Color count thresholds
  for (const count of QUESTION_THRESHOLDS['products'].colorCounts.slice(0, Math.min(4, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products have ${count} or more color options?`,
      groundTruth: String(data.filter(p => p.colors.length >= count).length),
      type: 'aggregation',
      dataset: 'products',
    })
    aggCount++
  }

  // Filtering questions (30%) - Dynamic multi-condition queries
  let filterCount = 0

  // 1. Price + Rating combinations
  for (const combo of QUESTION_THRESHOLDS['products'].priceRatingCombos.slice(0, Math.min(7, filteringCount - filterCount))) {
    const count = data.filter(p => p.basePrice > combo.price && p.rating >= combo.rating).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products have a base price over $${combo.price} AND a rating of ${combo.rating} or higher?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'products',
    })
    filterCount++
  }

  // 2. Category + Price combinations
  for (const category of categories.slice(0, Math.min(3, filteringCount - filterCount))) {
    for (const combo of QUESTION_THRESHOLDS['products'].categoryPriceCombos.slice(0, Math.min(3, filteringCount - filterCount))) {
      const count = data.filter(p => p.category === category && p.basePrice > combo.price).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many ${category} products cost more than $${combo.price}?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'products',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  // 3. Rating + Color count combinations
  for (const combo of QUESTION_THRESHOLDS['products'].ratingColorCombos.slice(0, Math.min(3, filteringCount - filterCount))) {
    const count = data.filter(p => p.rating >= combo.rating && p.colors.length >= combo.colorCount).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many products have a rating of ${combo.rating} or higher AND ${combo.colorCount} or more color options?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'products',
    })
    filterCount++
  }

  // 4. Category + Rating combinations
  for (const category of categories.slice(0, Math.min(2, filteringCount - filterCount))) {
    for (const rating of [3.0, 4.0].slice(0, Math.min(2, filteringCount - filterCount))) {
      const count = data.filter(p => p.category === category && p.rating >= rating).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many ${category} products have a rating of ${rating} or higher?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'products',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  return questions.slice(0, targetCount)
}

/**
 * Generate questions for usage-metrics dataset
 */
function generateUsageMetricsQuestions(data: UsageMetric[]): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  const targetCount = CONFIG.dataSize.questionCount
  const fieldRetrievalCount = Math.ceil(targetCount * 0.4)
  const aggregationCount = Math.ceil(targetCount * 0.3)
  const filteringCount = Math.ceil(targetCount * 0.3)

  // Field retrieval questions
  for (let i = 0; i < Math.min(fieldRetrievalCount, data.length * 2); i++) {
    const metric = data[i * 2] || data[i]
    if (!metric) continue

    if (i % 3 === 0) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many sessions did user ${metric.userId} have on ${metric.date}?`,
        groundTruth: String(metric.sessionCount),
        type: 'field-retrieval',
        dataset: 'usage-metrics',
      })
    } else if (i % 3 === 1) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What was the engagement score for user ${metric.userId} on ${metric.date}?`,
        groundTruth: String(metric.engagement),
        type: 'field-retrieval',
        dataset: 'usage-metrics',
      })
    } else {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What plan was user ${metric.userId} on for the session on ${metric.date}?`,
        groundTruth: metric.plan,
        type: 'field-retrieval',
        dataset: 'usage-metrics',
      })
    }
  }

  // Aggregation questions (30%) - Dynamic generation
  let aggCount = 0

  // 1. Total sessions
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total number of sessions across all records?',
      groundTruth: String(data.reduce((sum, m) => sum + m.sessionCount, 0)),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 2. Average engagement
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the average engagement score?',
      groundTruth: String(Math.round(data.reduce((sum, m) => sum + m.engagement, 0) / data.length)),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 3. Total API calls
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total number of API calls?',
      groundTruth: String(data.reduce((sum, m) => sum + m.apiCalls, 0)),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 4. Count by plan (dynamic based on actual plans in data)
  const plans = [...new Set(data.map(m => m.plan))]
  for (const plan of plans.slice(0, Math.min(4, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many records are for ${plan} plan users?`,
      groundTruth: String(data.filter(m => m.plan === plan).length),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 5. Session count thresholds
  for (const threshold of QUESTION_THRESHOLDS['usage-metrics'].sessionCounts.slice(0, Math.min(6, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many sessions had more than ${threshold} session count?`,
      groundTruth: String(data.filter(m => m.sessionCount > threshold).length),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 6. Engagement score thresholds
  for (const threshold of QUESTION_THRESHOLDS['usage-metrics'].engagementScores.slice(0, Math.min(7, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many records had engagement scores above ${threshold}?`,
      groundTruth: String(data.filter(m => m.engagement > threshold).length),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // 7. API call thresholds
  for (const threshold of QUESTION_THRESHOLDS['usage-metrics'].apiCallCounts.slice(0, Math.min(6, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many records had more than ${threshold} API calls?`,
      groundTruth: String(data.filter(m => m.apiCalls > threshold).length),
      type: 'aggregation',
      dataset: 'usage-metrics',
    })
    aggCount++
  }

  // Filtering questions (30%) - Dynamic multi-condition queries
  let filterCount = 0

  // 1. Plan + Engagement combinations
  for (const combo of QUESTION_THRESHOLDS['usage-metrics'].planEngagementCombos.slice(0, Math.min(6, filteringCount - filterCount))) {
    const count = data.filter(m => m.plan === combo.plan && m.engagement > combo.engagement).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many ${combo.plan} plan users had engagement scores above ${combo.engagement}?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'usage-metrics',
    })
    filterCount++
  }

  // 2. Engagement + API calls combinations
  for (const combo of QUESTION_THRESHOLDS['usage-metrics'].engagementApiCombos.slice(0, Math.min(4, filteringCount - filterCount))) {
    const count = data.filter(m => m.engagement > combo.engagement && m.apiCalls > combo.apiCalls).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many records had engagement above ${combo.engagement} AND more than ${combo.apiCalls} API calls?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'usage-metrics',
    })
    filterCount++
  }

  // 3. Engagement + Error combinations
  for (const engThreshold of [50, 60, 70].slice(0, Math.min(3, filteringCount - filterCount))) {
    for (const errThreshold of QUESTION_THRESHOLDS['usage-metrics'].errorCounts.slice(0, Math.min(2, filteringCount - filterCount))) {
      const count = data.filter(m => m.engagement < engThreshold && m.errors > errThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many sessions had engagement below ${engThreshold} AND more than ${errThreshold} errors?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'usage-metrics',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  // 4. Plan + API calls combinations
  for (const plan of ['free', 'starter', 'pro'].slice(0, Math.min(3, filteringCount - filterCount))) {
    for (const apiThreshold of [10, 20, 50].slice(0, Math.min(2, filteringCount - filterCount))) {
      const count = data.filter(m => m.plan === plan && m.apiCalls > apiThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many ${plan} plan users had more than ${apiThreshold} API calls?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'usage-metrics',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  return questions.slice(0, targetCount)
}

/**
 * Generate questions for sales-deals dataset
 */
function generateSalesDealsQuestions(data: SalesDeal[]): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  const targetCount = CONFIG.dataSize.questionCount
  const fieldRetrievalCount = Math.ceil(targetCount * 0.4)
  const aggregationCount = Math.ceil(targetCount * 0.3)
  const filteringCount = Math.ceil(targetCount * 0.3)

  // Field retrieval questions
  for (let i = 0; i < Math.min(fieldRetrievalCount, data.length * 2); i++) {
    const deal = data[i * 2] || data[i]
    if (!deal) continue

    if (i % 4 === 0) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the amount for deal ${deal.id}?`,
        groundTruth: String(deal.amount),
        type: 'field-retrieval',
        dataset: 'sales-deals',
      })
    } else if (i % 4 === 1) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What stage is deal ${deal.id} in?`,
        groundTruth: deal.stage,
        type: 'field-retrieval',
        dataset: 'sales-deals',
      })
    } else if (i % 4 === 2) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `Who is the contact for deal ${deal.id}?`,
        groundTruth: deal.contact.name,
        type: 'field-retrieval',
        dataset: 'sales-deals',
      })
    } else {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the probability of closing deal ${deal.id}?`,
        groundTruth: String(deal.probability),
        type: 'field-retrieval',
        dataset: 'sales-deals',
      })
    }
  }

  // Aggregation questions (30%) - Dynamic generation
  let aggCount = 0

  // 1. Total pipeline
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many sales deals are in the pipeline?',
      groundTruth: String(data.length),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // 2. Total value
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the total value of all deals?',
      groundTruth: String(data.reduce((sum, d) => sum + d.amount, 0)),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // 3. Average deal amount
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'What is the average deal amount?',
      groundTruth: String(Math.round(data.reduce((sum, d) => sum + d.amount, 0) / data.length)),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // 4. Count by stage (dynamic based on actual stages in data)
  const stages = [...new Set(data.map(d => d.stage))]
  for (const stage of stages.slice(0, Math.min(6, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals are in ${stage} stage?`,
      groundTruth: String(data.filter(d => d.stage === stage).length),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // 5. Amount thresholds
  for (const threshold of QUESTION_THRESHOLDS['sales-deals'].amountRanges.slice(0, Math.min(8, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals are worth more than $${threshold}?`,
      groundTruth: String(data.filter(d => d.amount > threshold).length),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // 6. Probability thresholds
  for (const threshold of QUESTION_THRESHOLDS['sales-deals'].probabilityRanges.slice(0, Math.min(7, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals have probability greater than ${threshold}%?`,
      groundTruth: String(data.filter(d => d.probability > threshold).length),
      type: 'aggregation',
      dataset: 'sales-deals',
    })
    aggCount++
  }

  // Filtering questions (30%) - Dynamic multi-condition queries
  let filterCount = 0

  // 1. Stage + Amount combinations
  for (const combo of QUESTION_THRESHOLDS['sales-deals'].stageAmountCombos.slice(0, Math.min(7, filteringCount - filterCount))) {
    const count = data.filter(d => d.stage === combo.stage && d.amount > combo.amount).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals in ${combo.stage} stage are worth more than $${combo.amount}?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'sales-deals',
    })
    filterCount++
  }

  // 2. Amount + Probability combinations
  for (const combo of QUESTION_THRESHOLDS['sales-deals'].amountProbabilityCombos.slice(0, Math.min(5, filteringCount - filterCount))) {
    const count = data.filter(d => d.amount > combo.amount && d.probability > combo.probability).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals worth more than $${combo.amount} have probability greater than ${combo.probability}%?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'sales-deals',
    })
    filterCount++
  }

  // 3. Stage + Probability combinations
  for (const stage of ['proposal', 'negotiation'].slice(0, Math.min(2, filteringCount - filterCount))) {
    for (const probThreshold of [50, 60, 70].slice(0, Math.min(3, filteringCount - filterCount))) {
      const count = data.filter(d => d.stage === stage && d.probability > probThreshold).length
      questions.push({
        id: `q${idCounter++}`,
        prompt: `How many deals in ${stage} stage have probability greater than ${probThreshold}%?`,
        groundTruth: String(count),
        type: 'filtering',
        dataset: 'sales-deals',
      })
      filterCount++
      if (filterCount >= filteringCount) break
    }
    if (filterCount >= filteringCount) break
  }

  // 4. Multiple stages combined with amount
  for (const amountThreshold of [100000, 200000, 300000].slice(0, Math.min(3, filteringCount - filterCount))) {
    const count = data.filter(d =>
      (d.stage === 'proposal' || d.stage === 'negotiation') &&
      d.amount > amountThreshold
    ).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many deals in proposal or negotiation stage are worth more than $${amountThreshold}?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'sales-deals',
    })
    filterCount++
  }

  return questions.slice(0, targetCount)
}

/**
 * Generate questions for error-logs dataset
 */
function generateErrorLogsQuestions(data: ErrorLog[]): Question[] {
  const questions: Question[] = []
  let idCounter = 1

  const targetCount = CONFIG.dataSize.questionCount
  const fieldRetrievalCount = Math.ceil(targetCount * 0.4)
  const aggregationCount = Math.ceil(targetCount * 0.3)
  const filteringCount = Math.ceil(targetCount * 0.3)

  // Field retrieval questions
  for (let i = 0; i < Math.min(fieldRetrievalCount, data.length * 2); i++) {
    const log = data[i * 2] || data[i]
    if (!log) continue

    if (i % 4 === 0) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What is the error level for log ${log.id}?`,
        groundTruth: log.level,
        type: 'field-retrieval',
        dataset: 'error-logs',
      })
    } else if (i % 4 === 1) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What endpoint caused error ${log.id}?`,
        groundTruth: log.endpoint,
        type: 'field-retrieval',
        dataset: 'error-logs',
      })
    } else if (i % 4 === 2) {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What HTTP method was used for error ${log.id}?`,
        groundTruth: log.method,
        type: 'field-retrieval',
        dataset: 'error-logs',
      })
    } else {
      questions.push({
        id: `q${idCounter++}`,
        prompt: `What was the status code for error ${log.id}?`,
        groundTruth: String(log.statusCode),
        type: 'field-retrieval',
        dataset: 'error-logs',
      })
    }
  }

  // Aggregation questions (30%) - Dynamic generation
  let aggCount = 0

  // 1. Total count
  questions.push({
    id: `q${idCounter++}`,
    prompt: 'How many error logs are in the dataset?',
    groundTruth: String(data.length),
    type: 'aggregation',
    dataset: 'error-logs',
  })
  aggCount++

  // 2. Count by level
  const levels = [...new Set(data.map(e => e.level))]
  for (const level of levels.slice(0, Math.min(2, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many errors have level "${level}"?`,
      groundTruth: String(data.filter(e => e.level === level).length),
      type: 'aggregation',
      dataset: 'error-logs',
    })
    aggCount++
  }

  // 3. Count by resolved status
  if (aggCount < aggregationCount) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: 'How many errors have been resolved?',
      groundTruth: String(data.filter(e => e.resolved).length),
      type: 'aggregation',
      dataset: 'error-logs',
    })
    aggCount++
  }

  // 4. Count by method
  const methods = [...new Set(data.map(e => e.method))]
  for (const method of methods.slice(0, Math.min(5, aggregationCount - aggCount))) {
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many errors are from ${method} requests?`,
      groundTruth: String(data.filter(e => e.method === method).length),
      type: 'aggregation',
      dataset: 'error-logs',
    })
    aggCount++
  }

  // 5. Count by status code (threshold-based)
  for (const statusCode of QUESTION_THRESHOLDS['error-logs'].statusCodes.slice(0, aggregationCount - aggCount)) {
    const count = data.filter(e => e.statusCode === statusCode).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many errors have status code ${statusCode}?`,
      groundTruth: String(count),
      type: 'aggregation',
      dataset: 'error-logs',
    })
    aggCount++
  }

  // Filtering questions (30%) - Dynamic multi-condition queries
  let filterCount = 0

  // 1. Method + Status combinations
  for (const combo of QUESTION_THRESHOLDS['error-logs'].methodStatusCombos.slice(0, Math.min(7, filteringCount - filterCount))) {
    const count = data.filter(e => e.method === combo.method && e.statusCode === combo.statusCode).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many errors are from ${combo.method} requests AND have status code ${combo.statusCode}?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'error-logs',
    })
    filterCount++
  }

  // 2. Level + Resolved combinations
  for (const combo of QUESTION_THRESHOLDS['error-logs'].levelResolvedCombos.slice(0, Math.min(4, filteringCount - filterCount))) {
    const count = data.filter(e => e.level === combo.level && e.resolved === combo.resolved).length
    const resolvedText = combo.resolved ? 'resolved' : 'unresolved'
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many ${combo.level} errors are ${resolvedText}?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'error-logs',
    })
    filterCount++
  }

  // 3. Method + Level combinations
  for (const combo of QUESTION_THRESHOLDS['error-logs'].methodLevelCombos.slice(0, filteringCount - filterCount)) {
    const count = data.filter(e => e.method === combo.method && e.level === combo.level).length
    questions.push({
      id: `q${idCounter++}`,
      prompt: `How many errors are from ${combo.method} requests AND have level "${combo.level}"?`,
      groundTruth: String(count),
      type: 'filtering',
      dataset: 'error-logs',
    })
    filterCount++
  }

  return questions.slice(0, targetCount)
}

/**
 * Question generators mapping
 */
const questionGenerators: Record<DatasetName, (data: any) => Question[]> = {
  'support-tickets': generateSupportTicketsQuestions,
  'products': generateProductsQuestions,
  'usage-metrics': generateUsageMetricsQuestions,
  'sales-deals': generateSalesDealsQuestions,
  'error-logs': generateErrorLogsQuestions,
}

/**
 * Generate questions for a single dataset
 */
function generateQuestionsForDataset(datasetName: DatasetName) {
  console.log(`\n❓ Generating questions for ${datasetName}...`)

  // Read JSON data
  const dataPath = path.join(DATA_DIR, datasetName, 'data.json')
  if (!fs.existsSync(dataPath)) {
    console.error(`  ✗ Data file not found: ${dataPath}`)
    console.error(`  → Run 'npm run generate-data' first`)
    return
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  // Generate questions
  const generator = questionGenerators[datasetName]
  const questions = generator(data)

  // Save questions
  const questionsPath = path.join(DATA_DIR, datasetName, 'questions.json')
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf-8')

  console.log(`  ✓ Generated ${questions.length} questions`)
  console.log(`  ✓ Saved to ${questionsPath}`)
}

/**
 * Main
 */
function main() {
  console.log('🚀 PLOON Retrieval Benchmarks - Question Generation')
  console.log(`   Questions per dataset: ${CONFIG.dataSize.questionCount}`)

  // Generate questions for all datasets
  for (const dataset of CONFIG.datasets) {
    generateQuestionsForDataset(dataset)
  }

  console.log('\n✅ Question generation complete!')
}

main()
