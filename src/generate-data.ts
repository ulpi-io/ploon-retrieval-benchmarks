/**
 * Generate datasets and convert to all formats
 * Usage: npm run generate-data
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { faker } from '@faker-js/faker'
import { CONFIG } from './config'
import { formatters, getFileExtension } from './formatters'
import { generateSupportTickets } from './datasets/support-tickets'
import { generateProducts } from './datasets/products'
import { generateUsageMetrics } from './datasets/usage-metrics'
import { generateSalesDeals } from './datasets/sales-deals'
import { generateErrorLogs } from './datasets/error-logs'
import type { DatasetName, DatasetMetadata } from './types'

// Set Faker seed for reproducibility
faker.seed(CONFIG.fakerSeed)

const DATA_DIR = path.join(process.cwd(), 'data')

/**
 * Dataset generators mapping
 */
const generators = {
  'support-tickets': generateSupportTickets,
  'products': generateProducts,
  'usage-metrics': generateUsageMetrics,
  'sales-deals': generateSalesDeals,
  'error-logs': generateErrorLogs,
}

/**
 * Generate and save a single dataset in all formats
 */
function generateDataset(datasetName: DatasetName) {
  console.log(`\n📊 Generating ${datasetName}...`)

  const generator = generators[datasetName]
  const data = generator(CONFIG.dataSize.recordCount)

  // Create dataset directory
  const datasetDir = path.join(DATA_DIR, datasetName)
  if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir, { recursive: true })
  }

  // Save in all formats
  for (const format of CONFIG.formats) {
    const formatter = formatters[format]
    const formattedData = formatter(data)
    const extension = getFileExtension(format)
    const fileName = `data.${extension}`

    const filePath = path.join(datasetDir, fileName)
    fs.writeFileSync(filePath, formattedData, 'utf-8')
    console.log(`  ✓ ${fileName} (${formattedData.length} bytes)`)
  }

  // Save metadata
  const metadata: DatasetMetadata = {
    name: datasetName,
    recordCount: CONFIG.dataSize.recordCount,
    questionCount: CONFIG.dataSize.questionCount,
    generatedAt: new Date().toISOString(),
  }

  fs.writeFileSync(
    path.join(datasetDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )

  console.log(`  ✓ Generated ${CONFIG.dataSize.recordCount} records`)
}

/**
 * Main
 */
function main() {
  console.log('🚀 PLOON Retrieval Benchmarks - Data Generation')
  console.log(`   Records per dataset: ${CONFIG.dataSize.recordCount}`)
  console.log(`   Faker seed: ${CONFIG.fakerSeed}`)
  console.log(`   Formats: ${CONFIG.formats.join(', ')}`)

  // Create data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // Generate all datasets
  for (const dataset of CONFIG.datasets) {
    generateDataset(dataset)
  }

  console.log('\n✅ Data generation complete!')
  console.log(`   Output: ${DATA_DIR}`)
}

main()
