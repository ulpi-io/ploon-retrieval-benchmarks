/**
 * Analyze failure patterns across formats to detect validation issues
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { EvaluationResult } from './types'

// Read a specific result file
const resultFile = process.argv[2]

if (!resultFile) {
  console.error('Usage: tsx src/analyze-failures.ts <result-file>')
  console.error('Example: tsx src/analyze-failures.ts results/products/google-gemini-2.5-flash-2025-11-07T03-17-18.json')
  process.exit(1)
}

if (!fs.existsSync(resultFile)) {
  console.error(`❌ File not found: ${resultFile}`)
  process.exit(1)
}

const results: EvaluationResult[] = JSON.parse(fs.readFileSync(resultFile, 'utf-8'))

// Group results by questionId
const byQuestion = new Map<string, EvaluationResult[]>()
for (const result of results) {
  if (!byQuestion.has(result.questionId)) {
    byQuestion.set(result.questionId, [])
  }
  byQuestion.get(result.questionId)!.push(result)
}

console.log(`\n📊 Analyzing ${resultFile}`)
console.log(`Model: ${results[0].model}`)
console.log(`Total questions: ${byQuestion.size}`)
console.log(`Total results: ${results.length}\n`)

// Analyze each question
const allFormats = ['json', 'yaml', 'csv', 'xml', 'toon', 'ploon']
const questionsFailingAllFormats: string[] = []
const questionsWithSomeFailures: Array<{ questionId: string; failedFormats: string[]; passedFormats: string[] }> = []

for (const [questionId, questionResults] of byQuestion.entries()) {
  const failures = questionResults.filter(r => !r.isCorrect)
  const successes = questionResults.filter(r => r.isCorrect)

  if (failures.length === questionResults.length) {
    // All formats failed for this question
    questionsFailingAllFormats.push(questionId)
  } else if (failures.length > 0) {
    // Some formats failed
    questionsWithSomeFailures.push({
      questionId,
      failedFormats: failures.map(f => f.format),
      passedFormats: successes.map(s => s.format)
    })
  }
}

// Report questions that fail for all formats
if (questionsFailingAllFormats.length > 0) {
  console.log(`\n🚨 QUESTIONS FAILING FOR ALL FORMATS (${questionsFailingAllFormats.length}):`)
  console.log('=' .repeat(80))

  for (const questionId of questionsFailingAllFormats) {
    const questionResults = byQuestion.get(questionId)!
    const example = questionResults[0]

    console.log(`\n${questionId}:`)
    console.log(`  Expected: ${example.expected}`)
    console.log(`  Actuals:`)

    for (const result of questionResults) {
      console.log(`    ${result.format}: "${result.actual}"`)
    }
  }

  console.log(`\n⚠️  These ${questionsFailingAllFormats.length} questions fail for ALL formats - likely validation issue!\n`)
} else {
  console.log('✅ No questions fail for all formats\n')
}

// Report questions with partial failures
if (questionsWithSomeFailures.length > 0) {
  console.log(`\n📉 QUESTIONS WITH SOME FAILURES (${questionsWithSomeFailures.length}):`)
  console.log('=' .repeat(80))

  for (const item of questionsWithSomeFailures) {
    const questionResults = byQuestion.get(item.questionId)!
    const example = questionResults[0]

    console.log(`\n${item.questionId}:`)
    console.log(`  Expected: ${example.expected}`)
    console.log(`  ✅ Passed: ${item.passedFormats.join(', ')}`)
    console.log(`  ❌ Failed: ${item.failedFormats.join(', ')}`)
    console.log(`  Actuals:`)

    for (const result of questionResults) {
      const icon = result.isCorrect ? '✅' : '❌'
      console.log(`    ${icon} ${result.format}: "${result.actual}"`)
    }
  }
}

// Summary statistics
const totalQuestions = byQuestion.size
const questionsWithAllPass = totalQuestions - questionsFailingAllFormats.length - questionsWithSomeFailures.length

console.log(`\n${'=' .repeat(80)}`)
console.log(`\n📈 SUMMARY:`)
console.log(`  Total questions: ${totalQuestions}`)
console.log(`  Questions passing all formats: ${questionsWithAllPass} (${(questionsWithAllPass / totalQuestions * 100).toFixed(1)}%)`)
console.log(`  Questions with some failures: ${questionsWithSomeFailures.length} (${(questionsWithSomeFailures.length / totalQuestions * 100).toFixed(1)}%)`)
console.log(`  Questions failing all formats: ${questionsFailingAllFormats.length} (${(questionsFailingAllFormats.length / totalQuestions * 100).toFixed(1)}%)`)

if (questionsFailingAllFormats.length > 0) {
  console.log(`\n⚠️  WARNING: ${questionsFailingAllFormats.length} questions fail for ALL formats!`)
  console.log(`   This suggests the question or validation rules may be incorrect.\n`)
}
