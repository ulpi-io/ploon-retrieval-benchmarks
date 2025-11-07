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
    recordCount: 60, // How many records to generate per dataset
    questionCount: 60, // How many questions to generate per dataset
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
    'openai/gpt-4o-mini',
    'openai/gpt-4o',
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
   * Model pricing (per million tokens)
   */
  pricing: {
    'openai/gpt-4o': {
      input: 2.50,  // $ per 1M input tokens
      output: 10.0, // $ per 1M output tokens
    },
    'openai/gpt-4o-mini': {
      input: 0.15,  // $ per 1M input tokens
      output: 0.60, // $ per 1M output tokens
    },
    'openai/gpt-5': {
      input: 1.25,  // $ per 1M input tokens
      output: 10.0, // $ per 1M output tokens
    },
    'anthropic/claude-sonnet-4.5': {
      input: 3.0,   // $ per 1M input tokens
      output: 15.0, // $ per 1M output tokens
    },
    'google/gemini-2.5-flash': {
      input: 0.30,  // $ per 1M input tokens
      output: 2.50, // $ per 1M output tokens
    },
    'x-ai/grok-4-fast': {
      input: 0.20,  // $ per 1M input tokens
      output: 0.50, // $ per 1M output tokens
    },
  } as Record<string, { input: number; output: number }>,

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
