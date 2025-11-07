/**
 * Configuration for PLOON retrieval benchmarks
 * All settings are configurable here
 */

import 'dotenv/config'
import type { DatasetName, FormatName } from './types'

export const CONFIG = {
  /**
   * Data generation settings
   */
  dataSize: {
    recordCount: 100, // How many records to generate per dataset
    questionCount: 100, // How many questions to generate per dataset
  },

  /**
   * OpenRouter API configuration
   */
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: 'https://openrouter.ai/api/v1',
  },

  /**
   * Models to test (OpenRouter model IDs)
   * Configurable list of evaluation models
   */
  evaluationModels: [
    'openai/gpt-5',
    'anthropic/claude-sonnet-4.5',
    'google/gemini-2.5-flash',
    'x-ai/grok-4-fast',
  ] as string[],

  /**
   * Judge model for LLM-as-judge validation
   * Configurable - use fast, cheap model for validation
   */
  judgeModel: 'openai/gpt-4o-mini',

  /**
   * Datasets to generate and benchmark
   */
  datasets: [
    'support-tickets',
    'products',
    'usage-metrics',
    'sales-deals',
    'error-logs',
  ] as DatasetName[],

  /**
   * Formats to test
   */
  formats: [
    'json',
    'yaml',
    'csv',
    'xml',
    'toon',
    'ploon',
    'ploon-minified',
  ] as FormatName[],

  /**
   * Rate limiting and concurrency
   */
  concurrency: 5, // How many parallel requests
  rpmLimit: 100, // Requests per minute (OpenRouter limit)

  /**
   * Faker.js seed for reproducible data generation
   */
  fakerSeed: 12345,
} as const

/**
 * Validate configuration
 */
export function validateConfig() {
  if (!CONFIG.openrouter.apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required')
  }

  if (CONFIG.evaluationModels.length === 0) {
    throw new Error('At least one evaluation model must be configured')
  }

  if (CONFIG.dataSize.recordCount <= 0 || CONFIG.dataSize.questionCount <= 0) {
    throw new Error('Record count and question count must be positive')
  }
}
