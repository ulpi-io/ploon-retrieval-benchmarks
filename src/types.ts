/**
 * Type definitions for PLOON retrieval benchmarks
 */

export type DatasetName =
  | 'support-tickets'
  | 'products'
  | 'usage-metrics'
  | 'sales-deals'
  | 'error-logs'

export type FormatName =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'xml'
  | 'toon'
  | 'ploon'

export type QuestionType =
  | 'field-retrieval'
  | 'aggregation'
  | 'filtering'

export interface Question {
  id: string
  prompt: string
  groundTruth: string
  type: QuestionType
  dataset: DatasetName
}

export interface EvaluationResult {
  questionId: string
  format: FormatName
  model: string
  judgeModel: string
  expected: string
  actual: string
  isCorrect: boolean
  judgeAnswer: string
  inputTokens: number
  outputTokens: number
  responseTimeMs: number
  judgeLatencyMs: number
}

export interface DatasetMetadata {
  name: DatasetName
  recordCount: number
  questionCount: number
  generatedAt: string
}

// Dataset-specific types

export interface SupportTicket {
  id: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  subject: string
  customer: {
    name: string
    email: string
    company: string
  }
  assignee: string | null
  messages: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface Product {
  id: string
  name: string
  category: string
  basePrice: number
  rating: number
  reviewCount: number
  tags: string[]
  colors: {
    name: string
    hex: string
    sizes: {
      size: string
      sku: string
      inStock: number
      price: number
    }[]
  }[]
  dimensions: {
    width: number
    height: number
    depth: number
    weight: number
  }
  createdAt: string
  updatedAt: string
}

export interface UsageMetric {
  date: string
  userId: number
  sessionCount: number
  activeMinutes: number
  featuresUsed: string[]
  apiCalls: number
  errors: number
  engagement: number // 0-100 score
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
}

export interface SalesDeal {
  id: string
  name: string
  amount: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number // 0-100
  closeDate: string
  contact: {
    name: string
    email: string
    phone: string
    company: string
    title: string
  }
  activities: {
    type: 'call' | 'email' | 'meeting' | 'demo'
    date: string
    notes: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'critical'
  message: string
  stackTrace: string
  userId: number | null
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  statusCode: number
  context: {
    browser: string
    os: string
    version: string
  }
  tags: string[]
  resolved: boolean
}
