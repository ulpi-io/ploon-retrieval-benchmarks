/**
 * Analyze benchmark results and generate reports
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { CONFIG } from './config'
import type { EvaluationResult, FormatName } from './types'

const RESULTS_DIR = path.join(process.cwd(), 'results')

interface FormatStats {
  format: FormatName
  inputTokens: number
  outputTokens: number
  totalCost: number
  correctCount: number
  totalCount: number
  totalResponseTimeMs: number
  avgResponseTimeMs: number
}

interface ModelReport {
  model: string
  dataset: string
  totalResults: number
  expectedResults: number
  formatStats: FormatStats[]
}

/**
 * Calculate cost for a model
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = CONFIG.pricing[model]
  if (!pricing) {
    console.warn(`⚠️  No pricing found for ${model}, using $0`)
    return 0
  }
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Format cost to dollars
 */
function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`
}

/**
 * Get rank display without medals
 */
function getRankDisplay(rank: number): string {
  const suffix = ['st', 'nd', 'rd', 'th', 'th', 'th']
  return `${rank}${suffix[rank - 1] || 'th'}`
}

/**
 * Format time in seconds
 */
function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Analyze a single result file
 */
function analyzeResultFile(filePath: string): ModelReport | null {
  const results: EvaluationResult[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  if (results.length === 0) {
    return null
  }

  const model = results[0].model
  const dataset = path.basename(path.dirname(filePath))

  // Group by format
  const formatMap = new Map<FormatName, EvaluationResult[]>()
  for (const result of results) {
    if (!formatMap.has(result.format)) {
      formatMap.set(result.format, [])
    }
    formatMap.get(result.format)!.push(result)
  }

  // Calculate stats per format
  const formatStats: FormatStats[] = []
  for (const [format, formatResults] of formatMap.entries()) {
    const inputTokens = formatResults.reduce((sum, r) => sum + r.inputTokens, 0)
    const outputTokens = formatResults.reduce((sum, r) => sum + r.outputTokens, 0)
    const totalCost = calculateCost(model, inputTokens, outputTokens)
    const correctCount = formatResults.filter(r => r.isCorrect).length
    const totalResponseTimeMs = formatResults.reduce((sum, r) => sum + r.responseTimeMs, 0)
    const avgResponseTimeMs = totalResponseTimeMs / formatResults.length

    formatStats.push({
      format,
      inputTokens,
      outputTokens,
      totalCost,
      correctCount,
      totalCount: formatResults.length,
      totalResponseTimeMs,
      avgResponseTimeMs,
    })
  }

  // Expected total results = questions * formats
  const questionsPerFormat = formatStats[0]?.totalCount || 0
  const expectedResults = questionsPerFormat * CONFIG.formats.length

  return {
    model,
    dataset,
    totalResults: results.length,
    expectedResults,
    formatStats,
  }
}

/**
 * Generate report for a model/dataset
 */
function generateReport(report: ModelReport): string {
  const { model, dataset, totalResults, expectedResults, formatStats } = report

  // Sort by cost (cheapest first)
  const sorted = [...formatStats].sort((a, b) => a.totalCost - b.totalCost)

  // Calculate savings relative to most expensive (CSV typically)
  const maxCost = Math.max(...sorted.map(s => s.totalCost))

  // Find most accurate format
  const mostAccurate = [...formatStats].reduce((best, current) => {
    const bestAcc = best.correctCount / best.totalCount
    const currentAcc = current.correctCount / current.totalCount
    return currentAcc > bestAcc ? current : best
  })

  // Find PLOON stats
  const ploonStats = formatStats.find(s => s.format === 'ploon')

  // Build table
  const rows: string[] = []

  // Determine completion status
  const isComplete = totalResults === expectedResults
  const status = isComplete
    ? `COMPLETE - ${totalResults}/${expectedResults} results`
    : `⚠️  INCOMPLETE - ${totalResults}/${expectedResults} results`

  // Header
  let output = `\n${model} - ${dataset} Dataset (${status})\n\n`

  // Sort by speed for speed ranking
  const sortedBySpeed = [...formatStats].sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)

  // Sort by accuracy for accuracy ranking (highest to lowest)
  const sortedByAccuracy = [...formatStats].sort((a, b) => {
    const accA = a.correctCount / a.totalCount
    const accB = b.correctCount / b.totalCount
    return accB - accA
  })

  // Table header
  output += '┌────────┬─────────────┬──────────────┬──────────────┬──────────┬─────────┬──────────┬─────────┬──────────────┬────────────┬───────────┐\n'
  output += '│ Format │ Input Tok   │ Output Tok   │ Total Cost   │ Avg Time │ Correct │ Accuracy │ Savings │ Accuracy Rank │ Speed Rank │ Cost Rank │\n'
  output += '├────────┼─────────────┼──────────────┼──────────────┼──────────┼─────────┼──────────┼─────────┼──────────────┼────────────┼───────────┤\n'

  // Data rows
  sorted.forEach((stat, index) => {
    const costRank = index + 1
    const speedRank = sortedBySpeed.findIndex(s => s.format === stat.format) + 1
    const accuracyRank = sortedByAccuracy.findIndex(s => s.format === stat.format) + 1
    const savings = ((stat.totalCost - maxCost) / maxCost * 100).toFixed(1)
    const accuracy = ((stat.correctCount / stat.totalCount) * 100).toFixed(1)
    const correct = `${stat.correctCount}/${stat.totalCount}`

    output += '│ '
    output += stat.format.padEnd(6) + ' │ '
    output += formatNumber(stat.inputTokens).padStart(11) + ' │ '
    output += formatNumber(stat.outputTokens).padStart(12) + ' │ '
    output += formatCost(stat.totalCost).padStart(12) + ' │ '
    output += formatTime(stat.avgResponseTimeMs).padStart(8) + ' │ '
    output += correct.padStart(7) + ' │ '
    output += (accuracy + '%').padStart(8) + ' │ '
    output += savings.padStart(6) + '% │ '
    output += getRankDisplay(accuracyRank).padStart(12) + ' │ '
    output += getRankDisplay(speedRank).padStart(10) + ' │ '
    output += getRankDisplay(costRank).padStart(9) + ' │\n'
  })

  output += '└────────┴─────────────┴──────────────┴──────────────┴──────────┴─────────┴──────────┴─────────┴──────────────┴────────────┴───────────┘\n'

  // Add PLOON vs most accurate comparison
  if (ploonStats && mostAccurate) {
    const ploonAcc = (ploonStats.correctCount / ploonStats.totalCount) * 100
    const bestAcc = (mostAccurate.correctCount / mostAccurate.totalCount) * 100
    const delta = ploonAcc - bestAcc

    // Calculate cost difference
    const costSavings = ((ploonStats.totalCost - mostAccurate.totalCost) / mostAccurate.totalCost * 100).toFixed(1)
    const costText = parseFloat(costSavings) < 0
      ? `${Math.abs(parseFloat(costSavings)).toFixed(1)}% cheaper`
      : `${costSavings}% more expensive`

    output += '\n'
    if (ploonStats.format === mostAccurate.format) {
      output += `PLOON is the most accurate format (${ploonAcc.toFixed(1)}%)\n`
    } else if (Math.abs(delta) < 0.1) {
      output += `PLOON matches the most accurate format (${mostAccurate.format} at ${bestAcc.toFixed(1)}%) at ${costText}\n`
    } else if (delta > 0) {
      output += `PLOON is the most accurate format at ${ploonAcc.toFixed(1)}% (+${delta.toFixed(1)}pp vs ${mostAccurate.format} at ${bestAcc.toFixed(1)}%) at ${costText}\n`
    } else {
      output += `Most accurate: ${mostAccurate.format} at ${bestAcc.toFixed(1)}% (PLOON: ${ploonAcc.toFixed(1)}%, ${delta.toFixed(1)}pp) but PLOON is ${costText}\n`
    }

    // Add speed comparison
    const fastest = sortedBySpeed[0]
    const speedDiff = ((ploonStats.avgResponseTimeMs - fastest.avgResponseTimeMs) / fastest.avgResponseTimeMs * 100).toFixed(1)

    if (ploonStats.format === fastest.format) {
      output += `PLOON is the fastest format (${formatTime(ploonStats.avgResponseTimeMs)} avg)\n`
    } else if (Math.abs(parseFloat(speedDiff)) < 5) {
      output += `PLOON matches the fastest format (${fastest.format} at ${formatTime(fastest.avgResponseTimeMs)}) with ${formatTime(ploonStats.avgResponseTimeMs)} avg\n`
    } else if (parseFloat(speedDiff) < 0) {
      output += `PLOON is the fastest format at ${formatTime(ploonStats.avgResponseTimeMs)} avg (${Math.abs(parseFloat(speedDiff)).toFixed(1)}% faster than ${fastest.format})\n`
    } else {
      output += `Fastest: ${fastest.format} at ${formatTime(fastest.avgResponseTimeMs)} avg (PLOON: ${formatTime(ploonStats.avgResponseTimeMs)}, ${speedDiff}% slower)\n`
    }
  }

  return output
}

/**
 * Generate summary row for a report
 */
function generateSummaryRow(report: ModelReport): { dataset: string; model: string; result: string } {
  const { model, dataset, formatStats } = report

  // Find most accurate format
  const mostAccurate = [...formatStats].reduce((best, current) => {
    const bestAcc = best.correctCount / best.totalCount
    const currentAcc = current.correctCount / current.totalCount
    return currentAcc > bestAcc ? current : best
  })

  // Find fastest format
  const sortedBySpeed = [...formatStats].sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)
  const fastest = sortedBySpeed[0]

  // Find PLOON stats
  const ploonStats = formatStats.find(s => s.format === 'ploon')

  if (!ploonStats || !mostAccurate) {
    return { dataset, model, result: 'No data' }
  }

  const ploonAcc = (ploonStats.correctCount / ploonStats.totalCount) * 100
  const bestAcc = (mostAccurate.correctCount / mostAccurate.totalCount) * 100
  const delta = ploonAcc - bestAcc

  // Calculate cost difference
  const costSavings = ((ploonStats.totalCost - mostAccurate.totalCost) / mostAccurate.totalCost * 100).toFixed(1)
  const costText = parseFloat(costSavings) < 0
    ? `${Math.abs(parseFloat(costSavings)).toFixed(1)}% cheaper`
    : `${costSavings}% more expensive`

  let result = ''

  if (ploonStats.format === mostAccurate.format) {
    result = `PLOON is the most accurate format (${ploonAcc.toFixed(1)}%)`
  } else if (Math.abs(delta) < 0.1) {
    result = `PLOON matches the most accurate format (${mostAccurate.format} at ${bestAcc.toFixed(1)}%) at ${costText}`
  } else if (delta > 0) {
    result = `PLOON is the most accurate format at ${ploonAcc.toFixed(1)}% (+${delta.toFixed(1)}pp vs ${mostAccurate.format} at ${bestAcc.toFixed(1)}%) at ${costText}`
  } else {
    result = `Most accurate: ${mostAccurate.format} at ${bestAcc.toFixed(1)}% (PLOON: ${ploonAcc.toFixed(1)}%, ${delta.toFixed(1)}pp) but PLOON is ${costText}`
  }

  // Add speed comparison
  const speedDiff = ((ploonStats.avgResponseTimeMs - fastest.avgResponseTimeMs) / fastest.avgResponseTimeMs * 100).toFixed(1)

  if (ploonStats.format === fastest.format) {
    result += `. PLOON is the fastest format (${formatTime(ploonStats.avgResponseTimeMs)} avg)`
  } else if (Math.abs(parseFloat(speedDiff)) < 5) {
    result += `. PLOON matches the fastest format (${fastest.format} at ${formatTime(fastest.avgResponseTimeMs)}) with ${formatTime(ploonStats.avgResponseTimeMs)} avg`
  } else if (parseFloat(speedDiff) < 0) {
    result += `. PLOON is the fastest format at ${formatTime(ploonStats.avgResponseTimeMs)} avg (${Math.abs(parseFloat(speedDiff)).toFixed(1)}% faster than ${fastest.format})`
  } else {
    result += `. Fastest: ${fastest.format} at ${formatTime(fastest.avgResponseTimeMs)} avg (PLOON: ${formatTime(ploonStats.avgResponseTimeMs)}, ${speedDiff}% slower)`
  }

  return { dataset, model, result }
}

/**
 * Main
 */
function main() {
  console.log('🚀 PLOON Retrieval Benchmarks - Results Analysis\n')

  if (!fs.existsSync(RESULTS_DIR)) {
    console.error('❌ Results directory not found:', RESULTS_DIR)
    process.exit(1)
  }

  // Get all dataset folders
  const datasets = fs.readdirSync(RESULTS_DIR)
    .filter(name => {
      const stat = fs.statSync(path.join(RESULTS_DIR, name))
      return stat.isDirectory()
    })

  if (datasets.length === 0) {
    console.error('❌ No dataset folders found in results/')
    process.exit(1)
  }

  console.log(`Found ${datasets.length} datasets: ${datasets.join(', ')}\n`)

  let totalReports = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCost = 0

  let summaryRows: { dataset: string; model: string; result: string }[] = []
  let datasetReports = '' // Store dataset reports separately

  // Process each dataset
  for (const dataset of datasets) {
    const datasetDir = path.join(RESULTS_DIR, dataset)

    // Get all result files
    const files = fs.readdirSync(datasetDir)
      .filter(f => f.endsWith('.json'))
      .sort()

    if (files.length === 0) {
      console.log(`⚠️  No results found for ${dataset}\n`)
      continue
    }

    console.log(`📊 ${dataset} (${files.length} result files)`)
    console.log('─'.repeat(80))

    datasetReports += `## ${dataset}\n\n`

    // Process each result file
    for (const file of files) {
      const filePath = path.join(datasetDir, file)

      try {
        const report = analyzeResultFile(filePath)
        if (report) {
          const reportText = generateReport(report)
          console.log(reportText)
          datasetReports += '```\n' + reportText + '```\n\n'

          // Add to summary
          summaryRows.push(generateSummaryRow(report))

          // Accumulate totals
          for (const stat of report.formatStats) {
            totalInputTokens += stat.inputTokens
            totalOutputTokens += stat.outputTokens
            totalCost += stat.totalCost
          }

          totalReports++
        }
      } catch (error) {
        console.error(`❌ Error analyzing ${file}: ${error}`)
      }
    }
  }

  // Build final report with totals at the top
  let mdOutput = '# PLOON Retrieval Benchmarks - Results Analysis\n\n'
  mdOutput += `Generated: ${new Date().toISOString()}\n\n`
  mdOutput += '## Benchmark Summary\n\n'
  mdOutput += `**Total Input Tokens:** ${formatNumber(totalInputTokens)}\n\n`
  mdOutput += `**Total Output Tokens:** ${formatNumber(totalOutputTokens)}\n\n`
  mdOutput += `**Total Cost:** ${formatCost(totalCost)}\n\n`
  mdOutput += '---\n\n'
  mdOutput += datasetReports

  // Build summary table
  let summaryOutput = '# PLOON Retrieval Benchmarks - Summary\n\n'
  summaryOutput += `Generated: ${new Date().toISOString()}\n\n`
  summaryOutput += '| Dataset | Model | Result |\n'
  summaryOutput += '|---------|-------|--------|\n'

  for (const row of summaryRows) {
    summaryOutput += `| ${row.dataset} | ${row.model} | ${row.result} |\n`
  }

  // Write to reports.md
  const reportsPath = path.join(process.cwd(), 'reports.md')
  fs.writeFileSync(reportsPath, mdOutput, 'utf-8')

  // Write to reports-summaries.md
  const summariesPath = path.join(process.cwd(), 'reports-summaries.md')
  fs.writeFileSync(summariesPath, summaryOutput, 'utf-8')

  console.log(`\n✅ Generated ${totalReports} reports`)
  console.log(`📄 Saved to: ${reportsPath}`)
  console.log(`📄 Summaries saved to: ${summariesPath}\n`)
}

main()
